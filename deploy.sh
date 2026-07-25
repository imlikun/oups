#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  appin-site 安全部署脚本（双端通用：macOS / Windows git-bash）
#  📌 完整维护规则见仓库根 RULES.md（随 git 跟踪，所有维护者必须遵守）
#  ⚠️ 用途：物理上杜绝「盲覆盖另一端改动」与「死链上线」
#
#  本脚本除了 [2/5] git pull 合入另一端改动、[4/5] tar 推 ECS 之外，
#  额外内置两道【机器强制护栏】（2026-07-25 事故后落地，对应 RULES.md）：
#    [1/5] 部署前护栏（铁律 2）：强制 git fetch → 工作区必须已 commit
#          → 本地必须 = origin/main 最新（落后/分叉即拒绝，领先自动 push）
#    [3/5] 死链检查（B）：扫描站内所有链接，目标文件不存在则【阻断部署】
#          从物理上杜绝「指向不存在子站/空目录」这类死链再次出现。
#
#  用法：
#    ./deploy.sh                 # 增量同步整个仓库（排除 .git/.github/.workbuddy）
#    ./deploy.sh index.html      # 只同步指定文件（仍强制走护栏+死链检查）
#    ./deploy.sh index.html craft/foo.html
#
#  ❌ 禁止：绕过本脚本直接 `tar czf - ... | ssh ... tar xzf -`
#          那样会拿旧本地版冲掉服务器上另一端的改动。
#
#  📌 铁律 · 单一真相源（2026-07-25 确立 · 跨端共识 · 最高优先级）
#     · git（GitHub `origin/main`）是【唯一真相源】；ECS 只是由本脚本
#       确定性生成的结果，【绝不】反向把 ECS 同步回 git。
#     · ✅ 任何改动：先 commit 进 git → 再跑本脚本上线。顺序是铁律。
#     · ❌ 禁止直接 SSH 改 ECS 上的文件、或绕过本脚本上传——
#           未 commit 的内容下次任何一端部署都会被冲掉，且无法回滚。
#     · ✅ 若 ECS 上有遗漏的孤儿内容：先手动拉回 git 提交备份，再部署
#           （参考 commit 66b4fd9e：把 ECS-only 的 pxid2/3 拉回 git）。
#     · ECS↔git 漂移监控见 scripts/drift-monitor.sh（C，可挂 cron 定期跑）。
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

REMOTE="root@101.133.136.140"
KEY="$HOME/.ssh/id_ed25519_appin_server"
DEST="/www/wwwroot/appin.site"

# 切到脚本所在目录（appin-site 仓库根），无论在哪调用
cd "$(dirname "$0")"

# ───────────────────────────────────────────────────────────────
# [1/5] 部署前护栏（铁律 2：先 fetch，确认基线最新且工作区已提交）
# ───────────────────────────────────────────────────────────────
echo "==> [1/5] 部署前护栏（铁律 2：fetch + 工作区已提交 + 基线最新）"
git fetch origin

if [ -n "$(git status --porcelain)" ]; then
  echo "❌ 工作区存在未提交改动，禁止部署。请先：git add -A && git commit"
  git status -s
  exit 1
fi

LOCAL=$(git rev-parse HEAD)
UPSTREAM=$(git rev-parse origin/main)
BASE=$(git merge-base HEAD origin/main)

if [ "$LOCAL" = "$UPSTREAM" ]; then
  echo "✅ 本地已与 origin/main 同步，基线最新"
elif [ "$BASE" = "$UPSTREAM" ]; then
  echo "ℹ️  本地领先 origin/main（存在未推送提交），自动推送后再部署"
  git push origin main
elif [ "$BASE" = "$LOCAL" ]; then
  echo "❌ 本地落后于 origin/main，请先：git pull --rebase"
  exit 1
else
  echo "❌ 本地与 origin/main 分叉，请先：git pull --rebase 解决冲突"
  exit 1
fi

# ───────────────────────────────────────────────────────────────
# [2/5] 合入另一端/Windows 已 push 的改动
# ───────────────────────────────────────────────────────────────
echo "==> [2/5] git pull --rebase（合入另一端/Windows 已 push 的改动）"
git pull --rebase --autostash

# ───────────────────────────────────────────────────────────────
# [3/5] 死链检查（B：站内链接必须指向仓库内真实存在的文件，否则阻断部署）
# ───────────────────────────────────────────────────────────────
echo "==> [3/5] 死链检查（B：站内链接必须指向真实存在的文件）"
python3 - "$@" <<'PY'
import os, re, sys, html
repo = os.getcwd()
args = sys.argv[1:]
# 始终检查站点总入口 index.html；若指定了文件则一并检查其中的 .html
must = ['index.html'] if os.path.isfile('index.html') else []
if args:
    html_files = must + [a for a in args if a.endswith('.html') and os.path.isfile(a)]
else:
    html_files = []
    for root, _, files in os.walk('.'):
        if any(p in root for p in ('/.git', '/.github', '/.workbuddy', '/node_modules')):
            continue
    for f in files:
        if f.endswith('.html') and not f.startswith('_template'):
            html_files.append(os.path.join(root, f))
html_files = list(dict.fromkeys(html_files))  # 去重

broken = []
checked = 0
for hf in html_files:
    try:
        txt = open(hf, encoding='utf-8').read()
    except Exception:
        continue
    for m in re.finditer(r'href="([^"]+)"', txt):
        url = html.unescape(m.group(1)).strip()
        if not url.startswith('/'):            # 相对路径/外链/锚点先略过
            continue
        if '://' in url or url.startswith('//'):
            continue
        if url.startswith('#') or url.startswith('mailto:') or url.startswith('javascript:'):
            continue
        path = url.split('?', 1)[0].split('#', 1)[0]
        if path == '/':
            candidates = ['index.html']
        elif path.endswith('/'):
            candidates = [path.lstrip('/') + 'index.html', path.lstrip('/').rstrip('/')]
        else:
            candidates = [path.lstrip('/'), path.lstrip('/') + '.html', path.lstrip('/') + '/index.html']
        checked += 1
        ok = any(os.path.isfile(c) or os.path.isdir(c) for c in candidates)
        if not ok:
            broken.append((hf, url))

if broken:
    print(f"❌ 发现 {len(broken)} 个死链（指向仓库中不存在的文件），部署已阻断：")
    for hf, url in broken:
        print(f"   {hf}  ->  {url}")
    sys.exit(1)
print(f"✅ 死链检查通过（扫描 {len(html_files)} 个 html，检查 {checked} 个站内链接，0 死链）")
PY

# ───────────────────────────────────────────────────────────────
# [4/5] tar 管道增量同步到 ECS
# ───────────────────────────────────────────────────────────────
echo "==> [4/5] tar 管道增量同步到 ECS $DEST"
if [ "$#" -gt 0 ]; then
  tar czf - "$@" \
    | ssh -i "$KEY" -o StrictHostKeyChecking=no "$REMOTE" "cd $DEST && tar xzf -"
else
  tar czf - --exclude='.git' --exclude='.github' --exclude='.workbuddy' \
              --exclude='node_modules' --exclude='.DS_Store' . \
    | ssh -i "$KEY" -o StrictHostKeyChecking=no "$REMOTE" "cd $DEST && tar xzf -"
fi

echo "==> [5/5] 部署完成 ✅  验证: curl -s -o /dev/null -w '%{http_code}' https://www.appin.site/"

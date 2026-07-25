#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  drift-monitor.sh —— ECS↔git 漂移监控（RULES.md 铁律 1 的机器强制，C）
#
#  根因：ECS 只是 git 的镜像。一旦有人「直接 SSH 改 ECS」（违规），
#        下次任何一端跑 ./deploy.sh 前，ECS 与 git HEAD 就出现了「漂移」，
#        这正是 2026-07-24 那批 pxid 页被冲掉、以及「死链又回来」错觉的源头。
#
#  本脚本逐文件比对 【git HEAD（=干净工作区）】 与 【ECS 线上同名文件内容】：
#    · 一致 → ✅ 无漂移
#    · 不一致（ECS 有 git 没有的改动）→ ⚠️ 告警，列出漂移文件（退出码 2）
#    · --fix → 自动 ./deploy.sh 用 git HEAD 重新覆盖 ECS，抹平漂移
#
#  性能：本地一次性算 md5 + ECS 单次 SSH 批量算 md5 + Python 比对，
#        避免对上千文件逐次 SSH（兼容 macOS 自带 bash 3.2，不用 mapfile）。
#
#  用法：
#    ./scripts/drift-monitor.sh          # 仅检查，输出漂移报告
#    ./scripts/drift-monitor.sh --fix    # 发现漂移自动重新部署覆盖 ECS
#
#  定期调度（建议挂 cron，本机 macOS 示例）：
#    0 9 * * *  cd /Users/likun/Projects/appin-site && ./scripts/drift-monitor.sh --fix >> /tmp/drift.log 2>&1
#  （也可在 WorkBuddy 建每日 automation 跑本脚本，双保险。）
#
#  ⚠️ 仅比对「已由 git 跟踪」的文件；ECS 上纯新增且 git 从未跟踪的孤儿文件
#     不在此范围（孤儿内容应先拉回 git，见 RULES 铁律 1）。
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

REMOTE="root@101.133.136.140"
KEY="$HOME/.ssh/id_ed25519_appin_server"
DEST="/www/wwwroot/appin.site"

# 切到仓库根（scripts/ 的上一级）
cd "$(dirname "$0")/.."

trap 'rm -f /tmp/dm_tracked.txt /tmp/dm_local.txt /tmp/dm_remote.txt' EXIT

FIX=0
[ "${1:-}" = "--fix" ] && FIX=1

# 前置：工作区必须干净（比对基准应 = git HEAD，脏工作区会让结果失真）
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ 工作区有未提交改动，漂移比对基准不准。请先 git commit 或 git stash。"
  git status -s
  exit 1
fi

# 1) 跟踪文件清单（排除元目录）
git ls-files | grep -vE '^(\.git/|\.github/|\.workbuddy/|node_modules/)' > /tmp/dm_tracked.txt

# 2) 本地工作区（已校验=HEAD）各文件 md5，格式 "<hash>  <path>"
: > /tmp/dm_local.txt
while IFS= read -r f; do
  [ -f "$f" ] || continue
  printf '%s  %s\n' "$(md5 -q "$f" 2>/dev/null || echo "")" "$f" >> /tmp/dm_local.txt
done < /tmp/dm_tracked.txt

# 3) ECS 侧单次 SSH 批量计算同清单 md5（避免逐文件连接）
ssh -i "$KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=15 "$REMOTE" \
  "cd $DEST && while IFS= read -r f; do [ -f \"\$f\" ] && md5sum \"\$f\" 2>/dev/null || echo \"MISSING  \$f\"; done" \
  < /tmp/dm_tracked.txt > /tmp/dm_remote.txt 2>/dev/null \
  || { echo "❌ SSH 到 ECS 失败（检查 KEY=$KEY 与连通性）"; exit 1; }

# 4) Python 比对（按 path 对齐，md5 不同即漂移）
python3 - <<'PY'
import sys, datetime
def load(p):
    d = {}
    for line in open(p, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip():
            continue
        h, _, path = line.split(' ', 1)
        d[path] = h
    return d
local = load('/tmp/dm_local.txt')
remote = load('/tmp/dm_remote.txt')
drift = [(p, local[p], remote.get(p, 'MISSING')) for p in local if local[p] != remote.get(p)]
if not drift:
    print("✅ 无漂移：ECS 与 git HEAD 完全一致（" + datetime.datetime.now().strftime('%Y-%m-%d %H:%M') + "）")
    sys.exit(0)
print("")
print("❌ 发现 %d 个文件在 ECS 上与 git HEAD 不一致（疑似有人违规直改 ECS）：" % len(drift))
for p, h, r in drift:
    print("   ⚠️  %s  (git HEAD=%s | ECS=%s)" % (p, h, r))
sys.exit(2)
PY
RC=$?
if [ "$RC" -ne 0 ] && [ "$FIX" -eq 1 ]; then
  echo "→ 执行 ./deploy.sh 用 git HEAD 重新覆盖 ECS ..."
  ./deploy.sh
elif [ "$RC" -ne 0 ]; then
  echo "→ 如需自动修复，运行：./scripts/drift-monitor.sh --fix"
fi
exit $RC

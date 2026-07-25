#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  drift-monitor.sh —— ECS↔git 漂移监控（RULES.md 铁律 1 的机器强制，C）
#
#  根因：ECS 只是 git 的镜像。一旦有人「直接 SSH 改 ECS」（违规），
#        下次任何一端跑 ./deploy.sh 前，ECS 与 git HEAD 就出现了「漂移」，
#        这正是 2026-07-24 那批 pxid 页被冲掉、以及「死链又回来」错觉的源头。
#
#  本脚本逐文件比对 【git HEAD 的 blob】 与 【ECS 线上同名文件内容】：
#    · 一致 → ✅ 无漂移
#    · 不一致（ECS 有 git 没有的改动）→ ⚠️ 告警，列出漂移文件
#    · --fix → 自动 ./deploy.sh 用 git HEAD 重新覆盖 ECS，抹平漂移
#
#  用法：
#    ./scripts/drift-monitor.sh          # 仅检查，输出漂移报告（退出码 2 表示有漂移）
#    ./scripts/drift-monitor.sh --fix    # 发现漂移自动重新部署覆盖 ECS
#
#  定期调度（建议挂 cron，本机 macOS 示例）：
#    0 9 * * *  cd /Users/likun/Projects/appin-site && ./scripts/drift-monitor.sh --fix >> /tmp/drift.log 2>&1
#  （也可在 WorkBuddy 建每日 automation 跑本脚本，双保险。）
#
#  ⚠️ 本脚本仅比对「已由 git 跟踪」的文件；ECS 上纯新增且 git 从未跟踪的
#     孤儿文件不在此检查范围（孤儿内容应先拉回 git，见 RULES 铁律 1）。
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

REMOTE="root@101.133.136.140"
KEY="$HOME/.ssh/id_ed25519_appin_server"
DEST="/www/wwwroot/appin.site"

# 切到仓库根（scripts/ 的上一级）
cd "$(dirname "$0")/.."

FIX=0
[ "${1:-}" = "--fix" ] && FIX=1

# 取 git 跟踪的所有文件（排除元目录），逐文件比对 md5
mapfile -t FILES < <(git ls-files | grep -vE '^(\.git/|\.github/|\.workbuddy/|node_modules/)' || true)

drift=()
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  lh=$(git show "HEAD:$f" | md5 -q 2>/dev/null || echo "")
  rh=$(ssh -i "$KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE" \
        "cd $DEST && [ -f '$f' ] && md5sum '$f' 2>/dev/null | awk '{print \$1}' || echo MISSING" \
        2>/dev/null || echo "ERR")
  if [ "$lh" != "$rh" ]; then
    drift+=("$f")
    echo "⚠️  漂移: $f  (git HEAD=$lh | ECS=$rh)"
  fi
done

if [ ${#drift[@]} -eq 0 ]; then
  echo "✅ 无漂移：ECS 与 git HEAD 完全一致（$(date '+%Y-%m-%d %H:%M')）"
  exit 0
fi

echo ""
echo "❌ 发现 ${#drift[@]} 个文件在 ECS 上与 git HEAD 不一致（疑似有人违规直改 ECS）："
printf '   - %s\n' "${drift[@]}"

if [ "$FIX" -eq 1 ]; then
  echo "→ 执行 ./deploy.sh 用 git HEAD 重新覆盖 ECS ..."
  ./deploy.sh
else
  echo "→ 如需自动修复，运行：./scripts/drift-monitor.sh --fix"
  exit 2
fi

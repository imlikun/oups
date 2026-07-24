#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  appin-site 安全部署脚本（双端通用：macOS / Windows git-bash）
#  ⚠️ 用途：物理上杜绝「盲覆盖另一端改动」
#     每次部署前【强制 git pull --rebase】，把 Windows/macOS 另一端
#     已 push 的改动先合进来，再 tar 推 ECS。
#     脚本随仓库走（已 push 到 GitHub），两端 `git pull` 后都用同一份。
#
#  用法：
#    ./deploy.sh                 # 增量同步整个仓库（排除 .git/.github/.workbuddy）
#    ./deploy.sh index.html      # 只同步指定文件
#    ./deploy.sh index.html craft/foo.html
#
#  ❌ 禁止：绕过本脚本直接 `tar czf - ... | ssh ... tar xzf -`
#          那样会拿旧本地版冲掉服务器上另一端的改动。
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

REMOTE="root@101.133.136.140"
KEY="$HOME/.ssh/id_ed25519_appin_server"
DEST="/www/wwwroot/appin.site"

# 切到脚本所在目录（appin-site 仓库根），无论在哪调用
cd "$(dirname "$0")"

echo "==> [1/3] git pull --rebase（先合入另一端/Windows 的改动）"
git pull --rebase --autostash

echo "==> [2/3] tar 管道增量同步到 ECS $DEST"
if [ "$#" -gt 0 ]; then
  tar czf - "$@" \
    | ssh -i "$KEY" -o StrictHostKeyChecking=no "$REMOTE" "cd $DEST && tar xzf -"
else
  tar czf - --exclude='.git' --exclude='.github' --exclude='.workbuddy' \
              --exclude='node_modules' --exclude='.DS_Store' . \
    | ssh -i "$KEY" -o StrictHostKeyChecking=no "$REMOTE" "cd $DEST && tar xzf -"
fi

echo "==> [3/3] 部署完成 ✅  验证: curl -s -o /dev/null -w '%{http_code}' https://www.appin.site/"

#!/bin/bash
# AI 新闻雷达 · 本地每日更新包装脚本
# 由 launchd (com.likun.ai-radar-update.plist) 每天 08:30 调用
# 流程：update.py(拉数据→注入→推COS) → 若有更新则 git 存档(容错)
cd /Users/likun/Projects/appin-site || exit 1

PYTHON=/Users/likun/.workbuddy/binaries/python/envs/default/bin/python
LOG=/Users/likun/Projects/appin-site/ai-radar/launchd.log

echo "──── $(date '+%Y-%m-%d %H:%M:%S') 启动 AI 雷达本地更新 ────"

"$PYTHON" ai-radar/update.py
rc=$?
echo "update.py 退出码: $rc"

if [ "$rc" -eq 0 ]; then
  # 推 COS 成功后，顺手把 index.html 存档进 git（容错，失败不影响线上）
  git -C /Users/likun/Projects/appin-site add ai-radar/index.html
  git -C /Users/likun/Projects/appin-site -c user.name="likun" -c user.email="likun@appin.site" \
    commit -m "chore(ai-radar): 本地定时更新 $(date +%F)" >/dev/null 2>&1
  if git -C /Users/likun/Projects/appin-site push >/dev/null 2>&1; then
    echo "git 存档已推送"
  else
    echo "git 存档跳过(无变化或推送失败，不影响线上 COS)"
  fi
else
  echo "update.py 未成功(退出码非0)，跳过 git 存档"
fi

echo "──── $(date '+%Y-%m-%d %H:%M:%S') 结束 ────"

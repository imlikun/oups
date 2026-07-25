# appin.site 维护规则（RULES）

> **本文件随仓库走（已 commit 进 git）。凡是 clone / pull 本仓库参与网站维护的人，必须服从本规则。**
> 这是 2026-07-24「ECS-only 改动被 git 部署冲掉」事故后确立的跨端共识，最高优先级。
> `deploy.sh` 顶部注释为同源规则的精简版，本文件为权威完整版。

---

## 铁律 1 · 单一真相源

- **git（GitHub `origin/main`）是唯一真相源**；ECS（`root@101.133.136.140:/www/wwwroot/appin.site`）只是由 `./deploy.sh` 确定性生成的镜像，**绝不**反向把 ECS 同步回 git。
- 类比：git = 源码 `.c`，ECS = 编译产物 `.exe`。你不会去改 `.exe` 再同步回 `.c`，而是改源码、重新编译、重新部署。

## 铁律 2 · 任何改动的三步顺序（不可颠倒）

1. **改之前：先 `git fetch` + `git log` + `git status`，确认本地 = `origin/main` 最新**，再动手。禁止基于未确认的旧基线直接编辑。
2. **改完：`git commit` 进 git**（先 commit、再上线，这是铁律）。
3. **上线：`./deploy.sh`**（脚本先 `git pull --rebase` 合入另一端/Windows 的改动，再 tar 增量推 ECS）。

## 铁律 3 · 禁止项（违反即破坏真相源，可被下次部署冲掉）

- ❌ 禁止直接 SSH 改 ECS 上的文件（未 commit 的内容下次部署必被冲掉，且无法回滚）。
- ❌ 禁止绕过 `./deploy.sh` 直接 `tar czf - ... | ssh ... tar xzf -` 推送（会拿旧本地版覆盖另一端改动）。
- ❌ 禁止任一端「未 `git pull` 就基于旧版本编辑再 push」（会触发 non-fast-forward / 冲突 / 覆盖）。

## 铁律 4 · 删除是永久的

- 删除一旦 commit 进 `main` 历史即**永久**，**不会**被「别人更新 git」自动恢复。
- 要让被删内容回来，必须有人**主动**重写加回并 commit——那会被历史审查到，不是 git 自己复活。
- 因此：要删某内容，**在 git 里删即可**，ECS 下次部署自动同步为删后状态。**不要去 ECS 直接删**（下次部署会被 git 版本覆盖回来，正是 2026-07-24 事故根因）。

## 铁律 5 · 怀疑内容「又回来」时的排查顺序

1. `git fetch` 拉最新；
2. `git log --oneline` 看 `main` 最近提交；
3. `git show origin/main:<文件>` 确认 **git 真相源**里到底有没有——而不是只看 ECS。
4. 若 git 里没有、ECS 却有，说明有人动了 ECS（违规），按铁律 1 用 `./deploy.sh` 重新部署即可抹平，无需手动改 ECS。

## 验证

- 部署后：`curl -s -o /dev/null -w '%{http_code}' https://www.appin.site/`
- 部署脚本：`./deploy.sh`（全量）或 `./deploy.sh <文件...>`（增量，沙箱/大仓库推荐）。

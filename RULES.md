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

## 机器强制（已实现，2026-07-25 · 不再只靠自觉）

纸面铁律会被"图方便"或"工具链故障"突破。以下三道护栏已落地为代码，随 git 跟踪、所有人拉取即生效：

- **A · 部署前护栏（在 `deploy.sh` [1/5]）**：每次部署强制 `git fetch` → 工作区必须已 `commit`（有未提交改动直接拒绝）→ 本地必须 = `origin/main` 最新（落后/分叉拒绝，领先自动 `push`）。阻断"基于旧基线编辑"与"绕脚本直推"。
- **B · 死链检查（在 `deploy.sh` [3/5]）**：部署前扫描所有站内链接，目标文件在仓库中不存在则**阻断部署**。物理上杜绝「pxid 指向不存在子站」这类死链再次上线。
- **C · ECS↔git 漂移监控（`scripts/drift-monitor.sh`）**：逐文件比对 git HEAD 与 ECS 线上内容，发现「ECS 有 git 没有的改动」即告警；`--fix` 自动重新部署抹平。建议挂 cron 每日跑（脚本内有本机 macOS 示例），或 WorkBuddy 每日 automation 兜底。

> 工具链前提：本机 git remote 必须为 SSH（`git@github.com:imlikun/oups.git`），否则 push/拉取会因无 HTTPS 凭证失败、诱使绕过脚本。该前提已于 2026-07-25 根治（删除全局 `insteadOf`、origin 切 SSH）。

## 验证

- 部署后：`curl -s -o /dev/null -w '%{http_code}' https://www.appin.site/`
- 部署脚本：`./deploy.sh`（全量）或 `./deploy.sh <文件...>`（增量，沙箱/大仓库推荐）。
- 漂移检查：`./scripts/drift-monitor.sh`（仅报告）/ `--fix`（自动修复）。

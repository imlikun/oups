# appin.site 维护指南（AI 编码助手用）

本仓库是 appin.site（个人开发者刊物网站）的源文件。对线上内容的任何修改，最终都通过 GitHub Actions 自动部署，**不需要直接 SSH 服务器**。

## 基本事实
- 仓库：`git@github.com:imlikun/oups.git`，分支 `main`，本地路径 `~/Projects/appin-site`
- 线上源站：ECS `root@101.133.136.140:/www/wwwroot/appin.site`（由 Actions 的 tar 管道同步，你不用管 SSH）
- 部署方式：改完文件 → `git add . && git commit -m "feat(<栏目>): ..." && git push` → Actions 自动上线。**你（AI 助手）不需要、也不应持有服务器私钥**（私钥只在 GitHub Secret `ECS_DEPLOY_KEY` 里）
- **绝不走 COS**：腾讯 COS 已废弃，仅镜像代码，线上无效
- **绝不碰 IMA 知识库**：素材来自对话框/本地文件

## 栏目映射（固定，按主题归类，不按临时指令覆盖）
| 栏目 | 目录 | content.json category |
|------|------|------------------------|
| 技艺录 | `craft/` | `craft` |
| 随笔 | `notes/` | `notes` |
| AI 雷达 | `ai-radar/` | `ai-radar` |
| 每日阅读 | `daily-digest/` | `daily-digest` |

## 发一篇文章的标准动作
1. 在对应栏目目录建/改 HTML，套 `craft/_template.html` 模板，替换占位符（`{{TITLE}}` / `{{BODY}}` / `{{TAGS}}` 等）
2. 封面图放 `uploads/<slug>-cover.<ext>`；文章页 `<img src>` **必须用绝对路径 `/uploads/xxx.jpg`**（子目录页用相对路径会 404）
3. 在 `content.json` 的 `articles` 数组末尾追加一条（`id` = 当前最大 +1，`template` 固定 `"DP"`）
4. 更新对应栏目 `index.html` 静态列表（文章数、列表项）
5. `git commit` + `git push`（部署由 Actions 完成，无需手动同步）

## 纪律（踩过坑）
- **content.json 登记后，本批次内必须把对应 html + 封面一起提交 push**，否则线上卡片 404
- 文章页头图必须是**横图**（宽高比 ≥ 1.5，推荐 1.78），竖图一律 `sips -c` center-crop 成 16:9 再入库
- 重要句子用 `<span class="key">…</span>` 强调（品牌绿加粗），不下划线、不纯变色、不只用普通加粗
- 封面优先真实摄影图（Unsplash/Pexels），不用 AI 生成图（除非用户当次同意）
- 图片类：`.gitignore` 忽略 `uploads/*.png`，**png 封面不会随 push 上线**；封面统一存 jpg/webp

## 验证
- push 后到 https://github.com/imlikun/oups/actions 看 `Deploy appin.site → ECS` 是否绿
- 线上核对：`curl -s -o /dev/null -w "%{http_code}" https://www.appin.site/<路径>` 应为 200

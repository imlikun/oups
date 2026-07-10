# 把 Google Gemini 接入 WorkBuddy 和 Trae：一份不用写代码的小白教程

本教程手把手教你从零开始，把 Google Gemini 模型接入 WorkBuddy 和 Trae。全程不需要写代码，跟着操作就行。

---

## 第一步：获取 Google Gemini API Key

不管用 WorkBuddy 还是 Trae，你都需要先拿到一个 API Key（可以理解为一把"钥匙"，让工具能调用 Google 的 AI 模型）。

### 1.1 打开 Google AI Studio

用浏览器访问：**https://aistudio.google.com/apikey**

> 注意：你需要一个 Google 账号（就是 Gmail 那个账号）。如果没登录，会提示你先登录。

### 1.2 创建 API Key

1. 登录后，你会看到 API Key 管理页面
2. 点击 **"Create API key"**（创建 API 密钥）
3. 选择 **"Create API key in new project"**（在新项目中创建）
4. 等几秒钟，系统会生成一串很长的密钥，类似 `AIzaSyD......xxxxx`
5. **立刻复制保存下来！** 关掉窗口后就看不到了（但可以在页面上重新查看）

### 1.3 关于网络问题

Google AI Studio 在国内无法直接访问，你需要使用科学上网工具。如果 API Key 创建好了，后续调用 API 同样需要稳定的网络环境。

### 1.4 Gemini API 免费额度

Google 提供了免费额度，对于个人使用来说完全够用。免费模型包括 `gemini-2.5-flash` 和 `gemini-2.5-pro` 等，每分钟有请求次数限制，但日常使用没问题。

---

## 第二步：了解一个关键概念 —— OpenAI 兼容接口

Google Gemini 官方现在提供了 **OpenAI 兼容接口**，意思是：虽然 Gemini 是 Google 的模型，但它模拟了 OpenAI 的 API 格式。这样 WorkBuddy 和 Trae 就能直接把它当成"OpenAI 格式的模型"来用，不需要额外装什么转换工具。

这个兼容接口的地址（Base URL）是：

```
https://generativelanguage.googleapis.com/v1beta/openai
```

记住这个地址，下面配置的时候要用。

---

## 第三步：在 WorkBuddy 中接入 Gemini

WorkBuddy 有两种配置方式：通过界面操作，或者直接编辑配置文件。推荐用界面操作，更直观。

### 方式一：通过界面配置（推荐）

1. 打开 WorkBuddy 桌面客户端
2. 在聊天界面底部，找到模型切换区域，点击 **"+配置自定义模型"**
3. 在弹出的页面中，选择 **"通用 OpenAI 兼容"** 或类似的自定义选项
4. 填写以下信息：

| 字段 | 填写内容 |
|------|---------|
| 模型名称 / Model Name | `gemini-2.5-flash` （或 `gemini-2.5-pro`） |
| Base URL | `https://generativelanguage.googleapis.com/v1beta/openai` |
| API Key | 你第一步获取的那个密钥 |

5. 点击保存，然后在模型列表里切换到刚添加的 Gemini 模型，发一条消息测试即可

### 方式二：编辑 models.json 配置文件

如果界面操作不成功，可以手动编辑配置文件。

**配置文件位置：**

- macOS / Linux：`~/.workbuddy/models.json`
- Windows：`C:\Users\你的用户名\.workbuddy\models.json`

**编辑方法：**

用任意文本编辑器（记事本、VS Code 等）打开 `models.json`，在里面添加如下内容：

```json
[
  {
    "id": "gemini-2.5-flash",
    "name": "gemini-2.5-flash",
    "vendor": "custom",
    "url": "https://generativelanguage.googleapis.com/v1beta/openai/v1",
    "apiKey": "你的API_KEY粘贴在这里"
  }
]
```

> 注意事项：
> - 如果文件里已经有其他模型配置，在最外层的 `[]` 里面用逗号隔开，添加新的对象即可
> - `id` 和 `name` 必须填写一样的值
> - `url` 末尾注意加上 `/v1`
> - 修改完文件后，必须**完全退出 WorkBuddy 再重新打开**才能生效（不是关闭窗口，是在任务栏/菜单栏彻底退出）

### WorkBuddy 常见问题排查

- **报 404 错误**：检查模型名称是否正确，`id` 和 `name` 是否一致
- **报 401 错误**：API Key 填写有误，重新复制粘贴
- **报 400 错误**：URL 路径有问题，确认末尾有 `/v1`
- **配置不生效**：彻底退出 WorkBuddy（Mac 上右键 Dock 图标退出，Windows 上在任务管理器中结束进程），然后重新打开

---

## 第四步：在 Trae 中接入 Gemini

Trae 是字节跳动出品的 AI 编程工具（IDE），有两种方式接入 Gemini：原生配置和通过 Cline 插件。

### 方式一：Trae 原生配置（推荐）

1. 打开 Trae IDE
2. 点击右上角的 **齿轮图标**（设置），或者用快捷键 `Ctrl + ,`（Mac 上是 `Cmd + ,`）
3. 找到 **"Models"** 或 **"AI 模型"** 区域
4. 点击 **"Add Model"**（添加模型）
5. 按以下信息填写：

| 字段 | 填写内容 |
|------|---------|
| API Provider（提供方） | 选择 **"OpenAI"**（因为 Gemini 有 OpenAI 兼容接口） |
| 模型类型 | 选择 **"自定义模型"** |
| Model Name（模型名称） | `gemini-2.5-flash`（或 `gemini-2.5-pro`） |
| API Key | 你第一步获取的密钥 |
| Base URL / Custom Request URL | `https://generativelanguage.googleapis.com/v1beta/openai/v1` |

6. 点击保存/完成
7. 回到聊天窗口，在模型列表里切换到 Gemini，发一条消息测试

### 方式二：通过 Cline 插件接入

如果原生配置遇到问题，可以用 Cline 插件作为替代方案。

1. 在 Trae 的插件市场搜索 **"Cline"** 并安装
2. 安装完成后，在左侧边栏找到 Cline 图标，点击进入
3. 点击 Cline 面板里的 **齿轮图标**（设置）
4. 在 API Configuration 中：
   - API Provider 选择 **"Google Gemini"**
   - 粘贴你的 API Key
   - 如果需要自定义 Base URL，勾选对应选项并填入地址
   - Model Name 填写 `gemini-2.5-flash` 或 `gemini-2.5-pro`
5. 点击 Done 保存，然后在 Cline 聊天窗口测试

---

## 第五步：验证是否成功

配置完成后，在对应工具中发送一条简单的消息来测试，比如：

> "你好，请用一句话介绍你自己。"

如果模型正常回复了，说明接入成功。如果报错，请对照上面的"常见问题排查"部分检查配置。

---

## 可选模型参考

| 模型名称 | 特点 | 适用场景 |
|---------|------|---------|
| `gemini-2.5-flash` | 速度快、免费额度大 | 日常对话、快速问答 |
| `gemini-2.5-pro` | 能力更强、推理更好 | 复杂任务、代码生成 |
| `gemini-2.5-flash-lite` | 最轻量、响应最快 | 简单任务、低延迟场景 |

---

## 总结

整个流程其实就是三步：

1. 去 Google AI Studio 拿 API Key
2. 在工具里添加自定义模型，填入 Gemini 的 OpenAI 兼容接口地址 + API Key + 模型名
3. 测试一下能不能正常对话

关键地址再贴一遍：`https://generativelanguage.googleapis.com/v1beta/openai/v1`

---

> 本文同步发布于个人网站「技艺录」：https://www.appin.site/craft/gemini-api-workbuddy-trae.html

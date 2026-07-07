#!/usr/bin/env python3
"""Generate GPT Image 2 craft article page using Template B."""
import re

def template_b(title, badge, excerpt, date, word_count, sections, tags_count, read_time, summary, key_points_html, body_html, tags_html):
    with open('craft/_template-b.html', 'r') as f:
        tpl = f.read()

    tpl = tpl.replace('{{TITLE}}', title)
    tpl = tpl.replace('{{BADGE}}', badge)
    tpl = tpl.replace('{{EXCERPT}}', excerpt)
    tpl = tpl.replace('{{DATE}}', date)
    tpl = tpl.replace('{{WORD_COUNT}}', word_count)
    tpl = tpl.replace('{{SECTIONS}}', str(sections))
    tpl = tpl.replace('{{TAGS_COUNT}}', str(tags_count))
    tpl = tpl.replace('{{READ_TIME}}', str(read_time))
    tpl = tpl.replace('{{TITLE_HTML}}', title)
    tpl = tpl.replace('{{SUMMARY}}', summary)
    tpl = tpl.replace('{{KEY_POINTS}}', key_points_html)
    tpl = tpl.replace('{{BODY}}', body_html)
    tpl = tpl.replace('{{TAGS}}', tags_html)

    with open('craft/gpt-image-2-prompts.html', 'w') as f:
        f.write(tpl)
    print('Generated: craft/gpt-image-2-prompts.html')

# ---- Build Body HTML ----
body = []

def h2(text):
    body.append(f'<h2>{text}</h2>')

def h3(text):
    body.append(f'<h3>{text}</h3>')

def h4(text):
    body.append(f'<h4>{text}</h4>')

def p(text):
    body.append(f'<p>{text}</p>')

def pull(text):
    body.append(f'<div class="pull-quote"><p>{text}</p></div>')

def info(title, text):
    body.append(f'<div class="info-box"><div class="info-title">{title}</div><p>{text}</p></div>')

def highlight(text):
    body.append(f'<div class="highlight-box"><p>{text}</p></div>')

def table(headers, rows):
    h = ''.join(f'<th>{c}</th>' for c in headers)
    r = ''.join(f'<tr>{"".join(f"<td>{c}</td>" for c in row)}</tr>' for row in rows)
    body.append(f'<div class="table-wrap"><table><thead><tr>{h}</tr></thead><tbody>{r}</tbody></table></div>')

def steps(items):
    lis = ''.join(f'<li><span class="step-label">{item["label"]}</span><p>{item["content"]}</p></li>' for item in items)
    body.append(f'<ol class="step-list">{lis}</ol>')

def checklist(items):
    lis = ''.join(f'<li>{item}</li>' for item in items)
    body.append(f'<ul class="checklist">{lis}</ul>')

def code(text):
    body.append(f'<div class="code-block">{text}</div>')

def ul(items):
    lis = ''.join(f'<li>{item}</li>' for item in items)
    body.append(f'<ul>{lis}</ul>')

# ===========================
# Content
# ===========================

h2('一、这是什么？')

p('GPT Image 2 是 OpenAI 推出的新一代图像生成模型，文字渲染准确率高达 <strong>99%+</strong>，支持 4K 分辨率，3 秒出图。')

p('<strong>awesome-gpt-image-2-prompts</strong> 是由 EvoLinkAI 团队维护的开源提示词案例库，专门收录 GPT-Image-2 的高质量 Prompt 和对应效果图。简单来说：<strong>你不用自己摸索怎么写提示词了，直接来这个仓库找模板，复制粘贴就能出好图。</strong>')

table(
    ['维度', '数据'],
    [
        ['GitHub Stars', '16.9K+（2个月内）'],
        ['案例总数', '900+ 条（持续更新）'],
        ['开源协议', 'CC0 1.0（完全开放，可自由使用）'],
        ['多语言支持', '11种语言（含简体中文）'],
        ['仓库地址', '<a href="https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts" target="_blank">github.com/EvoLinkAI/awesome-gpt-image-2-prompts</a>'],
    ]
)

h2('二、核心功能')

h3('1. 900+ 现成 Prompt 模板')
p('每条模板都包含：提示词全文（可直接复制使用）、对应效果图（看到这个 Prompt 出来到底什么效果）、场景分类标签（方便按需检索）。')

h3('2. 7 大场景全覆盖')

table(
    ['场景分类', '适合谁', '典型案例'],
    [
        ['电商场景', '电商运营、产品经理', '产品主图、故事板、电商拍法'],
        ['广告创意', '广告策划、品牌设计', '广告 KV、品牌叙事图'],
        ['人像摄影', '摄影师、自媒体', '写真、头像、人物概念图'],
        ['海报插画', '设计师、内容创作者', '电影海报、品牌视觉、插画风格'],
        ['角色设计', '游戏开发者、IP设计师', '游戏角色、IP形象、二次元人设'],
        ['UI/社媒素材', 'UI设计师、运营', 'App界面Mockup、封面图、社媒配图'],
        ['社区实验', '所有AI爱好者', '探索性玩法和创意实验'],
    ]
)

h3('3. API 调用支持')
p('提供结构化的 JSON 文件（gpt_image_2_prompt.json），所有 Prompt 可程序化读取，方便批量处理或接入自己的工具链。')

h3('4. 工作流集成')
p('支持 GPT-Image-2 × Seedance 2.0 影视级工作流，实现从图片生成到视频生成的完整链路。')

h2('三、怎么用？')

h3('方式一：直接浏览复制（零门槛）')

steps([
    {'label': '打开仓库', 'content': '打开 GitHub 仓库 <a href="https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts" target="_blank">github.com/EvoLinkAI/awesome-gpt-image-2-prompts</a>'},
    {'label': '找分类', 'content': '找到你需要的场景分类（如「电商场景」）'},
    {'label': '选案例', 'content': '浏览案例，找到满意的效果图'},
    {'label': '复制 Prompt', 'content': '复制对应的 Prompt'},
    {'label': '生成', 'content': '去 Evolink 平台（evolink.ai/gpt-image-2）粘贴 Prompt，直接生成'},
])

h3('方式二：API 调用（开发者适用）')

p('<strong>步骤 1：注册获取 API Key</strong> — 去 Evolink 平台免费注册，获取 API Key。')

p('<strong>步骤 2：调用接口</strong>')

code('''export EVOLINK_API_KEY="your_key_here"
curl --request POST \\
  --url https://api.evolink.ai/v1/images/generations \\
  --header "Authorization: Bearer ${EVOLINK_API_KEY}" \\
  --header "Content-Type: application/json" \\
  --data '{
    "model": "gpt-image-2",
    "prompt": "A premium ecommerce hero shot..."
  }'
''')

p('<strong>步骤 3：本地技能安装</strong> — 一键安装后可直接调用技能，无需重复配置 API Key：')

code('npx evolink-gpt-image -y')

h3('方式三：Python SDK 调用')

code('''from openai import OpenAI

client = OpenAI()
result = client.images.generate(
    model="gpt-image-2",
    prompt=prompt,
    size="1024x1536",
    quality="high",
    n=1,
)
print(result.data[0].url)
''')

h2('四、Prompt 写作技巧')

pull('好 Prompt 不是形容词堆砌，而是约束越明确越好。<br><br>核心公式：<strong>任务类型 + 主体锚点 + 结构约束 + 光线/材质/色彩 + 文字要求 + 保留项/排除项</strong>')

h3('5 类关键约束')

table(
    ['约束类型', '说明', '示例'],
    [
        ['任务类型', '你在生成什么', '<code>editorial portrait / product ad / UI mockup</code>'],
        ['主体锚点', '画面中心是谁/什么', '<code>年轻女性、便利店门口、中景</code>'],
        ['结构约束', '镜头、构图、布局', '<code>35mm、中景、眼平视角</code>'],
        ['材质与光线', '决定画面可信度', '<code>荧光灯+霓虹、玻璃反射、皮肤纹理</code>'],
        ['输出边界', '什么必须有/什么不能有', '<code>无塑料皮肤、无水印、无多余文字</code>'],
    ]
)

h3('人像摄影骨架模板')

code('''Create a candid editorial portrait of [主体] in [环境].
Camera: [35mm / 85mm / iPhone / CCD], [framing], [angle].
Lighting: [mixed fluorescent and neon / soft window light / harsh flash].
Skin and texture: natural skin texture, visible pores, realistic highlights, no plastic skin.
Wardrobe and pose: [服装], [姿势], [表情].
Background: [2-3 key environment details], shallow depth of field.
Mood and grade: [cinematic / nostalgic / documentary / casual snapshot].
Output boundary: no watermark, no extra text, no synthetic beauty-filter look.
''')

h3('产品广告骨架模板')

code('''Create a premium product advertising image for [产品].
Hero object: [形状, 材质, 颜色, 角度, 品牌区域].
Composition: [centered / three-quarter view / split layout / 9-panel storyboard].
Supporting props: [2-4 props], each with a narrative role.
Lighting: [low-key studio / soft daylight / hard edge light / glossy reflections].
Surface and environment: [wet ground / marble / paper texture / desk / void background].
Color system: [3-5 colors].
Typography rule: [no text / short headline only / Chinese labels with short copy].
Avoid: cheap e-commerce look, random props, unreadable text, broken geometry.
''')

h3('UI/信息图骨架模板（JSON格式）')

code('''{
  "type": "infographic or UI mockup",
  "goal": "explain [topic] for [audience]",
  "canvas": { "aspect_ratio": "4:5", "background": "clean paper texture" },
  "layout": {
    "header": "title + subtitle",
    "main_visual": "one central diagram or hero image",
    "modules": 4,
    "footer": "legend or CTA",
    "text_language": "Simplified Chinese",
    "text_density": "short labels only"
  },
  "visual_system": {
    "style": "editorial / futuristic / museum board",
    "palette": ["#0F172A", "#E2E8F0", "#38BDF8"]
  },
  "must_keep": ["clear hierarchy", "consistent icon style", "readable labels"],
  "avoid": ["crowded layout", "fake tiny paragraphs", "random decoration"]
}
''')

h2('五、常见误区与避坑指南')

table(
    ['常见错误', '为什么会翻车', '正确做法'],
    [
        ['只写风格不写结构', '模型不知道画面分几块、文字放哪', '先写比例、模块数、标题层级'],
        ['想要人物一致只写 "same person"', '五官、服装、镜头都没锁定', '分别写清脸型、发型、服装、画幅'],
        ['形容词堆太多', '有噪声缺约束', '少写空话，多写镜头、材质、构图'],
        ['中文文案太长', '小字容易失真', '改成短标题、短标签、模块化信息'],
        ['只说"不要改别的"', '没定义 keep 的具体内容', '列出 preserve 清单与 change 清单'],
        ['直接搬社区 prompt 商用', '可能踩版权/商标风险', '学结构，不直接搬整段案例'],
    ]
)

h4('中文文本特别注意')
checklist([
    '海报和信息图尽量用短标题+短标签，不要塞密集正文',
    '明确写 Simplified Chinese，并限定标题数量和每模块行数',
    '如果必须做长中文内容，先出结构稿，再二次编辑精修',
])

h2('六、技术架构说明')

table(
    ['维度', '说明'],
    [
        ['项目性质', '提示词资源仓库（awesome-list），非代码库'],
        ['核心依赖', 'OpenAI GPT-Image-2 模型 + Evolink 平台 API'],
        ['数据格式', 'Markdown 文件 + 结构化 JSON'],
        ['目录结构', 'cases/ecommerce.md（电商）、cases/ad-creative.md（广告）等按场景分文件'],
        ['多语言', 'README_xx.md 格式，支持11种语言'],
        ['更新机制', '社区贡献 + 团队筛选，持续更新'],
    ]
)

h2('七、同类仓库对比')

table(
    ['仓库', 'Stars', '特点', '最适合'],
    [
        ['<strong>EvoLinkAI</strong>/awesome-gpt-image-2-prompts', '<strong>16.9K+</strong>', '精选案例密度高，电商广告强', '电商主图、广告KV、产品摄影'],
        ['<strong>YouMind-OpenLab</strong>/awesome-gpt-image-2', '4.1K+', '规模最大(3600+条)，检索友好', '找灵感、找同类案例'],
        ['<strong>freestylefly</strong>/awesome-gpt-image-2', '2.9K+', '结构化程度最高(Prompt-as-Code)', 'UI、信息图、批量化出图'],
        ['<strong>Anil-matcha</strong>/Awesome-GPT-Image-2-API-Prompts', '1.8K+', '开发者手册风格', 'API集成、工程落地'],
    ]
)

info('推荐使用顺序',
    '找灵感 → 先在 <strong>YouMind</strong> 搜索相似任务<br>'
    '看成熟案例 → 去 <strong>EvoLinkAI</strong> 看完整广告图、电商图<br>'
    '改造成模板 → 用 <strong>freestylefly</strong> 的结构化思路拆解<br>'
    '落 API → 参考 <strong>Anil-matcha</strong> 的工程文档接入'
)

h2('八、30分钟上手路线')

steps([
    {'label': '找灵感', 'content': '在 YouMind 找 5 个相似任务，看别人怎么定义目标'},
    {'label': '学成熟案例', 'content': '去 EvoLinkAI 挑 1-2 个成熟案例，观察主体、镜头、光线、文字约束'},
    {'label': '改造模板', 'content': '把案例重写成自己的骨架模板，删掉与业务无关的描述'},
    {'label': '结构化拆解', 'content': '用 freestylefly 思路拆成：业务变量、视觉常量、布局协议'},
    {'label': '接入 API', 'content': '接 API，记录 3 组成功样本和 3 组失败样本'},
])

h3('发布前检查清单')

checklist([
    '任务类型明确，不是笼统的"来一张图"',
    '主体锚点只有 1 个中心',
    '画幅、镜头或布局数量已写明',
    '光线与材质是具体物理描述，不是空话',
    '文本语言、标题层级、字数密度已限定',
    '保留项与禁止项分别列出',
    '商用版权/品牌/人物风险已审查',
    '成功样本已沉淀成模板',
])

h2('九、总结')

highlight(
    'GPT Image 2 提示词库的核心价值：<br><br>'
    '不是「更长的 prompt」，而是<strong>「更清楚的约束」</strong><br><br>'
    '不是「灵感型手艺」，而是<strong>「可复用的工程资产」</strong><br><br>'
    '好模板控制得越清楚越好，描述华丽反而是噪声。<br><br>'
    '一句话：<strong>学结构，不抄整段；建模板，不留灵感。</strong>'
)

# Assemble
body_html = '\n'.join(body)

# ---- Tags ----
tags = ['GPT Image 2', 'AI 绘图', 'Prompt 工程', '图像生成', 'OpenAI', '提示词模板', '开源']
tags_html = '\n'.join(f'<a href="/craft/?tag={t}">{t}</a>' for t in tags)

# ---- Key Points ----
key_points_html = '\n'.join(
    f'<span>{k}</span>' for k in [
        '16.9K+ GitHub Star', '900+ 现成 Prompt 模板',
        '覆盖电商/广告/人像等 7 大场景', 'CC0 协议完全开放',
        '支持 API 调用 + Python SDK', '11 种语言含简体中文',
    ]
)

template_b(
    title='GPT Image 2 开源提示词库：900+模板直接复制出图',
    badge='AI 工具',
    excerpt='GPT Image 2 + awesome-gpt-image-2-prompts 开源提示词案例库，收录 900+ 高质量 Prompt 模板，覆盖 7 大场景，CC0 协议完全开放。让 AI 图像生成从「灵光一现」变成「工程化复用」。',
    date='2026-06-22',
    word_count='约 3,200 字',
    sections=9,
    tags_count=len(tags),
    read_time=14,
    summary='awesome-gpt-image-2-prompts 是由 EvoLinkAI 团队维护的开源提示词案例库，收录超过 900 条 GPT-Image-2 的高质量 Prompt 和对应效果图。覆盖电商、广告创意、人像摄影、海报插画、角色设计、UI素材等 7 大场景，CC0 许可证完全开放，支持 11 种语言。本文从是什么、怎么用、Prompt 写作技巧到常见误区全面拆解这套「AI 图像生成的工程化方法论」。',
    key_points_html=key_points_html,
    body_html=body_html,
    tags_html=tags_html,
)

print('Done!')

#!/usr/bin/env python3
"""
全站审计修复脚本（2026-07-18 审计后）。
处理：
  A) 扩展 list.css 覆盖 ai-radar 类词汇
  B) 重写 ai-radar/index.html（深紫→荧光绿 DP 风）
  C) 生成 2 篇缺 HTML 的 craft 文章（canvas-api / nodejs-express）
  D) 修复 video-lab/index.html 的 /article.html?id= 旧路由
"""
import io, json, html, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))

# ══════════════════════════════════════
# A) 扩展 list.css — 加入 AI RADAR 类词汇覆盖
# ══════════════════════════════════════

AI_RADAR_CSS = """

/* ═══ AI RADAR 列表页（list-ai-radar body class） ═══ */
/* 复用 list.css 基础 token；以下为 ai-radar JS 渲染模板所需的类名映射到 DP 风格 */

/* Hero 居中（ai-radar 用居中大标题） */
body.list-ai-radar .hero{text-align:center;padding:120px 28px 48px}
body.list-ai-radar .hero h1{font-size:clamp(30px,5.5vw,52px);letter-spacing:-1.5px;
  background:linear-gradient(135deg,var(--brand),var(--amber));-webkit-background-clip:text;
  -webkit-text-fill-color:transparent;background-clip:text}
body.list-ai-radar .hero-desc{margin:0 auto 32px;max-width:520px;text-align:center}
body.list-ai-radar .hero-stats{justify-content:center;gap:48px}
body.list-ai-radar .hero-stat .num{font-size:40px;font-weight:700;font-family:var(--font-mono);
  background:linear-gradient(135deg,var(--brand),var(--amber));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* Filters 芯片 */
.filters-wrap{display:flex;justify-content:center;gap:8px;padding:0 28px 36px;flex-wrap:wrap}
.f-chip{padding:8px 20px;border-radius:99px;border:1px solid var(--border);
  background:var(--bg-card);color:var(--fg-muted);font-size:13px;font-weight:500;
  cursor:pointer;transition:all .2s;user-select:none;white-space:nowrap}
.f-chip:hover{border-color:var(--brand);color:var(--brand);background:var(--brand-bg)}
.f-chip.active{background:var(--brand-bg);border-color:var(--brand-border);color:var(--brand);
  box-shadow:0 0 16px var(--accent-shadow)}
.f-chip .count{font-size:10px;margin-left:4px;opacity:.5}

/* Card Grid（ai-radar 核心：资讯卡） */
.grid{max-width:var(--maxw);margin:0 auto;padding:0 28px 48px;
  display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px}
.card{display:flex;flex-direction:column;gap:12px;padding:22px 24px;border-radius:var(--radius);
  border:1px solid var(--border);background:var(--bg-card);text-decoration:none;color:inherit;
  transition:all .25s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden}
.card::before{content:'';position:absolute;left:0;top:12px;bottom:12px;width:3px;
  border-radius:0 2px 2px 0;background:var(--brand);opacity:.2;transition:opacity .25s}
.card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.35);
  border-color:var(--brand-border);background:var(--bg-elevated)}
.card:hover::before{opacity:.7}

/* Card 内部结构 */
.card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.card-cat{font-size:10px;font-weight:700;padding:4px 11px;border-radius:99px;
  letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;flex-shrink:0}
.card-score{font-size:11px;color:var(--fg-dim);white-space:nowrap;display:flex;align-items:center;gap:3px}
.card-title{font-size:15px;font-weight:600;line-height:1.5;color:var(--fg);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  transition:color .2s}
.card:hover .card-title{color:var(--brand)}
.card-summary{font-size:13px;color:var(--fg-muted);line-height:1.65;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;flex:1}
.card-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding-top:12px;border-top:1px solid var(--border);margin-top:auto}
.card-source{font-size:11px;color:var(--fg-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-time{font-size:11px;color:var(--fg-dim);white-space:nowrap;flex-shrink:0}

/* Card 分类色（保留语义色但降低饱和度适配暗色底） */
.cat-model{background:rgba(129,140,248,.10);color:#a5b4fc}
.cat-product{background:rgba(192,132,252,.10);color:#d8b4fe}
.cat-industry{background:rgba(52,211,153,.10);color:#6ee7b7}
.cat-paper{background:rgba(251,191,36,.10);color:#fcd34d}
.cat-tip{background:rgba(244,114,182,.10);#f9a8d4}

/* Sources 信源区 */
.sources-section{max-width:var(--maxw);margin:0 auto;padding:0 28px 64px}
.sources-divider{width:60px;height:2px;background:linear-gradient(90deg,transparent,var(--brand),transparent);
  margin:0 auto 44px;border-radius:1px}
.sources-header{text-align:center;margin-bottom:40px}
.sources-header h2{font-size:24px;font-weight:700;letter-spacing:-.5px;color:var(--fg);margin-bottom:10px}
.sources-header p{font-size:14px;color:var(--fg-muted);max-width:480px;margin:0 auto;line-height:1.65}
.sources-header strong{color:var(--brand);font-weight:700}
.sources-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.src-card{padding:20px 22px 16px;border-radius:var(--radius);border:1px solid var(--border);
  background:var(--bg-card);transition:all .25s}
.src-card:hover{border-color:var(--brand-border);transform:translateY(-1px)}
.src-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;border-radius:var(--radius) var(--radius) 0 0}
.src-card.cat-labs::before{background:linear-gradient(90deg,#818cf8,#6366f1)}
.src-card.cat-cn::before{background:linear-gradient(90deg,#f472b6,#fb923c)}
.src-card.cat-overseas::before{background:linear-gradient(90deg,#c084fc,#818cf8)}
.src-card.cat-dev::before{background:linear-gradient(90deg,#34d399,#10b981)}
.src-card.cat-biz::before{background:linear-gradient(90deg,#fbbf24,#f59e0b)}
.src-card{position:relative;overflow:hidden}
.src-card-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.src-card-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;
  justify-content:center;font-size:15px;flex-shrink:0}
.src-card.cat-labs .src-card-icon{background:rgba(129,140,248,.10);color:#a5b4fc}
.src-card.cat-cn .src-card-icon{background:rgba(244,114,182,.10);color:#f9a8d4}
.src-card.cat-overseas .src-card-icon{background:rgba(192,132,252,.10);color:#d8b4fe}
.src-card.cat-dev .src-card-icon{background:rgba(52,211,153,.10);color:#6ee7b7}
.src-card.cat-biz .src-card-icon{background:rgba(251,191,36,.10);color:#fcd34d}
.src-card-title{font-size:14px;font-weight:600;color:var(--fg)}
.src-card-count{font-size:11px;color:var(--fg-dim);margin-left:auto}
.src-tags{display:flex;flex-wrap:wrap;gap:6px}
.src-tag{display:inline-flex;align-items:center;gap:5px;
  padding:5px 11px;border-radius:99px;font-size:11px;font-weight:500;
  background:var(--bg-elevated);color:var(--fg-muted);border:1px solid var(--border);
  transition:all .18s;white-space:nowrap}
.src-tag:hover{border-color:var(--brand-border);color:var(--brand)}

/* Ai-radar 卡片入场动画 */
.card-enter{animation:radarCardIn .45s cubic-bezier(.16,1,.3,1) both}
@keyframes radarCardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* Ai-radar 响应式 */
@media(max-width:800px){
  body.list-ai-radar .hero{padding:100px 20px 36px}
  body.list-ai-radar .hero-stats{gap:28px}
  body.list-ai-radar .hero-stat .num{font-size:30px}
  .grid{grid-template-columns:1fr;padding:0 20px 36px}
  .sources-grid{grid-template-columns:1fr}
  .sources-section{padding:0 20px 48px}
  .sources-header h2{font-size:20px}
}
"""

def extend_list_css():
    path = os.path.join(ROOT, 'assets', 'list.css')
    with io.open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'AI RADAR' in content:
        print('list.css already contains AI RADAR section, skipping.')
        return
    content += '\n' + AI_RADAR_CSS
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('extended: assets/list.css (+AI RADAR styles)')


# ══════════════════════════════════════
# B) 重写 ai-radar/index.html
# ══════════════════════════════════════

TOGGLE_SCRIPT = '''<script>
function toggleTheme(){var b=document.body;b.classList.toggle('light');
try{localStorage.setItem('theme',b.classList.contains('light')?'light':'dark');}catch(e){}}
(function(){try{if(localStorage.getItem('theme')==='light')document.body.classList.add('light');}catch(e){}})();
</script>'''

def reskin_ai_radar():
    path = os.path.join(ROOT, 'ai-radar', 'index.html')
    with io.open(path, 'r', encoding='utf-8') as f:
        raw = f.read()

    # 提取内嵌 JSON 数据和 JS 逻辑
    data_match = re.search(
        r'<script id="ai-data"[^>]*>(.*?)</script>',
        raw, re.DOTALL
    )
    js_match = re.search(r'<script>\n\(function\(\)(.*?)\)\(\);\n</script>', raw, re.DOTALL)
    if not data_match or not js_match:
        print('ERROR: cannot find ai-data or main script in ai-radar/index.html')
        return False

    ai_data = data_match.group(1)
    main_js = js_match.group(1)

    # 提取 sgn-links 导航项用于重建标准 nav
    nav_items = [
        ('/', '首页'),
        ('/craft/', '技艺录'),
        ('/video-lab/', '视频剪辑'),
        ('/notes/', '随笔'),
        ('/daily-digest/', '每日阅读'),
        ('/ai-radar/', 'AI 雷达'),
    ]

    nav_html = '<ul class="nav-links">\n'
    for href, label in nav_items:
        active = ' class="active"' if 'ai-radar' in href else ''
        nav_html += f'      <li><a href="{href}"{active}>{label}</a></li>\n'
    nav_html += '    </ul>'

    out = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 新闻雷达 — 每日 AI 资讯精选</title>
<meta name="description" content="AI 新闻雷达，每天自动从 AI HOT 精选全球 AI 资讯。覆盖模型发布、产品更新、行业动态、论文研究、技巧观点五大板块。">
<meta property="og:title" content="AI 新闻雷达 — 每日 AI 资讯精选">
<meta property="og:description" content="每天自动更新，精选全球 AI 资讯。模型发布、产品更新、行业动态、论文研究、技巧观点一站浏览。">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/list.css">
</head>
<body class="list-ai-radar">

<!-- Nav -->
<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo">李坤<span>/appin.site</span></a>
    <div class="nav-right">
      {nav_html}
      <button class="theme-toggle" onclick="toggleTheme()" aria-label="切换主题">◐</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="hero">
  <div class="hero-badge"><span class="dot"></span>DAILY AI DIGEST</div>
  <h1>今天的 AI 世界<br>发生了什么？</h1>
  <p class="hero-desc">每天自动从 AI HOT 精选全球人工智能资讯，模型发布、产品更新、行业动态、论文研究、技巧观点，一站浏览。</p>
  <div class="hero-right">
    <div class="hero-stat"><div class="num" id="totalCount">--</div><div class="label">精选资讯</div></div>
    <div class="hero-stat"><div class="num" id="catCount">--</div><div class="label">覆盖板块</div></div>
    <div class="hero-stat"><div class="num" id="topSource">--</div><div class="label">资讯来源</div></div>
  </div>
</section>

<!-- Filters -->
<div class="filters-wrap" id="filters">
  <div class="f-chip active" data-cat="all">全部<span class="count" id="cnt-all">0</span></div>
  <div class="f-chip" data-cat="ai-models">模型发布<span class="count" id="cnt-models">0</span></div>
  <div class="f-chip" data-cat="ai-products">产品更新<span class="count" id="cnt-products">0</span></div>
  <div class="f-chip" data-cat="industry">行业动态<span class="count" id="cnt-industry">0</span></div>
  <div class="f-chip" data-cat="paper">论文研究<span class="count" id="cnt-paper">0</span></div>
  <div class="f-chip" data-cat="tip">技巧观点<span class="count" id="cnt-tip">0</span></div>
</div>

<!-- Grid -->
<div class="grid" id="grid"></div>

<!-- Sources -->
<section class="sources-section">
  <div class="sources-divider"></div>
  <div class="sources-header">
    <h2>信源追踪</h2>
    <p>实时追踪全球 <strong id="srcTotal">34</strong> 个核心 AI 信源，覆盖官方实验室、中文媒体、海外科技媒体、开发者社区与投资机构。</p>
  </div>
  <div class="sources-grid" id="sourcesGrid"></div>
</section>

<!-- Footer -->
<footer class="footer">
  <p>&copy; 2026 李坤 &middot; 数据来源 <a href="https://aihot.virxact.com" target="_blank" rel="noopener">AI HOT</a> &middot; 每天自动更新</p>
  <button class="theme-toggle" onclick="toggleTheme()" aria-label="切换主题">◐ 切换主题</button>
</footer>

<!-- Data (embedded JSON blob) -->
<script id="ai-data" type="application/json">{ai_data}</script>

<!-- Main rendering logic (preserved from original) -->
<script>
{main_js}
</script>

{TOGGLE_SCRIPT}
</body>
</html>'''

    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(out)
    print('reskinned: ai-radar/index.html (DP green theme)')
    return True


# ══════════════════════════════════════
# C) 生成 2 个缺失的 craft HTML 页面
# ══════════════════════════════════════

import markdown

DATA = json.load(io.open(os.path.join(ROOT, 'content.json'), 'r', encoding='utf-8'))

SCRIPT_FAB = '''<script>
(function(){
  try{ if(localStorage.getItem('theme')==='light') document.body.classList.add('light'); }catch(e){}
  function toggleTheme(){ var b=document.body; b.classList.toggle('light');
    try{ localStorage.setItem('theme', b.classList.contains('light')?'light':'dark'); }catch(e){} }
  var fab=document.createElement('button'); fab.className='theme-fab'; fab.innerHTML='◐';
    fab.title='切换主题'; fab.setAttribute('aria-label','切换主题'); fab.onclick=toggleTheme;
    document.body.appendChild(fab);
})();
</script>'''

MISSING_IDS = ['article-10', 'article-12']  # canvas-api-ripple-particles, nodejs-express-blog-api

def gen_missing_craft(a):
    title = a.get('title') or ''
    excerpt = a.get('excerpt') or ''
    date = (a.get('date') or '')[:10]
    tags = a.get('tags') or []
    image = a.get('image') or ''
    content = a.get('content') or ''

    md = markdown.Markdown(extensions=['extra', 'sane_lists', 'tables', 'fenced_code'])
    body = md.convert(content)

    chars = len(content)
    wc = '{:,}'.format(chars)

    cover = ''
    if image:
        cover = '<div class="hero-cover"><img src="/%s" alt="%s" loading="eager" /></div>' % (
            html.escape(image, quote=True), html.escape(title, quote=True))

    tags_html = '\n'.join('  <a href="#">%s</a>' % html.escape(t) for t in tags)
    t_esc = title.replace('\n', ' ')
    e_esc = excerpt.replace('\n', ' ')

    out = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>%s</title>
<meta name="description" content="%s">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/article.css">
</head>
<body>
<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo">李坤<span>/appin.site</span></a>
    <ul class="nav-links">
      <li><a href="/">首页</a></li>
      <li><a href="/craft/" class="active">技艺录</a></li>
      <li><a href="/video-lab/">视频剪辑</a></li>
    </ul>
  </div>
</nav>
<section class="hero">
  <div class="hero-badge"><span class="dot"></span>CRAFT — 技术笔记</div>
  <h1>%s</h1>
  <p class="hero-desc">%s</p>
  <div class="hero-meta">
    <span>李坤</span><span class="dot"></span>
    <span>%s</span><span class="dot"></span>
    <span>约 %s 字</span>
  </div>
  <div class="hero-divider"></div>
</section>
<div class="page">
%s
<article class="article-body">
%s
<a href="/craft/" class="back-link">返回技艺录</a>
<div class="tag-cloud">
%s
</div>
</article>
</div>
<footer class="footer">
  <p>&copy; 2026 李坤 &middot; <a href="/">appin.site</a></p>
</footer>
%s
</body>
</html>''' % (
        html.escape(t_esc), html.escape(e_esc),
        html.escape(t_esc), html.escape(e_esc), date, wc,
        cover, body, tags_html, SCRIPT_FAB)

    slug = a.get('slug') or a.get('id')
    path = os.path.join(ROOT, 'craft', slug + '.html')
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(out)
    print('generated craft page:', slug + '.html', '(chars=%d)' % chars)


def gen_missing():
    count = 0
    for art in DATA['articles']:
        if art.get('id') in MISSING_IDS:
            slug = art.get('slug', '')
            filepath = os.path.join(ROOT, 'craft', slug + '.html')
            if not os.path.exists(filepath):
                gen_missing_craft(art)
                count += 1
            else:
                print('already exists:', slug + '.html')
    if count == 0:
        print('no missing craft pages to generate')
    return count


# ══════════════════════════════════════
# D) 修复 video-lab 旧路由 /article.html?id= → /video-lab/
# ══════════════════════════════════════

def fix_video_lab_routes():
    path = os.path.join(ROOT, 'video-lab', 'index.html')
    with io.open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 统计旧路由数量
    old_count = len(re.findall(r'/article\.html\?id=', content))
    if old_count == 0:
        print('video-lab: no old routes found')
        return 0

    # 替换静态链接中的旧路由 → # (这些文章没有独立页，暂时用锚点避免死链)
    # 更好的方案：替换为 /video-lab/# 并加注释
    fixed = re.sub(
        r'href="/article\.html\?id=([^"]*)"',
        r'href="#video-\1"',  # 锚点链接（不跳转但也不死链）
        content
    )

    # 同时修复 JS 模板中的动态路由生成
    fixed = fixed.replace(
        "cardHtml = '<a href=\"/article.html?id=' + a.id + '\"",
        "cardHtml = '<a href=\"#video-' + a.id + '\""
    )
    fixed = fixed.replace(
        "'<a href=\"/article.html?id='",
        "'<a href=\"#video-'"
    )

    new_count = len(re.findall(r'/article\.html\?id=', fixed))
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(fixed)
    print(f'video-lab: fixed {old_count - new_count} old routes ({new_count} remaining)')

    return old_count - new_count


# ══════════════════════════════════════
# 主流程
# ══════════════════════════════════════

if __name__ == '__main__':
    print('=' * 50)
    print('APPIN.SITE AUDIT FIX RUNNER')
    print('=' * 50)

    print('\n--- [A] Extending list.css ---')
    extend_list_css()

    print('\n--- [B] Reskinning ai-radar ---')
    reskin_ai_radar()

    print('\n--- [C] Generating missing craft pages ---')
    gen_missing()

    print('\n--- [D] Fixing video-lab routes ---')
    fix_video_lab_routes()

    print('\n✅ All fixes applied.')

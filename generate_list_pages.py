#!/usr/bin/env python3
"""
修复 Appin.site 5 个栏目列表页：原本 index.html 只有 <head> 没有 <body>，导致页面空白。
本脚本保留现有 SEO head，补全 body，并接入统一的 list.css + fx.css/fx.js 皮肤与动效。
"""
import json
import os
import re

BASE = '/Users/likun/Projects/appin-site'

CATS = {
    'craft': {
        'title': '技艺录',
        'subtitle': '技术学习与实践记录',
        'desc': '从 HTML/CSS 到 AI 工具链——把学到的东西，变成能落地的实战教程。',
        'body_class': 'list-craft',
    },
    'notes': {
        'title': '随笔',
        'subtitle': '个人思考',
        'desc': '工作、生活、阅读中的碎片思考，记录那些不吐不快的观点。',
        'body_class': 'list-notes',
    },
    'video-lab': {
        'title': '视频',
        'subtitle': '影像探索',
        'desc': '从剪辑软件到镜头叙事，记录学习影视飓风课程与独立创作的过程。',
        'body_class': 'list-video',
    },
    'daily-digest': {
        'title': '每日阅读',
        'subtitle': '每天一份精选',
        'desc': '社会商业、汽车科技、养老产业、心理学好书——每日阅读，自动汇总。',
        'body_class': 'list-daily',
    },
    'ai-radar': {
        'title': 'AI 雷达',
        'subtitle': '每日 AI 资讯',
        'desc': '自动采集 + 人工精选的 AI 行业动态。内容正在同步建设中。',
        'body_class': 'list-ai-radar',
    },
}

NAV = '''<nav class="nav"><div class="nav-inner">
  <a href="/" class="nav-logo">Appin<span>.site</span></a>
  <div class="nav-right">
    <div class="nav-links">
      <a href="/craft/">技艺录</a>
      <a href="/notes/">随笔</a>
      <a href="/video-lab/">视频</a>
      <a href="/daily-digest/">每日阅读</a>
      <a href="/ai-radar/">AI 雷达</a>
    </div>
    <button class="theme-toggle" onclick="toggleTheme()" title="切换主题" aria-label="切换主题">
      <svg class="ic ic-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg class="ic ic-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    </button>
  </div>
</div></nav>'''

THEME_SCRIPT = '''<script>
(function(){try{if(localStorage.getItem('theme')==='light')document.body.classList.add('light');}catch(e){}})();
function toggleTheme(){var b=document.body;b.classList.toggle('light');try{localStorage.setItem('theme',b.classList.contains('light')?'light':'dark');}catch(e){}}
</script>'''

FOOTER = '''<footer class="footer">
  <p>© 2026 李坤 · <a href="/">Appin.site</a></p>
  <button class="theme-toggle" onclick="toggleTheme()" title="切换主题" aria-label="切换主题">
    <svg class="ic ic-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    <svg class="ic ic-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
  </button>
</footer>'''

ASSETS = '''
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/list.css">
<link rel="stylesheet" href="/assets/fx.css">
<script src="/assets/fx.js" defer></script>
</head>
'''


def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def inject_assets(head):
    if '/assets/list.css' in head:
        return head
    if '</head>' in head:
        return head.replace('</head>', ASSETS)
    # 占位文件可能缺 </head>：直接在 head 末尾追加资源块（ASSETS 自带 </head> 收尾）
    return head.rstrip() + '\n' + ASSETS


def load_articles():
    with open(os.path.join(BASE, 'content.json'), 'r', encoding='utf-8') as f:
        return json.load(f).get('articles', [])


def make_article_card(a):
    cat = a.get('category', 'craft')
    # 目录映射：content.json 中的 video 分类对应 video-lab 目录
    link_cat = 'video-lab' if cat == 'video' else cat
    link = a.get('link') or ('/' + link_cat + '/' + (a.get('slug') or a.get('id')) + '.html')
    img = a.get('image') or ''
    # 图片路径标准化：非 URL 的相对路径统一补前导斜杠
    if img and not re.match(r'^https?://', img, re.I) and not img.startswith('/'):
        img = '/' + img
    date = a.get('date', '')
    tags = a.get('tags', [])[:2]
    tag_html = ''.join('<span class="item-tag">' + esc(t) + '</span>' for t in tags) if tags else ''
    thumb = (f'<div class="article-thumb"><img class="thumb-img" src="{esc(img)}" alt="" loading="lazy"></div>'
             if img else '<div class="article-thumb fallback"><span>✎</span></div>')
    return f'''<a class="article-item" href="{esc(link)}">
  {thumb}
  <div class="article-info">
    <span class="ai-date">{esc(date)}</span>
    <h3>{esc(a.get('title', ''))}</h3>
    <p class="ai-excerpt">{esc(a.get('excerpt', ''))}</p>
    <div class="ai-meta">
      <div class="ai-tags">{tag_html}</div>
    </div>
  </div>
</a>'''


def body_html(cfg, list_html):
    return f'''<body class="{cfg['body_class']}">
{NAV}
<section class="hero">
  <div class="hero-inner">
    <div class="hero-left">
      <span class="hero-badge"><span class="dot"></span>{cfg['title']}</span>
      <h1><em>{cfg['subtitle']}</em></h1>
      <p class="hero-desc">{cfg['desc']}</p>
    </div>
  </div>
</section>
<section class="list-wrap">
  {list_html}
</section>
{FOOTER}
{THEME_SCRIPT}
</body>
</html>'''


def generate_content_page(cat, cfg, articles):
    path = os.path.join(BASE, cat, 'index.html')
    with open(path, 'r', encoding='utf-8') as f:
        raw = f.read().strip()
    head = raw.split('<body', 1)[0]
    if '/assets/list.css' in head and '</body>' in raw and 'src="uploads/' not in raw:
        print('skip (already correct):', path)
        return
    head = inject_assets(head)

    # content.json 中的分类名与目录名的映射
    content_cat = cat
    if cat == 'video-lab':
        content_cat = 'video'
    cat_articles = [a for a in articles if a.get('category') == content_cat]
    cat_articles.sort(key=lambda x: x.get('date', ''), reverse=True)

    if cat_articles:
        cards = '\n'.join(make_article_card(a) for a in cat_articles)
        list_html = f'<div class="list-header"><h2>&gt; 全部 {cfg["title"]} <span>({len(cat_articles)})</span></h2></div>\n{cards}'
    else:
        list_html = '''<div class="empty-state">
  <div class="empty-icon">✎</div>
  <div class="empty-text">该栏目暂无内容，正在建设中。</div>
</div>'''

    with open(path, 'w', encoding='utf-8') as f:
        f.write(head.rstrip() + '\n' + body_html(cfg, list_html))
    print('generated:', path)


def generate_daily_digest_page(cfg):
    path = os.path.join(BASE, 'daily-digest', 'index.html')
    with open(path, 'r', encoding='utf-8') as f:
        raw = f.read().strip()
    head = raw.split('<body', 1)[0]
    if '/assets/list.css' in head and '</body>' in raw:
        print('skip (already correct):', path)
        return
    head = inject_assets(head)

    dates = []
    for fn in os.listdir(os.path.join(BASE, 'daily-digest')):
        m = re.match(r'^(\d{4}-\d{2}-\d{2})\.html$', fn)
        if m:
            dates.append(m.group(1))
    dates.sort(reverse=True)

    if dates:
        cards = '\n'.join(
            f'<a class="digest-item reveal" href="{d}.html"><div class="digest-date-row"><span class="digest-date">{d}</span></div><div class="digest-title">每日阅读 · {d}</div><div class="digest-arrow">阅读全文 →</div></a>'
            for d in dates
        )
        list_html = f'<div class="list-header"><h2>&gt; 全部 {cfg["title"]} <span>({len(dates)})</span></h2></div>\n{cards}'
    else:
        list_html = '''<div class="empty-state">
  <div class="empty-icon">✎</div>
  <div class="empty-text">该栏目暂无内容，正在建设中。</div>
</div>'''

    with open(path, 'w', encoding='utf-8') as f:
        f.write(head.rstrip() + '\n' + body_html(cfg, list_html))
    print('generated:', path)


def generate_ai_radar_page(cfg):
    path = os.path.join(BASE, 'ai-radar', 'index.html')
    with open(path, 'r', encoding='utf-8') as f:
        raw = f.read().strip()
    head = raw.split('<body', 1)[0]
    if '/assets/list.css' in head and '</body>' in raw:
        print('skip (already correct):', path)
        return
    head = inject_assets(head)

    list_html = '''<div class="empty-state">
  <div class="empty-icon">📡</div>
  <div class="empty-text">AI 雷达内容正在同步建设中，敬请期待。</div>
</div>'''

    with open(path, 'w', encoding='utf-8') as f:
        f.write(head.rstrip() + '\n' + body_html(cfg, list_html))
    print('generated:', path)


if __name__ == '__main__':
    articles = load_articles()
    for cat in ['craft', 'notes', 'video-lab']:
        generate_content_page(cat, CATS[cat], articles)
    generate_daily_digest_page(CATS['daily-digest'])
    # ai-radar 由 update.py 流水线管理（注入 ai-data JSON + 前端渲染），本脚本不重写，避免覆盖其内容

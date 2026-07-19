#!/usr/bin/env python3
"""
统一修复/生成文章详情页：
- 所有 published 文章必须有 /assets/article.css 统一皮肤
- 图片路径统一补前导斜杠
- 缺失的页面（尤其是 video-lab）重新生成
- footer 品牌统一为 Appin.site
- 引入 fx.css/fx.js 动效
"""
import io, json, os, re, html as html_mod
import markdown

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = json.load(io.open(os.path.join(ROOT, 'content.json'), 'r', encoding='utf-8'))

CAT_DIR = {
    'craft': 'craft',
    'notes': 'notes',
    'video': 'video-lab',
    'daily': 'daily-digest',
}

CAT_LABEL = {
    'craft': 'CRAFT — 技术笔记',
    'notes': 'NOTES — 随笔',
    'video': 'VIDEO — 视频剪辑',
    'daily': 'DAILY — 每日阅读',
}

THEME_SCRIPT = '''<script>
(function(){
  try{ if(localStorage.getItem('theme')==='light') document.body.classList.add('light'); }catch(e){}
  function toggleTheme(){ var b=document.body; b.classList.toggle('light'); try{ localStorage.setItem('theme', b.classList.contains('light')?'light':'dark'); }catch(e){} }
  var fab=document.createElement('button'); fab.className='theme-fab'; fab.title='切换主题'; fab.setAttribute('aria-label','切换主题'); fab.onclick=toggleTheme;
  fab.innerHTML='<svg class="ic ic-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><svg class="ic ic-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  document.body.appendChild(fab);
})();
</script>'''

NAV_LINKS = {
    'craft': '''<a href="/">首页</a><a href="/craft/" class="active">技艺录</a><a href="/video-lab/">视频</a><a href="/notes/">随笔</a><a href="/daily-digest/">每日阅读</a><a href="/ai-radar/">AI 雷达</a>''',
    'notes': '''<a href="/">首页</a><a href="/craft/">技艺录</a><a href="/video-lab/">视频</a><a href="/notes/" class="active">随笔</a><a href="/daily-digest/">每日阅读</a><a href="/ai-radar/">AI 雷达</a>''',
    'video': '''<a href="/">首页</a><a href="/craft/">技艺录</a><a href="/video-lab/" class="active">视频</a><a href="/notes/">随笔</a><a href="/daily-digest/">每日阅读</a><a href="/ai-radar/">AI 雷达</a>''',
    'daily': '''<a href="/">首页</a><a href="/craft/">技艺录</a><a href="/video-lab/">视频</a><a href="/notes/">随笔</a><a href="/daily-digest/" class="active">每日阅读</a><a href="/ai-radar/">AI 雷达</a>''',
}

# slug -> 本地 videos/ 目录下的 MP4 文件名（已知可匹配资源）
VIDEO_FILE_MAP = {
    'ysjf-course10-mashup-v2': 'course10-v2.mp4',
    'ysjf-course11-plane-track-v2': 'course11-v2.mp4',
    'ysjf-course3-mashup': '【影视飓风】第三课混剪-202606024第一版.mp4',
}


def resolve_video_url(a):
    """返回可用的视频播放地址（外链/本地 MP4/None）。"""
    link = a.get('link') or a.get('videoUrl') or ''
    link = link.strip()
    if re.search(r'(bilibili\.com|youtube\.com|youtu\.be|vimeo\.com)', link, re.I):
        return link
    # 尝试本地 MP4 映射
    slug = a.get('slug', '')
    mp4_name = VIDEO_FILE_MAP.get(slug)
    if mp4_name:
        mp4_path = os.path.join(ROOT, 'video-lab', 'videos', mp4_name)
        if os.path.exists(mp4_path):
            return '/video-lab/videos/' + mp4_name
    return None


def normalize_image(path):
    if not path:
        return path
    p = path.strip()
    if re.match(r'^https?://', p, re.I):
        return p
    if p.startswith('/'):
        return p
    return '/' + p


def normalize_article_html(s, a, dir_name):
    """对已有文章页做最小化修复：补斜杠、大写品牌、加 fx.css/fx.js。"""
    # 1. 图片路径：src="uploads/..." -> src="/uploads/..."
    def fix_src(m):
        prefix = m.group(1)  # src=
        quote = m.group(2)
        val = m.group(3)
        if re.match(r'^https?://', val, re.I) or val.startswith('/'):
            return m.group(0)
        return f'{prefix}{quote}/{val}{quote}'
    s = re.sub(r'(src=)(["\'])([^"\']+)(\2)', fix_src, s)
    s = re.sub(r'(href=)(["\'])(https?://www\.)?appin\.site/?(\2)', r'\1\2https://www.Appin.site/\4', s)
    # 2. 确保 fx.css/fx.js 在 </head> 前
    if '/assets/fx.css' not in s and '</head>' in s:
        s = s.replace('</head>', '  <link rel="stylesheet" href="/assets/fx.css">\n  <script src="/assets/fx.js" defer></script>\n</head>')
    # 3. footer 品牌大写
    s = s.replace('>appin.site</a>', '>Appin.site</a>')
    s = s.replace('李坤的创意探索', '李坤')
    s = s.replace('© 2026 李坤的创意探索', '© 2026 李坤')
    return s


def generate_article(a, dir_name, force=False):
    cat = a.get('category', 'craft')
    slug = a.get('slug') or a.get('id')
    path = os.path.join(ROOT, dir_name, slug + '.html')
    title = a.get('title', '')
    excerpt = a.get('excerpt', '')
    date = (a.get('date') or '')[:10]
    tags = a.get('tags', [])
    image = a.get('image', '')
    content = a.get('content', '')
    video_url = resolve_video_url(a)

    # 安全策略：已有页面一律不动（避免覆盖手工排版），只生成缺失页
    if os.path.exists(path) and not force:
        return 'skip'

    # 生成新页面
    md = markdown.Markdown(extensions=['extra', 'sane_lists', 'tables', 'fenced_code'])
    body = md.convert(content)

    chars = len(content)
    read = max(1, round(chars / 300))
    wc = '{:,}'.format(chars)

    img = normalize_image(image)
    cover = ''
    if img:
        cover = f'<div class="hero-cover"><img src="{html_mod.escape(img, quote=True)}" alt="{html_mod.escape(title, quote=True)}" loading="eager" /></div>'

    tags_html = '\n'.join(f'  <a href="#">{html_mod.escape(t)}</a>' for t in tags)

    # 视频分类：嵌入视频 / 本地 MP4 / 占位提示
    video_embed = ''
    if cat == 'video':
        if video_url:
            if video_url.startswith('/video-lab/videos/'):
                # 本地 MP4，用原生 video 标签
                video_embed = f'''<div class="video-embed" style="margin:28px 0;border-radius:12px;overflow:hidden;background:#0a0a0a;">
  <video src="{html_mod.escape(video_url, quote=True)}" controls preload="metadata" style="width:100%;display:block"></video>
</div>'''
            elif re.search(r'(bilibili\.com|youtube\.com|youtu\.be|vimeo\.com)', video_url, re.I):
                video_embed = f'<div class="video-embed"><iframe src="{html_mod.escape(video_url, quote=True)}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width:100%;aspect-ratio:16/9;border-radius:12px;"></iframe></div>'
        else:
            video_embed = '''<div class="video-placeholder" style="margin:28px 0;padding:48px 24px;text-align:center;border:1px dashed var(--accent-dim);border-radius:12px;color:var(--text-secondary);">
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px;opacity:.6"><rect x="2" y="6" width="20" height="12" rx="2"/><polygon points="10,9 16,12 10,15"/></svg>
  <p>视频资源整理中，敬请期待。</p>
</div>'''

    t = title.replace('\n', ' ')
    e = excerpt.replace('\n', ' ')

    og_image = img if img else '/assets/og-cover.png'
    if og_image.startswith('/'):
        og_image = 'https://www.Appin.site' + og_image

    nav_links = NAV_LINKS.get(cat, NAV_LINKS['craft'])
    label = CAT_LABEL.get(cat, 'ARTICLE')

    out = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{html_mod.escape(t)}</title>
<meta name="description" content="{html_mod.escape(e)}">
<link rel="icon" href="/favicon.ico">
<link rel="canonical" href="https://www.Appin.site/{dir_name}/{slug}.html">
<meta property="og:type" content="website">
<meta property="og:title" content="{html_mod.escape(t)}">
<meta property="og:description" content="{html_mod.escape(e)}">
<meta property="og:url" content="https://www.Appin.site/{dir_name}/{slug}.html">
<meta property="og:site_name" content="Appin.site">
<meta property="og:locale" content="zh_CN">
<meta property="og:image" content="{html_mod.escape(og_image, quote=True)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{html_mod.escape(t)}">
<meta name="twitter:description" content="{html_mod.escape(e)}">
<meta name="twitter:image" content="{html_mod.escape(og_image, quote=True)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/article.css">
<link rel="stylesheet" href="/assets/fx.css">
<script src="/assets/fx.js" defer></script>
</head>
<body>

<nav class="nav">
  <div class="nav-inner">
    <a href="/{dir_name}/" class="nav-logo">← 返回</a>
    <ul class="nav-links">
      {nav_links}
    </ul>
  </div>
</nav>

<section class="hero">
  <div class="hero-badge"><span class="dot"></span>{label}</div>
  <h1>{html_mod.escape(t)}</h1>
  <p class="hero-desc">{html_mod.escape(e)}</p>
  <div class="hero-meta">
    <span>李坤</span><span class="dot"></span>
    <span>{date}</span><span class="dot"></span>
    <span>约 {wc} 字</span>
  </div>
  <div class="hero-divider"></div>
</section>

<div class="page">
{cover}
{video_embed}
<article class="article-body">
{body}

<a href="/{dir_name}/" class="back-link">返回{label.split('—')[0].strip()}</a>

<div class="tag-cloud">
{tags_html}
</div>

</article>
</div>

<footer class="footer">
  <p>© 2026 李坤 · <a href="/">Appin.site</a></p>
</footer>

{THEME_SCRIPT}
</body>
</html>
'''
    io.open(path, 'w', encoding='utf-8').write(out)
    return 'generated'


def main():
    generated = 0
    patched = 0
    skipped = 0
    for a in DATA['articles']:
        if a.get('status') != 'published':
            continue
        cat = a.get('category', 'craft')
        dir_name = CAT_DIR.get(cat)
        if not dir_name:
            continue
        # daily-digest 详情页由日期文件组成，不在这里生成
        if dir_name == 'daily-digest':
            continue
        res = generate_article(a, dir_name)
        if res == 'generated':
            generated += 1
        elif res == 'patched':
            patched += 1
        else:
            skipped += 1
    print(f'generated={generated}, patched={patched}, skipped={skipped}')


if __name__ == '__main__':
    main()

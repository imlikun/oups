#!/usr/bin/env python3
# 为 6 篇缺独立页面的旧技艺录文章生成 /craft/{slug}.html，
# 复用 article.css（与 67 篇换肤文章同一套皮肤）+ theme-fab 脚本，保持整站一致。
import io, json, html, os
import markdown

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = json.load(io.open(os.path.join(ROOT, 'content.json'), 'r', encoding='utf-8'))

IDS = ['article-1', 'article-2', 'article-4', 'article-6', 'article-8', 'article-14']

SCRIPT = '''<script>
(function(){
  try{ if(localStorage.getItem('theme')==='light') document.body.classList.add('light'); }catch(e){}
  function toggleTheme(){ var b=document.body; b.classList.toggle('light'); try{ localStorage.setItem('theme', b.classList.contains('light')?'light':'dark'); }catch(e){} }
  var fab=document.createElement('button'); fab.className='theme-fab'; fab.innerHTML='◐'; fab.title='切换主题'; fab.setAttribute('aria-label','切换主题'); fab.onclick=toggleTheme; document.body.appendChild(fab);
})();
</script>
'''

def gen(a):
    title = a.get('title') or ''
    excerpt = a.get('excerpt') or ''
    date = (a.get('date') or '')[:10]
    tags = a.get('tags') or []
    image = a.get('image') or ''
    content = a.get('content') or ''

    md = markdown.Markdown(extensions=['extra', 'sane_lists', 'tables', 'fenced_code'])
    body = md.convert(content)

    chars = len(content)
    read = max(1, round(chars / 300))
    wc = '{:,}'.format(chars)

    cover = ''
    if image:
        cover = '<div class="hero-cover"><img src="/%s" alt="%s" loading="eager" /></div>' % (
            html.escape(image, quote=True), html.escape(title, quote=True))

    tags_html = '\n'.join('  <a href="#">%s</a>' % html.escape(t) for t in tags)

    t = title.replace('\n', ' ')
    e = excerpt.replace('\n', ' ')

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
    <a href="/craft/" class="nav-logo">← 返回</a>
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
  <p>© 2026 李坤的创意探索 · <a href="/">appin.site</a></p>
</footer>

%s
</body>
</html>
''' % (html.escape(t), html.escape(e), html.escape(t), html.escape(e), date, wc, cover, body, tags_html, SCRIPT)

    slug = a.get('slug') or a.get('id')
    path = os.path.join(ROOT, 'craft', slug + '.html')
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(out)
    print('generated:', path, '(chars=%d, words≈%s)' % (chars, wc))

for art in DATA['articles']:
    if art.get('id') in IDS:
        gen(art)

#!/usr/bin/env python3
# 把 craft/notes/daily-digest 三个列表页换皮为 Developer Publication 风：
# 删内联 <style> -> <link /assets/list.css>，注入字体、主题切换按钮与脚本。
# 同时修复 craft 列表的链接 bug（/article.html?id= -> /craft/{slug}.html）。
import re, io

NEW_HEAD = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/list.css">
'''

THEME_SCRIPT = '''<script>
(function(){try{if(localStorage.getItem('theme')==='light')document.body.classList.add('light');}catch(e){}})();
function toggleTheme(){var b=document.body;b.classList.toggle('light');try{localStorage.setItem('theme',b.classList.contains('light')?'light':'dark');}catch(e){}}
</script>
'''

NAV_OPEN_OLD = '    <div class="nav-links">'
NAV_OPEN_NEW = '    <div class="nav-right">\n      <div class="nav-links">'
NAV_CLOSE_OLD = '    </div>\n  </div>\n</nav>'
NAV_CLOSE_NEW = '    </div>\n      <button class="theme-toggle" onclick="toggleTheme()" title="切换主题" aria-label="切换主题">◐</button>\n    </div>\n  </div>\n</nav>'

TOGGLE_BTN = '\n    <button class="theme-toggle" onclick="toggleTheme()">◐ 切换主题</button>'

PAGES = {
    'craft/index.html': {
        'body_class': 'list-craft',
        'footer_p': '  <p>© 2026 李坤 · <a href="/">返回首页</a></p>',
    },
    'notes/index.html': {
        'body_class': 'list-notes',
        'footer_p': '  <p>© 2026 李坤 · <a href="/">appin.site</a></p>',
    },
    'daily-digest/index.html': {
        'body_class': 'list-daily',
        'footer_p': '  <p>由 <a href="/">八戒（WorkBuddy）</a> 自动生成 · 每日 12:00 更新并同步至此站</p>',
    },
}

def reskin(path, cfg):
    with io.open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    orig = html

    # 1) 删内联 <style>，换外链
    html = re.sub(r'<style>.*?</style>', NEW_HEAD, html, count=1, flags=re.S)

    # 2) body 加列表类
    html = html.replace('<body>', '<body class="%s">' % cfg['body_class'], 1)

    # 3) nav：包一层 nav-right + 主题切换按钮
    if NAV_OPEN_OLD not in html:
        raise RuntimeError('%s: nav-links open not found' % path)
    html = html.replace(NAV_OPEN_OLD, NAV_OPEN_NEW, 1)
    if NAV_CLOSE_OLD not in html:
        raise RuntimeError('%s: nav close not found' % path)
    html = html.replace(NAV_CLOSE_OLD, NAV_CLOSE_NEW, 1)

    # 4) footer：加主题切换按钮
    if cfg['footer_p'] not in html:
        raise RuntimeError('%s: footer p not found' % path)
    html = html.replace(cfg['footer_p'], cfg['footer_p'] + TOGGLE_BTN, 1)

    # 5) 主题切换脚本（在 </body> 前）
    html = html.replace('</body>', THEME_SCRIPT + '</body>', 1)

    # 6) craft 专属：链接 bug + 静态后备 6 篇旧文
    if path.startswith('craft/'):
        html = html.replace(
            "var link = a.link || '/article.html?id=' + a.id;",
            "var link = a.link || '/craft/' + (a.slug || a.id) + '.html';", 1)
        old_map = {
            '/article.html?id=article-1': '/craft/apple-resume-page.html',
            '/article.html?id=article-2': '/craft/react-hooks-learning.html',
            '/article.html?id=article-4': '/craft/css-grid-bento-layout.html',
            '/article.html?id=article-6': '/craft/js-async-await-guide.html',
            '/article.html?id=article-8': '/craft/typescript-intro.html',
            '/article.html?id=article-14': '/craft/trendradar-ai-hot-push.html',
        }
        for o, n in old_map.items():
            html = html.replace(o, n)

    if html == orig:
        print('NO CHANGE:', path)
        return
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print('reskinned:', path)

for p, c in PAGES.items():
    reskin(p, c)

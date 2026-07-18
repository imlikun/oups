#!/usr/bin/env python3
# 存量文章换肤：删内联 <style> -> <link /assets/article.css>，正文 HTML 不动。
# 2026-07-18 网站整体改版。可重复运行（已转换的会跳过）。
import re, glob, os

DIRS = ['craft', 'notes', 'daily-digest']
LINKS = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/article.css">
'''
SCRIPT = '''<script>
(function(){
  try{ if(localStorage.getItem('theme')==='light') document.body.classList.add('light'); }catch(e){}
  function toggleTheme(){ var b=document.body; b.classList.toggle('light'); try{ localStorage.setItem('theme', b.classList.contains('light')?'light':'dark'); }catch(e){} }
  var fab=document.createElement('button'); fab.className='theme-fab'; fab.innerHTML='◐'; fab.title='切换主题'; fab.setAttribute('aria-label','切换主题'); fab.onclick=toggleTheme; document.body.appendChild(fab);
})();
</script>
'''
style_re = re.compile(r'<style[^>]*>.*?</style>', re.DOTALL | re.IGNORECASE)

count = 0
skipped = 0
for d in DIRS:
    for path in sorted(glob.glob(os.path.join(d, '*.html'))):
        base = os.path.basename(path)
        if base == 'index.html' or base.startswith('_'):
            continue
        with open(path, 'r', encoding='utf-8') as f:
            html = f.read()
        if '/assets/article.css' in html:
            skipped += 1
            continue
        if '<style' not in html:
            continue
        new = style_re.sub(LINKS, html, count=1)
        if new == html:
            continue
        if '</body>' in new:
            new = new.replace('</body>', SCRIPT + '</body>', 1)
        else:
            new += SCRIPT
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new)
        count += 1
print(f"converted={count} skipped_already={skipped}")

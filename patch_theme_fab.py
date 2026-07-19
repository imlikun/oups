#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全站主题按钮统一为「首页同款」太阳/月亮 SVG + body.light 机制。

覆盖三种历史形态：
  A) 浮动 fab：fab.innerHTML='◐'  →  sun/moon SVG
  B) nav #themeToggle（data-theme/craft-theme + 🌙/☀️ emoji） → sun/moon SVG + 内联 body.light 切换
  C) nav #themeToggle（tg.addEventListener('click', toggleTheme) 引用了作用域外函数）→ 改为内联 body.light 切换

幂等：已替换过的文件不会重复改动。
"""
import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
SVG = ('<svg class="ic ic-moon" viewBox="0 0 24 24" aria-hidden="true">'
       '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
       '<svg class="ic ic-sun" viewBox="0 0 24 24" aria-hidden="true">'
       '<circle cx="12" cy="12" r="5"/>'
       '<line x1="12" y1="1" x2="12" y2="3"/>'
       '<line x1="12" y1="21" x2="12" y2="23"/>'
       '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>'
       '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>'
       '<line x1="1" y1="12" x2="3" y2="12"/>'
       '<line x1="21" y1="12" x2="23" y2="12"/>'
       '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>'
       '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>')

INLINE_TOGGLE = ("var b=document.body; b.classList.toggle('light'); "
                 "try{ localStorage.setItem('theme', b.classList.contains('light')?'light':'dark'); }catch(e){}")

# A) 浮动 fab
FAB_OLD = "fab.innerHTML='\u25d0';"   # ◐ (U+25D0)
FAB_NEW = "fab.innerHTML='%s';" % SVG

# B) nav 按钮里的 emoji
NAV_BTN_OLD = ">\U0001F319</button>"   # >🌙</button>
NAV_BTN_NEW = ">" + SVG + "</button>"

# C) data-theme/craft-theme 整段 → 干净的内联 body.light 切换
RE_A = re.compile(
    r"var btn = document\.getElementById\('themeToggle'\);.*?"
    r"btn\.addEventListener\('click', function\(\)\{.*?\}\);",
    re.DOTALL)
CLEAN_A = ("    var btn = document.getElementById('themeToggle');\n"
           "    if (btn) {\n"
           "      btn.addEventListener('click', function(){\n"
           "        var b=document.body; b.classList.toggle('light');\n"
           "        try{ localStorage.setItem('theme', b.classList.contains('light')?'light':'dark'); }catch(e){}\n"
           "      });\n"
           "    }")

# D) deeptutor / video-autopilot：引用了作用域外的 toggleTheme → 改为内联
RE_B = re.compile(r"tg\.addEventListener\('click', toggleTheme\);")
CLEAN_B = "tg.addEventListener('click', function(){ %s });" % INLINE_TOGGLE

# E) 另一种 tg 形式：内联 function 里用 tg.textContent 写 emoji → 改为内联 body.light 切换
RE_C = re.compile(
    r"var tg = document\.getElementById\('themeToggle'\);.*?"
    r"tg\.textContent = next === 'dark' \? '🌙' : '☀️';.*?\}\);\s*\}",
    re.DOTALL)
CLEAN_C = ("    var tg = document.getElementById('themeToggle');\n"
           "    if(tg){\n"
           "      tg.addEventListener('click', function(){ %s });\n"
           "    }" % INLINE_TOGGLE)

changed = []
for sub in ("craft", "notes", "daily-digest"):
    d = os.path.join(ROOT, sub)
    if not os.path.isdir(d):
        continue
    for fn in sorted(os.listdir(d)):
        if not fn.endswith(".html"):
            continue
        if fn == "index.html" or fn == "_template.html":
            continue
        path = os.path.join(d, fn)
        with open(path, "r", encoding="utf-8") as f:
            c = f.read()
        orig = c
        if FAB_OLD in c:
            c = c.replace(FAB_OLD, FAB_NEW)
        if NAV_BTN_OLD in c:
            c = c.replace(NAV_BTN_OLD, NAV_BTN_NEW)
        c, n_a = RE_A.subn(CLEAN_A, c)
        c, n_b = RE_B.subn(CLEAN_B, c)
        c, n_c = RE_C.subn(CLEAN_C, c)
        if c != orig:
            with open(path, "w", encoding="utf-8") as f:
                f.write(c)
            changed.append((fn, n_a, n_b, n_c))

print("patched %d files:" % len(changed))
for fn, na, nb, nc in changed:
    print("  - %s  (A=%d B=%d C=%d)" % (fn, na, nb, nc))

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO 全站增强生成器 v2（可重跑 / 幂等 / 基于实际文件）：

1) 动态生成 sitemap.xml —— 遍历全部可索引 html（不再硬编码 PXID 文件名快照），
   排除模板(_template*)/后台(admin)/404/产出物(outputs)/资源(assets/uploads) 等。
2) 给全部内容页 / 列表页 / 子站首页注入 canonical + OG + Twitter + favicon（幂等 <!--SEO-->）。
3) 首页额外注入 JSON-LD（WebSite + Person）。

相较 v1 修复：
- 去掉失效的 PXID2/PXID3 硬编码快照（指向已不存在的 URL → 404 伤 SEO）
- LASTMOD 动态取当天
- meta 注入扩展到 daily-digest / video-lab / pxid / 各子站首页（v1 只覆盖 craft/notes 文章）
- 手动追加线上存在但本地仓库未跟踪的 pxid 4 主题站 URL
"""
import os, re, json, glob
from datetime import date
from urllib.parse import quote

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE = "https://www.appin.site"
BRAND_OG = BASE + "/assets/og-cover.png"
LASTMOD = date.today().strftime("%Y-%m-%d")

# 线上存在但本地仓库未跟踪（Windows 直传 ECS，未进 git）——手动追加
EXTRA_URLS = [
    ("/pxid/black-orange/", "monthly", "0.5"),
    ("/pxid/red-black/", "monthly", "0.5"),
    ("/pxid/yellow-trad/", "monthly", "0.5"),
    ("/pxid/original/", "monthly", "0.5"),
]

EXCLUDE_FILES = {"admin.html", "article.html", "404.html"}
EXCLUDE_DIRS = {"_templates", "outputs", "assets", "uploads", "_videos", "_wechat", "wechat-kit"}


def should_index(rel):
    parts = rel.split("/")
    fname = parts[-1]
    if fname in EXCLUDE_FILES:
        return False
    if fname.startswith("_template"):
        return False
    if "404" in rel:
        return False
    for p in parts[:-1]:
        if p in EXCLUDE_DIRS:
            return False
    return True


def priority_for(rel):
    if rel == "index.html":
        return "daily", "1.0"
    if rel.endswith("/index.html"):
        if rel in ("craft/index.html", "notes/index.html",
                   "daily-digest/index.html", "ai-radar/index.html", "video-lab/index.html"):
            return "daily", "0.8"
        return "weekly", "0.7"
    top = rel.split("/")[0]
    if top in ("craft", "notes", "daily-digest", "video-lab"):
        return "monthly", "0.6"
    return "monthly", "0.5"


# ===================== 1. SITEMAP =====================
def build_sitemap():
    urls = []
    for f in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True):
        rel = os.path.relpath(f, ROOT)
        if not should_index(rel):
            continue
        loc = BASE + "/" + quote(rel, safe="/")
        cf, pr = priority_for(rel)
        urls.append((loc, cf, pr))
    for path, cf, pr in EXTRA_URLS:
        urls.append((BASE + path, cf, pr))
    seen, out = set(), []
    for u, cf, pr in urls:
        if u in seen:
            continue
        seen.add(u)
        out.append((u, cf, pr))
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u, cf, pr in sorted(out, key=lambda x: x[0]):
        lines += ["  <url>",
                  f"    <loc>{u}</loc>",
                  f"    <lastmod>{LASTMOD}</lastmod>",
                  f"    <changefreq>{cf}</changefreq>",
                  f"    <priority>{pr}</priority>",
                  "  </url>"]
    lines.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    print(f"[sitemap] 生成 {len(out)} 条 URL")
    return len(out)


# ===================== 2. META 注入 =====================
def read_meta(fpath):
    txt = open(fpath, encoding="utf-8").read()
    t = re.search(r"<title>([^<]*)</title>", txt)
    d = re.search(r'<meta name="description" content="([^"]*)"', txt)
    return txt, (t.group(1).strip() if t else ""), (d.group(1).strip() if d else "")


def og_block(title, desc, page_url, image=None):
    b = ['<link rel="canonical" href="' + page_url + '">',
         '<meta property="og:type" content="website">',
         f'<meta property="og:title" content="{title}">',
         f'<meta property="og:description" content="{desc}">',
         f'<meta property="og:url" content="{page_url}">',
         '<meta property="og:site_name" content="Appin.site">',
         '<meta property="og:locale" content="zh_CN">',
         '<meta name="twitter:card" content="summary_large_image">',
         f'<meta name="twitter:title" content="{title}">',
         f'<meta name="twitter:description" content="{desc}">']
    if image:
        b.append(f'<meta property="og:image" content="{image}">')
        b.append(f'<meta name="twitter:image" content="{image}">')
    return "\n".join(b)


def inject_page(fpath, page_url, title=None, desc=None, image=None, jsonld=None):
    txt, t_auto, d_auto = read_meta(fpath)
    if "<!--SEO-->" in txt:
        return False
    title = title or t_auto or "Appin.site"
    desc = desc or d_auto or title
    if len(desc) > 160:
        desc = desc[:157] + "..."
    block = og_block(title, desc, page_url, image)
    parts = ['<!--SEO-->', '<link rel="icon" href="/favicon.ico">', block]
    if jsonld:
        parts.append(jsonld)
    inject = "\n".join(parts)
    if "</title>" in txt:
        txt = txt.replace("</title>", "</title>\n" + inject, 1)
    elif 'name="description"' in txt:
        txt = re.sub(r'(<meta name="description" content="[^"]*?"\s*/?>)',
                     lambda m: m.group(1) + "\n" + inject, txt, count=1)
    else:
        txt = txt.replace("<head>", "<head>\n" + inject, 1)
    open(fpath, "w", encoding="utf-8").write(txt)
    return True


def homepage_jsonld():
    data = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "WebSite", "name": "Appin.site", "url": BASE + "/",
             "description": "李坤的个人站——实战派技术人的内容工坊与出海品牌操盘记录。",
             "inLanguage": "zh-CN", "author": {"@type": "Person", "name": "李坤"}},
            {"@type": "Person", "name": "李坤", "url": BASE + "/",
             "jobTitle": "实战派技术人 / 出海品牌操盘",
             "worksFor": {"@type": "Organization", "name": "Appin.site"}}
        ]
    }
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"


def run_meta():
    # 首页
    inject_page(os.path.join(ROOT, "index.html"), BASE + "/",
                title="李坤 · Appin.site｜实战派技术人，出海品牌操盘",
                desc="李坤的个人站 Appin.site——实战派技术人的内容工坊与出海品牌操盘。涵盖 AI 工具实战、技术技艺录、每日阅读精选、AI 资讯雷达，以及数字产品与出海品牌咨询。",
                image=BRAND_OG, jsonld=homepage_jsonld())

    # 全部可索引内容页 / 列表页 / 子站首页
    n = 0
    for f in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True):
        rel = os.path.relpath(f, ROOT)
        if not should_index(rel):
            continue
        if rel == "index.html":
            continue
        txt = open(f, encoding="utf-8").read()
        m = re.search(r'src="(/uploads/[^"]+)"', txt)
        img = BASE + m.group(1) if m else BRAND_OG
        if inject_page(f, BASE + "/" + quote(rel, safe="/"), image=img):
            n += 1
    print(f"[meta] 新注入 {n} 个页面（已注入的自动跳过）")


if __name__ == "__main__":
    print("===== SEO 生成 v2 =====")
    build_sitemap()
    print("===== META 注入 =====")
    run_meta()
    print("===== 完成 =====")

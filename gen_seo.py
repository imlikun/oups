#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO 全站增强生成器（可重跑 / 幂等）：
1) 生成 sitemap.xml（收录 appin.site 全部可索引页面）
2) 给 index.html / 列表页 / 文章页 注入 canonical + OG + Twitter + favicon 引用
3) 首页额外注入 JSON-LD（WebSite + Person）

设计：带 <!--SEO--> 标记，已注入则跳过，可安全重跑。
"""
import os, re, json, glob
from urllib.parse import quote

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE = "https://www.appin.site"
LASTMOD = "2026-07-19"

# ---------- pxid 子页清单（快照，稳定客户站） ----------
PXID2 = ["about us.html","antelope-p5.html","bestride-f1.html","bestride-pro-f2.html",
         "bestride-pro-w2.html","index.html","light-p2.html","light-p4.html","m2.html",
         "mantis-p6.html","mota-z1.html","mota-z3.html","odm 服务.html","px-4.html",
         "urban-p1.html","urban-p3.html","产品.html","报价页面.html","新闻详情.html",
         "新闻页.html","首页.html"]
PXID3 = ["about.html","case-studies.html","certifications.html","contact.html","distributor.html",
         "home-v2.html","index.html","manufacturing.html","news.html","odm-services.html",
         "product-antelope-p5.html","product-bestride-f1.html","product-bestride-pro-f2.html",
         "product-bestride-pro-w2.html","product-light-p2.html","product-light-p4.html",
         "product-m2.html","product-mantis-p6.html","product-mota-z1.html","product-mota-z3.html",
         "product-px-4.html","product-urban-p1.html","product-urban-p3.html","products.html"]

def enc(name):
    # 仅编码空格与非常规字符，保留 .html
    return quote(name, safe="")

def url(path):
    return BASE + "/" + path.lstrip("/")

# ===================== 1. SITEMAP =====================
def build_sitemap():
    urls = []  # (loc, changefreq, priority)
    # 根栏目
    roots = [
        ("", "daily", "1.0"),
        ("craft/", "daily", "0.8"),
        ("notes/", "daily", "0.8"),
        ("daily-digest/", "daily", "0.8"),
        ("ai-radar/", "daily", "0.8"),
        ("video-lab/", "weekly", "0.7"),
        ("pxid2/", "yearly", "0.5"),
        ("pxid3/", "yearly", "0.5"),
    ]
    for p, cf, pr in roots:
        urls.append((url(p), cf, pr))
    # craft / notes 文章页（排除模板 _template.html）
    for d, cf, pr in [("craft", "monthly", "0.6"), ("notes", "monthly", "0.6")]:
        for f in sorted(glob.glob(os.path.join(ROOT, d, "*.html"))):
            name = os.path.basename(f)
            if name == "index.html" or name.startswith("_"):
                continue
            urls.append((url(f"{d}/{name}"), cf, pr))
    # pxid2 / pxid3 子页
    for base, names in [("pxid2", PXID2), ("pxid3", PXID3)]:
        for n in names:
            if n == "index.html":
                continue
            urls.append((url(f"{base}/{enc(n)}"), "yearly", "0.4"))
    # 去重保序
    seen, out = set(), []
    for u, cf, pr in urls:
        if u in seen:
            continue
        seen.add(u); out.append((u, cf, pr))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u, cf, pr in out:
        lines.append("  <url>")
        lines.append(f"    <loc>{u}</loc>")
        lines.append(f"    <lastmod>{LASTMOD}</lastmod>")
        lines.append(f"    <changefreq>{cf}</changefreq>")
        lines.append(f"    <priority>{pr}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")
    xml = "\n".join(lines) + "\n"
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write(xml)
    print(f"[sitemap] 生成 {len(out)} 条 URL")
    return len(out)

# ===================== 2. META 注入 =====================
def read_meta(fpath):
    txt = open(fpath, encoding="utf-8").read()
    t = re.search(r"<title>([^<]*)</title>", txt)
    d = re.search(r'<meta name="description" content="([^"]*)"', txt)
    return txt, (t.group(1) if t else ""), (d.group(1) if d else "")

def og_block(title, desc, page_url, image=None):
    b = []
    b.append(f'<link rel="canonical" href="{page_url}">')
    b.append('<meta property="og:type" content="website">')
    b.append(f'<meta property="og:title" content="{title}">')
    b.append(f'<meta property="og:description" content="{desc}">')
    b.append(f'<meta property="og:url" content="{page_url}">')
    b.append('<meta property="og:site_name" content="Appin.site">')
    b.append('<meta property="og:locale" content="zh_CN">')
    b.append('<meta name="twitter:card" content="summary_large_image">')
    b.append(f'<meta name="twitter:title" content="{title}">')
    b.append(f'<meta name="twitter:description" content="{desc}">')
    if image:
        b.append(f'<meta property="og:image" content="{image}">')
        b.append(f'<meta name="twitter:image" content="{image}">')
    return "\n".join(b)

def inject_page(fpath, page_url, title=None, desc=None, image=None, jsonld=None):
    txt, t_auto, d_auto = read_meta(fpath)
    if "<!--SEO-->" in txt:
        print(f"  [skip] 已注入: {os.path.relpath(fpath, ROOT)}")
        return False
    title = title or t_auto
    desc = desc or d_auto or title
    block = og_block(title, desc, page_url, image)
    parts = ['<!--SEO-->', '<link rel="icon" href="/favicon.ico">', block]
    if jsonld:
        parts.append(jsonld)
    inject = "\n".join(parts)

    # 插入点：优先放在 description 之后；否则放在 </title> 之后；index 无 description
    if 'name="description"' in txt:
        txt = re.sub(r'(<meta name="description" content="[^"]*">)',
                     lambda m: m.group(1) + "\n" + inject, txt, count=1)
    else:
        txt = txt.replace("</title>", "</title>\n" + inject, 1)
    open(fpath, "w", encoding="utf-8").write(txt)
    print(f"  [ok] 注入: {os.path.relpath(fpath, ROOT)}")
    return True

def homepage_jsonld():
    data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "name": "Appin.site",
                "url": BASE + "/",
                "description": "李坤的个人站——实战派技术人的内容工坊与出海品牌操盘记录。",
                "inLanguage": "zh-CN",
                "author": {"@type": "Person", "name": "李坤"}
            },
            {
                "@type": "Person",
                "name": "李坤",
                "url": BASE + "/",
                "jobTitle": "实战派技术人 / 出海品牌操盘",
                "worksFor": {"@type": "Organization", "name": "Appin.site"}
            }
        ]
    }
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"

def run_meta():
    # index.html
    print("[meta] index.html")
    inject_page(os.path.join(ROOT, "index.html"), BASE + "/",
                title="李坤 · Appin.site｜实战派技术人，出海品牌操盘",
                desc="李坤的个人站 Appin.site——实战派技术人的内容工坊与出海品牌操盘。涵盖 AI 工具实战、技术技艺录、每日阅读精选、AI 资讯雷达，以及数字产品与出海品牌咨询。",
                jsonld=homepage_jsonld())

    # 列表页
    lists = {
        "craft/index.html": BASE + "/craft/",
        "notes/index.html": BASE + "/notes/",
        "daily-digest/index.html": BASE + "/daily-digest/",
        "ai-radar/index.html": BASE + "/ai-radar/",
        "video-lab/index.html": BASE + "/video-lab/",
    }
    for rel, u in lists.items():
        print(f"[meta] {rel}")
        inject_page(os.path.join(ROOT, rel), u)

    # 文章页（craft + notes）
    for d in ["craft", "notes"]:
        for f in sorted(glob.glob(os.path.join(ROOT, d, "*.html"))):
            name = os.path.basename(f)
            if name == "index.html":
                continue
            txt = open(f, encoding="utf-8").read()
            # 派生 og:image：页面首个 /uploads/ 图
            m = re.search(r'src="(/uploads/[^"]+)"', txt)
            img = BASE + m.group(1) if m else None
            inject_page(f, url(f"{d}/{name}"), image=img)

if __name__ == "__main__":
    print("===== SEO 生成 =====")
    build_sitemap()
    print("===== META 注入 =====")
    run_meta()
    print("===== 完成 =====")

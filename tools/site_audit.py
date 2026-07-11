import os, re, json, subprocess
from concurrent.futures import ThreadPoolExecutor

BASE = os.path.expanduser('~/Projects/appin-site')
DOMAIN = 'https://www.appin.site'

# ---- 收集 HTML 文件（排除 pxid 目录和 .git） ----
html_files = []
for root, dirs, files in os.walk(BASE):
    parts = root.split(os.sep)
    if 'pxid' in parts or '.git' in parts:
        continue
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

print(f"扫描 HTML 文件: {len(html_files)} 个（已排除 pxid/ 与 .git）")

refs = set()
ref_re = re.compile(r'''(?:src|href)\s*=\s*["']([^"']+)["']''')
url_re = re.compile(r'''url\(\s*["']?([^"')]+)["']?\s*\)''')

for hf in html_files:
    try:
        txt = open(hf, encoding='utf-8', errors='ignore').read()
    except Exception:
        continue
    for m in ref_re.finditer(txt):
        u = m.group(1).strip()
        if u.startswith('/') and not u.startswith('//'):
            refs.add(u.split('?')[0])
    for m in url_re.finditer(txt):
        u = m.group(1).strip()
        if u.startswith('/') and not u.startswith('//'):
            refs.add(u.split('?')[0])

# ---- content.json 动态引用 ----
cj = json.load(open(os.path.join(BASE, 'content.json'), encoding='utf-8'))
arts = cj['articles'] if isinstance(cj, dict) else cj
for a in arts:
    for k in ('image', 'cover', 'link', 'directVideo', 'videoUrl'):
        v = a.get(k)
        if isinstance(v, str) and v.startswith('/'):
            refs.add(v.split('?')[0])

check = sorted(refs)
print(f"收集本地绝对引用: {len(check)} 个（含 HTML 引用 + content.json 封面/链接）")

# ---- 并发 curl 检查 ECS ----
def check_url(url):
    try:
        r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
                            '--max-time', '15', '-A', 'Mozilla/5.0', url],
                           capture_output=True, text=True)
        return (url, r.stdout.strip())
    except Exception as e:
        return (url, 'ERR')

bad = []
with ThreadPoolExecutor(max_workers=25) as ex:
    for url, code in ex.map(check_url, [DOMAIN + u for u in check]):
        if code not in ('200', '206', '304'):
            bad.append((code, url))

print(f"\n===== 非 200 引用 ({len(bad)}) =====")
for code, url in sorted(bad):
    print(f"  [{code}]  {url}")

# ---- category 一致性 ----
print("\n===== category vs 文件目录 mismatch =====")
seg_map = {'craft': 'craft', 'notes': 'notes', 'video-lab': 'video', 'video': 'video'}
mismatch = []
for a in arts:
    link = a.get('link', '')
    cat = a.get('category')
    if link.startswith('/'):
        seg = link.split('/')[1]
        expect = seg_map.get(seg)
        if expect and cat != expect:
            mismatch.append((a.get('slug'), cat, expect, link))
if not mismatch:
    print("  无 mismatch（所有文章 category 与所在目录一致）")
else:
    for slug, cat, expect, link in mismatch:
        print(f"  slug={slug}  category={cat}  应属={expect}  link={link}")

# ---- 统计 ----
from collections import Counter
cat_count = Counter(a.get('category') for a in arts)
print("\n===== content.json 栏目分布 =====")
for k, v in sorted(cat_count.items()):
    print(f"  {k}: {v}")

print("\n===== 审计完成 =====")

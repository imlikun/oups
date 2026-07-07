#!/usr/bin/env python3
"""
PXID 产品图片爬虫
从 pxid.com 爬取所有产品详情页的主图，下载到本地 images/products/ 目录
同时根据产品名称匹配到本地 Next.js 项目的 product slug，建立映射关系
"""
import os
import re
import sys
import time
import hashlib
import urllib.request
import urllib.error
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

BASE_URL = "https://www.pxid.com"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pxid", "images", "products")
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"

# 本地 Next.js 项目的产品 slug 映射 —— pxid.com 产品名 → 本地 slug
SLUG_MAP = {
    "antelope-p5": "antelope-p5",
    "p5": "antelope-p5",
    "mantis-p6": "mantis-p6",
    "light-p4": "light-p4",
    "light-p2": "light-p2",
    "e-motorcycle-p8": "e-motorcycle-p8",
    "e-motorcycle-p9": "e-motorcycle-p9",
    "offroad-emoto": "offroad-emoto",
    "urban-p1": "urban-p1",
    "urban-p3": "urban-p3",
    "bestride": "bestride",
    "bestride-pro": "bestride-pro",
}


class ImageExtractor(HTMLParser):
    """从 HTML 中提取所有 img 标签的 src 属性"""
    def __init__(self):
        super().__init__()
        self.images = []
    
    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'img':
            attrs_dict = dict(attrs)
            src = attrs_dict.get('src', '') or attrs_dict.get('data-src', '')
            if src and not src.startswith('data:'):
                self.images.append(src)


class LinkExtractor(HTMLParser):
    """从 HTML 中提取所有 a 标签的 href 属性"""
    def __init__(self):
        super().__init__()
        self.links = []
    
    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'a':
            attrs_dict = dict(attrs)
            href = attrs_dict.get('href', '')
            if href and not href.startswith('#') and not href.startswith('javascript:'):
                self.links.append(href)


def fetch_html(url, timeout=15):
    """获取网页 HTML 内容"""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} for {url}")
        return None
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None


def download_image(img_url, save_path, timeout=30):
    """下载图片到本地"""
    req = urllib.request.Request(img_url, headers={"User-Agent": USER_AGENT, "Referer": BASE_URL})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
            content_type = resp.headers.get('Content-Type', '')
            if 'image' not in content_type and not img_url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                print(f"    Skipped (not image): {img_url} [{content_type}]")
                return False
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, 'wb') as f:
                f.write(data)
            size_kb = len(data) // 1024
            print(f"    Saved: {save_path} ({size_kb} KB)")
            return True
    except Exception as e:
        print(f"    Error downloading {img_url}: {e}")
        return False


def find_best_image(images, page_url):
    """从图片列表中找最佳产品图（按尺寸/路径规则排序）"""
    candidates = []
    for img in images:
        full_url = urljoin(page_url, img)
        lower = full_url.lower()
        
        # 跳过明显的小图标/装饰图
        skip_patterns = ['icon', 'logo', 'flag', 'arrow', 'you.png', 'right2.png', 
                        'avatar', 'thumb-', '-small', '50x50', '100x100']
        if any(p in lower for p in skip_patterns):
            continue
        
        # 优先：cdnus.globalso.com 上的大图
        if 'cdnus.globalso.com' in lower or '/uploads/' in lower or '/products/' in lower:
            if lower.endswith(('.jpg', '.jpeg', '.png', '.webp')):
                candidates.append(('primary', full_url))
                continue
        
        # 次选：其他图片 URL
        if lower.endswith(('.jpg', '.jpeg', '.png', '.webp')):
            candidates.append(('secondary', full_url))
    
    # 优先返回 primary 候选
    for priority, url in candidates:
        if priority == 'primary':
            return url
    if candidates:
        return candidates[0][1]
    return None


def crawl_product_pages():
    """爬取 pxid.com 产品列表页，获取所有产品详情页"""
    print("=" * 60)
    print("PXID 产品图片爬虫")
    print("=" * 60)
    
    # 1. 获取产品列表页
    product_list_urls = [
        f"{BASE_URL}/products/",
        f"{BASE_URL}/",
    ]
    
    all_product_urls = set()
    
    for list_url in product_list_urls:
        print(f"\n[1] 爬取列表页: {list_url}")
        html = fetch_html(list_url)
        if not html:
            continue
        
        parser = LinkExtractor()
        parser.feed(html)
        
        for link in parser.links:
            full = urljoin(list_url, link)
            # 匹配产品详情页 URL 模式
            if re.search(r'/(product[s]?/|[a-z0-9-]+-product/)', link, re.IGNORECASE):
                parsed = urlparse(full)
                clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                all_product_urls.add(clean)
        
        print(f"  找到 {len(all_product_urls)} 个产品链接")
    
    # 2. 逐个爬取产品详情页，提取主图
    print(f"\n[2] 爬取 {len(all_product_urls)} 个产品详情页...")
    
    downloaded = 0
    skipped = 0
    errors = 0
    
    for i, url in enumerate(sorted(all_product_urls)):
        slug = url.rstrip('/').split('/')[-1]
        print(f"\n  [{i+1}/{len(all_product_urls)}] {slug}")
        print(f"    URL: {url}")
        
        html = fetch_html(url)
        if not html:
            errors += 1
            continue
        
        # 提取所有图片
        img_parser = ImageExtractor()
        img_parser.feed(html)
        
        # 同时用正则匹配 og:image
        og_match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html)
        if og_match:
            og_img = og_match.group(1)
            img_parser.images.insert(0, og_img)
        
        print(f"    找到 {len(img_parser.images)} 张图片")
        
        # 找最佳图片
        best_img = find_best_image(img_parser.images, url)
        if not best_img:
            print(f"    ⚠️  未找到产品主图")
            skipped += 1
            continue
        
        print(f"    主图: {best_img}")
        
        # 确定本地文件名
        mapped_slug = SLUG_MAP.get(slug, slug)
        ext = os.path.splitext(urlparse(best_img).path)[1] or '.jpg'
        if not ext.startswith('.'):
            ext = '.jpg'
        
        save_path = os.path.join(OUTPUT_DIR, f"{mapped_slug}{ext}")
        
        # 检查是否已存在
        if os.path.exists(save_path):
            existing_size = os.path.getsize(save_path)
            print(f"    已存在 ({existing_size // 1024} KB)，跳过")
            skipped += 1
            continue
        
        # 下载
        if download_image(best_img, save_path):
            downloaded += 1
        else:
            errors += 1
        
        time.sleep(0.5)  # 礼貌延迟
    
    # 3. 汇总
    print(f"\n{'=' * 60}")
    print(f"爬取完成: {len(all_product_urls)} 个产品")
    print(f"  下载: {downloaded}")
    print(f"  跳过: {skipped}")
    print(f"  错误: {errors}")
    print(f"  图片输出: {OUTPUT_DIR}")
    
    # 列出最终文件
    print(f"\n当前产品图片:")
    if os.path.exists(OUTPUT_DIR):
        for f in sorted(os.listdir(OUTPUT_DIR)):
            if f.endswith(('.jpg', '.jpeg', '.png', '.webp')):
                size = os.path.getsize(os.path.join(OUTPUT_DIR, f)) // 1024
                print(f"  {f} ({size} KB)")
    
    return True


def list_product_urls():
    """快速列出所有已知的产品 URL"""
    urls = [
        f"{BASE_URL}/p5-product/",
        f"{BASE_URL}/px-4-product/",
        f"{BASE_URL}/mota-z3-product/",
        f"{BASE_URL}/mota-z1-product/",
        f"{BASE_URL}/volcon-electric-bikes-product/",
        f"{BASE_URL}/onebot-s9-product/",
        f"{BASE_URL}/wheels-product/",
        f"{BASE_URL}/fat-px-2-coolplay-new-trend-product/",
        f"{BASE_URL}/pxid-design-eu-market-popular-250w-36v-16-inch-city-road-electric-bike-product/",
        f"{BASE_URL}/ce-36v10-4ah-e-bike-20-electric-cycle-electric-bicycle-folding-electric-bike-product/",
        f"{BASE_URL}/pxid-factory-custom-500w-48v-motor-off-road-electric-scooter-with-seat-product/",
        f"{BASE_URL}/three-wheel-electric-scooter-manufacturer-wholesale-1000w-dual-motor-electric-scooter-product/",
        f"{BASE_URL}/copy-pxid-wholesale-odm-design-500w-48v-motor-electric-scooter-with-app-product/",
        f"{BASE_URL}/pxid-design-urban-03-model-500w-motor-kick-scooter-electric-gps-scooter-with-sharing-app-product/",
    ]
    return urls


def crawl_direct():
    """直接爬取已知产品 URL 列表"""
    print("=" * 60)
    print("PXID 产品图片爬虫（直连模式）")
    print("=" * 60)
    
    urls = list_product_urls()
    downloaded = 0
    
    for i, url in enumerate(urls):
        slug = url.rstrip('/').split('/')[-1]
        print(f"\n[{i+1}/{len(urls)}] {slug}")
        
        html = fetch_html(url)
        if not html:
            continue
        
        img_parser = ImageExtractor()
        img_parser.feed(html)
        
        og_match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html)
        if og_match:
            img_parser.images.insert(0, og_match.group(1))
        
        best_img = find_best_image(img_parser.images, url)
        if not best_img:
            print(f"  ⚠️  无主图")
            continue
        
        print(f"  {best_img}")
        
        # 使用 URL 路径的最后部分作为文件名
        ext = os.path.splitext(urlparse(best_img).path)[1] or '.jpg'
        if not ext.startswith('.'):
            ext = '.jpg'
        
        # 尝试匹配 SLUG_MAP
        mapped = SLUG_MAP.get(slug)
        if mapped:
            fname = f"{mapped}{ext}"
        else:
            # 生成唯一文件名
            fname = f"{slug}{ext}"
        
        save_path = os.path.join(OUTPUT_DIR, fname)
        if os.path.exists(save_path):
            print(f"  已存在，跳过")
            continue
        
        if download_image(best_img, save_path):
            downloaded += 1
        
        time.sleep(0.5)
    
    print(f"\n下载完成: {downloaded} 张新图片")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        for u in list_product_urls():
            print(u)
    elif len(sys.argv) > 1 and sys.argv[1] == "--from-list":
        urls = [line.strip() for line in sys.stdin if line.strip()]
        print(f"从 stdin 读取 {len(urls)} 个 URL")
        downloaded = 0
        for i, url in enumerate(urls):
            slug = url.rstrip('/').split('/')[-1]
            print(f"\n[{i+1}/{len(urls)}] {slug}")
            html = fetch_html(url)
            if not html:
                continue
            img_parser = ImageExtractor()
            img_parser.feed(html)
            og_match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html)
            if og_match:
                img_parser.images.insert(0, og_match.group(1))
            best_img = find_best_image(img_parser.images, url)
            if best_img:
                ext = os.path.splitext(urlparse(best_img).path)[1] or '.jpg'
                if not ext.startswith('.'):
                    ext = '.jpg'
                fname = f"{slug}{ext}"
                save_path = os.path.join(OUTPUT_DIR, fname)
                if not os.path.exists(save_path):
                    if download_image(best_img, save_path):
                        downloaded += 1
                else:
                    print(f"  已存在")
            time.sleep(0.5)
        print(f"\n下载完成: {downloaded}")
    else:
        crawl_direct()

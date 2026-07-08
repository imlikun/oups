#!/usr/bin/env python3
"""
AI 新闻雷达 — 每日自动更新脚本
1. 从 AI HOT API 拉取过去 24 小时精选资讯
2. 注入到 ai-radar/index.html 的数据占位符中
3. 推送到 COS

用法: python3 update.py [--dry-run]
"""

import json, os, sys, subprocess, datetime, time

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
API_BASE = "https://aihot.virxact.com/api/public"
HTML_PATH = os.path.join(os.path.dirname(__file__), "index.html")
DRY_RUN = "--dry-run" in sys.argv

def fetch_items(max_retries=3, timeout=60):
    """从 AI HOT API 拉取过去 24 小时精选资讯。

    海外 GitHub Actions runner 访问 aihot.virxact.com 偶发超时，
    故加重试（默认 3 次，间隔 8s），覆盖偶发网络抖动。
    """
    from urllib.request import Request, urlopen
    from urllib.error import URLError, HTTPError
    since = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%SZ")
    url = f"{API_BASE}/items?mode=selected&since={since}&take=100"
    last_err = None
    for attempt in range(1, max_retries + 1):
        req = Request(url, headers={"User-Agent": UA})
        try:
            with urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode())
        except (URLError, HTTPError) as e:
            last_err = e
            print(f"  ⚠️ 第 {attempt}/{max_retries} 次拉取失败: {e}")
            if attempt < max_retries:
                time.sleep(8)
    print(f"  ❌ AI HOT API 连续 {max_retries} 次拉取失败（最后一次: {last_err}）")
    return None

def update_html(data_json):
    """将 JSON 数据注入到 HTML 中的 <script id="ai-data"> 标签"""
    import re
    compact = json.dumps(data_json, ensure_ascii=False, separators=(",", ":"))
    
    with open(HTML_PATH, "r", encoding="utf-8") as f:
        html = f.read()
    
    new_tag = f'<script id="ai-data" type="application/json">{compact}</script>'
    
    # 支持两种模式：占位符替换 或 已有数据替换
    if "__AI_DATA_PLACEHOLDER__" in html:
        html = html.replace("__AI_DATA_PLACEHOLDER__", compact)
    else:
        # 用 str.replace 而非 re.sub 以避免 \u 转义问题
        # 先找 ai-data 标签的起止位置
        pattern = r'<script id="ai-data" type="application/json">.*?</script>'
        m = re.search(pattern, html, flags=re.DOTALL)
        if m:
            html = html[:m.start()] + new_tag + html[m.end():]
    
    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    
    # 读回验证 JSON 有效性
    with open(HTML_PATH, "r", encoding="utf-8") as f:
        verify_html = f.read()
    m = re.search(r'<script id="ai-data"[^>]*>(.*?)</script>', verify_html, re.DOTALL)
    if m:
        try:
            json.loads(m.group(1).strip())
            print(f"  ✅ 已注入 {data_json.get('count', 0)} 条资讯到 {HTML_PATH}")
        except json.JSONDecodeError:
            print("  ⚠️ JSON 验证失败，回退用 ensure_ascii=True 重试...")
            compact = json.dumps(data_json, ensure_ascii=True)
            new_tag = f'<script id="ai-data" type="application/json">{compact}</script>'
            html = verify_html[:m.start()] + new_tag + verify_html[m.end():]
            with open(HTML_PATH, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"  ✅ 已用 ASCII 模式注入 {data_json.get('count', 0)} 条资讯")
    else:
        print(f"  ⚠️ 未找到 ai-data 标签")

def upload_to_cos():
    """推送到腾讯云 COS"""
    # 优先从环境变量读取（GitHub Actions Secrets 注入），
    # 本地无环境变量时 fallback 到 ~/.cos_env 文件
    creds = {
        "COS_SECRET_ID": os.environ.get("COS_SECRET_ID", ""),
        "COS_SECRET_KEY": os.environ.get("COS_SECRET_KEY", ""),
    }
    if not creds["COS_SECRET_ID"] or not creds["COS_SECRET_KEY"]:
        cred_file = os.path.expanduser("~/.cos_env")
        if os.path.exists(cred_file):
            with open(cred_file) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        creds[k] = v
    if not creds.get("COS_SECRET_ID") or not creds.get("COS_SECRET_KEY"):
        print("  ❌ 缺少 COS 凭证（请设置环境变量 COS_SECRET_ID/COS_SECRET_KEY 或 ~/.cos_env）")
        sys.exit(1)

    from qcloud_cos import CosConfig, CosS3Client
    config = CosConfig(
        Region="ap-hongkong",
        SecretId=creds["COS_SECRET_ID"],
        SecretKey=creds["COS_SECRET_KEY"],
        Scheme="https",
    )
    client = CosS3Client(config)
    client.put_object_from_local_file(
        Bucket="myopus-1253808671",
        LocalFilePath=HTML_PATH,
        Key="ai-radar/index.html",
        ContentType="text/html; charset=utf-8",
        CacheControl="no-cache",
    )
    print("  ✅ 已推送到 COS: ai-radar/index.html")

def main():
    print("═══ AI 新闻雷达 · 每日更新 ═══")
    print(f"  时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  模式: {'预览 (不推送)' if DRY_RUN else '正式 (推送到 COS)'}")

    # 1. Fetch
    print("\n  📡 拉取 AI HOT 数据...")
    data = fetch_items()
    if not data:
        print("  ⚠️ API 调用失败，跳过本次更新（保留昨日数据，不改动 index.html）")
        sys.exit(0)
    print(f"  📊 获取到 {data.get('count', 0)} 条资讯")

    # 2. Update HTML
    print("\n  📝 更新 HTML...")
    update_html(data)

    # 3. Upload
    if not DRY_RUN:
        print("\n  ☁️ 推送到 COS...")
        upload_to_cos()
    else:
        print("\n  🔍 预览模式，跳过推送")

    print("\n  🎉 完成！")

if __name__ == "__main__":
    main()

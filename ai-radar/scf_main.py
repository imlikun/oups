#!/usr/bin/env python3
"""
AI 新闻雷达 — 腾讯云 SCF 云函数版
功能：从 AI HOT API 拉取资讯 → 注入 HTML → 推送到 COS
触发方式：定时触发器（每天 08:00）
入口函数：main_handler(event, context)

环境变量（在 SCF 控制台配置）：
  COS_SECRET_ID  — 腾讯云 SecretId
  COS_SECRET_KEY — 腾讯云 SecretKey
"""

import json
import re
import os
import datetime
from urllib.request import Request, urlopen
from urllib.error import URLError

# ===== 配置 =====
COS_REGION = "ap-hongkong"
COS_BUCKET = "myopus-1253808671"
COS_KEY = "ai-radar/index.html"
API_BASE = "https://aihot.virxact.com/api/public"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def fetch_items():
    """从 AI HOT API 拉取过去 24 小时精选资讯"""
    since = (
        datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)
    ).strftime("%Y-%m-%dT%H:%M:%SZ")
    url = f"{API_BASE}/items?mode=selected&since={since}&take=100"
    req = Request(url, headers={"User-Agent": UA})
    try:
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except URLError as e:
        print(f"  API fetch failed: {e}")
        return None
    except Exception as e:
        print(f"  API fetch error: {e}")
        return None


def get_html_from_cos(secret_id, secret_key):
    """从 COS 读取当前 index.html — 完整读取分块流"""
    from qcloud_cos import CosConfig, CosS3Client

    config = CosConfig(
        Region=COS_REGION, SecretId=secret_id, SecretKey=secret_key, Scheme="https"
    )
    client = CosS3Client(config)
    resp = client.get_object(Bucket=COS_BUCKET, Key=COS_KEY)
    body = resp["Body"]
    chunks = []
    while True:
        chunk = body.read(65536)
        if not chunk:
            break
        chunks.append(chunk)
    return b"".join(chunks).decode("utf-8")


def inject_data(html, data_json):
    """将 JSON 数据注入 HTML 中的 <script id="ai-data"> 标签"""
    compact = json.dumps(data_json, ensure_ascii=False, separators=(",", ":"))
    # 安全检查：确保 compact JSON 是严格合法的单行
    try:
        json.loads(compact)
    except json.JSONDecodeError:
        print("  ⚠️ JSON 含非法字符，回退 ensure_ascii=True")
        compact = json.dumps(data_json, ensure_ascii=True)
    
    new_tag = f'<script id="ai-data" type="application/json">{compact}</script>'
    
    if "__AI_DATA_PLACEHOLDER__" in html:
        return html.replace("__AI_DATA_PLACEHOLDER__", compact)
    # 用 re.search + str 切片替换，避免 re.sub 的 \\u 转义问题
    pattern = r'<script id="ai-data" type="application/json">.*?</script>'
    m = re.search(pattern, html, flags=re.DOTALL)
    if m:
        return html[:m.start()] + new_tag + html[m.end():]
    # 如果 HTML 中没有 ai-data 标签（COS 文件损坏），插入到 </body> 前
    print("  ⚠️ 未找到 ai-data 标签，自动插入...")
    return html.replace("</body>", f"  {new_tag}\n</body>")


def upload_to_cos(html_content, secret_id, secret_key):
    """上传 HTML 到 COS"""
    from qcloud_cos import CosConfig, CosS3Client

    config = CosConfig(
        Region=COS_REGION, SecretId=secret_id, SecretKey=secret_key, Scheme="https"
    )
    client = CosS3Client(config)
    client.put_object(
        Bucket=COS_BUCKET,
        Body=html_content.encode("utf-8"),
        Key=COS_KEY,
        ContentType="text/html; charset=utf-8",
        CacheControl="no-cache",
    )


def main_handler(event, context):
    """SCF 入口函数"""
    print("═══ AI 新闻雷达 · SCF 每日更新 ═══")
    print(f"  时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    secret_id = os.environ.get("COS_SECRET_ID", "")
    secret_key = os.environ.get("COS_SECRET_KEY", "")
    if not secret_id or not secret_key:
        return {"code": 1, "msg": "缺少环境变量 COS_SECRET_ID / COS_SECRET_KEY"}

    # 1. 拉取 AI HOT 数据
    print("  📡 拉取 AI HOT 数据...")
    data = fetch_items()
    if not data:
        return {"code": 1, "msg": "API 调用失败"}
    count = data.get("count", 0)
    print(f"  📊 获取到 {count} 条资讯")

    # 2. 从 COS 读取当前 HTML
    print("  📄 从 COS 读取当前 HTML...")
    try:
        html = get_html_from_cos(secret_id, secret_key)
    except Exception as e:
        return {"code": 1, "msg": f"读取 COS 失败: {e}"}

    # 3. 注入数据
    print("  📝 注入数据到 HTML...")
    html = inject_data(html, data)
    print(f"  ✅ 已注入 {count} 条资讯")

    # 4. 上传回 COS
    print("  ☁️ 推送到 COS...")
    try:
        upload_to_cos(html, secret_id, secret_key)
    except Exception as e:
        return {"code": 1, "msg": f"上传 COS 失败: {e}"}

    print("  🎉 完成！")
    return {"code": 0, "msg": f"成功更新 {count} 条资讯"}

#!/usr/bin/env python3
"""Upload pxid0705 directory to COS under pxid-landing/ path."""
import os
import sys
import mimetypes
from pathlib import Path
from qcloud_cos import CosConfig, CosS3Client

# --- Config ---
def _load_creds():
    sid = os.environ.get("COS_SECRET_ID")
    skey = os.environ.get("COS_SECRET_KEY")
    if sid and skey:
        return sid, skey
    cred_file = os.path.expanduser("~/.cos_env")
    if os.path.isfile(cred_file):
        creds = {}
        with open(cred_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    creds[k] = v
        sid = creds.get("COS_SECRET_ID")
        skey = creds.get("COS_SECRET_KEY")
        if sid and skey:
            return sid, skey
    raise RuntimeError("COS_SECRET_ID/COS_SECRET_KEY not found")

SECRET_ID, SECRET_KEY = _load_creds()
REGION = "ap-hongkong"
BUCKET = "myopus-1253808671"

SOURCE_DIR = Path("/Users/likun/Desktop/pxid0705")
COS_PREFIX = "pxid-landing"

EXCLUDE_NAMES = {".DS_Store", ".uploads", ".codebuddy", ".workbuddy", "Thumbs.db"}
EXCLUDE_EXTS = {".ps1"}

MIME_OVERRIDES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".eot": "application/vnd.ms-fontobject",
    ".md": "text/markdown; charset=utf-8",
}


def get_content_type(filepath):
    ext = Path(filepath).suffix.lower()
    if ext in MIME_OVERRIDES:
        return MIME_OVERRIDES[ext]
    mime, _ = mimetypes.guess_type(filepath)
    return mime or "application/octet-stream"


def collect_files(root):
    """Collect (absolute_path, cos_key) pairs."""
    files = []
    for item in root.rglob("*"):
        if not item.is_file():
            continue
        # Skip excluded names
        if any(p.name in EXCLUDE_NAMES for p in item.parents) or item.name in EXCLUDE_NAMES:
            continue
        # Skip excluded extensions
        if item.suffix.lower() in EXCLUDE_EXTS:
            continue
        rel = item.relative_to(root)
        cos_key = f"{COS_PREFIX}/{rel}"
        files.append((str(item), cos_key))
    return files


def main():
    config = CosConfig(
        Region=REGION,
        SecretId=SECRET_ID,
        SecretKey=SECRET_KEY,
        Scheme="https",
    )
    client = CosS3Client(config)

    files = collect_files(SOURCE_DIR)
    print(f"Found {len(files)} files to upload to '{COS_PREFIX}/'\n")

    # Also upload 首页.html as index.html
    homepage = SOURCE_DIR / "首页.html"
    if homepage.exists():
        files.append((str(homepage), f"{COS_PREFIX}/index.html"))

    uploaded = 0
    failed = 0
    total = len(files)

    for i, (local_path, cos_key) in enumerate(files, 1):
        content_type = get_content_type(local_path)
        file_size = os.path.getsize(local_path)
        size_str = f"{file_size/1024:.0f}KB" if file_size < 1024*1024 else f"{file_size/1024/1024:.1f}MB"
        try:
            client.put_object_from_local_file(
                Bucket=BUCKET,
                LocalFilePath=local_path,
                Key=cos_key,
                ContentType=content_type,
                CacheControl="public, max-age=3600",
            )
            uploaded += 1
            print(f"  [{i}/{total}] ✅ {cos_key}  ({size_str})")
        except Exception as e:
            failed += 1
            print(f"  [{i}/{total}] ❌ {cos_key}  FAILED: {e}")

    print(f"\n{'='*50}")
    print(f"Done: {uploaded} uploaded, {failed} failed.")
    if failed == 0:
        print(f"\n🌐 PXID Landing Page: https://www.appin.site/{COS_PREFIX}/")


if __name__ == "__main__":
    main()

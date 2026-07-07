#!/usr/bin/env python3
"""Upload all static site files to Tencent Cloud COS."""
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
    raise RuntimeError("COS_SECRET_ID/COS_SECRET_KEY not found (env or ~/.cos_env)")

SECRET_ID, SECRET_KEY = _load_creds()
REGION = "ap-hongkong"
BUCKET = "myopus-1253808671"

PROJECT_ROOT = Path("/Users/likun/WorkBuddy/2026-05-29-21-25-04")

# Files/dirs to exclude from upload
EXCLUDE = {
    ".git", ".workbuddy", "node_modules", ".DS_Store",
    "upload_to_cos.py",  # don't upload this script itself
}

# MIME type overrides
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
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
}


def get_content_type(filepath: str) -> str:
    ext = Path(filepath).suffix.lower()
    if ext in MIME_OVERRIDES:
        return MIME_OVERRIDES[ext]
    mime, _ = mimetypes.guess_type(filepath)
    return mime or "application/octet-stream"


def collect_files(root: Path) -> list[tuple[str, str]]:
    """Collect (absolute_path, cos_key) for all files to upload."""
    files = []
    for item in root.iterdir():
        if item.name in EXCLUDE or item.name.startswith("."):
            continue
        if item.is_file():
            rel = item.relative_to(root)
            files.append((str(item), str(rel)))
        elif item.is_dir():
            for sub in item.rglob("*"):
                if sub.is_file() and not any(
                    p.name in EXCLUDE or p.name.startswith(".")
                    for p in sub.parents if p != root
                ):
                    rel = sub.relative_to(root)
                    files.append((str(sub), str(rel)))
    return files


def main():
    config = CosConfig(
        Region=REGION,
        SecretId=SECRET_ID,
        SecretKey=SECRET_KEY,
        Scheme="https",
    )
    client = CosS3Client(config)

    files = collect_files(PROJECT_ROOT)
    print(f"Found {len(files)} files to upload.\n")

    uploaded = 0
    failed = 0

    for local_path, cos_key in files:
        content_type = get_content_type(local_path)
        try:
            client.put_object_from_local_file(
                Bucket=BUCKET,
                LocalFilePath=local_path,
                Key=cos_key,
                ContentType=content_type,
                CacheControl="public, max-age=3600",
            )
            uploaded += 1
            print(f"  ✅ {cos_key}  ({content_type})")
        except Exception as e:
            failed += 1
            print(f"  ❌ {cos_key}  FAILED: {e}")

    print(f"\n{'='*50}")
    print(f"Done: {uploaded} uploaded, {failed} failed.")
    if failed == 0:
        print(f"\n🌐 Site should be available at: https://{BUCKET}.cos.{REGION}.myqcloud.com/")
        print(f"🌐 Custom domain: https://www.appin.site/")


if __name__ == "__main__":
    main()

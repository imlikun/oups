#!/usr/bin/env python3
"""Upload all PXID HTML files to COS with correct content-type"""
import os
from pathlib import Path
from qcloud_cos import CosConfig, CosS3Client

# Load creds same way as upload_to_cos.py
cred_file = os.path.expanduser("~/.cos_env")
creds = {}
with open(cred_file) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            creds[k] = v

BUCKET = 'myopus-1253808671'
REGION = 'ap-hongkong'

config = CosConfig(Region=REGION, SecretId=creds['COS_SECRET_ID'], SecretKey=creds['COS_SECRET_KEY'])
client = CosS3Client(config)

BASE = Path('/Users/likun/WorkBuddy/2026-05-29-21-25-04/pxid')
PARENT = BASE.parent

html_files = []
for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if d != '_next']
    for f in files:
        if f.endswith('.html'):
            html_files.append(Path(root) / f)

print(f"Uploading {len(html_files)} HTML files to COS...")
for fp in sorted(html_files):
    rel = fp.relative_to(PARENT)
    key = str(rel)
    
    with open(fp, 'rb') as fh:
        client.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=fh,
            ContentType='text/html; charset=utf-8',
            CacheControl='no-cache'
        )
    print(f"  ✓ {rel}")

print("Done! All PXID v5 files uploaded to COS.")

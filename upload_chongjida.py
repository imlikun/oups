#!/usr/bin/env python3
"""Upload 宠急帮 landing page + screenshots to COS, then add 6th card to index.html"""
import os
from pathlib import Path
from qcloud_cos import CosConfig, CosS3Client

# Load creds
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

BASE = Path('/Users/likun/WorkBuddy/2026-05-29-21-25-04')

# Upload screenshots
screenshots = [
    '宠急帮_screen-welcome.png',
    '宠急帮_screen-asker-home.png',
    '宠急帮_screen-publish.png',
    '宠急帮_screen-helper-pool.png',
]

for ss in screenshots:
    local = BASE / ss
    key = f'宠急帮/{ss.replace("宠急帮_","")}'
    with open(local, 'rb') as fh:
        client.put_object(Bucket=BUCKET, Key=key, Body=fh, ContentType='image/png', CacheControl='public,max-age=604800')
    print(f"  ✓ {key}")

# Upload landing page
html_path = BASE / '宠急帮/index.html'
with open(html_path, 'rb') as fh:
    client.put_object(Bucket=BUCKET, Key='宠急帮/index.html', Body=fh, ContentType='text/html; charset=utf-8', CacheControl='no-cache')
print(f"  ✓ 宠急帮/index.html")

print("Done uploading 宠急帮 files!")

#!/usr/bin/env python3
"""上传宠急达小程序二维码到 COS"""
import os
from qcloud_cos import CosConfig, CosS3Client

creds = {}
with open(os.path.expanduser('~/.cos_env')) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            creds[k] = v

client = CosS3Client(CosConfig(
    Region='ap-hongkong',
    SecretId=creds['COS_SECRET_ID'],
    SecretKey=creds['COS_SECRET_KEY']
))

bucket = 'myopus-1253808671'

# 上传二维码
with open('/Users/likun/Desktop/gh_6a4d83cb690f_344.jpg', 'rb') as f:
    client.put_object(
        Bucket=bucket,
        Key='宠急达/qrcode.jpg',
        Body=f,
        ContentType='image/jpeg',
        CacheControl='max-age=86400'
    )
print('✓ 二维码上传完成: https://www.appin.site/宠急达/qrcode.jpg')

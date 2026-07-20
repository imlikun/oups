#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""幂等迁移：把全局动效层 fx.css / fx.js 注入到所有主站 HTML。
排除：pxid* / pxid-landing / 旧 landing 页（neuroflow, congji, 宠急达, bigbang, yunlan）。
可重复运行，已注入的文件跳过。"""
import os, sys

ROOT = '/Users/likun/Projects/appin-site'

EXCLUDE_DIRS = ['pxid', 'neuroflow', 'congji', '宠急达', 'bigbang', 'yunlan',
               'node_modules', '.git']
EXCLUDE_FILES = {'pet-app.html', '宠急达_phones.html'}

def excluded(path):
    parts = path.split(os.sep)
    for p in parts:
        for ex in EXCLUDE_DIRS:
            if ex in p:
                return True
    base = os.path.basename(path)
    if base in EXCLUDE_FILES:
        return True
    return False

def inject(content):
    needed = []
    if '/assets/fx.css' not in content:
        needed.append('  <link rel="stylesheet" href="/assets/fx.css">')
    if '/assets/fx.js' not in content:
        needed.append('  <script src="/assets/fx.js" defer></script>')
    if not needed:
        return content, False
    insertion = '\n'.join(needed) + '\n'
    if '</head>' in content:
        return content.replace('</head>', insertion + '</head>', 1), True
    if '</body>' in content:
        return content.replace('</body>', insertion + '</body>', 1), True
    return content, False

def main():
    changed = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        # 不进入被排除目录
        dirnames[:] = [d for d in dirnames if not excluded(d)]
        for fn in filenames:
            if not fn.endswith('.html'):
                continue
            full = os.path.join(dirpath, fn)
            if excluded(full):
                continue
            try:
                with open(full, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception as e:
                print('SKIP(read)', full, e)
                continue
            new, did = inject(content)
            if did:
                with open(full, 'w', encoding='utf-8') as f:
                    f.write(new)
                rel = os.path.relpath(full, ROOT)
                changed.append(rel)
                print('INJECT', rel)
    print('\nTOTAL injected:', len(changed))
    if not changed:
        print('(no files needed injection — already up to date)')

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成 Appin.site 的 OG 分享图 (1200x630)。
视觉规范：Developer Publication 荧光绿风，与全站 token 一致。
2x 超采样保证文字锐利，最终降采样到 1200x630 输出 PNG。
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "assets", "og-cover.png")

SS = 2                      # 超采样倍数
W, H = 1200 * SS, 630 * SS  # 2400 x 1260

# ── 设计 token ──────────────────────────────────────────────
BG         = (14, 15, 14)    # #0E0F0E 近黑
BRAND      = (184, 255, 60)  # #B8FF3C 荧光绿
BRAND_DK   = (74, 156, 0)    # #4a9c00
WHITE      = (240, 242, 238)
MUTED      = (150, 158, 148)
AMBER      = (255, 184, 0)   # #FFB800

# ── 字体加载（带候选回退）──────────────────────────────────
def load_font(cands, size):
    for path, idx in cands:
        try:
            return ImageFont.truetype(path, size, index=idx)
        except Exception:
            continue
    return ImageFont.load_default()

DISPLAY = load_font([
    ("/System/Library/Fonts/Helvetica.ttc", 0),
    ("/System/Library/Fonts/Supplemental/Arial.ttf", 0),
], 220 * SS)
DISPLAY_B = load_font([
    ("/System/Library/Fonts/Helvetica.ttc", 1),
    ("/System/Library/Fonts/Helvetica.ttc", 0),
    ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 0),
], 220 * SS)
CJK = load_font([
    ("/System/Library/Fonts/STHeiti Medium.ttc", 0),
    ("/System/Library/Fonts/Hiragino Sans GB.ttc", 0),
], 84 * SS)
CJK_SM = load_font([
    ("/System/Library/Fonts/STHeiti Medium.ttc", 0),
    ("/System/Library/Fonts/Hiragino Sans GB.ttc", 0),
], 62 * SS)
MONO = load_font([
    ("/System/Library/Fonts/Menlo.ttc", 1),
    ("/System/Library/Fonts/Menlo.ttc", 0),
], 40 * SS)
MONO_SM = load_font([
    ("/System/Library/Fonts/Menlo.ttc", 0),
], 26 * SS)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# ── 背景：淡栅格线 ─────────────────────────────────────────
GRID = 90 * SS
for x in range(0, W + 1, GRID):
    d.line([(x, 0), (x, H)], fill=(255, 255, 255), width=1)
for y in range(0, H + 1, GRID):
    d.line([(0, y), (W, y)], fill=(255, 255, 255), width=1)
# 用半透明黑覆盖，让栅格变成极淡的底纹
veil = Image.new("RGBA", (W, H), (14, 15, 14, 235))
img = Image.alpha_composite(img.convert("RGBA"), veil).convert("RGB")
d = ImageDraw.Draw(img)

# ── 荧光绿辉光（径向，多重椭圆模拟）──────────────────────
cx, cy, R = int(1820 * SS), int(640 * SS), int(720 * SS)
for i in range(40, 0, -1):
    r = int(R * i / 40)
    a = int(26 * (1 - i / 40) ** 1.6)   # 越靠外越弱
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(184, 255, 60, a))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
d = ImageDraw.Draw(img)

# ── 左上：品牌圆点 logo ───────────────────────────────────
dot_r = 16 * SS
d.ellipse([150 * SS - dot_r, 175 * SS - dot_r, 150 * SS + dot_r, 175 * SS + dot_r],
          fill=BRAND)

# ── 主品牌字 Appin.site ───────────────────────────────────
# 用 A 大写 + 其余小写，绿色 + 琥珀 "." 点缀
def draw_mixed(d, xy, font, base, accent_pos, accent_char, accent_color):
    x, y = xy
    # 逐字符绘制以给 "." 上琥珀色
    for ch in "Appin.site":
        col = accent_color if ch == "." else base
        d.text((x, y), ch, font=font, fill=col)
        x += d.textlength(ch, font=font)

word_size = 210 * SS
word_font = DISPLAY_B if hasattr(DISPLAY_B, "size") else DISPLAY
# 重新确保用粗体
word_font = load_font([
    ("/System/Library/Fonts/Helvetica.ttc", 1),
    ("/System/Library/Fonts/Helvetica.ttc", 0),
], word_size)
bw = d.textlength("Appin.site", font=word_font)
draw_mixed(d, (150 * SS, 250 * SS), word_font, BRAND, None, ".", AMBER)
# 品牌字下方绿色细条
d.rectangle([150 * SS, 250 * SS + int(word_size * 1.05), 150 * SS + int(bw),
             250 * SS + int(word_size * 1.05) + 8 * SS], fill=BRAND)

# ── 中文副标题 ────────────────────────────────────────────
d.text((152 * SS, 520 * SS), "李坤", font=CJK, fill=WHITE)
ln2 = "实战派技术人 · 出海品牌操盘"
d.text((152 * SS, 640 * SS), ln2, font=CJK_SM, fill=(200, 220, 180))

# ── 底部等宽标语 ─────────────────────────────────────────
tag = "内容 · 出海 · 数字产品"
d.text((152 * SS, 1080 * SS), tag, font=MONO, fill=BRAND)
d.text((152 * SS, 1140 * SS), "~/appin.site $ whoami → likun", font=MONO_SM, fill=MUTED)

# ── 右上：终端卡片装饰 ───────────────────────────────────
card_x0, card_y0 = int(1480 * SS), int(170 * SS)
card_x1, card_y1 = int(2240 * SS), int(620 * SS)
d.rounded_rectangle([card_x0, card_y0, card_x1, card_y1],
                    radius=22 * SS, outline=(74, 156, 0), width=2 * SS)
# 卡片标题栏三个点
for i, c in enumerate([(255, 95, 86), (255, 184, 0), (60, 200, 90)]):
    px = card_x0 + 40 * SS + i * 46 * SS
    d.ellipse([px - 11 * SS, card_y0 + 34 * SS - 11 * SS,
               px + 11 * SS, card_y0 + 34 * SS + 11 * SS], fill=c)
# 卡片内 mono 文本
lines = [
    ("$ whoami", BRAND),
    ("likun — builder / brand operator", WHITE),
    ("$ cat focus.txt", BRAND),
    ("craft writing · overseas brand · digital product", WHITE),
]
yy = card_y0 + 90 * SS
for txt, col in lines:
    d.text((card_x0 + 44 * SS, yy), txt, font=MONO, fill=col)
    yy += 64 * SS

# ── 降采样输出 ────────────────────────────────────────────
img = img.resize((1200, 630), Image.LANCZOS)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT, "PNG", optimize=True)
print("WROTE", OUT, "size", os.path.getsize(OUT), "bytes")

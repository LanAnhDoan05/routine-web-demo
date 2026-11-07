"""
Sinh anh placeholder toi gian, dong nhat theo tinh than thiet ke Routine.
Thay vi phac hoa ao mac (de sai ty le / trong gan gap), moi anh la mot bo
cuc hinh hoc truu tuong lay cam hung tu "vai gap / swatch vai" — dung
chung palette, do day net, khoang le => dong nhat, nhung khac nhau ve vi
tri/goc/kich thuoc theo seed rieng cua tung style.
"""

import hashlib
import os

from PIL import Image, ImageDraw

INK = (17, 17, 17)
INK_SOFT = (17, 17, 17, 90)
BG = (247, 245, 241)

STYLE_OUT_DIR = "/home/claude/routine-auth/public/images/styles"
HERO_OUT_DIR = "/home/claude/routine-auth/public/images/hero"
os.makedirs(STYLE_OUT_DIR, exist_ok=True)
os.makedirs(HERO_OUT_DIR, exist_ok=True)

STYLE_IDS = [
    "basic",
    "minimal",
    "smart-casual",
    "streetstyle",
    "vintage",
    "formal",
    "layer",
    "sporty-chic",
    "unisex",
]

W, H = 800, 1000


def seeded_random(name, salt=0):
    h = hashlib.sha256(f"{name}-{salt}".encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def draw_swatch_motif(draw, name, w, h, ink, ink_soft, offset=(0, 0)):
    """Bo cuc truu tuong: 2 khung vai gap chong lop + vai duong cheo phu kien."""
    ox, oy = offset
    r = lambda salt: seeded_random(name, salt)

    cx = ox + w / 2
    cy = oy + h / 2

    # Khung chinh (panel vai lon)
    panel_w = w * (0.46 + r(1) * 0.08)
    panel_h = h * (0.5 + r(2) * 0.08)
    p1 = (cx - panel_w / 2, cy - panel_h / 2 - h * 0.02)
    p2 = (cx + panel_w / 2, cy + panel_h / 2 - h * 0.02)
    draw.rectangle([p1, p2], outline=ink, width=3)

    # Khung phu chong lop, lech nhe (goi cam giac vai gap)
    shift_x = w * (0.09 + r(3) * 0.05) * (1 if r(4) > 0.5 else -1)
    shift_y = h * (0.06 + r(5) * 0.04)
    q1 = (p1[0] + shift_x, p1[1] + shift_y)
    q2 = (p2[0] + shift_x, p2[1] + shift_y)
    draw.rectangle([q1, q2], outline=ink_soft, width=2)

    # Cac duong chi ngang mong trong panel chinh, dan cach deu
    n_lines = 3 + int(r(6) * 3)
    for i in range(1, n_lines + 1):
        t = i / (n_lines + 1)
        y = p1[1] + (p2[1] - p1[1]) * t
        inset = panel_w * 0.14
        draw.line([(p1[0] + inset, y), (p2[0] - inset, y)], fill=ink_soft, width=1)

    # Mot duong cheo phu kien bang qua goc, cat qua khung
    diag_len = min(w, h) * (0.3 + r(7) * 0.15)
    angle_choices = [30, 45, 60, 120, 135, 150]
    angle = angle_choices[int(r(8) * len(angle_choices)) % len(angle_choices)]
    import math

    rad = math.radians(angle)
    start_x = cx - diag_len / 2 * math.cos(rad)
    start_y = cy + h * 0.32 - diag_len / 2 * math.sin(rad)
    end_x = cx + diag_len / 2 * math.cos(rad)
    end_y = cy + h * 0.32 + diag_len / 2 * math.sin(rad)
    draw.line([(start_x, start_y), (end_x, end_y)], fill=ink, width=2)

    # Mot vong tron nho lam diem nhan (nut ao / accent dot)
    dot_r = 5 + r(9) * 3
    dot_x = p2[0] - panel_w * (0.16 + r(10) * 0.1)
    dot_y = p1[1] + panel_h * (0.18 + r(11) * 0.12)
    if r(12) > 0.35:
        draw.ellipse(
            [dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r],
            outline=ink,
            width=2,
        )
    else:
        draw.ellipse(
            [dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r],
            fill=ink,
        )


def make_style_image(style_id):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img, "RGBA")

    margin = 28
    draw.rectangle(
        [margin, margin, W - margin, H - margin], outline=(17, 17, 17, 35), width=1
    )

    draw_swatch_motif(draw, style_id, W, H, INK, INK_SOFT)

    path = os.path.join(STYLE_OUT_DIR, f"{style_id}.jpg")
    img.save(path, "JPEG", quality=90)
    print("saved", path)


def make_hero_image():
    hw, hh = 1200, 1600
    img = Image.new("RGB", (hw, hh), (22, 22, 22))
    draw = ImageDraw.Draw(img, "RGBA")

    top = (32, 32, 32)
    bottom = (14, 14, 14)
    for y in range(hh):
        t = y / hh
        col = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        draw.line([(0, y), (hw, y)], fill=col)

    light = (235, 235, 232)
    light_soft = (235, 235, 232, 70)
    draw_swatch_motif(draw, "hero", hw, hh, light, light_soft)

    path = os.path.join(HERO_OUT_DIR, "auth-hero.jpg")
    img.save(path, "JPEG", quality=90)
    print("saved", path)


if __name__ == "__main__":
    for sid in STYLE_IDS:
        make_style_image(sid)
    make_hero_image()

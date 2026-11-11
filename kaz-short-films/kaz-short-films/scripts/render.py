#!/usr/bin/env python3
"""Kaz Short Films renderer.

Turns a storyboard JSON (see references/storyboard-schema.md) into an MP4:
minimal blob-character animation, a red-glowing shadow "inner enemy",
day counters, whispers, captions, meters, title cards and a generated score.

Usage:
  python3 render.py story.json -o film.mp4 [--res 720|1080] [--fps 24]
                    [--voice narration.wav] [--music mymusic.mp3]
                    [--preview] [--sheet sheet.jpg] [--only 3,4]
Requires: Python 3.9+, Pillow, numpy, ffmpeg on PATH.
"""
import argparse, json, math, os, random, subprocess, sys, tempfile, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(HERE, "..", "assets", "fonts")

# ---------------------------------------------------------------- style
PALETTES = {
    # bg top, bg bottom, floor line, ambient light tint
    "night":  dict(top=(24, 24, 28),  bot=(13, 13, 16),  line=(85, 85, 95),  glow=(255, 255, 255)),
    "cold":   dict(top=(28, 32, 44),  bot=(14, 16, 22),  line=(80, 88, 105), glow=(170, 200, 255)),
    "dawn":   dict(top=(58, 48, 82),  bot=(196, 120, 92), line=(90, 70, 80), glow=(255, 200, 150)),
    "sunset": dict(top=(34, 22, 32),  bot=(188, 92, 48), line=(70, 40, 40),  glow=(255, 170, 90)),
    "warm":   dict(top=(54, 40, 30),  bot=(24, 19, 16),  line=(110, 90, 70), glow=(255, 200, 140)),
    "day":    dict(top=(150, 158, 170), bot=(118, 126, 140), line=(80, 85, 95), glow=(255, 255, 255)),
    "rain":   dict(top=(120, 124, 130), bot=(92, 96, 104), line=(70, 72, 78),  glow=(255, 255, 255)),
    "home":   dict(top=(196, 178, 150), bot=(170, 150, 122), line=(110, 95, 80), glow=(255, 230, 190)),
    "black":  dict(top=(10, 10, 12),  bot=(10, 10, 12),  line=(40, 40, 46),  glow=(255, 255, 255)),
}
BODY = (236, 229, 212)
INK = (38, 36, 40)
RED = (226, 52, 52)
BLANKET = (62, 68, 100)


def font(size, bold=True):
    for name in (["Poppins-Bold.ttf"] if bold else ["Poppins-Medium.ttf", "Poppins-Regular.ttf"]):
        for d in (FONT_DIR, "/usr/share/fonts/truetype/google-fonts"):
            p = os.path.join(d, name)
            if os.path.exists(p):
                return ImageFont.truetype(p, int(size))
    try:
        return ImageFont.truetype("DejaVuSans-Bold.ttf", int(size))
    except OSError:
        return ImageFont.load_default()


def lerp(a, b, t):
    return a + (b - a) * t


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def mix(c1, c2, t):
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))


# ---------------------------------------------------------------- canvas helper
class Ctx:
    """Drawing context. Coordinates are in a 1280x720 design space."""
    def __init__(self, W, H, ss=2):
        self.W, self.H, self.ss = W, H, ss
        self.k = W * ss / 1280.0
        self.img = Image.new("RGB", (W * ss, H * ss), (0, 0, 0))
        self.d = ImageDraw.Draw(self.img)

    def p(self, x, y):
        return (x * self.k, y * self.k)

    def box(self, x0, y0, x1, y1):
        return [x0 * self.k, y0 * self.k, x1 * self.k, y1 * self.k]

    def w(self, v):
        return max(1, int(v * self.k))

    def glow(self, draw_fn, color, radius=18, strength=1.0):
        """Draw a shape into a mask, blur it, and add it as coloured light."""
        mask = Image.new("L", self.img.size, 0)
        md = ImageDraw.Draw(mask)
        draw_fn(md)
        blur = mask.filter(ImageFilter.GaussianBlur(radius * self.k))
        arr = np.asarray(self.img).astype(np.float32)
        a = np.asarray(blur).astype(np.float32)[..., None] / 255.0 * strength
        arr = arr + a * np.array(color, np.float32)
        self.img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        self.d = ImageDraw.Draw(self.img)

    def text(self, xy, s, size, fill, anchor="mm", bold=True, alpha=1.0):
        if alpha <= 0 or not s:
            return
        f = font(size * self.k, bold)
        if alpha >= 0.99:
            self.d.text(self.p(*xy), s, font=f, fill=fill, anchor=anchor)
        else:
            layer = Image.new("RGBA", self.img.size, (0, 0, 0, 0))
            ImageDraw.Draw(layer).text(self.p(*xy), s, font=f, fill=fill + (int(255 * alpha),), anchor=anchor)
            self.img = Image.alpha_composite(self.img.convert("RGBA"), layer).convert("RGB")
            self.d = ImageDraw.Draw(self.img)


# ---------------------------------------------------------------- backgrounds & props
GROUND = 560


def background(c, pal):
    top, bot = np.array(pal["top"], np.float32), np.array(pal["bot"], np.float32)
    h, w = c.img.size[1], c.img.size[0]
    g = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    arr = (top * (1 - g) + bot * g)[:, :, :].repeat(w, axis=1)
    c.img = Image.fromarray(arr.astype(np.uint8))
    c.d = ImageDraw.Draw(c.img)


def floor(c, pal, y=GROUND):
    c.d.line([c.p(0, y), c.p(1280, y)], fill=pal["line"], width=c.w(2))


def window(c, x, y, sky="night", size=90):
    col = {"night": (30, 34, 48), "dawn": (190, 120, 120), "sunset": (200, 110, 70), "day": (190, 210, 230)}.get(sky, (30, 34, 48))
    c.d.rectangle(c.box(x, y, x + size, y + size), fill=col, outline=(150, 150, 160), width=c.w(3))
    c.d.line([c.p(x + size / 2, y), c.p(x + size / 2, y + size)], fill=(150, 150, 160), width=c.w(3))
    c.d.line([c.p(x, y + size / 2), c.p(x + size, y + size / 2)], fill=(150, 150, 160), width=c.w(3))
    if sky == "night":
        c.d.ellipse(c.box(x + size * .62, y + size * .14, x + size * .82, y + size * .34), fill=(235, 235, 225))
        # moonlight beam
        beam = Image.new("L", c.img.size, 0)
        ImageDraw.Draw(beam).polygon([c.p(x, y + size), c.p(x + size, y + size), c.p(x + size - 40, GROUND), c.p(x - 260, GROUND)], fill=22)
        beam = beam.filter(ImageFilter.GaussianBlur(14 * c.k))
        c.img = Image.composite(Image.new("RGB", c.img.size, (200, 210, 230)), c.img, beam)
        c.d = ImageDraw.Draw(c.img)


def clock(c, x, y, txt="5:00", big=False, ring=0.0):
    s = 3.2 if big else 1.0
    w, h = 64 * s, 34 * s
    c.d.rounded_rectangle(c.box(x - w / 2, y - h / 2, x + w / 2, y + h / 2), radius=c.w(6 * s), fill=(28, 26, 28), outline=(90, 88, 92), width=c.w(2 * s))
    c.glow(lambda md: md.text(c.p(x, y), txt, font=font(24 * s * c.k), fill=255, anchor="mm"), RED, radius=4 * s, strength=0.7)
    c.d.text(c.p(x, y), txt, font=font(24 * s * c.k), fill=(255, 70, 60), anchor="mm")
    if ring > 0:
        for i in range(6):
            a = -math.pi / 2 + (i - 2.5) * 0.45
            r0, r1 = w * 0.75, w * (0.9 + 0.1 * ring)
            c.d.line([c.p(x + math.cos(a) * r0, y - h * 0.2 + math.sin(a) * r0 * .6), c.p(x + math.cos(a) * r1, y - h * 0.2 + math.sin(a) * r1 * .6)], fill=(240, 200, 60), width=c.w(3 * s))


def bed(c, x=330, clock_txt=None, ring=0.0):
    # nightstand + clock
    c.d.rounded_rectangle(c.box(x - 110, GROUND - 70, x - 40, GROUND), radius=c.w(6), fill=(40, 40, 46), outline=(95, 95, 105), width=c.w(2))
    if clock_txt:
        clock(c, x - 75, GROUND - 88, clock_txt, ring=ring)
    c.d.rectangle(c.box(x - 25, GROUND - 120, x - 15, GROUND), fill=(70, 70, 80))   # headboard
    c.d.rectangle(c.box(x - 25, GROUND - 40, x + 330, GROUND - 28), fill=(70, 70, 80))  # frame
    c.d.rounded_rectangle(c.box(x - 15, GROUND - 62, x + 325, GROUND - 40), radius=c.w(8), fill=(200, 200, 205))  # mattress
    c.d.rounded_rectangle(c.box(x - 8, GROUND - 82, x + 60, GROUND - 60), radius=c.w(10), fill=(225, 225, 230))  # pillow


def blanket(c, x=330, lump=True):
    c.d.rounded_rectangle(c.box(x + 40, GROUND - 78 if lump else GROUND - 66, x + 330, GROUND - 38), radius=c.w(14), fill=BLANKET, outline=(40, 44, 70), width=c.w(2))


def couch(c, x=560):
    col, dk = (70, 66, 80), (50, 47, 58)
    c.d.rounded_rectangle(c.box(x - 160, GROUND - 120, x + 160, GROUND - 50), radius=c.w(16), fill=dk)
    c.d.rounded_rectangle(c.box(x - 175, GROUND - 75, x + 175, GROUND - 15), radius=c.w(14), fill=col)
    c.d.rounded_rectangle(c.box(x - 190, GROUND - 95, x - 150, GROUND - 15), radius=c.w(12), fill=dk)
    c.d.rounded_rectangle(c.box(x + 150, GROUND - 95, x + 190, GROUND - 15), radius=c.w(12), fill=dk)


def desk(c, x=760, lamp=True):
    c.d.rectangle(c.box(x - 150, GROUND - 95, x + 150, GROUND - 85), fill=(80, 76, 72))
    c.d.line([c.p(x - 140, GROUND - 85), c.p(x - 140, GROUND)], fill=(80, 76, 72), width=c.w(5))
    c.d.line([c.p(x + 140, GROUND - 85), c.p(x + 140, GROUND)], fill=(80, 76, 72), width=c.w(5))
    for i, col in enumerate([(70, 110, 150), (150, 80, 80), (90, 140, 100)]):
        c.d.rectangle(c.box(x + 70, GROUND - 105 - i * 10, x + 125, GROUND - 96 - i * 10), fill=col)
    if lamp:
        c.d.line([c.p(x + 40, GROUND - 95), c.p(x + 20, GROUND - 150)], fill=(150, 150, 150), width=c.w(4))
        c.d.polygon([c.p(x + 5, GROUND - 165), c.p(x + 45, GROUND - 155), c.p(x + 25, GROUND - 140)], fill=(170, 170, 170))
        c.glow(lambda md: md.polygon([c.p(x + 25, GROUND - 145), c.p(x - 90, GROUND - 92), c.p(x + 90, GROUND - 92)], fill=255), (255, 210, 140), radius=14, strength=0.35)


def mirror(c, x=760, cracked=False):
    c.d.ellipse(c.box(x - 70, GROUND - 260, x + 70, GROUND - 40), fill=(22, 22, 26), outline=(170, 170, 180), width=c.w(4))
    c.d.rounded_rectangle(c.box(x - 60, GROUND - 40, x + 60, GROUND - 10), radius=c.w(8), fill=(90, 90, 98))
    if cracked:
        rnd = random.Random(7)
        for _ in range(9):
            a = rnd.uniform(0, 6.28)
            c.d.line([c.p(x, GROUND - 150), c.p(x + math.cos(a) * 65, GROUND - 150 + math.sin(a) * 100)], fill=(200, 200, 210), width=c.w(1.5))


def punching_bag(c, x=820, hit=0.0):
    sw = math.sin(hit * math.pi) * 14
    c.d.line([c.p(x, 0), c.p(x + sw * .3, GROUND - 330)], fill=(120, 120, 120), width=c.w(3))
    c.glow(lambda md: md.rounded_rectangle(c.box(x - 45 + sw, GROUND - 330, x + 45 + sw, GROUND - 120), radius=c.w(20), fill=255), RED, radius=22, strength=0.45)
    c.d.rounded_rectangle(c.box(x - 45 + sw, GROUND - 330, x + 45 + sw, GROUND - 120), radius=c.w(20), fill=(205, 30, 30))


def city(c, t, pal, lights=True, seed=3):
    rnd = random.Random(seed)
    x = -20
    while x < 1300:
        w, h = rnd.randint(60, 130), rnd.randint(120, 330)
        col = mix(pal["top"], (0, 0, 0), 0.25)
        c.d.rectangle(c.box(x, GROUND - h, x + w, GROUND), fill=col)
        if lights:
            for wy in range(GROUND - h + 15, GROUND - 20, 26):
                for wx in range(x + 10, x + w - 14, 22):
                    if rnd.random() < 0.3:
                        c.d.rectangle(c.box(wx, wy, wx + 8, wy + 10), fill=(235, 200, 120))
        x += w + rnd.randint(4, 30)
    for lx in range(80, 1280, 260):
        c.d.line([c.p(lx, GROUND), c.p(lx, GROUND - 170)], fill=(60, 60, 66), width=c.w(4))
        c.glow(lambda md, lx=lx: md.ellipse(c.box(lx - 10, GROUND - 180, lx + 10, GROUND - 165), fill=255), (255, 200, 120), radius=26, strength=0.6)
    c.d.rectangle(c.box(0, GROUND, 1280, 720), fill=mix(pal["bot"], (0, 0, 0), 0.5))
    for dx in range(0, 1280, 90):
        c.d.line([c.p(dx, GROUND + 60), c.p(dx + 40, GROUND + 60)], fill=(110, 110, 110), width=c.w(3))


def stairs(c, pal):
    pts = [c.p(0, 720)]
    x, y = 150, 720
    while x < 1300:
        pts += [c.p(x, y), c.p(x, y - 45)]
        x += 70
        y -= 45
    pts += [c.p(1280, y), c.p(1280, 720)]
    c.d.polygon(pts, fill=mix(pal["top"], (60, 60, 66), 0.6))


def stair_pos(t_x):
    """Return (x, y-ground) for a figure climbing the stairs at x."""
    step = max(0, int((t_x - 150) // 70) + 1)
    return t_x, 720 - step * 45


def hill(c, pal):
    c.glow(lambda md: md.ellipse(c.box(500, 380, 900, 640), fill=255), (255, 150, 60), radius=60, strength=0.8)
    rnd = random.Random(1)
    pts = [c.p(0, 720)] + [c.p(x, 470 + 25 * math.sin(x / 140 + 1) + rnd.randint(-4, 4)) for x in range(0, 1300, 40)] + [c.p(1280, 720)]
    c.d.polygon(pts, fill=(60, 30, 36))
    c.d.ellipse(c.box(280, 470, 1000, 900), fill=(26, 18, 22))


def bus_stop(c):
    c.d.rectangle(c.box(0, 160, 1280, 420), fill=(150, 72, 58))
    for wx in range(40, 1280, 120):
        c.d.rectangle(c.box(wx, 200, wx + 60, 260), fill=(235, 235, 240))
        c.d.rectangle(c.box(wx, 310, wx + 60, 370), fill=(235, 235, 240))
    c.d.rectangle(c.box(0, 420, 1280, GROUND), fill=(110, 110, 116))
    for fx in range(0, 1280, 18):
        c.d.line([c.p(fx, 440), c.p(fx, GROUND)], fill=(50, 70, 55), width=c.w(2))


def rain(c, t, n=160):
    rnd = random.Random(5)
    for _ in range(n):
        x0, sp = rnd.uniform(0, 1400), rnd.uniform(500, 900)
        y = (rnd.uniform(0, 720) + t * sp) % 760 - 20
        x = x0 - (y * 0.15)
        c.d.line([c.p(x, y), c.p(x - 4, y + 18)], fill=(210, 215, 225), width=c.w(1.4))


def sparks(c, t, color=(255, 190, 90), n=120):
    rnd = random.Random(9)
    for _ in range(n):
        x, y, ph = rnd.uniform(0, 1280), rnd.uniform(0, 720), rnd.uniform(0, 6.28)
        a = 0.5 + 0.5 * math.sin(t * 4 + ph)
        r = 2 + 2 * a
        c.d.rectangle(c.box(x - r, y - r - t * 20, x + r, y + r - t * 20), fill=mix((0, 0, 0), color, a))


# ---------------------------------------------------------------- characters
def face(c, cx, cy, s, mood, look=0):
    e = s
    ex = 9 * e
    ey = cy
    lx = look * 4 * e
    if mood == "sleep":
        for sx in (-1, 1):
            c.d.arc(c.box(cx + sx * ex - 5 * e + lx, ey - 3 * e, cx + sx * ex + 5 * e + lx, ey + 4 * e), 0, 180, fill=INK, width=c.w(2 * e))
    else:
        r = 2.8 * e
        for sx in (-1, 1):
            c.d.ellipse(c.box(cx + sx * ex - r + lx, ey - r, cx + sx * ex + r + lx, ey + r), fill=INK)
    # brows
    bw = c.w(2.2 * e)
    by = ey - 9 * e
    tilt = {"angry": 5, "determined": 4, "sad": -4, "tired": -2, "scared": -5, "happy": -1}.get(mood, 0)
    for sx in (-1, 1):
        x0, x1 = cx + sx * (ex + 6 * e) + lx, cx + sx * (ex - 5 * e) + lx
        c.d.line([c.p(x0, by - tilt * e * 0.5), c.p(x1, by + tilt * e * 0.5)], fill=INK, width=bw)
    my = ey + 12 * e
    mw = 7 * e
    if mood in ("happy",):
        c.d.arc(c.box(cx - mw + lx, my - 6 * e, cx + mw + lx, my + 4 * e), 10, 170, fill=INK, width=bw)
    elif mood in ("sad", "tired", "scared"):
        c.d.arc(c.box(cx - mw + lx, my, cx + mw + lx, my + 10 * e), 200, 340, fill=INK, width=bw)
    elif mood in ("angry", "determined"):
        c.d.rounded_rectangle(c.box(cx - mw + lx, my - 2 * e, cx + mw + lx, my + 5 * e), radius=c.w(2 * e), fill=(255, 255, 255), outline=INK, width=c.w(1.6 * e))
        c.d.line([c.p(cx - mw + lx, my + 1.5 * e), c.p(cx + mw + lx, my + 1.5 * e)], fill=INK, width=c.w(1 * e))
    elif mood != "sleep":
        c.d.line([c.p(cx - mw * 0.6 + lx, my), c.p(cx + mw * 0.6 + lx, my)], fill=INK, width=bw)


def limb(c, a, b, s, col=BODY, th=13):
    """Thick pictogram limb with round ends and an ink outline."""
    for w, cc in ((th + 4, INK), (th, col)):
        c.d.line([c.p(*a), c.p(*b)], fill=cc, width=c.w(w * s))
        r = w * s / 2
        for pt in (a, b):
            c.d.ellipse(c.box(pt[0] - r, pt[1] - r, pt[0] + r, pt[1] + r), fill=cc)


def chain(c, pts, s, col=BODY, th=13):
    for a, b in zip(pts, pts[1:]):
        limb(c, a, b, s, col, th)


def pill(c, cx, top, w, h, col, outline=INK, ow=2.5):
    c.d.rounded_rectangle(c.box(cx - w / 2, top, cx + w / 2, top + h), radius=c.w(w / 2), fill=col, outline=outline, width=c.w(ow))


def torso(c, cx, top, s, col, w=44, h=72, tilt=0):
    """Pictogram torso: rounded shoulders, square hips."""
    c.d.rounded_rectangle(c.box(cx - w / 2 * s + tilt, top, cx + w / 2 * s + tilt, top + h * s), radius=c.w(14 * s),
                          corners=(True, True, False, False), fill=col, outline=INK, width=c.w(2.5))


def head(c, hx, hy, s, col, mood, look):
    r = 19 * s
    c.d.ellipse(c.box(hx - r, hy - r, hx + r, hy + r), fill=col, outline=INK, width=c.w(2.5))
    face(c, hx, hy + 1 * s, s * 0.78, mood, look)


def arms_for(style, sh_l, sh_r, top, s, sw=0.0, phone=False):
    """Return two point-chains (left arm, right arm) for an arm style."""
    L, R = sh_l, sh_r
    if style == "crossed":
        return ([L, (L[0] + 4 * s, top + 34 * s), (R[0] - 2 * s, top + 30 * s)],
                [R, (R[0] - 4 * s, top + 38 * s), (L[0] + 2 * s, top + 36 * s)])
    if style == "hips":
        return ([L, (L[0] - 20 * s, top + 30 * s), (L[0] + 4 * s, top + 60 * s)],
                [R, (R[0] + 20 * s, top + 30 * s), (R[0] - 4 * s, top + 60 * s)])
    if style == "head":
        return ([L, (L[0] - 26 * s, top - 30 * s), (L[0] + 8 * s, top - 42 * s)],
                [R, (R[0] + 26 * s, top - 30 * s), (R[0] - 8 * s, top - 42 * s)])
    if style == "scratch":  # one hand on head
        return ([L, (L[0] - 30 * s, top - 22 * s), (L[0] + 4 * s, top - 40 * s)],
                [R, (R[0] + 6 * s, top + 40 * s), (R[0] + 4 * s, top + 68 * s)])
    if style == "pockets":
        return ([L, (L[0] - 6 * s, top + 36 * s), (L[0] + 8 * s, top + 60 * s)],
                [R, (R[0] + 6 * s, top + 36 * s), (R[0] - 8 * s, top + 60 * s)])
    if style == "point":
        return ([L, (L[0] - 6 * s, top + 36 * s), (L[0] + 8 * s, top + 60 * s)],
                [R, (R[0] + 50 * s, top - 6 * s), (R[0] + 100 * s, top - 22 * s)])
    if style == "raise":  # victory arms up
        return ([L, (L[0] - 18 * s, top - 30 * s), (L[0] - 26 * s, top - 64 * s)],
                [R, (R[0] + 18 * s, top - 30 * s), (R[0] + 26 * s, top - 64 * s)])
    if style == "punch":
        return ([L, (L[0] + 14 * s, top + 34 * s), (L[0] + 34 * s, top + 22 * s)],
                [R, (R[0] + 36 * s + sw, top + 8 * s), (R[0] + 74 * s + sw, top + 8 * s)])
    if style == "phone":
        return ([L, (L[0] - 4 * s, top + 40 * s), (L[0] + 4 * s, top + 66 * s)],
                [R, (R[0] + 8 * s, top + 34 * s), (R[0] - 10 * s, top + 4 * s)])
    # "down" (+ swing for walking)
    return ([L, (L[0] - 6 * s - sw * 0.5, top + 36 * s), (L[0] - 4 * s - sw, top + 66 * s)],
            [R, (R[0] + 6 * s + sw * 0.5, top + 36 * s), (R[0] + 4 * s + sw, top + 66 * s)])


def hero(c, spec, t, ground=GROUND):
    """Pictogram-style hero. spec: x, to_x, pose, arms, mood, scale, headband, look, phone, aura, color, on_stairs, ground."""
    s = spec.get("scale", 1.3)
    x = lerp(spec.get("x", 640), spec.get("to_x", spec.get("x", 640)), ease(t) if spec.get("ease", True) else t)
    pose = spec.get("pose", "stand")
    mood = spec.get("mood", "neutral")
    col = tuple(spec.get("color", BODY))
    look = spec.get("look", 0)
    gy = spec.get("ground", ground)
    if spec.get("on_stairs"):
        _, gy = stair_pos(x)
    tt = t * spec.get("dur", 4)
    arms = spec.get("arms", "phone" if spec.get("phone") else ("punch" if pose == "punch" else "down"))
    if spec.get("aura"):
        ac = tuple(spec["aura"])
        c.glow(lambda md: md.rounded_rectangle(c.box(x - 34 * s, gy - 150 * s, x + 34 * s, gy - 10 * s), radius=c.w(30 * s), fill=255), ac, radius=26 * s, strength=0.9)
    hx = hy = None
    if pose in ("stand", "walk", "run", "punch", "talk", "lean"):
        moving = pose in ("walk", "run")
        ph = tt * (11 if pose == "run" else 6) if moving else 0
        sw = math.sin(ph) * (26 if pose == "run" else 14) * s
        bob = abs(math.sin(ph)) * 3 * s if moving else 0
        lean = (8 * s if pose == "run" else 0) * (1 if spec.get("to_x", x) >= spec.get("x", x) else -1)
        hip_y = gy - 62 * s
        top = hip_y - 66 * s - bob
        hl, hr = (x - 11 * s, hip_y), (x + 11 * s, hip_y)
        if pose == "lean":  # cross-legged lean (row 3 of the reference)
            limb(c, hl, (x - 11 * s, gy - 6 * s), s, col)
            chain(c, [hr, (x + 26 * s, gy - 34 * s), (x - 4 * s, gy - 8 * s)], s, col)
        elif moving:
            chain(c, [hl, (x - 11 * s + sw * 0.6, hip_y + 32 * s), (x - 11 * s + sw, gy - 6 * s)], s, col)
            chain(c, [hr, (x + 11 * s - sw * 0.6, hip_y + 32 * s), (x + 11 * s - sw, gy - 6 * s)], s, col)
        else:
            wide = 8 * s if arms in ("hips", "crossed") else 0
            limb(c, hl, (x - 11 * s - wide, gy - 6 * s), s, col)
            limb(c, hr, (x + 11 * s + wide, gy - 6 * s), s, col)
        k = abs(math.sin(tt * 7)) * 30 * s if arms == "punch" else 0
        aL, aR = arms_for(arms, (x - 17 * s + lean, top + 10 * s), (x + 17 * s + lean, top + 10 * s), top, s, sw if moving else k, spec.get("phone"))
        back_first = arms in ("crossed",)
        if not back_first:
            chain(c, aL, s, col, 12)
        torso(c, x, top, s, col, tilt=lean)
        if not back_first:
            chain(c, aR, s, col, 12)
        else:
            chain(c, aL, s, col, 12)
            chain(c, aR, s, col, 12)
        hx, hy = x + lean, top - 22 * s
    elif pose == "sit":
        seat = gy - 50 * s
        top = seat - 66 * s
        chain(c, [(x, seat), (x + 40 * s, seat), (x + 42 * s, gy - 6 * s)], s, col)
        torso(c, x, top, s, col)
        aL, aR = arms_for(spec.get("arms", "phone" if spec.get("phone") else "knees"), (x - 17 * s, top + 10 * s), (x + 17 * s, top + 10 * s), top, s)
        if spec.get("arms", "knees") == "knees" and not spec.get("phone"):
            aR = [(x + 17 * s, top + 10 * s), (x + 24 * s, top + 40 * s), (x + 40 * s, seat - 6 * s)]
        chain(c, aR, s, col, 12)
        hx, hy = x + 2 * s, top - 22 * s
    elif pose == "slump":  # head down on desk
        top = gy - 112 * s
        chain(c, [(x, gy - 50 * s), (x + 30 * s, gy - 50 * s), (x + 32 * s, gy - 6 * s)], s, col)
        c.d.rounded_rectangle(c.box(x - 23 * s, top, x + 23 * s, gy - 46 * s), radius=c.w(14 * s), fill=col, outline=INK, width=c.w(2.5))
        chain(c, [(x + 10 * s, top + 12 * s), (x + 60 * s, top + 22 * s), (x + 90 * s, top + 20 * s)], s, col, 12)
        hx, hy = x + 42 * s, top + 4 * s
        mood = "tired" if mood == "neutral" else mood
    elif pose == "lie":  # in bed: head on pillow at x
        hx, hy = x, gy - 92 * s
    elif pose == "curl":  # sitting on floor hugging knees
        top = gy - 96 * s
        torso(c, x - 14 * s, top, s, col, h=72)
        chain(c, [(x - 6 * s, gy - 22 * s), (x + 30 * s, gy - 60 * s), (x + 34 * s, gy - 6 * s)], s, col)
        chain(c, [(x - 2 * s, top + 12 * s), (x + 22 * s, top + 40 * s), (x + 30 * s, top + 52 * s)], s, col, 12)
        hx, hy = x + 6 * s, top - 14 * s
        mood = "sad" if mood == "neutral" else mood
    elif pose == "pushup":
        k = (math.sin(tt * 5) + 1) / 2
        by = gy - 40 * s - k * 22 * s
        limb(c, (x - 60 * s, by + 4 * s), (x - 120 * s, gy - 6 * s), s, col)
        c.d.rounded_rectangle(c.box(x - 66 * s, by - 18 * s, x + 30 * s, by + 18 * s), radius=c.w(14 * s), fill=col, outline=INK, width=c.w(2.5))
        limb(c, (x + 18 * s, by), (x + 22 * s, gy - 6 * s), s, col, 12)
        hx, hy = x + 50 * s, by - 6 * s
    else:
        raise ValueError("unknown pose " + pose)
    head(c, hx, hy, s, col, mood, look)
    if spec.get("headband"):
        c.d.rectangle(c.box(hx - 18 * s, hy - 13 * s, hx + 18 * s, hy - 7 * s), fill=RED)
        c.d.line([c.p(hx - 18 * s, hy - 10 * s), c.p(hx - 38 * s, hy - 2 * s + math.sin(tt * 8) * 4 * s)], fill=RED, width=c.w(5 * s))
    if spec.get("phone"):
        c.glow(lambda md: md.ellipse(c.box(hx - 30 * s, hy - 24 * s, hx + 30 * s, hy + 30 * s), fill=255), (110, 160, 255), radius=18 * s, strength=0.5)


def shadow(c, spec, t):
    s = spec.get("scale", 1.25)
    x = lerp(spec.get("x", 900), spec.get("to_x", spec.get("x", 900)), ease(t))
    gy = spec.get("ground", GROUND)
    a = ease(min(1, t * 3)) if spec.get("fade_in", True) else 1
    top = gy - 175 * s
    shape = lambda md: (md.rounded_rectangle(c.box(x - 36 * s, top, x + 36 * s, gy - 50 * s), radius=c.w(36 * s), fill=255),
                        md.line([c.p(x - 15 * s, gy - 55 * s), c.p(x - 18 * s, gy)], fill=255, width=c.w(16 * s)),
                        md.line([c.p(x + 15 * s, gy - 55 * s), c.p(x + 18 * s, gy)], fill=255, width=c.w(16 * s)))
    pulse = 0.85 + 0.15 * math.sin(t * spec.get("dur", 4) * 3)
    c.glow(shape, RED, radius=16, strength=1.2 * a * pulse)
    mask = Image.new("L", c.img.size, 0)
    shape(ImageDraw.Draw(mask))
    if a < 1:
        mask = mask.point(lambda v: int(v * a))
    c.img = Image.composite(Image.new("RGB", c.img.size, (6, 6, 8)), c.img, mask)
    c.d = ImageDraw.Draw(c.img)
    if spec.get("eyes", True):
        ey = top + 40 * s
        for sx in (-1, 1):
            c.d.arc(c.box(x + sx * 14 * s - 10 * s, ey - 6 * s, x + sx * 14 * s + 10 * s, ey + 6 * s), 200 if sx < 0 else 200, 340, fill=mix((6, 6, 8), (255, 60, 60), a), width=c.w(3.5 * s))
    return x, top


# ---------------------------------------------------------------- overlays
def wrap(s, n):
    words, lines, cur = s.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > n and cur:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur:
        lines.append(cur)
    return lines


def caption(c, s, t, pos="top", size=24, color=(240, 240, 240), dur=4, y_off=0):
    if not s:
        return
    a = min(ease(t * dur / 0.5), ease((1 - t) * dur / 0.4))
    y = {"top": 90, "bottom": 650, "center": 340}[pos] + y_off
    for i, line in enumerate(wrap(s, 48)):
        c.text((640, y + i * size * 1.45), line, size, tuple(color), alpha=a)


def whisper(c, s, t, xy, dur=4, size=26):
    """Red typewriter text from the shadow."""
    if not s:
        return
    n = int(len(s) * ease(t * dur / max(0.6, len(s) * 0.06)))
    a = ease((1 - t) * dur / 0.4)
    c.glow(lambda md: md.text(c.p(*xy), s[:n], font=font(size * c.k, False), fill=255, anchor="mm"), RED, radius=6, strength=0.6 * a)
    c.text(xy, s[:n], size, (255, 70, 70), bold=False, alpha=a)


def day_label(c, s, big=False):
    if not s:
        return
    if big:
        c.text((640, 120), s, 54, (245, 245, 245))
    else:
        c.text((40, 40), s, 15, (200, 200, 205), anchor="lm")


def meter(c, spec, t):
    v = lerp(spec.get("from", 100), spec.get("to", spec.get("from", 100)), ease(t))
    label = spec.get("label", "MOTIVATION")
    x0, x1, y = 470, 810, 72
    c.text((x0 - 12, y), label, 13, (230, 230, 230), anchor="rm")
    c.d.rounded_rectangle(c.box(x0, y - 8, x1, y + 8), radius=c.w(8), outline=(200, 200, 200), width=c.w(2))
    if v > 0.5:
        col = mix((230, 70, 50), (255, 185, 60), min(1, v / 60))
        c.d.rounded_rectangle(c.box(x0 + 3, y - 5, x0 + 3 + (x1 - x0 - 6) * v / 100, y + 5), radius=c.w(5), fill=col)
    c.text((x1 + 12, y), f"{int(round(v))}%", 13, (255, 190, 80) if v > 10 else (230, 80, 70), anchor="lm")


def bubble(c, s, xy, t, dur=4):
    if not s:
        return
    a = ease(t * dur / 0.3)
    if a < 0.05:
        return
    lines = wrap(s, 26)
    w = max(len(l) for l in lines) * 9.5 + 30
    h = len(lines) * 22 + 18
    x, y = xy
    c.d.rounded_rectangle(c.box(x - w / 2, y - h, x + w / 2, y), radius=c.w(10), fill=(250, 250, 250), outline=INK, width=c.w(2))
    c.d.polygon([c.p(x - 8, y - 1), c.p(x + 8, y - 1), c.p(x - 4, y + 14)], fill=(250, 250, 250))
    for i, l in enumerate(lines):
        c.text((x, y - h + 20 + i * 22), l, 15, INK, bold=False)


def title_card(c, spec, t, dur):
    word = spec["title"]
    n = max(1, int(len(word) * ease(t * dur / 1.2)))
    c.text((640, 320), word[:n], 92, (245, 245, 245))
    if n == len(word):
        k = ease((t * dur - 1.2) / 0.6)
        pts = [c.p(400 + i * 4, 382 + 4 * math.sin(i * 0.5)) for i in range(int(120 * k))]
        if len(pts) > 1:
            c.d.line(pts, fill=RED, width=c.w(5))
        if spec.get("sub"):
            c.text((640, 430), spec["sub"], 26, (220, 220, 220), bold=False, alpha=ease((t * dur - 2.0) / 0.6))
        if spec.get("punch"):
            c.text((640, 475), spec["punch"], 30, RED, alpha=ease((t * dur - 3.0) / 0.6))


def graph(c, spec, t):
    x0, y0, x1, y1 = 220, 140, 1060, 560
    c.d.line([c.p(x0, y0), c.p(x0, y1), c.p(x1, y1)], fill=(170, 170, 170), width=c.w(2))
    c.d.line([c.p(x0, y0 + 30), c.p(x1, y0 + 30)], fill=(220, 170, 80), width=c.w(1))
    c.text((x0 + 10, y0 + 12), spec.get("goal", "GOAL"), 16, (255, 190, 80), anchor="lm")
    k = ease(t * 1.4)
    spikes = []
    for i in range(int(400 * k)):
        u = i / 400
        v = sum(math.exp(-((u - p) / 0.03) ** 2) * hgt for p, hgt in ((0.1, 1.0), (0.32, 0.6), (0.55, 0.3)))
        spikes.append(c.p(lerp(x0, x1, u), y1 - v * (y1 - y0 - 60)))
    if len(spikes) > 1:
        c.d.line(spikes, fill=(240, 130, 40), width=c.w(3))
    c.text((x0 + 150, y0 + 90), spec.get("a", "MOTIVATION"), 16, (240, 130, 40))
    k2 = ease(t * 1.6 - 0.5)
    if k2 > 0:
        st = []
        for i in range(int(40 * k2) + 1):
            u = i / 40
            st += [c.p(lerp(x0, x1, u), y1 - u * (y1 - y0 - 30)), c.p(lerp(x0, x1, u + 1 / 40), y1 - u * (y1 - y0 - 30))]
        c.d.line(st, fill=(250, 250, 250), width=c.w(3))
        c.text((x0 + 600, y0 + 230), spec.get("b", "DISCIPLINE"), 18, (250, 250, 250))


# ---------------------------------------------------------------- scenes
def render_frame(scene, t, W, H, rng_t):
    dur = scene["duration"]
    pal = PALETTES[scene.get("palette", "night")]
    c = Ctx(W, H)
    background(c, pal)
    st = scene.get("set", "empty")
    clock_txt = scene.get("clock")
    ring = abs(math.sin(rng_t * 12)) if scene.get("alarm") else 0
    if st == "bedroom":
        window(c, 900, 90, scene.get("sky", "night"))
        floor(c, pal)
        bed(c, scene.get("bed_x", 330), clock_txt, ring)
    elif st == "couch":
        floor(c, pal)
        couch(c, scene.get("couch_x", 560))
    elif st == "desk":
        floor(c, pal)
        desk(c, scene.get("desk_x", 760))
    elif st == "mirror":
        floor(c, pal)
        mirror(c, scene.get("mirror_x", 760), scene.get("cracked", False))
    elif st == "gym":
        floor(c, pal)
        punching_bag(c, scene.get("bag_x", 820), (rng_t * 7) % 1)
    elif st == "city":
        city(c, t, pal, seed=scene.get("seed", 3))
    elif st == "stairs":
        stairs(c, pal)
    elif st == "hill":
        hill(c, pal)
    elif st == "street_rain":
        bus_stop(c)
        floor(c, pal)
    elif st == "clock_closeup":
        clock(c, 640, 360, clock_txt or "5:00", big=True, ring=ring)
    elif st == "spotlight":
        floor(c, pal)
        c.glow(lambda md: md.polygon([c.p(600, 0), c.p(680, 0), c.p(760, GROUND), c.p(520, GROUND)], fill=255), (255, 255, 255), radius=30, strength=0.18)
    elif st in ("title", "graph", "black", "empty"):
        if st == "empty":
            floor(c, pal)
    for p in scene.get("props", []):
        kind = p["type"]
        if kind == "window": window(c, p.get("x", 900), p.get("y", 90), p.get("sky", "night"))
        elif kind == "clock": clock(c, p.get("x", 255), p.get("y", GROUND - 88), p.get("text", "5:00"), ring=ring)
        elif kind == "desk": desk(c, p.get("x", 760))
        elif kind == "couch": couch(c, p.get("x", 560))
        elif kind == "mirror": mirror(c, p.get("x", 760), p.get("cracked", False))
        elif kind == "bag": punching_bag(c, p.get("x", 820), (rng_t * 7) % 1)
        elif kind == "sign":
            x, y = p.get("x", 220), p.get("y", 250)
            c.d.rounded_rectangle(c.box(x - 70, y - 40, x + 70, y + 40), radius=c.w(8), fill=(200, 45, 45), outline=(240, 240, 240), width=c.w(2))
            for i, l in enumerate(wrap(p.get("text", "NO EXCUSES"), 10)):
                c.text((x, y - 12 + i * 24), l, 18, (255, 255, 255))
    heroes = scene.get("hero")
    heroes = heroes if isinstance(heroes, list) else ([heroes] if heroes else [])
    sh = scene.get("shadow")
    sh_xy = None
    if sh and sh.get("behind", True):
        sh["dur"] = dur
        sh_xy = shadow(c, sh, t)
    for h in heroes:
        h["dur"] = dur
        hero(c, h, t)
    if st == "bedroom" and scene.get("blanket", True):
        blanket(c, scene.get("bed_x", 330), lump=any(h.get("pose") == "lie" for h in heroes))
    if sh and not sh.get("behind", True):
        sh["dur"] = dur
        sh_xy = shadow(c, sh, t)
    if scene.get("rain") or st == "street_rain":
        rain(c, rng_t)
    if scene.get("sparks"):
        sparks(c, rng_t)
    if st == "title":
        title_card(c, scene, t, dur)
    if st == "graph":
        graph(c, scene, t)
    if scene.get("meter"):
        meter(c, scene["meter"], t)
    day_label(c, scene.get("day"), scene.get("day_big", False))
    if scene.get("big_text"):
        c.text((640, 300), scene["big_text"], 80, (245, 245, 245), alpha=ease(t * dur / 0.3))
    if scene.get("whisper"):
        wxy = scene.get("whisper_xy") or ((sh_xy[0], sh_xy[1] - 30) if sh_xy else (640, 150))
        whisper(c, scene["whisper"], t, wxy, dur, scene.get("whisper_size", 26))
    if scene.get("bubble"):
        b = scene["bubble"]
        bubble(c, b["text"], (b.get("x", 640), b.get("y", 300)), t, dur)
    caption(c, scene.get("caption"), t, scene.get("caption_pos", "top"), dur=dur, y_off=40 if scene.get("meter") else 0)
    # camera zoom
    z = lerp(scene.get("zoom", [1, 1])[0], scene.get("zoom", [1, 1])[1], ease(t)) if isinstance(scene.get("zoom"), list) else scene.get("zoom", 1)
    img = c.img
    if z != 1:
        fx, fy = scene.get("focus", [640, 360])
        Wp, Hp = img.size
        cw, ch = Wp / z, Hp / z
        cx, cy = fx * c.k, fy * c.k
        x0 = min(max(0, cx - cw / 2), Wp - cw)
        y0 = min(max(0, cy - ch / 2), Hp - ch)
        img = img.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch)))
    img = img.resize((W, H), Image.LANCZOS)
    # vignette + fades
    fi, fo = scene.get("fade_in", 0.35), scene.get("fade_out", 0.35)
    tt = t * dur
    f = min(1.0, tt / fi if fi > 0 else 1, (dur - tt) / fo if fo > 0 else 1)
    arr = np.asarray(img).astype(np.float32)
    arr *= VIGNETTE(W, H)[..., None] * max(0.0, f)
    if scene.get("flash"):
        arr += 255 * max(0, 1 - tt / 0.25)
    if scene.get("grain", True):
        arr += np.random.default_rng(int(rng_t * 1000)).normal(0, 3, arr.shape[:2])[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


_vig = {}


def VIGNETTE(W, H):
    if (W, H) not in _vig:
        y, x = np.ogrid[-1:1:H * 1j, -1:1:W * 1j]
        _vig[(W, H)] = (1 - 0.35 * np.clip((x ** 2 + y ** 2) / 1.6, 0, 1)).astype(np.float32)
    return _vig[(W, H)]


# ---------------------------------------------------------------- audio
SR = 44100


def score(scenes, total):
    """Generated ambient score: a minor pad that warms when palettes warm, plus SFX."""
    n = int(total * SR)
    out = np.zeros(n, np.float32)
    tvec = np.arange(n) / SR
    t0 = 0
    for sc in scenes:
        d = sc["duration"]
        a, b = int(t0 * SR), int(min(total, t0 + d) * SR)
        seg = tvec[a:b]
        mood = sc.get("music", "dark" if sc.get("palette", "night") in ("night", "cold", "black") else "warm")
        root = {"dark": 55.0, "tense": 51.9, "warm": 65.4, "hope": 73.4, "silent": 0}[mood]
        if root:
            chord = [1, 1.189, 1.498] if mood in ("dark", "tense") else [1, 1.26, 1.498, 2]
            pad = sum(np.sin(2 * np.pi * root * r * k * seg + k) / (k * 1.5) for r in chord for k in (1, 2, 4))
            lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * seg)
            out[a:b] += 0.05 * pad * lfo
            if mood in ("warm", "hope"):  # soft piano-ish plucks
                for i, bt in enumerate(np.arange(0, d, 0.75)):
                    s = int((t0 + bt) * SR)
                    L = int(1.2 * SR)
                    if s + L < n:
                        f = root * 4 * [1, 1.26, 1.498, 2, 1.498, 1.26][i % 6]
                        e = np.exp(-np.arange(L) / SR * 3)
                        out[s:s + L] += 0.06 * np.sin(2 * np.pi * f * np.arange(L) / SR) * e
        for sfx in sc.get("sfx", []) + (["alarm"] if sc.get("alarm") else []):
            name, at = (sfx, 0.1) if isinstance(sfx, str) else (sfx["name"], sfx.get("at", 0))
            s = int((t0 + at) * SR)
            if name == "alarm":
                for k in range(int(min(d, 2.5) / 0.5)):
                    ss, L = s + int(k * 0.5 * SR), int(0.18 * SR)
                    if ss + L < n:
                        out[ss:ss + L] += 0.18 * np.sign(np.sin(2 * np.pi * 1000 * np.arange(L) / SR))
            elif name in ("hit", "boom", "whoosh"):
                L = int({"hit": 0.25, "boom": 1.6, "whoosh": 0.6}[name] * SR)
                if s + L < n:
                    tt = np.arange(L) / SR
                    if name == "hit":
                        sig = np.random.default_rng(1).normal(0, 1, L) * np.exp(-tt * 25) * 0.4 + np.sin(2 * np.pi * 80 * tt) * np.exp(-tt * 12) * 0.5
                    elif name == "boom":
                        sig = np.sin(2 * np.pi * (45 - 15 * tt) * tt) * np.exp(-tt * 2.2) * 0.6
                    else:
                        sig = np.random.default_rng(2).normal(0, 1, L) * np.sin(np.pi * tt / tt[-1]) * 0.15
                    out[s:s + L] += sig.astype(np.float32)
        t0 += d
    # fade edges, normalise
    f = int(1.5 * SR)
    out[:f] *= np.linspace(0, 1, f)
    out[-f:] *= np.linspace(1, 0, f)
    return out / max(1e-6, np.abs(out).max()) * 0.6


def write_wav(path, x):
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("story")
    ap.add_argument("-o", "--out", default="film.mp4")
    ap.add_argument("--res", type=int, default=720, help="720 or 1080 (16:9)")
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--voice", help="voiceover audio to lay over the score")
    ap.add_argument("--music", help="replace generated score with your own track")
    ap.add_argument("--music_db", type=float, default=-14, help="score level under voice")
    ap.add_argument("--preview", action="store_true", help="half res, 12 fps")
    ap.add_argument("--sheet", help="write a contact sheet (middle frame of each scene) and exit")
    ap.add_argument("--only", help="comma list of scene indexes to render")
    a = ap.parse_args()
    story = json.load(open(a.story))
    scenes = story["scenes"]
    if a.only:
        keep = {int(i) for i in a.only.split(",")}
        scenes = [s for i, s in enumerate(scenes) if i in keep]
    H = 360 if a.preview else a.res
    W = H * 16 // 9
    fps = 12 if a.preview else a.fps

    if a.sheet:
        thumbs = []
        for i, sc in enumerate(scenes):
            im = render_frame(sc, 0.6, 640, 360, sc["duration"] * 0.6)
            ImageDraw.Draw(im).text((8, 340), f"#{i}", fill=(255, 255, 0), font=font(16))
            thumbs.append(im)
        cols = 4
        rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (640 * cols, 360 * rows))
        for i, im in enumerate(thumbs):
            sheet.paste(im, ((i % cols) * 640, (i // cols) * 360))
        sheet.save(a.sheet, quality=85)
        print("sheet ->", a.sheet)
        return

    total = sum(s["duration"] for s in scenes)
    tmp = tempfile.mkdtemp()
    vid = os.path.join(tmp, "v.mp4")
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", vid], stdin=subprocess.PIPE)
    gt = 0.0
    for i, sc in enumerate(scenes):
        nf = max(1, int(round(sc["duration"] * fps)))
        for f in range(nf):
            t = f / max(1, nf - 1)
            ff.stdin.write(render_frame(sc, t, W, H, gt + f / fps).tobytes())
        gt += sc["duration"]
        print(f"scene {i + 1}/{len(scenes)} done", flush=True)
    ff.stdin.close()
    ff.wait()

    music = os.path.join(tmp, "m.wav")
    if a.music:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", a.music, "-t", str(total), "-ac", "1", "-ar", str(SR), music], check=True)
    else:
        write_wav(music, score(scenes, total))
    if a.voice:
        cmd = ["ffmpeg", "-y", "-v", "error", "-i", vid, "-i", music, "-i", a.voice, "-filter_complex",
               f"[1:a]volume={a.music_db}dB[m];[2:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16[a]",
               "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", a.out]
    else:
        cmd = ["ffmpeg", "-y", "-v", "error", "-i", vid, "-i", music, "-af", "loudnorm=I=-18", "-map", "0:v", "-map", "1:a",
               "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", a.out]
    subprocess.run(cmd, check=True)
    print("done ->", a.out, f"({total:.1f}s)")


if __name__ == "__main__":
    main()

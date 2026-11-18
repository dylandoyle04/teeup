"""Builds App Store screenshots (1290 x 2796, the 6.9"/6.7" iPhone slot) from
raw phone screenshots: brand-green background, gold kicker, serif headline,
and the screenshot in a phone frame.

    python3 scripts/make-store-screenshots.py <raw-dir> <out-dir>

Edit SHOTS below to change files, order or copy.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAW, OUT = sys.argv[1], sys.argv[2]
W, H = 1290, 2796
FONTS = os.path.join(os.path.dirname(__file__), '..', 'mobile', 'node_modules', '@expo-google-fonts')
SERIF = os.path.join(FONTS, 'cormorant-garamond', '700Bold', 'CormorantGaramond_700Bold.ttf')
SANS = os.path.join(FONTS, 'poppins', '600SemiBold', 'Poppins_600SemiBold.ttf')
GOLD = (212, 175, 55)
STATUS_BAR = 150  # px cropped off the top of 1179x2556 phone screenshots

# (file, kicker, headline, kind)
SHOTS = [
    ('IMG_4328.PNG', 'GOLF TRIPS MADE EASY', 'Plan the trip.\nKeep score together.', 'phone'),
    ('IMG_4330.PNG', 'FIND TRIPS NEAR YOU', 'Top golf trips,\nsorted by distance', 'phone'),
    ('IMG_4331.PNG', '11 DESTINATIONS · 70+ COURSES', 'Hand-picked courses\nand where to stay', 'phone'),
    ('IMG_4332.PNG', 'ONE PHONE, WHOLE GROUP', 'Fast hole-by-hole\nscoring', 'phone'),
    ('IMG_4334.PNG', 'THE CUP', 'Your trip-long\nteam showdown', 'phone'),
    ('IMG_4336.PNG', 'SHARE THE RESULTS', 'Send the scorecard\nto the group chat', 'card'),
]


def background():
    top, bottom = (18, 67, 47), (6, 23, 15)
    bg = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(bg)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))
    # soft glow behind the headline
    glow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(glow).ellipse([W * 0.1, -300, W * 0.9, 900], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    return Image.composite(Image.new('RGB', (W, H), (40, 110, 75)), bg, glow)


def text_block(img, kicker, headline):
    d = ImageDraw.Draw(img)
    kf = ImageFont.truetype(SANS, 40)
    spaced = ' '.join(kicker)  # letter-spaced caps
    kw = d.textlength(spaced, font=kf)
    d.text(((W - kw) / 2, 170), spaced, font=kf, fill=GOLD)
    hf = ImageFont.truetype(SERIF, 122)
    y = 245
    for line in headline.split('\n'):
        lw = d.textlength(line, font=hf)
        d.text(((W - lw) / 2, y), line, font=hf, fill=(255, 255, 255))
        y += 132
    return y


def rounded(im, r):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=r, fill=255)
    out = im.convert('RGBA')
    out.putalpha(m)
    return out


def shadow(size, r, blur=40, alpha=150):
    s = Image.new('RGBA', (size[0] + blur * 4, size[1] + blur * 4), (0, 0, 0, 0))
    ImageDraw.Draw(s).rounded_rectangle([blur * 2, blur * 2, blur * 2 + size[0], blur * 2 + size[1]], radius=r, fill=(0, 0, 0, alpha))
    return s.filter(ImageFilter.GaussianBlur(blur))


def phone(img, shot, top):
    screen = shot.crop((0, STATUS_BAR, shot.width, shot.height))
    sw = 1010
    screen = screen.resize((sw, round(screen.height * sw / screen.width)), Image.LANCZOS)
    bezel = 26
    fw, fh = sw + bezel * 2, screen.height + bezel * 2
    x = (W - fw) // 2
    sh = shadow((fw, fh), 120)
    img.alpha_composite(sh, (x - 80, top - 80 + 30))
    frame = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle([0, 0, fw - 1, fh - 1], radius=120, fill=(17, 20, 18, 255))
    frame.alpha_composite(rounded(screen, 96), (bezel, bezel))
    img.alpha_composite(frame, (x, top))


def card(img, shot, top):
    cw = 1130
    c = shot.convert('RGBA').resize((cw, round(shot.height * cw / shot.width)), Image.LANCZOS)
    c = rounded(c, 56)
    x = (W - cw) // 2
    pill_h, gap = 86, 60
    # centre the pill + card in the space under the headline
    y = top + (H - top - (pill_h + gap + c.height)) // 2 + pill_h + gap
    # a "sent to the group chat" pill above the card
    d = ImageDraw.Draw(img)
    pf = ImageFont.truetype(SANS, 38)
    label = 'Sent to Golf Crew'
    lw = d.textlength(label, font=pf)
    px, py = (W - lw) / 2 - 40, y - gap - pill_h
    d.rounded_rectangle([px, py, px + lw + 80, py + pill_h], radius=pill_h // 2, fill=(30, 92, 64, 255))
    d.text((px + 40, py + 18), label, font=pf, fill=(236, 242, 238, 255))
    img.alpha_composite(shadow(c.size, 56), (x - 80, y - 80 + 30))
    img.alpha_composite(c, (x, y))


os.makedirs(OUT, exist_ok=True)
for i, (name, kicker, headline, kind) in enumerate(SHOTS, 1):
    img = background().convert('RGBA')
    below = text_block(img, kicker, headline)
    shot = Image.open(os.path.join(RAW, name))
    (phone if kind == 'phone' else card)(img, shot, below + 70)
    path = os.path.join(OUT, f'{i:02d}-{name.split(".")[0]}.png')
    img.convert('RGB').save(path, optimize=True)
    print('wrote', path)

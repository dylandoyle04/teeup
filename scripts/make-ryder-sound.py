"""Synthesizes the Ryder Cup page sound: a putt rattling into the cup, then a
crowd roar with applause and a whistle. Fully synthetic, so no licensing.

    python3 scripts/make-ryder-sound.py   # writes public/sounds/ryder-cheer.m4a
                                          # and mobile/assets/sounds/ryder-cheer.m4a
"""
import os
import shutil
import subprocess
import tempfile

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
DUR = 3.6
rng = np.random.default_rng(7)
t = np.arange(int(SR * DUR)) / SR
out = np.zeros_like(t)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def env(points):
    """Piecewise-linear envelope from (time, level) points."""
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)


def place(sig, start):
    i = int(start * SR)
    n = min(len(sig), len(out) - i)
    out[i:i + n] += sig[:n]


# 1) ball drops in the cup: a soft thunk + bright, fast-decaying clinks
for k, (when, amp) in enumerate([(0.00, 1.0), (0.085, 0.55), (0.14, 0.3)]):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    clink = sum(np.sin(2 * np.pi * f * (1 + 0.01 * k) * tt) * a
                for f, a in [(2150, 1.0), (3420, 0.6), (5230, 0.35), (7400, 0.15)])
    clink *= np.exp(-tt / 0.035) * amp * 0.35
    thunk = np.sin(2 * np.pi * 170 * tt) * np.exp(-tt / 0.03) * amp * 0.5
    place(clink + thunk, when)

# 2) crowd roar: band-limited noise, many slow overlapping voices
roar = np.zeros_like(t)
for _ in range(14):
    lo = rng.uniform(250, 500)
    voice = bandpass(rng.standard_normal(len(t)), lo, lo * rng.uniform(3, 5))
    wobble = 0.6 + 0.4 * np.sin(2 * np.pi * rng.uniform(0.6, 2.2) * t + rng.uniform(0, 6.28))
    roar += voice * wobble
# vowel-ish formant colour ("ohhh!")
roar += 0.5 * bandpass(rng.standard_normal(len(t)), 600, 900)
roar /= np.abs(roar).max()
out += roar * env([(0, 0), (0.3, 0), (0.75, 0.55), (1.0, 0.75), (2.1, 0.62), (DUR - 0.15, 0.0), (DUR, 0)])

# 3) applause: lots of individual clappers with jittered timing
claps = np.zeros_like(t)
burst_n = int(0.02 * SR)
bt = np.arange(burst_n) / SR
for _ in range(45):
    rate = rng.uniform(3.8, 5.6)
    when = rng.uniform(0.45, 0.8)
    centre = rng.uniform(1200, 3200)
    while when < DUR - 0.2:
        burst = bandpass(rng.standard_normal(burst_n), centre * 0.6, centre * 1.6) * np.exp(-bt / 0.006)
        i = int(when * SR)
        n = min(burst_n, len(t) - i)
        claps[i:i + n] += burst[:n] * rng.uniform(0.5, 1.0)
        when += 1 / rate + rng.normal(0, 0.012)
claps /= np.abs(claps).max()
out += claps * env([(0, 0), (0.45, 0), (0.9, 0.5), (2.2, 0.42), (DUR - 0.1, 0.0), (DUR, 0)])

# 4) a fan's two-note whistle
for start, f0, f1, length in [(0.95, 2400, 2900, 0.35), (1.38, 2350, 2050, 0.45)]:
    n = int(length * SR)
    tt = np.arange(n) / SR
    f = np.linspace(f0, f1, n) + 25 * np.sin(2 * np.pi * 7 * tt)
    w = np.sin(2 * np.pi * np.cumsum(f) / SR)
    w *= np.minimum(1, tt / 0.04) * np.minimum(1, (length - tt) / 0.08) * 0.12
    place(w, start)

out /= np.abs(out).max() / 0.89

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with tempfile.TemporaryDirectory() as tmp:
    wav = os.path.join(tmp, 'ryder-cheer.wav')
    wavfile.write(wav, SR, (out * 32767).astype(np.int16))
    m4a = os.path.join(root, 'public/sounds/ryder-cheer.m4a')
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '96000', wav, m4a], check=True)
    shutil.copy(m4a, os.path.join(root, 'mobile/assets/sounds/ryder-cheer.m4a'))
    print('wrote', m4a)

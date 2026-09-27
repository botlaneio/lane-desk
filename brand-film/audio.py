"""Synthesize the sound bed from the film's own cue list, then plot it.

    python3 render.py --cues out/cues.json
    python3 audio.py out/cues.json out/bed.wav out/waveform.png

Every sound is generated here (numpy/scipy); no samples or external audio are used.
"""
import json
import struct
import sys
import zlib

import numpy as np
from scipy import signal

SR = 48000
DUR = 15.0
rng = np.random.default_rng(7)


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(d, 1e-4))


def noise(n):
    return rng.standard_normal(n)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def glide(f0, f1, dur, curve=6.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * curve / dur * 3)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def sub(f0, f1, dur, decay):
    x = glide(f0, f1, dur)
    return x * env(len(x), 0.002, decay)


def click(n_ms=10, f=2500):
    n = int(n_ms / 1000 * SR)
    return hp(noise(n), f) * env(n, 0.0005, n_ms / 4000)


def sweep_noise(dur, f_lo, f_hi, rise=True):
    """Noise whose band moves from f_lo to f_hi (or back) across dur, faked with a crossfade."""
    n = int(dur * SR)
    a = bp(noise(n), f_lo * 0.7, f_lo * 1.4)
    b = bp(noise(n), f_hi * 0.7, min(f_hi * 1.4, SR / 2 - 100))
    s = np.linspace(0, 1, n) if rise else np.linspace(1, 0, n)
    return a * (1 - s) + b * s


# ------------------------------------------------------------------ sounds
def s_slam(p, d):
    x = sub(140, 46, 0.9, 0.42) * 1.0
    body = lp(noise(int(0.18 * SR)), 500) * env(int(0.18 * SR), 0.001, 0.05) * 0.6
    return mix(x, body, click(14, 1800) * 0.5)


def s_thud(p, d):
    return mix(sub(110 * p, 60 * p, 0.35, 0.12), lp(noise(int(0.1 * SR)), 300) * env(int(0.1 * SR), 0.001, 0.03) * 0.4)


def s_tick(p, d):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return mix(np.sin(2 * np.pi * 1700 * p * t) * env(n, 0.0005, 0.012) * 0.6, click(4, 3000) * 0.3)


def s_creak(p, d):
    x = glide(260, 520, 0.12, 1.0)
    return x * np.sin(np.linspace(0, np.pi, len(x))) * 0.35


def s_pop(p, d):
    x = glide(1000 * p, 280 * p, 0.07, 2.0)
    return mix(x * env(len(x), 0.0005, 0.03), click(5, 2500) * 0.4)


def s_whoosh(p, d):
    d = d or 0.6
    x = sweep_noise(d, 400, 2600)
    e = np.sin(np.linspace(0, np.pi, len(x))) ** 2
    return x * e * 0.6


def s_whip(p, d):
    x = sweep_noise(0.3, 900, 5200)
    e = np.sin(np.linspace(0, np.pi, len(x))) ** 3
    return x * e * 0.8


def s_marker(p, d):
    d = d or 0.25
    n = int(d * SR)
    x = bp(noise(n), 1800, 7000)
    am = 0.55 + 0.45 * np.abs(np.sin(np.cumsum(28 + 18 * rng.random(n)) * 2 * np.pi / SR))
    e = np.minimum(1, np.arange(n) / (0.01 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.02 * SR))
    return x * am * e * 0.45


def s_land(p, d):
    return mix(sub(120, 52, 0.6, 0.2), lp(noise(int(0.12 * SR)), 400) * env(int(0.12 * SR), 0.001, 0.04) * 0.7)


def s_roll(p, d):
    n = int((d or 0.8) * SR)
    x = lp(noise(n), 220) * 2.2
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return x * e * 0.4


def s_pluck(p, d):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 196 * p
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    return x * env(n, 0.001, 0.12) * 0.32


def s_knock(p, d):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 190 * p * t) * 0.6 + bp(noise(n), 700, 1400) * 0.5) * env(n, 0.0005, 0.025)


def s_click(p, d):
    a = click(6, 2800)
    gap = np.zeros(int(0.018 * SR))
    b = click(5, 3600) * 0.7
    n = int(0.04 * SR)
    tone = np.sin(2 * np.pi * 3200 * np.arange(n) / SR) * env(n, 0.0003, 0.006) * 0.4
    return mix(np.concatenate([a, gap, b]), tone)


def s_stamp(p, d):
    return mix(
        sub(160 * p, 70 * p, 0.5, 0.16) * 1.1,
        lp(noise(int(0.14 * SR)), 1100) * env(int(0.14 * SR), 0.0005, 0.035) * 0.9,
        click(8, 1500) * 0.6,
    )


def s_riser(p, d):
    d = d or 0.45
    x = sweep_noise(d, 300, 4000) * 0.6
    tone = glide(90, 380, d, 0.2) * 0.25
    n = min(len(x), len(tone))
    e = np.linspace(0, 1, n) ** 2.4
    return (x[:n] + tone[:n]) * e


def s_drop(p, d):
    return mix(
        sub(90, 38, 1.6, 0.6) * 1.2,
        lp(noise(int(0.35 * SR)), 180) * env(int(0.35 * SR), 0.001, 0.12) * 1.1,
        click(18, 1200) * 0.5,
    )


def s_type(p, d):
    n = int((d or 0.4) * SR)
    out = np.zeros(n)
    for i in range(0, n, int(0.034 * SR)):
        c = click(3, 2600 + 800 * rng.random()) * (0.5 + 0.4 * rng.random())
        out[i : i + len(c)] += c[: n - i]
    return out * 0.6


def s_reverse(p, d):
    d = d or 0.35
    x = sweep_noise(d, 500, 6000)
    e = np.linspace(0, 1, len(x)) ** 3
    return x * e * 0.8


def s_light(p, d):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * 880 * t) + 0.6 * np.sin(2 * np.pi * 1318.5 * t) + 0.4 * np.sin(2 * np.pi * 1760 * t)) * env(n, 0.001, 0.18)
    air = hp(noise(n), 5000) * env(n, 0.001, 0.08)
    return mix(tone * 0.32, air * 0.5, sub(100, 55, 0.5, 0.15) * 0.8)


def s_swell(p, d):
    d = d or 0.7
    n = int(d * SR)
    x = lp(noise(n), 900) * 0.8 + glide(55, 110, d, 0.1)[:n] * 0.4
    return x * np.linspace(0, 1, n) ** 2


def s_resolve(p, d):
    n = int(2.9 * SR)
    t = np.arange(n) / SR
    chord = [110.0, 164.81, 220.0, 277.18, 329.63, 440.0]
    x = sum(np.sin(2 * np.pi * f * t + i) * (0.9 ** i) for i, f in enumerate(chord))
    x = lp(x, 1800) * np.minimum(1, t / 0.03) * np.exp(-t / 1.1) * 0.22
    return mix(x, sub(80, 44, 1.4, 0.5) * 0.9)


SOUNDS = {k[2:]: v for k, v in globals().items() if k.startswith("s_")}


def mix(*xs):
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[: len(x)] += x
    return out


def place(bus, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= bus.shape[1]:
        return
    x = x[: bus.shape[1] - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[0, i : i + len(x)] += x * l * 1.414
    bus[1, i : i + len(x)] += x * r * 1.414


def drone(n):
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 55 * t) * 0.5 + np.sin(2 * np.pi * 82.41 * t + 1) * 0.25 + lp(noise(n), 160) * 0.5
    e = np.clip(t / 0.4, 0, 1) * np.clip((11.9 - t) / 0.6, 0, 1)
    dark = ((t > 7.0) & (t < 9.28)).astype(float)
    dark = lp(dark, 8)  # soften the switch
    x = x * (1 - 0.35 * dark) + np.sin(2 * np.pi * 41.2 * t) * 0.45 * dark
    return x * e * 0.11


# the reverse swell must END on its event, so it is placed early
ENDS_ON_EVENT = {"reverse"}
PANS = {"whoosh": 0.3, "whip": -0.4, "tick": 0.1, "marker": -0.15, "pluck": 0.0, "roll": 0.2}


def build(cues):
    n = int(DUR * SR)
    bus = np.zeros((2, n))
    place(bus, drone(n), 0.0, 1.0, 0.0)
    for c in cues:
        k, t, g = c["k"], c["t"], c.get("g", 1.0)
        x = SOUNDS[k](c.get("p", 1.0), c.get("d"))
        if k in ENDS_ON_EVENT:
            t = t + (c.get("d") or 0.35) - len(x) / SR
        place(bus, x, t, g, PANS.get(k, 0.0))
    # glue: gentle soft clip, then leave the last 0.35s silent
    bus = np.tanh(bus * 1.4) / np.tanh(1.4)
    fade = np.ones(n)
    fade[int(14.3 * SR) : int(14.65 * SR)] = np.linspace(1, 0, int(14.65 * SR) - int(14.3 * SR))
    fade[int(14.65 * SR) :] = 0
    return bus * fade


def write_wav(path, bus):
    x = np.clip(bus.T, -1, 1)
    data = (x * 32767).astype("<i2").tobytes()
    with open(path, "wb") as f:
        f.write(b"RIFF" + struct.pack("<I", 36 + len(data)) + b"WAVE")
        f.write(b"fmt " + struct.pack("<IHHIIHH", 16, 1, 2, SR, SR * 4, 4, 16))
        f.write(b"data" + struct.pack("<I", len(data)) + data)


def write_png(path, rgb):
    h, w, _ = rgb.shape
    raw = b"".join(b"\x00" + rgb[y].tobytes() for y in range(h))

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b"")
    open(path, "wb").write(png)


def plot(path, bus, cues):
    """Waveform with every cue drawn as a vertical line, to check placement by eye."""
    w, h = 1800, 420
    img = np.full((h, w, 3), 250, np.uint8)
    mono = np.abs(bus).max(axis=0)
    cols = np.array_split(mono, w)
    peak = max(1e-6, mono.max())
    for x, c in enumerate(cols):
        v = int((c.max() / peak) * (h / 2 - 20))
        img[h // 2 - v : h // 2 + v, x] = (40, 40, 40)
    for c in cues:
        x = int(c["t"] / DUR * w)
        if 0 <= x < w:
            img[:, x] = (255, 91, 31)
    for s in range(16):
        x = min(w - 1, int(s / DUR * w))
        img[h - 12 :, x] = (0, 0, 0)
    write_png(path, img)


if __name__ == "__main__":
    cues = json.load(open(sys.argv[1]))
    bus = build(cues)
    write_wav(sys.argv[2], bus)
    if len(sys.argv) > 3:
        plot(sys.argv[3], bus, cues)
    print("wrote", sys.argv[2])

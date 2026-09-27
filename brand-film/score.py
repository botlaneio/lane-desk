"""The film's music: a 15-second score in A major at 120 BPM, written against the picture.

    python3 score.py out/score.wav

One beat is 0.5 s, so the film's big moments sit on the grid: the slam at 0.0, the drop into the
guard at 7.0 (beat 14), the HELD stamp at 7.75, the light at 9.25 (a pushed beat 18.5) and the mark
at 12.05. Everything is synthesized (Karplus-Strong plucks, sine/saw voices, filtered noise drums);
no samples are used.
"""
import sys

import numpy as np
from scipy import signal

from audio import SR, DUR, bp, env, hp, lp, write_wav

BPM = 120
B = 60 / BPM  # one beat in seconds
rng = np.random.default_rng(11)
N = int(DUR * SR)


def hz(note):
    """'A3' / 'C#4' -> Hz."""
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    name, octave = note[:-1], int(note[-1])
    return 440.0 * 2 ** ((names[name] + 12 * (octave - 4)) / 12)


# ------------------------------------------------------------------ voices
def ks_pluck(f, dur=0.6, bright=0.5, damp=0.996):
    """Karplus-Strong string: tactile, woody pluck."""
    n = int(dur * SR)
    period = int(SR / f)
    exc = lp(rng.uniform(-1, 1, period), 1200 + 7000 * bright)
    x = np.zeros(n)
    x[:period] = exc
    a = np.zeros(period + 2)
    a[0] = 1
    a[period] = -0.5 * damp
    a[period + 1] = -0.5 * damp
    y = signal.lfilter([1.0], a, x)
    return y * env(n, 0.001, dur * 0.45) / (np.abs(y).max() + 1e-9)


def saw(f, n, detune=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 9):
        out += np.sin(2 * np.pi * f * (1 + detune) * k * t) / k
    return out


def pad(notes, dur, cutoff=1400, attack=0.25, release=0.8):
    n = int(dur * SR)
    x = sum(saw(hz(p), n, d) for p in notes for d in (-0.004, 0.004)) / (2 * len(notes))
    x = lp(x, cutoff)
    t = np.arange(n) / SR
    e = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (dur - t) / release))
    return x * e


def bass(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    body = lp(saw(f, n), 380) * 0.8 + np.sin(2 * np.pi * f * t) * 0.9
    return body * env(n, 0.003, dur * 0.55)


def kick(g=1.0):
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t * 38)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    x += hp(rng.standard_normal(n), 3000) * np.exp(-t * 400) * 0.25
    return x * g


def clap(g=1.0):
    n = int(0.2 * SR)
    t = np.arange(n) / SR
    burst = np.zeros(n)
    for off in (0.0, 0.009, 0.018):
        i = int(off * SR)
        burst[i:] += np.exp(-(t[: n - i]) * 180)
    tail = np.exp(-t * 26) * 0.5
    return bp(rng.standard_normal(n), 900, 3200) * (burst + tail) * 0.55 * g


def hat(open_=False, g=1.0):
    n = int((0.22 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7500) * np.exp(-t * (14 if open_ else 90)) * 0.3 * g


def rim(g=1.0):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    return (bp(rng.standard_normal(n), 1800, 4200) * 0.5 + np.sin(2 * np.pi * 1650 * t) * 0.4) * np.exp(-t * 70) * g


def cymbal(g=1.0):
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 5000) * np.exp(-t * 2.6) * 0.22 * g


def sub(f, dur, g=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * env(n, 0.004, dur * 0.5) * g


# ------------------------------------------------------------------ arrangement
class Track:
    def __init__(self):
        self.bus = np.zeros((2, N))
        self.kicks = []

    def add(self, x, t, g=1.0, pan=0.0):
        i = int(round(t * SR))
        if i >= N or i < 0:
            return
        x = x[: N - i] * g
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.bus[0, i : i + len(x)] += x * l * 1.414
        self.bus[1, i : i + len(x)] += x * r * 1.414

    def k(self, b, g=1.0):
        self.add(kick(g), b * B, 0.9)
        self.kicks.append(b * B)


CHORDS = {
    "A": ["A3", "C#4", "E4", "A4"],
    "F#m": ["F#3", "A3", "C#4", "F#4"],
    "D": ["D3", "F#3", "A3", "D4"],
    "E": ["E3", "G#3", "B3", "E4"],
    "Esus": ["E3", "A3", "B3", "E4"],
    "Am": ["A2", "C3", "E3", "A3"],
}
ROOT = {"A": "A1", "F#m": "F#1", "D": "D2", "E": "E2", "Esus": "E2", "Am": "A1"}


def ostinato(tr, chord, b0, b1, octave_up=0, bright=0.35, g=0.26):
    """16th-note arpeggio over the chord: root, fifth, octave, third."""
    tones = CHORDS[chord]
    order = [0, 2, 3, 1, 2, 3, 0, 3]
    s = 0
    b = b0
    while b < b1 - 1e-6:
        note = tones[order[s % len(order)]]
        f = hz(note) * (2 ** (1 + octave_up))
        accent = 1.0 if s % 4 == 0 else 0.72
        tr.add(ks_pluck(f, 0.32, bright), b * B, g * accent, pan=0.25 if s % 2 else -0.25)
        s += 1
        b += 0.25


def bassline(tr, chord, b0, b1, g=0.42):
    f = hz(ROOT[chord])
    b = b0
    i = 0
    while b < b1 - 1e-6:
        tr.add(bass(f * (2 if i % 4 == 3 else 1), 0.42), b * B, g)
        b += 0.5
        i += 1


def compose():
    tr = Track()

    # 0.0: the slam. Stab + sub on frame 0.
    tr.k(0, 1.2)
    tr.add(sub(55, 1.2), 0, 0.7)
    for p in CHORDS["A"]:
        tr.add(ks_pluck(hz(p) * 2, 0.9, 0.6), 0, 0.22)
    tr.add(cymbal(), 0, 0.6)

    # bar 1-2 (0-4s): groove enters under the type and the falling dot
    for b in (2, 4, 6, 6.75):
        tr.k(b, 0.85)
    for b in (5, 7):
        tr.add(clap(), b * B, 0.8)
    for i in range(2, 16):
        tr.add(hat(g=0.8 if i % 2 else 0.5), i * 0.5 * B, 1.0, pan=0.3)
    ostinato(tr, "A", 1, 4, bright=0.25, g=0.2)
    ostinato(tr, "F#m", 4, 8, bright=0.3, g=0.22)
    bassline(tr, "A", 2, 4)
    bassline(tr, "F#m", 4, 8)

    # bar 3 (4-6s): the system appears. Fuller, brighter.
    for b in (8, 9, 10, 11):
        tr.k(b, 0.9)
    for b in (9, 11):
        tr.add(clap(), b * B, 0.9)
    for s in range(16, 24):
        tr.add(hat(open_=(s % 2 == 1), g=0.8), s * 0.5 * B, 1.0, pan=0.3)
    ostinato(tr, "D", 8, 12, bright=0.45, g=0.24)
    bassline(tr, "D", 8, 12)
    tr.add(pad(CHORDS["D"], 4 * B, 1600), 8 * B, 0.1)

    # bar 4 to the cut (6-7s): E, climbing, clap roll into the guard
    tr.k(12, 0.9)
    tr.k(13, 0.9)
    ostinato(tr, "E", 12, 14, octave_up=1, bright=0.55, g=0.22)
    bassline(tr, "E", 12, 14)
    for i in range(8):
        tr.add(clap(0.4 + 0.08 * i), (13 + i * 0.125) * B, 0.7)

    # 7.0: hard cut. Choke every tail from the build (8 ms fade) so the guard starts in silence.
    cut, fade_n = int(7.0 * SR), int(0.008 * SR)
    tr.bus[:, cut : cut + fade_n] *= np.linspace(1, 0, fade_n)
    tr.bus[:, cut + fade_n :] = 0

    # 7.0-9.25: inside the guard. Half time, dark and sparse.
    for b in (14, 16, 18):
        tr.add(sub(55, 0.9), b * B, 0.85)
    tr.add(pad(CHORDS["Am"], 4.5 * B, 520, attack=0.05, release=0.3), 14 * B, 0.22)
    for b in np.arange(14.5, 18.5, 1.0):
        tr.add(rim(0.8), b * B, 0.5, pan=-0.2)

    # 9.25: the light opens. Pushed downbeat, then the full groove.
    tr.k(18.5, 1.1)
    tr.add(cymbal(1.2), 18.5 * B, 0.8)
    for p in CHORDS["D"]:
        tr.add(ks_pluck(hz(p) * 2, 0.8, 0.7), 18.5 * B, 0.22)
    for b in (19, 20, 21, 22):
        tr.k(b, 0.95)
    for b in (20, 22):
        tr.add(clap(), b * B, 1.0)
    for s in range(38, 46):
        tr.add(hat(open_=(s % 2 == 1), g=0.9), s * 0.5 * B, 1.0, pan=0.3)
    ostinato(tr, "D", 19, 21, octave_up=0, bright=0.6, g=0.25)
    ostinato(tr, "E", 21, 23, octave_up=0, bright=0.65, g=0.25)
    bassline(tr, "D", 19, 21)
    bassline(tr, "E", 21, 23)
    tr.add(pad(CHORDS["D"], 2 * B, 2200), 19 * B, 0.1)
    tr.add(pad(CHORDS["E"], 2 * B, 2200), 21 * B, 0.1)

    # 11.5-12.05: convergence. Drums out, plucks climb, tension held.
    ostinato(tr, "Esus", 23, 24.1, octave_up=1, bright=0.75, g=0.2)
    tr.add(pad(CHORDS["Esus"], 1.1 * B + 0.05, 2600, attack=0.4, release=0.05), 23 * B, 0.14)

    # 12.05: the mark. Warm A major resolve with a sub.
    t = 12.05
    tr.add(pad(["A2", "E3", "A3", "C#4", "E4"], 2.55, 1800, attack=0.02, release=1.4), t, 0.2)
    for p in ["A2", "E3", "A3", "C#4", "E4", "A4"]:
        tr.add(ks_pluck(hz(p), 2.2, 0.35, damp=0.999), t, 0.16)
    tr.add(sub(55, 2.0), t, 0.7)
    tr.k(24.1, 0.8)

    # 13.0-14.0: the lamp's signature under the tagline
    for tt, p in ((13.05, "E5"), (13.3, "C#5"), (13.55, "A4")):
        tr.add(ks_pluck(hz(p), 1.1, 0.4, damp=0.998), tt, 0.14, pan=0.15)

    # glue: gentle kick pump on the groove, soft clip, silence from 14.65
    g = np.ones(N)
    for kt in tr.kicks:
        i = int(kt * SR)
        rel = 1 - 0.35 * np.exp(-np.arange(int(0.3 * SR)) / (0.08 * SR))
        j = min(N, i + len(rel))
        g[i:j] = np.minimum(g[i:j], rel[: j - i])
    out = tr.bus * g
    out = np.tanh(out * 1.6) / np.tanh(1.6)
    fade = np.ones(N)
    a, b = int(14.3 * SR), int(14.65 * SR)
    fade[a:b] = np.linspace(1, 0, b - a)
    fade[b:] = 0
    return out * fade * 0.9


if __name__ == "__main__":
    write_wav(sys.argv[1], compose())
    print("wrote", sys.argv[1])

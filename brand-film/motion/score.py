"""The botlane.in motion explainer's music: a quiet bed in the film's language (A major, 120 BPM),
arranged on the piece's own section times so each change lands on a picture change. It sits well
under the voice: soft kick, no claps, plucks and pads carry it.

    python3 motion/score.py out/launch-cues.json out/launch-score.wav

Sections come from the cue file (PIECE.sections()). All voices come from ../score.py; no samples.
"""
import json
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import score as S  # noqa: E402
from audio import SR, write_wav  # noqa: E402

B = S.B


def beats(t0, t1, step=1.0):
    t = t0
    while t < t1 - 1e-6:
        yield t
        t += step * B


def compose(sec):
    DUR = float(sec.get("DUR", 60.0))
    N = int(DUR * SR)

    class Track(S.Track):
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

        def kick_at(self, t, g=1.0):
            self.add(S.kick(g), t, 0.6)
            self.kicks.append(t)

    def bed(tr, t0, t1, prog, energy=1.0, kick=True, four=False, bright=0.35):
        """A bar-per-chord bed (bar = 2 s): plucked ostinato, bass, soft kick and hats."""
        t, i = t0, 0
        while t < t1 - 1e-6:
            end = min(t + 4 * B, t1)
            ch = prog[i % len(prog)]
            S.ostinato(tr, ch, t / B, end / B, bright=bright, g=0.16 * energy)
            S.bassline(tr, ch, t / B, end / B, g=0.26 * energy)
            if kick:
                for k, bt in enumerate(beats(t, end)):
                    if four or k % 2 == 0:
                        tr.kick_at(bt, 0.6 * energy)
            for bt in beats(t, end, 0.5):
                tr.add(S.hat(g=0.5), bt, 0.5 * energy, pan=0.3)
            t, i = end, i + 1

    tr = Track()
    VO = sec["VO"]
    close = VO["close"] - 0.2

    # 1. the gap (to "Meet BotLane"): a held F#m pad, a slow sub pulse, one ticking rim
    tr.add(S.pad(["F#2", "C#3", "F#3", "A3"], VO["meet"] - 0.3, 650, attack=0.8, release=0.5), 0.0, 0.14)
    for bt in beats(0.0, VO["meet"] - 0.6, 2.0):
        tr.add(S.sub(46.25, 0.8), bt, 0.3)
    for bt in beats(1.0, VO["meet"] - 0.6):
        tr.add(S.rim(0.5), bt, 0.2, pan=-0.2)

    # 2. the lamp ignites: resolve to A with a pluck chord, then a light bed without drums
    tr.add(S.sub(55, 1.2), VO["meet"] - 0.2, 0.45)
    for p in S.CHORDS["A"]:
        tr.add(S.ks_pluck(S.hz(p) * 2, 0.9, 0.5), VO["meet"] - 0.2, 0.14)
    bed(tr, VO["meet"] + 0.3, VO["order"] - 0.4, ["A", "F#m", "D", "E"], energy=0.65, kick=False, bright=0.3)

    # 3. the order, the guard, the handoff: the soft kick comes in
    tr.add(S.cymbal(0.8), VO["order"] - 0.4, 0.22)
    bed(tr, VO["order"] - 0.4, VO["service"] - 0.4, ["D", "E", "F#m", "A"], energy=0.78, bright=0.4)

    # 4. service and India: warm, then a steady soft four-on-the-floor
    bed(tr, VO["service"] - 0.4, close - 0.1, ["A", "D", "F#m", "E"], energy=0.78, four=True, bright=0.5)

    # 5. the mark: warm A major and the lamp's three-note signature
    tr.add(S.pad(["A2", "E3", "A3", "C#4", "E4"], DUR - close - 0.4, 1800, attack=0.4, release=2.5), close, 0.16)
    for p in ["A2", "E3", "A3", "C#4", "E4", "A4"]:
        tr.add(S.ks_pluck(S.hz(p), 2.4, 0.35, damp=0.999), close, 0.1)
    tr.add(S.sub(55, 2.0), close, 0.4)
    for i, p in enumerate(("E5", "C#5", "A4")):
        tr.add(S.ks_pluck(S.hz(p), 1.4, 0.4, damp=0.998), DUR - 2.4 + i * 0.25, 0.12, pan=0.15)

    # glue: gentle kick pump, soft clip, silence at the very end
    g = np.ones(N)
    for kt in tr.kicks:
        i = int(kt * SR)
        rel = 1 - 0.2 * np.exp(-np.arange(int(0.3 * SR)) / (0.08 * SR))
        j = min(N, i + len(rel))
        g[i:j] = np.minimum(g[i:j], rel[: j - i])
    out = np.tanh(tr.bus * g * 1.4) / np.tanh(1.4)
    a, b = int((DUR - 0.8) * SR), int((DUR - 0.3) * SR)
    fade = np.ones(N)
    fade[a:b] = np.linspace(1, 0, b - a)
    fade[b:] = 0
    return out * fade * 0.9


if __name__ == "__main__":
    sec = json.load(open(sys.argv[1]))["sections"]
    write_wav(sys.argv[2], compose(sec))
    print("wrote", sys.argv[2])

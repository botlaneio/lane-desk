"""The explainer's music: 60 seconds in the film's language (A major, 120 BPM), arranged on the
explainer's own section times so each change lands on a picture change.

    python3 explainer/score.py out/explainer-cues.json out/explainer-score.wav

Sections come from the cue file (PIECE.sections()). All voices come from ../score.py; no samples.
"""
import json
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import score as S  # noqa: E402
from audio import SR, write_wav  # noqa: E402

DUR = 60.0  # replaced by the piece length from the cue file
N = int(DUR * SR)
B = S.B


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
        self.add(S.kick(g), t, 0.9)
        self.kicks.append(t)

    def choke(self, t, ms=10):
        i, n = int(t * SR), int(ms / 1000 * SR)
        self.bus[:, i : i + n] *= np.linspace(1, 0, n)
        self.bus[:, i + n :] = 0


def beats(t0, t1, step=1.0):
    t = t0
    while t < t1 - 1e-6:
        yield t
        t += step * B


def groove(tr, t0, t1, prog, energy=1.0, four=False, bright=0.4, octave=0):
    """A bar-per-chord groove from t0 to t1 (bar = 4 beats = 2 s)."""
    bar = 4 * B
    t = t0
    i = 0
    while t < t1 - 1e-6:
        end = min(t + bar, t1)
        ch = prog[i % len(prog)]
        S.ostinato(tr, ch, t / B, end / B, octave_up=octave, bright=bright, g=0.2 * energy)
        S.bassline(tr, ch, t / B, end / B, g=0.36 * energy)
        for k, bt in enumerate(beats(t, end)):
            if four or k % 2 == 0:
                tr.kick_at(bt, 0.8 * energy)
            if k % 2 == 1:
                tr.add(S.clap(), bt, 0.7 * energy)
        for bt in beats(t, end, 0.5):
            tr.add(S.hat(g=0.7), bt, 0.8 * energy, pan=0.3)
        t = end
        i += 1


def compose(sec):
    tr = Track()
    VO = sec["VO"]
    hook, dark, iris = sec["HOOK"], sec["darkE"], sec["E_iris"]
    conv, plate = sec["conv"], sec["plate"]
    p_in, p_out, lock = sec["PILOT_IN"], sec["PILOT_OUT"], sec["lock"]

    # 1. the problem: tense F#m pulse that speeds up with the messages, then thins to one voice
    for bt in beats(0, 3.6):
        tr.add(S.sub(46.25, 0.45), bt, 0.5)
    S.ostinato(tr, "F#m", 0, 3.6 / B, bright=0.2, g=0.16)
    for bt in beats(0, 3.6, 0.25):
        tr.add(S.hat(g=0.5), bt, 0.6, pan=0.3)
    tr.add(S.pad(["F#2", "C#3", "F#3", "A3"], hook - 3.6, 700, attack=0.3, release=0.4), 3.6, 0.16)
    for bt in beats(3.6, hook - 0.5):
        tr.add(S.rim(0.6), bt, 0.35, pan=-0.2)
    tr.choke(hook)

    # 2. hook and title: stab on the slam, light A-major groove under the voice
    tr.kick_at(hook, 1.2)
    tr.add(S.sub(55, 1.2), hook, 0.7)
    tr.add(S.cymbal(), hook, 0.5)
    for p in S.CHORDS["A"]:
        tr.add(S.ks_pluck(S.hz(p) * 2, 0.9, 0.6), hook, 0.2)
    groove(tr, hook + 1.0, VO["routes"] - 0.2, ["A", "F#m"], energy=0.75, bright=0.3)

    # 3. the routes and the verified reply
    groove(tr, VO["routes"] - 0.2, VO["guard"] - 0.8, ["D", "E", "F#m", "A"], energy=0.85, bright=0.45)

    # 4. whip and push into the guard: climbing, then a hard cut
    S.ostinato(tr, "E", (VO["guard"] - 0.8) / B, dark / B, octave_up=1, bright=0.6, g=0.18)
    for i in range(8):
        tr.add(S.clap(0.35 + 0.08 * i), dark - 0.5 + i * 0.0625, 0.6)
    tr.choke(dark)

    # 5. inside the guard: half time, dark, sparse
    for bt in beats(dark, iris - 0.2, 2.0):
        tr.add(S.sub(55, 0.9), bt, 0.7)
    tr.add(S.pad(S.CHORDS["Am"], iris - dark, 520, attack=0.08, release=0.4), dark, 0.18)
    for bt in beats(dark + 0.5, iris - 0.3):
        tr.add(S.rim(0.7), bt, 0.35, pan=-0.2)
    tr.choke(iris - 0.02, ms=20)

    # 6. the light opens: lift, then warm groove under the handoff
    tr.kick_at(iris, 1.1)
    tr.add(S.cymbal(1.2), iris, 0.7)
    for p in S.CHORDS["D"]:
        tr.add(S.ks_pluck(S.hz(p) * 2, 0.8, 0.7), iris, 0.2)
    groove(tr, iris + 0.5, VO["service"] - 0.2, ["D", "E", "A", "F#m"], energy=0.85, bright=0.55)

    # 7. managed service: steady, a little lighter under the notes
    groove(tr, VO["service"] - 0.2, conv, ["A", "D", "F#m", "E"], energy=0.7, bright=0.4)
    tr.choke(conv, ms=40)

    # 8. convergence: drums out, plucks climb
    S.ostinato(tr, "Esus", conv / B, plate / B, octave_up=1, bright=0.75, g=0.17)
    tr.add(S.pad(S.CHORDS["Esus"], plate - conv, 2600, attack=0.4, release=0.05), conv, 0.12)

    # 9. the plate opens into the pilot: resolve, then a confident four-on-the-floor
    tr.add(S.pad(["A2", "E3", "A3", "C#4", "E4"], 1.0, 1800, attack=0.02, release=0.6), plate, 0.18)
    tr.add(S.sub(55, 1.0), plate, 0.6)
    groove(tr, VO["pilot"] - 0.4, p_out - 0.5, ["D", "E", "F#m", "E"], energy=0.85, four=True, bright=0.55)
    tr.choke(p_out - 0.45, ms=30)

    # 10. the mark and the close: warm A major, the lamp's three-note signature, silence
    tr.add(S.pad(["A2", "E3", "A3", "C#4", "E4"], DUR - lock - 0.6, 1800, attack=0.4, release=2.5), lock - 0.2, 0.18)
    for p in ["A2", "E3", "A3", "C#4", "E4", "A4"]:
        tr.add(S.ks_pluck(S.hz(p), 2.4, 0.35, damp=0.999), lock, 0.12)
    tr.add(S.sub(55, 2.0), lock, 0.5)
    end = sec["closeEnd"]
    for i, p in enumerate(("E5", "C#5", "A4")):
        tr.add(S.ks_pluck(S.hz(p), 1.4, 0.4, damp=0.998), end + 0.3 + i * 0.25, 0.14, pan=0.15)

    # glue: kick pump, soft clip, silence at the very end
    g = np.ones(N)
    for kt in tr.kicks:
        i = int(kt * SR)
        rel = 1 - 0.3 * np.exp(-np.arange(int(0.3 * SR)) / (0.08 * SR))
        j = min(N, i + len(rel))
        g[i:j] = np.minimum(g[i:j], rel[: j - i])
    out = np.tanh(tr.bus * g * 1.6) / np.tanh(1.6)
    a, b = int((DUR - 0.8) * SR), int((DUR - 0.3) * SR)
    fade = np.ones(N)
    fade[a:b] = np.linspace(1, 0, b - a)
    fade[b:] = 0
    return out * fade * 0.9


if __name__ == "__main__":
    sec = json.load(open(sys.argv[1]))["sections"]
    DUR = float(sec.get("DUR", 60.0))
    N = int(DUR * SR)
    write_wav(sys.argv[2], compose(sec))
    print("wrote", sys.argv[2])

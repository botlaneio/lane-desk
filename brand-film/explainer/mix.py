"""Mix the explainer: voiceover on top, effects under it, music ducked under the voice.

    python3 explainer/mix.py out/explainer-cues.json out/vo out/explainer-score.wav out/explainer-mix.wav

Then master with ../master.py (two-pass loudnorm to -14 LUFS / -2 dBTP, re-measured after AAC).
"""
import json
import pathlib
import sys

import numpy as np
from scipy import signal

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import audio as A  # noqa: E402

SR = A.SR
DUR = 60.0
N = int(DUR * SR)


def rms(x):
    return float(np.sqrt(np.mean(x**2)) + 1e-12)


def envelope(x, attack=0.03, release=0.35):
    """Smoothed level of a mono signal, for sidechain ducking."""
    a = np.abs(x)
    up = signal.lfilter([1 - np.exp(-1 / (attack * SR))], [1, -np.exp(-1 / (attack * SR))], a)
    down = signal.lfilter([1 - np.exp(-1 / (release * SR))], [1, -np.exp(-1 / (release * SR))], a)
    return np.maximum(up, down)


def main(cue_path, vo_dir, music_path, out_path):
    global DUR, N
    cues = json.load(open(cue_path))
    DUR = float(cues["sections"].get("DUR", 60.0))
    N = int(DUR * SR)
    vo_dir = pathlib.Path(vo_dir)

    # voice: each line at its scheduled time, levelled line by line
    voice = np.zeros((2, N))
    for v in cues["voice"]:
        x = A.load_audio(str(vo_dir / f"{v['id']}.wav"))
        x = x / rms(x) * 0.09
        A.place(voice, x.mean(axis=0), v["t"], 1.0, 0.0)

    # effects: the same synthesized sounds as the film
    sfx = np.zeros((2, N))
    for c in cues["sfx"]:
        k, t, g = c["k"], c["t"], c.get("g", 1.0)
        x = A.SOUNDS[k](c.get("p", 1.0), c.get("d"))
        if k in A.ENDS_ON_EVENT:
            t = t + (c.get("d") or 0.35) - len(x) / SR
        A.place(sfx, x, t, g, A.PANS.get(k, 0.0))

    music = A.load_audio(music_path)
    m = np.zeros((2, N))
    k = min(N, music.shape[1])
    m[:, :k] = music[:, :k]

    # sidechain: music dips about 9 dB while the voice speaks, effects about 8 dB
    ve = envelope(voice.mean(axis=0))
    ve = np.clip(ve / (np.percentile(ve[ve > 1e-4], 60) + 1e-9), 0, 1)
    duck_m = 1 - (1 - 10 ** (-9 / 20)) * ve
    duck_s = 1 - (1 - 10 ** (-8 / 20)) * ve

    bus = voice * 1.0 + sfx * (rms(voice) / rms(sfx)) * 0.55 * duck_s + m * (rms(voice) / rms(m)) * 0.5 * duck_m
    bus = np.tanh(bus * 1.3) / np.tanh(1.3)
    a, b = int((DUR - 0.8) * SR), int((DUR - 0.3) * SR)
    fade = np.ones(N)
    fade[a:b] = np.linspace(1, 0, b - a)
    fade[b:] = 0
    A.write_wav(out_path, bus * fade)
    print("wrote", out_path)
    return bus


if __name__ == "__main__":
    bus = main(*sys.argv[1:5])

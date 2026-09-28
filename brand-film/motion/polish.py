"""A light "AI assistant" polish for the voice: high-pass, a touch of presence and air, gentle compression,
a short bright room and a faint 11 ms doubler. Subtle on purpose: it should read as polished, not robotic.

    python3 motion/polish.py in.wav out.wav
"""
import sys
import numpy as np
import soundfile as sf
from scipy import signal


def shelf(x, sr, f, gain_db, kind):
    # RBJ shelving biquad
    A = 10 ** (gain_db / 40); w0 = 2 * np.pi * f / sr; al = np.sin(w0) / 2 * np.sqrt(2); c = np.cos(w0)
    if kind == "high":
        b = [A * ((A + 1) + (A - 1) * c + 2 * np.sqrt(A) * al), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - 2 * np.sqrt(A) * al)]
        a = [(A + 1) - (A - 1) * c + 2 * np.sqrt(A) * al, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - 2 * np.sqrt(A) * al]
    else:
        b = [A * ((A + 1) - (A - 1) * c + 2 * np.sqrt(A) * al), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - 2 * np.sqrt(A) * al)]
        a = [(A + 1) + (A - 1) * c + 2 * np.sqrt(A) * al, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - 2 * np.sqrt(A) * al]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x)


def peak(x, sr, f, gain_db, q=1.0):
    A = 10 ** (gain_db / 40); w0 = 2 * np.pi * f / sr; al = np.sin(w0) / (2 * q); c = np.cos(w0)
    b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x)


def polish(x, sr):
    x = signal.sosfilt(signal.butter(2, 90, "hp", fs=sr, output="sos"), x)
    x = shelf(x, sr, 180, 1.5, "low")        # a little chest
    x = peak(x, sr, 3200, 2.0, 0.9)          # presence / diction
    x = shelf(x, sr, 9000, 2.5, "high")      # air
    # gentle compression (RMS follower)
    env = np.sqrt(signal.lfilter([0.002], [1, -0.998], x * x) + 1e-9)
    thr = np.percentile(env, 70)
    g = np.where(env > thr, (thr / env) ** 0.35, 1.0)
    x = x * g
    # faint doubler for the "assistant" sheen
    d = int(0.011 * sr)
    dbl = np.concatenate([np.zeros(d), x[:-d]])
    x = x + 0.12 * signal.sosfilt(signal.butter(2, 1500, "hp", fs=sr, output="sos"), dbl)
    # short bright room
    n = int(0.45 * sr)
    rng = np.random.default_rng(3)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.09 * sr))
    ir = signal.sosfilt(signal.butter(2, [400, 7000], "bp", fs=sr, output="sos"), ir)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = signal.fftconvolve(x, ir)[: len(x) + n // 2]
    y = np.concatenate([x, np.zeros(len(wet) - len(x))]) + 0.07 * wet
    return y / np.max(np.abs(y)) * 0.89


if __name__ == "__main__":
    x, sr = sf.read(sys.argv[1])
    if x.ndim > 1:
        x = x.mean(axis=1)
    sf.write(sys.argv[2], polish(x, sr), sr)

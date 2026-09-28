"""Record the voiceover with Kokoro (free, local; British male "bm_george"), then polish it.

    python3 motion/voice.py out/motion-vo [--voice bm_george] [--speed 0.95] [--only id]

Model files are read from $KOKORO_DIR (default /tmp/kokoro): kokoro-v1.0.onnx and voices-v1.0.bin.
Then run motion/align.py on the same folder for word timings.
"""
import argparse
import json
import os
import pathlib
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from polish import polish  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--voice", default="bm_george")
ap.add_argument("--speed", type=float, default=0.95)
ap.add_argument("--only")
a = ap.parse_args()
d = os.environ.get("KOKORO_DIR", "/tmp/kokoro")
k = Kokoro(f"{d}/kokoro-v1.0.onnx", f"{d}/voices-v1.0.bin")
out = pathlib.Path(a.out)
out.mkdir(parents=True, exist_ok=True)
for line in json.load(open(HERE / "script.json")):
    if a.only and line["id"] != a.only:
        continue
    x, sr = k.create(line.get("say", line["text"]), voice=a.voice, speed=a.speed, lang="en-gb")
    # trim the model's leading/trailing silence
    thr = 0.02 * np.abs(x).max()
    i = np.where(np.abs(x) > thr)[0]
    x = x[max(0, i[0] - int(0.02 * sr)) : i[-1] + int(0.08 * sr)]
    sf.write(out / f"{line['id']}.wav", polish(x, sr), sr)
    print(f"{line['id']:8s} {len(x) / sr:5.2f}s")

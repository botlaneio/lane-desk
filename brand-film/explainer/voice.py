"""Generate the voiceover, one file per line, with the open-source Kokoro model (Apache-2.0).

    python3 explainer/voice.py explainer/script.json out/vo [--voice af_heart] [--speed 1.0]

Model files (kokoro-v1.0.onnx, voices-v1.0.bin) are read from $KOKORO_DIR (default /tmp/kokoro):
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
To use another voice (an ElevenLabs take, a recording), drop <id>.wav files into the output folder instead.
"""
import argparse
import json
import os
import pathlib

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ap = argparse.ArgumentParser()
ap.add_argument("script")
ap.add_argument("out")
ap.add_argument("--voice", default="af_heart")
ap.add_argument("--speed", type=float, default=1.0)
a = ap.parse_args()

d = pathlib.Path(os.environ.get("KOKORO_DIR", "/tmp/kokoro"))
k = Kokoro(str(d / "kokoro-v1.0.onnx"), str(d / "voices-v1.0.bin"))
out = pathlib.Path(a.out)
out.mkdir(parents=True, exist_ok=True)
lens = {}
for line in json.load(open(a.script)):
    audio, sr = k.create(line["text"], voice=a.voice, speed=a.speed, lang="en-us")
    # trim silence at both ends so line timing is exact
    thr = 0.01 * np.abs(audio).max()
    idx = np.where(np.abs(audio) > thr)[0]
    audio = audio[max(0, idx[0] - int(0.01 * sr)) : idx[-1] + int(0.05 * sr)]
    sf.write(out / f"{line['id']}.wav", audio, sr)
    lens[line["id"]] = round(len(audio) / sr, 3)
    print(f"{line['id']:8s} {lens[line['id']]:5.2f}s")
json.dump(lens, open(out / "lengths.json", "w"), indent=1)
print("total speech", round(sum(lens.values()), 2), "s")

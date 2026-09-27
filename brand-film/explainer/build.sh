#!/usr/bin/env bash
# Rebuild the 60-second explainer: voice, word timing, picture, music, mix, master.
# Needs what ../build.sh needs, plus kokoro-onnx + soundfile (voice) and faster-whisper (timing).
# To use another voice (ElevenLabs, a recording), put <line-id>.wav files in out/vo, run
# lengths/alignment (align.py), and skip voice.py; the picture retimes itself to the new words.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
python3 explainer/voice.py explainer/script.json out/vo           # open-source Kokoro voice (Apache-2.0)
python3 explainer/align.py out/vo                                  # word times -> explainer/timing.js
python3 render.py --page explainer/index.html --cues out/explainer-cues.json
python3 render.py out/explainer-video.mp4 --page explainer/index.html   # ~20 min at 1080p60
python3 explainer/score.py out/explainer-cues.json out/explainer-score.wav
python3 explainer/mix.py out/explainer-cues.json out/vo out/explainer-score.wav out/explainer-mix.wav
python3 master.py out/explainer-mix.wav out/explainer-video.mp4 out/lanedesk-explainer-16x9.mp4

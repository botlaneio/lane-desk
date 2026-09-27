#!/usr/bin/env bash
# Rebuild the Hindi-voice explainer. Same picture (on-screen text stays English), Hindi voiceover.
# The voice is spoken segment by segment so every beat's anchor time is exact (no speech recognition).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
python3 explainer/voice_segments.py explainer/script-hi.json out/vo-hi explainer/timing-hi.js --voice hf_alpha --speed 1.25
python3 render.py --page explainer/index-hi.html --cues out/explainer-hi-cues.json
python3 render.py out/explainer-hi-video.mp4 --page explainer/index-hi.html   # ~20 min at 1080p60
python3 explainer/score.py out/explainer-hi-cues.json out/explainer-hi-score.wav
python3 explainer/mix.py out/explainer-hi-cues.json out/vo-hi out/explainer-hi-score.wav out/explainer-hi-mix.wav
python3 master.py out/explainer-hi-mix.wav out/explainer-hi-video.mp4 out/lanedesk-explainer-hindi-16x9.mp4

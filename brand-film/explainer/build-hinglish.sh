#!/usr/bin/env bash
# Rebuild the Hinglish-voice explainer with Sarvam AI's Bulbul v3.
# Voice: VOICE=shreya (default) | varun | ritu. The chosen voices are varun and ritu.
# Needs SARVAM_API_KEY in the environment (never commit it). Same picture as the English explainer.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SARVAM_API_KEY:?set SARVAM_API_KEY}"
mkdir -p out
python3 explainer/voice_sarvam.py explainer/script-hinglish.json out/vo-hinglish explainer/timing-hinglish.js --speaker "${VOICE:-shreya}" --pace 1.1
python3 render.py --page explainer/index-hinglish.html --cues out/explainer-hg-cues.json
python3 render.py out/explainer-hg-video.mp4 --page explainer/index-hinglish.html   # ~17 min at 1080p60
python3 explainer/score.py out/explainer-hg-cues.json out/explainer-hg-score.wav
python3 explainer/mix.py out/explainer-hg-cues.json out/vo-hinglish out/explainer-hg-score.wav out/explainer-hg-mix.wav
python3 master.py out/explainer-hg-mix.wav out/explainer-hg-video.mp4 out/lanedesk-explainer-hinglish-16x9.mp4

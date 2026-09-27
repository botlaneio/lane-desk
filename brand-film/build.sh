#!/usr/bin/env bash
# Rebuild the Lane Desk film: picture, sound bed, master, mux.
# Needs: python3 with playwright, numpy, scipy, imageio-ffmpeg; a Chromium (set CHROME=...).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out
python3 render.py --cues out/cues.json
python3 render.py out/film-video.mp4            # ~4 min at 1080p60 with 5-sample motion blur
python3 score.py out/score.wav                  # the music, written against the picture
python3 audio.py out/cues.json out/bed.wav out/waveform.png --music out/score.wav
python3 master.py out/bed.wav out/film-video.mp4 out/lanedesk-film-16x9.mp4

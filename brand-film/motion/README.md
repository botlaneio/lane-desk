# BotLane: 60-second motion-graphics explainer

The orange lamp from the BotLane mark travels one hairline lane and lights each station as the voice names it;
scenes arrive and leave by diffusion (blur, drift, fade), chips float in depth, text blurs in or types.
botlane.in's own palette and type (paper, ink, hairline, orange; Inter, JetBrains Mono). Every on-screen claim
is on botlane.in or botlane.in/assist.

Voice: Kokoro (free, open-source), British male `bm_george`, with a light "assistant" polish (`polish.py`).

```
python3 motion/voice.py out/motion-vo            # record (needs Kokoro model files in $KOKORO_DIR)
python3 motion/align.py out/motion-vo            # word timings -> motion/timing.js
python3 render.py --page motion/index.html --cues out/motion-cues.json
python3 motion/score.py out/motion-cues.json out/motion-score.wav
MUSIC_GAIN=0.36 MUSIC_DUCK_DB=11 python3 explainer/mix.py out/motion-cues.json out/motion-vo out/motion-score.wav out/motion-mix.wav
python3 render.py out/motion-video.mp4 --page motion/index.html
python3 master.py out/motion-mix.wav out/motion-video.mp4 out/botlane-motion-60s.mp4
```

`stub_timing.py` writes provisional timings so the picture can be built before a voice exists.

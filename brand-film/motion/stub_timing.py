"""Provisional word timings from the script (about 2.45 words/s, with pauses at punctuation), so the
picture can be built before the voice exists. voice.py replaces motion/timing.js with real ASR timings."""
import json, pathlib, re
lines = json.load(open(pathlib.Path(__file__).with_name("script.json")))
lengths, words, script = {}, {}, {}
for ln in lines:
    t, ws = 0.0, []
    for tok in ln["text"].split():
        d = 0.12 + 0.046 * len(re.sub(r"[^A-Za-z0-9]", "", tok))
        ws.append([tok, round(t, 3), round(t + d, 3)])
        t += d + (0.3 if tok[-1] in ".?!" else 0.12 if tok[-1] == "," else 0.02)
    lengths[ln["id"]] = round(ws[-1][2], 3)
    words[ln["id"]] = ws
    script[ln["id"]] = ln["text"]
pathlib.Path(__file__).with_name("timing.js").write_text(
    "// provisional (stub_timing.py); replaced by voice.py\nwindow.VO_TIMING = " + json.dumps({"lengths": lengths, "words": words, "script": script}) + ";\n")
print(lengths, round(sum(lengths.values()), 2))

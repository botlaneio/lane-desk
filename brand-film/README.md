# Lane Desk brand film (15s)

A 15-second motion-graphics film for Lane Desk. It's built from this repo's own tokens, type, mark and copy. There is no voiceover, stock footage or external audio.

## The idea

**The orange lamp in the Lane Desk mark is a customer message, and the slot it sits in is the lane.**

1. The dot of the "?" in *Where's my order?* falls onto a lane.
2. The lane forks into the five real routes from `app/page.tsx`.
3. One message comes back **verified**.
4. An AI draft is **held** by the reply guard and handed to a person.
5. Every lane collapses back into the slot of the mark.

Each scene is caused by the one before it: the question becomes a dot, the dot a lane, the lane a system, the system the slot, and the slot the mark.

## Timeline

| Time | Beat | What happens | Sound |
|---|---|---|---|
| 0.00–1.10 | Hook | "Where's" fills the frame at 2.5× and slams down. "my" arrives from depth, and "order?" slams in with tight tracking. The dot of the **?** is the brand orange. | slam, thud, letter ticks |
| 1.10–2.20 | The message leaves | The dot squashes, pops out of the question and falls. The words crumble behind it. A marker line races across and the dot lands on it: the line dips and the dot bounces once. | creak, pop, whoosh, marker, landing |
| 2.20–3.65 | Message in → Sort | "MESSAGE IN" is labelled with a hand-drawn arrow. The dot rolls to the SORT switch, and the lane springs apart into the five routes, each labelled NO LLM or AI DRAFT → GUARD. A marker circle picks ORDER STATUS and the switch clicks. | roll, five plucks, knock, click |
| 3.65–5.95 | Verified | The dot shoots up the route and opens into the order card (`components/chat.tsx`). The camera pushes in as the **VERIFIED** chip stamps down. Then stillness. | whoosh, pop, stamp |
| 5.95–7.00 | Into the guard | A fast pan follows a second message, tagged AI DRAFT, down RETURNS OR POLICY and into the reply guard. The camera pushes into the guard until it fills the frame. | whip, knock, riser |
| 7.00–8.30 | Held | Dark (the ink band colour). The draft "Here's 20% off." is struck through with marker, a **HELD** pill stamps down, and the reason types in: *discount not in store policy → sent to a person*. | drum drop, marker, heavy stamp, typing |
| 8.30–9.30 | When it's hard | The held draft falls away. "When it's hard," tracks in and the dot lands after the comma. | whoosh, slam, tick |
| 9.28–10.20 | A person takes over | The dot opens a circle of light that reveals "a person takes over." The owner card slides in and the dot lands in its notification. | reverse swell, light hit, tick |
| 10.20–12.05 | Convergence | The camera pulls out to the whole system. Cards and labels dissolve, and every lane folds onto one line. The dot flies to the left end as the line thickens into the slot. | whoosh, swell, tick, thump |
| 12.05–13.30 | The mark | The plate snaps out around the slot, which inverts to paper, and the dot is now the lamp. The camera pushes in, then pulls back as "botLane / Lane Desk" reveals from behind the mark. | sub-hit + warm chord |
| 13.30–15.00 | Resolution | "Fast answers, safe answers, and a human when it matters." rises word by word, then stillness. The audio ends in silence. | — |

## Brand rules followed

| Rule | Source |
|---|---|
| Palette is the `@theme` tokens only: paper `#faf8f5`, ink `#111111`, ink-2, border, hairline, on-ink / on-ink-2, verified green and wash | `app/globals.css` |
| **One orange thing on screen**: the message dot, which becomes the lamp. No orange backgrounds, orange text or glows. | `app/globals.css` (orange is for the lamp, the CTA and the active step) |
| The one dark environment is the ink band colour, used when the camera enters the reply guard | `app/page.tsx` (#pilot section) |
| Inter 700 display at −0.03em tracking, Inter 600/500 for headings and body, JetBrains Mono 500 uppercase labels | `app/layout.tsx`, `.t-display`, `.t-eyebrow` |
| Site easing `cubic-bezier(0.22, 1, 0.36, 1)` for entrances | `app/globals.css` `.rise` |
| The mark is drawn from the exact `PLATE` path geometry (32-unit plate, slot 9.5–22.5 with 3.5 radius caps, lamp at (10, 16) r 2.25). The lockup uses the component's ratios (28px mark, 10px gap, 15px text, "botLane" 500 ink-2, "/" border, "Lane Desk" 600 −0.01em). | `components/logo.tsx`, `app/icon.svg` |
| Chat cards, bubbles, chips (VERIFIED, HELD, NO LLM, AI DRAFT → GUARD) mirror the site components | `components/chat.tsx`, `components/route-cycler.tsx` |
| Route names, card copy and the tagline are the site's own words. Example chats carry **AN ILLUSTRATIVE FLOW · NO CUSTOMER DATA**. There are no stats, customers, logos or claims. | `app/page.tsx` |

## Build

Needs Python 3 with `playwright numpy scipy imageio-ffmpeg`, and a Chromium. Set `CHROME=/path/to/chrome` if it isn't at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

```bash
./build.sh                                         # everything -> out/lanedesk-film-16x9.mp4
python3 stills.py out/sheet.png 0 1.2 3.5 7.9 12.3 # contact sheet of any times
python3 render.py out/draft.mp4 --samples 1        # fast draft, no motion blur
python3 render.py out/cut.mp4 --from 6 --to 8      # a range
open index.html?play                               # live preview (index.html?t=7.9 for one frame)
```

- `film.js` is the whole film: one pure `render(ctx, t)`. Nothing reads a clock, so any frame renders on its own and seeking is exact. All beat times are in the `T` table, and all camera moves are in `buildCam()`.
- `render.py` renders 1920×1080 at 60fps. Each frame is five sub-frames averaged over a 180° shutter for motion blur. It encodes with libx264 (CRF 14, yuv420p, bt709, faststart).
- `audio.py` synthesizes every sound from the film's own cue list (`FILM.cues()`), so a retimed beat moves its sound with it. It also writes `out/waveform.png`, which shows the waveform with every cue marked, to check placement.
- `score.py` is the music: 15 seconds in A major at 120 BPM, written against the picture. The slam lands on beat 0, and the drop into the guard at 7.0 s lands on beat 14, where every tail is choked for a hard cut. The light at 9.25 s is a pushed downbeat, and the drums drop out at 11.5 s as the lanes converge. A warm A major resolve lands with the mark at 12.05 s, and a three-note pluck signature plays under the tagline. The voices are Karplus-Strong plucks, a saw pad, a sub-bass and synthesized drums.
- To use a different track, pass `--music any.wav|mp3` to `audio.py`. The track is trimmed so its first onset lands on frame 0, levelled under the effects, and ducked on the big hits.
- `master.py` runs two-pass `loudnorm` to −14 LUFS integrated and −2 dBTP true peak, muxes AAC 320k, and **re-measures the final AAC file**.

Renders go to `out/`, which is ignored by git.

## Assets and licences

- **Fonts:** Inter and JetBrains Mono (SIL Open Font License 1.1), from the `@fontsource/inter` and `@fontsource/jetbrains-mono` npm packages. They're the same families the site loads through `next/font`. Licences are in `fonts/`.
- **Audio:** the effects (`audio.py`) and the music (`score.py`) are both synthesized. No samples or third-party sounds are used, so there are no licensing restrictions.
- **Imagery:** none. Everything is drawn in code.

## Performance

- Rendering takes about 0.25–0.5 s per frame with motion blur in headless software Chromium, so about 4–7 minutes for the full film.
- Depth comes from scale and motion, not canvas blur filters. `ctx.filter = blur()` is very slow in software Chromium.
- A fine film grain is added to every frame. It keeps H.264 from banding on the flat paper and ink fields.

---

# Lane Desk explainer (60s, with voiceover)

`explainer/` builds a 60-second explainer from the same engine. The film's world, dot and scenes play through a **time map** that holds and slows the film, so every beat lands on the word that names it:

- **VERIFIED** stamps on "matches".
- The draft is struck through on "discount".
- **HELD** lands on "held".

New scenes cover what the film doesn't say.

| Time | Voice | Picture |
|---|---|---|
| 0–8.6 | *Every day, your customers ask the same things on WhatsApp…* | A WhatsApp inbox fills up. The marker circles every "Where's my order?". "by hand." A push into the last message match-cuts into the film's hook. |
| 8.6–15 | *Lane Desk is a managed WhatsApp support desk for Indian online stores.* | The **?** loses its dot, the dot lands on the lane, and the product is named. |
| 15–23.5 | *Every message takes one of five routes…* | The five routes. The marker picks ORDER STATUS, the order card opens, and VERIFIED lands. |
| 23.5–32.4 | *When AI drafts a reply, the reply guard checks it…* | Into the guard. CHECKING AGAINST YOUR POLICY, the strike-through, then HELD. |
| 32.4–38.7 | *And when it's hard, a person takes over…* | The light opens onto the owner's card. |
| 38.7–45.2 | *You don't set up a bot. BotLane connects your store…* | The whole system, with BotLane's marker notes: connected on one call, policy wording written with you, reviewed every week. |
| 45.2–52.9 | *Start with a pilot, at ₹6,999 a month.* | Everything folds into the mark, whose ink plate opens into the site's ink band: the price, the launch offer and the one orange button. |
| 52.9–60 | *Lane Desk. Fast answers, safe answers, and a human when it matters.* | Logo lockup, the tagline word by word with the voice, and TALK TO US · BOTLANE.IN/CONTACT. |

- **Voice:** `explainer/script.json` holds the script, and `explainer/voice.py` generates it with the open-source Kokoro model (Apache-2.0, runs locally). Every line was checked with speech recognition, and the final mix matches the script at 99%. To use ElevenLabs or a recorded voice, replace `out/vo/<id>.wav` and re-run `align.py`; the picture retimes to the new word times.
- **Music:** `explainer/score.py` uses the film's instruments and key, arranged on the explainer's section times. It cuts hard into the guard, lifts on the light, drops the drums as the lanes converge, and resolves on the mark.
- **Mix:** `explainer/mix.py` lets the voice lead. The music ducks about 9 dB and the effects about 8 dB while the voice speaks. Mastering is the same as the film: −14 LUFS, −2 dBTP, re-measured after AAC.
- **Build:** run `explainer/build.sh`.

## Hindi voiceover version

`explainer/build-hi.sh` builds the same explainer with a Hindi voiceover. The picture, the on-screen text and the product demo stay as they are. Showing the product replying in Hindi would claim a feature the site still lists as *Planned*.

- **Script:** `explainer/script-hi.json` is everyday spoken Hindi. It keeps only the English words everyone uses and the voice pronounces well (WhatsApp, order, store, AI, policy, pilot). Words the model mangled, like "customers" and "discount", became ग्राहक and छूट.
- **Timing:** each line is split into segments, and each segment is tagged with the beat it carries (`held`, `matches`, `discount`…). `voice_segments.py` speaks the segments and joins them with natural pauses, so every beat time is exact. The picture uses those times, so VERIFIED, the strike-through and HELD land on the Hindi words for them.
- **Length:** Hindi sentences run longer, so the edit stretches to about 75 seconds. Each section waits for its line, and nothing overlaps. The English build is unchanged at 60 seconds.
- **Voice:** Kokoro `hf_alpha` at 1.25× speed, the clearest of the four Hindi voices by character error rate against the script. It still flattens some aspirated sounds, for example हाथ comes out close to "हाद". For a native-sounding voice, generate the lines with ElevenLabs (multilingual) or record them, save them as `out/vo-hi/<id>.wav`, and keep the anchor times, or re-split them to match.

## Hinglish voiceover version (Sarvam AI)

`explainer/build-hinglish.sh` builds the explainer with a Hinglish voiceover from **Sarvam AI's Bulbul v3**, which is built for Indian languages and code-mixed speech. It uses the speaker `shreya` at 1.1× pace. The picture and on-screen text are unchanged.

- **Script:** `explainer/script-hinglish.json` is natural Hinglish: Hindi sentences with English words written in English (customers, WhatsApp, order, policy, discount, hold), the way store owners actually talk.
- **Timing:** each clause is spoken whole, for natural delivery. Beat anchors are written inline as `{held}`, `{matches}` and so on. An anchor at the start of a clause is exact. One inside a clause is placed by its syllable position within the clause.
- **Length:** about 67 seconds. The pilot scene keeps at least the English cut's length, so the launch offer can be read.
- **Key:** the API key is read from `SARVAM_API_KEY` only and is never written to the repo. Regenerating the voice needs a key. The rest of the build doesn't.

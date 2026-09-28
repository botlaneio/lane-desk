# BotLane: 60-second English explainer (botlane.in)

- **Format:** 1920×1080, 60 fps, 60.0 s, H.264 + AAC. Audio is mastered to −14 LUFS / −2 dBTP.
- **Source of truth:** the live site as reviewed on 28 Sep 2026: https://botlane.in/ and https://botlane.in/assist. Every claim, number and feature in the film appears on those pages.
- **Voice:** Sarvam Bulbul v3 (en-IN, speaker "ritu"), in English only.
- **Music:** an original synthesized bed, ducked 12 dB under the voice.

Build:

```
SARVAM_API_KEY=... python3 launch/voice.py      # voice lines + word timings (launch/timing.js)
python3 launch/capture.py                       # site captures + element rects (launch/rects.js)
python3 render.py --page launch/index.html --cues out/launch-cues.json
python3 launch/score.py out/launch-cues.json out/launch-score.wav
MUSIC_GAIN=0.34 MUSIC_DUCK_DB=12 python3 explainer/mix.py out/launch-cues.json out/launch-vo out/launch-score.wav out/launch-mix.wav
python3 render.py out/launch-video.mp4 --page launch/index.html
python3 master.py out/launch-mix.wav out/launch-video.mp4 out/botlane-explainer-60s.mp4
```

## 1. Site review: what the film is built on

| Element | What the live site says | Where |
|---|---|---|
| Value proposition | "Software for the work that still gets done manually." BotLane builds and operates focused software for Indian businesses, removing repetitive operational work from WhatsApp, spreadsheets and disconnected systems. | botlane.in hero |
| Pain | "You already have software. The manual work is still there." WhatsApp → copy → Excel → re-enter → Tally → match → GST portal → reconcile → marketplaces. "Every step between two systems is someone on your team." | botlane.in/#gap |
| Product | The lanes: Lane Assist (available), Lane Verify (in development), Lane Engage and Lane Settle (in research). | botlane.in hero, #products |
| How it works | Lane Assist answers routine WhatsApp questions for Shopify and WooCommerce stores. Order lookups happen only after the WhatsApp number matches. Every AI draft is checked against store policy and held if it breaks it. Hard conversations go to a person with the whole chat. | botlane.in/assist hero, #the-guard, #handoff |
| Trust | Managed service: connected on one call, policy wording and thresholds written with you, reviewed every week, kept current. Footer: "Private · Managed · Human-controlled". | /assist#service, footer |
| India fit | GST and Tally, WhatsApp first, UPI/COD and payouts, Indian marketplaces, priced in rupees, a person at the exception. | botlane.in/#india |
| Offer and CTA | Pilot at ₹6,999/month, with setup scoped separately. The primary CTA is "Talk to BotLane", which points to botlane.in/contact. | /assist#pilot, site header |

Left out on purpose:
- Lane Verify, Engage and Settle: they aren't available yet.
- The launch offer: it is limited to five pilots.
- Package tiers.
- Integrations the site doesn't claim.
- Statistics: the site doesn't publish any.

## 2. Voiceover script (English)

| Time | Line |
|---|---|
| 0:00.35–0:04.4 | You already have software. So why does so much work still get done by hand? |
| 0:05.0–0:13.4 | BotLane builds and runs focused software for Indian businesses, for the repetitive work between WhatsApp, spreadsheets and the systems you already use. |
| 0:13.9–0:23.0 | The first lane, Lane Assist, answers routine WhatsApp questions for online stores. Order questions are answered from your store, only after the customer's number matches. |
| 0:23.5–0:33.3 | Every AI draft is checked against your policy. If it promises something you don't offer, it's held. And when it's hard, a person takes over, with the whole chat. |
| 0:34.0–0:42.0 | You don't set up a bot. BotLane connects it, writes the rules with you, and reviews every week. Private, managed, and human-controlled. |
| 0:43.2–0:52.6 | It's built for how business works here. Work starts on WhatsApp, everything is priced in rupees, and the pilot is ₹6,999 a month. |
| 0:55.0–0:57.8 | BotLane. Talk to us at botlane.in. |

(The TTS input spells "Bot Lane" as two words and writes out "six thousand, nine hundred and ninety-nine rupees" so both are pronounced correctly.)

## 3. Storyboard

| Time | Beat | Picture | Motion and highlight | Sound |
|---|---|---|---|---|
| 0:00–0:05 | Pain hook | botlane.in/#gap: "You already have software. The manual work is still there." | The camera opens tight on the headline, then pulls back to the WhatsApp → Excel → Tally → GST portal → Marketplaces chain. Each system and each COPY / RE-ENTER / MATCH / RECONCILE step lights in turn, ending on "Every step between two systems is someone on your team." | Low F#m pad and a soft tick for each step |
| 0:05–0:14 | Introduce BotLane | botlane.in hero: "Software for the work that still gets done manually." with "The lanes" list | The camera scrolls up to the hero and eases out to the full layout. Orange focus ring on "Lane Assist · Available", and the cursor moves to it and clicks. | Resolves to A major, light plucks |
| 0:14–0:23 | Lane Assist | Browser-window transition from botlane.in to botlane.in/assist, landing on "Support that knows when to hand over." | Zoom into the live Order status flow. The NUMBER MATCHED and ORDER FOUND chips ring as the voice says "number"; VERIFIED rings on "matches". | Soft kick enters |
| 0:23–0:29 | Reply guard | /assist#the-guard | Push into the "Draft held" card. The struck-through AI draft ("Here's 20% off your next order") rings on "promises", then the HELD pill on "held". | — |
| 0:29–0:34 | Handoff | /assist#handoff | The "Handoff to the owner" card; "To the owner · WhatsApp — Customer asked for a person — full chat attached" rings. | — |
| 0:34–0:40 | Managed service | /assist#service: "You don't set up a bot. BotLane runs it for you." | Service cards ring in time with the voice: Connected on one call → Policy wording and thresholds → Reviewed every week. | Drums out, warmer bed |
| 0:40–0:43 | Trust line | /assist footer | Close-up on "PRIVATE · MANAGED · HUMAN-CONTROLLED", each word underlined in orange as it is spoken. | — |
| 0:43–0:49 | Built for India | Window transition to botlane.in/#india: "Built around how business actually works here." | The camera settles on the six India cards; "WhatsApp first" rings, then "Priced in rupees". | Gentle four-on-the-floor |
| 0:49–0:53 | Pilot | Window transition to botlane.in/assist#pilot | The dark pilot band, with "₹6,999 /month, setup scoped separately." ringed and the full "The pilot includes" list in view. | — |
| 0:53–1:00 | CTA / end frame | Clean paper frame | The botLane mark and wordmark, "Software for the work that still gets done manually.", the orange "Talk to BotLane ↗" button (the cursor presses it on "Talk"), "BOTLANE.IN/CONTACT", and "PRIVATE · MANAGED · HUMAN-CONTROLLED". | A major resolve, the lamp's three-note signature |

- **Transitions:** framed browser-window moves with the real URL in the address bar, a horizontal page slide, and eased camera moves with motion blur.
- **9:16 safe area:** the key UI for each beat sits within the centre 608 px column during its hold (the gap chain is the one wide exception and would be reframed per row). Captions and the end-frame lockup are centred.

## 4. On-screen text

The film adds only three kinds of text of its own. Everything else is the live site's own UI, shown as captured.

**Captions:** see `botlane-explainer.en.srt` (27 cues, English, synced to the voice's word timings).

**End frame:**
- botLane (mark + wordmark)
- Software for the work / that still gets done manually.
- Talk to BotLane ↗
- BOTLANE.IN/CONTACT
- PRIVATE · MANAGED · HUMAN-CONTROLLED

**Browser address bar:**
- botlane.in
- botlane.in/assist
- botlane.in/#india
- botlane.in/assist#pilot

**Site copy the film highlights**, all verbatim from the live pages:
- botlane.in/#gap:
  - "You already have software. The manual work is still there."
  - WhatsApp · COPY · Excel · RE-ENTER · Tally · MATCH · GST portal · RECONCILE · Marketplaces and payments
  - "Every step between two systems is someone on your team."
- botlane.in hero:
  - "Software for the work that still gets done manually."
  - "Lane Assist · Available"
- botlane.in/assist hero:
  - "Support that knows when to hand over."
  - Order status: NUMBER MATCHED · ORDER FOUND · VERIFIED
- /assist#the-guard: "Draft held" · "AI draft · not sent" · HELD
- /assist#handoff: "Handoff to the owner" · "Customer asked for a person"
- /assist#service: "Connected on one call" · "Policy wording and thresholds" · "Reviewed every week"
- Footer: "Private · Managed · Human-controlled"
- botlane.in/#india: "Built around how business actually works here." · "WhatsApp first" · "Priced in rupees"
- /assist#pilot: "Start with a pilot." · "₹6,999 /month, setup scoped separately."

## 5. Website screens used

| # | Screen | Source URL | Used at |
|---|---|---|---|
| 1 | The gap | https://botlane.in/#gap | 0:00–0:05 |
| 2 | Hero + the lanes | https://botlane.in/ | 0:05–0:14 |
| 3 | Lane Assist hero, order-status flow | https://botlane.in/assist | 0:14–0:23 |
| 4 | Reply guard | https://botlane.in/assist#the-guard | 0:23–0:29 |
| 5 | Handoff | https://botlane.in/assist#handoff | 0:29–0:34 |
| 6 | Managed service | https://botlane.in/assist#service | 0:34–0:40 |
| 7 | Footer trust line | https://botlane.in/assist (footer) | 0:40–0:43 |
| 8 | Built for India | https://botlane.in/#india | 0:43–0:49 |
| 9 | Pilot | https://botlane.in/assist#pilot | 0:49–0:53 |

Captured at 1920 px wide at 2× from the live pages. The chat demos were allowed to play through, and the hero carousel is paused on its "Order status" flow.

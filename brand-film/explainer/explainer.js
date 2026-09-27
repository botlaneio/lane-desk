/*
 * Lane Desk: 60-second explainer with voiceover.
 *
 * Built on the 15-second film (../film.js): its world, its dot and its scenes are replayed through a
 * time map that holds and slows the film so each beat lands on the word that names it (word times come
 * from explainer/timing.js, generated from the voiceover). New scenes carry what the film doesn't say:
 * the problem, the product title, the managed service (drawn as marker notes on the system itself),
 * and the pilot offer (the mark's ink plate opens into the site's ink band).
 *
 * Everything is a pure function of t, like the film.
 */
(function () {
  "use strict";

  const F = window.FILM;
  const X = F.lib;
  const { C, SANS, MONO, E, clamp, lerp, prog, spring, hash, noise, font, rrect, chip, marker, dot, arrowPath, L, T } = X;
  const { LANE_Y, X_F, X_G, LC, OV, MS, MX, MY } = X.W;
  const FPS = 60;
  const VT = window.VO_TIMING;

  // the film's middle beats, re-spaced so the voice has room (content time only; the explainer owns the camera)
  Object.assign(T, { circle: 3.9, click: 4.12, shoot: 4.18, card: 4.72, verified: 5.7 });

  // ---------------------------------------------------------------- voiceover schedule
  // Each section waits for the previous line to finish, so a longer voice (Hindi, a slower take)
  // stretches the edit instead of overlapping. With the English voice this gives the original 60 s cut.
  const LEN = VT.lengths;
  const VO = { problem: 0.4 };
  const HOOK = Math.max(8.6, VO.problem + LEN.problem + 0.25);
  VO.intro = HOOK + 1.7;
  VO.routes = Math.max(HOOK + 6.6, VO.intro + LEN.intro + 0.35);
  VO.guard = Math.max(VO.routes + 9.1, VO.routes + LEN.routes + 0.8);
  function w(id, word, nth = 0) {
    let k = 0;
    for (const [txt, a] of VT.words[id]) {
      const t = txt.toLowerCase().replace(/[^a-z0-9']/g, "");
      if (t.startsWith(word)) {
        if (k === nth) return VO[id] + a;
        k++;
      }
    }
    throw new Error(`word not found: ${id}/${word}`);
  }

  // ---------------------------------------------------------------- film time map (E = explainer, F = film)
  {
    const ho = w("guard", "held") - 0.08 + 0.6;
    VO.handoff = Math.max(VO.guard + 8.3, VO.guard + LEN.guard + 0.3, ho + 0.24);
    VO.service = Math.max(VO.handoff + 6.2, VO.handoff + LEN.handoff + 0.6);
  }
  const CONV = VO.service + LEN.service + 0.13;
  const PILOT_IN = CONV + 1.28;
  VO.pilot = PILOT_IN + 0.42;
  const PILOT_OUT = VO.pilot + LEN.pilot + 1.1;
  VO.close = PILOT_OUT + 0.7;
  const DUR = Math.max(60, VO.close + LEN.close + 2.4);
  let K, darkE, E_v, E_iris, E_held;
  function buildMap() {
    E_v = w("routes", "matches");
    E_held = w("guard", "held");
    darkE = VO.guard + 1.5;
    const ho = E_held - 0.08 + 0.6; // film 8.30
    const titleEnd = VO.routes - 0.9;
    K = [
      [HOOK, 0],
      [HOOK + 2.52, 2.52],
      [titleEnd, 2.52], // hold: the dot rests on the lane under the title
      [titleEnd + 0.82, 3.34], // roll to the switch; the lanes spring apart
      [titleEnd + 1.36, 3.88], // labels settle
      [w("routes", "order") - 0.16, 3.88], // hold on the five routes
      [w("routes", "order") + 0.12, 4.16], // marker circle on "Order"
      [w("routes", "order") + 1.44, 5.48], // shoot, the card opens
      [w("routes", "number") - 0.1, 5.48], // hold on the card
      [E_v, 5.7], // VERIFIED on "matches"
      [E_v + 0.25, 5.95],
      [VO.guard - 0.8, 5.95],
      [VO.guard + 0.6, 6.55], // the AI draft races to the guard (slowed)
      [darkE, 7.0], // into the guard
      [darkE + 0.45, 7.45],
      [w("guard", "discount") - 0.25, 7.45], // hold on the draft
      [w("guard", "discount"), 7.7], // struck through on "discount"
      [E_held - 0.08, 7.7],
      [ho, 8.3], // HELD on "held"
      [ho + 1.85, 10.15], // when it's hard / a person takes over
      [CONV, 10.84], // hold (nothing moves in the film here)
      [PILOT_IN, 12.12], // everything folds into the mark
      [PILOT_OUT, 12.12], // hold under the pilot
      [PILOT_OUT + 0.43, 12.55],
      [w("close", "fast") - 0.14, 13.3], // wordmark on "Lane Desk"
      [w("close", "matters") + 0.2, 13.9], // tagline follows the voice
      [w("close", "matters") + 1.3, 15.0],
      [DUR, 15.0],
    ];
    for (let i = 1; i < K.length; i++) if (K[i][0] < K[i - 1][0]) throw new Error("time map not increasing at " + i);
    E_iris = Einv(9.28);
  }
  function fmap(t) {
    if (t < K[0][0]) return null;
    for (let i = 1; i < K.length; i++) {
      const [e0, f0] = K[i - 1], [e1, f1] = K[i];
      if (t <= e1) return lerp(f0, f1, e1 > e0 ? (t - e0) / (e1 - e0) : 1);
    }
    return K[K.length - 1][1];
  }
  function Einv(f) {
    for (let i = 1; i < K.length; i++) {
      const [e0, f0] = K[i - 1], [e1, f1] = K[i];
      if (f1 > f0 && f >= f0 && f <= f1) return e0 + ((f - f0) / (f1 - f0)) * (e1 - e0);
    }
    return f <= K[0][1] ? K[0][0] : K[K.length - 1][0];
  }

  // ---------------------------------------------------------------- camera (explainer time)
  let CK;
  function buildCam() {
    const y12 = (X.laneY(1) + X.laneY(2)) / 2;
    const card = { x: L.orderPos.x + L.cards.order.w / 2, y: X.laneY(0) };
    const meta = L.cards.order.items.find((i) => i.type === "meta");
    const chipW = { x: L.orderPos.x + L.cards.order.w - 300, y: L.orderPos.y + meta.y };
    const titleEnd = VO.routes - 0.9;
    CK = [
      { t: HOOK, x: L.hookCam.x, y: L.hookCam.y, z: 1 },
      { t: HOOK + 1.26, x: L.hookCam.x, y: L.hookCam.y, z: 1, e: E.lin },
      { t: HOOK + 2.1, x: L.landX + 160, y: LANE_Y, z: 1, e: E.inOut },
      { t: HOOK + 2.95, x: L.landX + 330, y: LANE_Y - 165, z: 0.93, e: E.brand },
      { t: titleEnd, x: L.landX + 380, y: LANE_Y - 178, z: 0.92, e: E.lin },
      { t: titleEnd + 1.0, x: X_F + 640, y: LANE_Y, z: 0.64, e: E.inOut },
      { t: w("routes", "order") - 0.2, x: X_F + 690, y: LANE_Y, z: 0.675, e: E.lin },
      { t: w("routes", "order") + 0.15, x: X_F + 690, y: LANE_Y, z: 0.675, e: E.lin },
      { t: w("routes", "order") + 1.1, x: card.x, y: card.y, z: 1.12, e: E.brand },
      { t: E_v - 0.36, x: card.x + 12, y: card.y, z: 1.17, e: E.lin },
      { t: E_v + 0.45, x: lerp(card.x, chipW.x, 0.55), y: lerp(card.y, chipW.y, 0.55), z: 1.42, e: E.brand },
      { t: VO.guard - 0.8, x: lerp(card.x, chipW.x, 0.58), y: lerp(card.y, chipW.y, 0.58), z: 1.46, e: E.lin },
      { t: VO.guard - 0.35, x: X_G - 300, y: y12, z: 1.0, e: E.whip },
      { t: VO.guard + 0.6, x: X_G - 80, y: y12, z: 1.08, e: E.lin },
      { t: darkE, x: X_G, y: y12, z: 44, e: E.expoIn },
      { t: E_iris, x: X_G, y: y12, z: 44, e: E.lin },
      { t: E_iris + 1e-4, x: LC.x, y: LC.y, z: 1, e: null },
      { t: VO.service - 1.0, x: LC.x + 30, y: LC.y + 10, z: 1.08, e: E.lin },
      { t: VO.service, x: OV.x, y: OV.y - 110, z: OV.z, e: E.inOut },
      { t: CONV, x: OV.x + 15, y: OV.y - 110, z: OV.z * 1.03, e: E.lin },
      { t: PILOT_IN, x: MX, y: MY, z: 0.95, e: E.inOut },
      { t: PILOT_OUT, x: MX, y: MY, z: 0.95, e: E.lin },
      { t: PILOT_OUT + 1.05, x: MX, y: MY + 110, z: 0.52, e: E.brand },
      { t: DUR, x: MX, y: MY + 110, z: 0.545, e: E.lin },
    ];
  }
  function camAt(t) {
    let i = 1;
    while (i < CK.length - 1 && CK[i].t < t) i++;
    const a = CK[i - 1], b = CK[i];
    if (t <= a.t) return { x: a.x, y: a.y, z: a.z };
    if (t >= b.t || !b.e) return { x: b.x, y: b.y, z: b.z };
    const p = b.e((t - a.t) / (b.t - a.t));
    return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), p)) };
  }

  let IMPACTS;
  function buildImpacts() {
    IMPACTS = [
      [0.04, 12, 10], [HOOK + 0.07, 22, 9], [Einv(2.1), 7, 10], [Einv(T.card), 4, 12], [E_v, 6, 14], [darkE, 18, 8],
      [Einv(7.78), 24, 9], [Einv(8.66), 8, 12], [E_iris, 10, 10], [Einv(12.05), 5, 12],
      [w("problem", "hand"), 12, 11], [w("pilot", "6"), 8, 12], [PILOT_OUT - 0.9, 3, 14],
    ];
  }
  function shake(t) {
    let x = 0, y = 0, r = 0;
    for (const [ti, amp, k] of IMPACTS) {
      const dt = t - ti;
      if (dt < 0 || dt > 0.8) continue;
      const a = amp * Math.exp(-dt * k);
      x += a * noise(t * 38 + ti * 17);
      y += a * noise(t * 41 + ti * 29 + 5);
      r += a * 0.0009 * noise(t * 30 + ti);
    }
    return { x, y, r };
  }

  // ---------------------------------------------------------------- scene 1: the problem (screen space)
  const MSGS = [
    "Where’s my order?", "Can I return this?", "Is this in XL?", "Where’s my order?", "hello??",
    "Can I exchange this?", "Where’s my order?", "Is COD available?", "Can I return this?", "Where’s my order?",
    "Size chart?", "Where’s my order?", "Can I return this?", "any update??", "Where’s my order?",
  ];
  const ARRIVE = [0.0, 0.1, 0.2, 0.34, 0.9, 1.35, 1.72, 2.05, 2.34, 2.6, 2.84, 3.04, 3.22, 3.39, 3.54];
  const CHAT = { x: 1010, y: 96, w: 790, h: 888, head: 78, foot: 54 };
  let P = null;
  function layoutProblem(ctx) {
    font(ctx, 500, 30, SANS, -0.2);
    P = MSGS.map((m) => {
      const tw = ctx.measureText(m).width;
      return { text: m, w: tw + 46, h: 72 };
    });
  }
  function bubbleStackY(i, t, typing) {
    // newest at the bottom; each arrival pushes the older ones up with a spring
    const base = CHAT.y + CHAT.h - CHAT.foot - 30;
    let off = 0;
    for (let j = i + 1; j < P.length; j++) {
      if (t < ARRIVE[j]) break;
      off += (P[j].h + 14) * spring(t - ARRIVE[j], 3.2, 0.72);
    }
    off += typing;
    return base - P[i].h - off;
  }
  function drawProblem(ctx, t) {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, 1920, 1080);
    const tType = w("problem", "and") + 0.15;
    const typingH = t > tType ? 86 * spring(t - tType, 3, 0.7) : 0;

    // push into the newest "Where's my order?" at the end: a match cut into the film's hook
    const pushP = E.expoIn(prog(t, HOOK - 0.5, HOOK));
    const last = P.length - 1;
    const ly = bubbleStackY(last, t, typingH);
    const fx = CHAT.x + 28 + 23 + P[last].w * 0.3, fy = ly + 36;
    const zs = Math.exp(lerp(0, Math.log(9), pushP));
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(zs, zs);
    ctx.translate(-fx + (960 - fx) * pushP / zs * 0, -fy);
    ctx.translate(((960 - fx) * pushP) / zs, ((540 - fy) * pushP) / zs);

    // left: the words
    const say = (txt, x, y, px, t0, weight = 700, color = C.ink) => {
      const k = E.brand(prog(t, t0, t0 + 0.42));
      if (k <= 0) return;
      font(ctx, weight, px, SANS, -0.03 * px);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 20, y - px * 1.05, 1000, px * 1.3);
      ctx.clip();
      ctx.fillStyle = color;
      ctx.fillText(txt, x, y + (1 - k) * px * 1.05);
      ctx.restore();
    };
    const drop = (i) => {
      const dt = t - (tType - 0.1 + i * 0.04);
      return dt > 0 ? 0.5 * 9000 * dt * dt : 0;
    };
    ctx.save();
    ctx.translate(0, drop(0));
    say("Every day,", 130, 380, 138, VO.problem + 0.02);
    ctx.restore();
    ctx.save();
    ctx.translate(0, drop(1));
    say("the same", 130, 520, 138, w("problem", "the") - 0.05);
    ctx.restore();
    ctx.save();
    ctx.translate(0, drop(2));
    say("questions.", 130, 660, 138, w("problem", "things") - 0.05);
    ctx.restore();
    say("And every answer comes", 130, 430, 58, tType + 0.05, 600, C.ink2);
    say("from you,", 130, 500, 58, w("problem", "from") - 0.05, 600, C.ink2);
    {
      const th = w("problem", "hand") - 0.12;
      if (t >= th) {
        const s = lerp(1.6, 1, spring(t - th, 2.6, 0.55));
        ctx.save();
        ctx.translate(130, 700);
        ctx.scale(s, s);
        ctx.globalAlpha = clamp((t - th) * 14);
        font(ctx, 700, 190, SANS, -0.03 * 190);
        ctx.fillStyle = C.ink;
        ctx.fillText("by hand.", 0, 0);
        ctx.restore();
        // marker underline under "hand"
        const up = E.inOut(prog(t, th + 0.25, th + 0.5));
        font(ctx, 700, 190, SANS, -0.03 * 190);
        const bw = ctx.measureText("by ").width, hw = ctx.measureText("hand").width;
        marker(ctx, [[130 + bw - 6, 734], [130 + bw + hw * 0.5, 742], [130 + bw + hw + 8, 730]], up, 11, C.ink, 41, 1.6);
      }
    }

    // right: a WhatsApp inbox filling up
    const cardIn = spring(t + 0.03, 2.6, 0.5);
    ctx.save();
    const cs = lerp(1.12, 1, cardIn);
    ctx.translate(CHAT.x + CHAT.w / 2, CHAT.y + CHAT.h / 2);
    ctx.scale(cs, cs);
    ctx.translate(-(CHAT.x + CHAT.w / 2), -(CHAT.y + CHAT.h / 2) + (1 - cardIn) * 60);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.09)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
    rrect(ctx, CHAT.x, CHAT.y, CHAT.w, CHAT.h, 22);
    ctx.fillStyle = C.surface;
    ctx.fill();
    ctx.restore();
    ctx.save();
    rrect(ctx, CHAT.x, CHAT.y, CHAT.w, CHAT.h, 22);
    ctx.clip();
    ctx.fillStyle = C.paper;
    ctx.fillRect(CHAT.x, CHAT.y + CHAT.head, CHAT.w, CHAT.h - CHAT.head - CHAT.foot);
    ctx.fillStyle = C.hairline;
    ctx.fillRect(CHAT.x, CHAT.y + CHAT.head - 2, CHAT.w, 2);
    ctx.fillRect(CHAT.x, CHAT.y + CHAT.h - CHAT.foot, CHAT.w, 2);
    // body
    ctx.save();
    ctx.beginPath();
    ctx.rect(CHAT.x, CHAT.y + CHAT.head, CHAT.w, CHAT.h - CHAT.head - CHAT.foot);
    ctx.clip();
    for (let i = 0; i < P.length; i++) {
      if (t < ARRIVE[i]) break;
      const b = P[i];
      const y = bubbleStackY(i, t, typingH);
      if (y + b.h < CHAT.y + CHAT.head - 10) continue;
      const k = spring(t - ARRIVE[i], 3.4, 0.55);
      const x = CHAT.x + 28;
      ctx.save();
      ctx.translate(x, y + b.h / 2);
      const sc = lerp(0.6, 1, k);
      ctx.scale(sc, sc);
      ctx.globalAlpha = clamp((t - ARRIVE[i]) * 14);
      ctx.beginPath();
      ctx.roundRect(0, -b.h / 2, b.w, b.h, [6, 18, 18, 18]);
      ctx.fillStyle = C.surface2;
      ctx.fill();
      font(ctx, 500, 30, SANS, -0.2);
      ctx.fillStyle = C.ink;
      ctx.fillText(b.text, 23, 11);
      ctx.restore();
      // marker: circle every "Where's my order?", underline every "Can I return this?"
      const isWhere = b.text.startsWith("Where");
      const isReturn = b.text.startsWith("Can I return");
      const tw = w("problem", "where") - 0.06;
      const tr = w("problem", "return") - 0.1;
      if (isWhere && t > tw) {
        const n = MSGS.slice(0, i).filter((m) => m.startsWith("Where")).length;
        const p0 = tw + n * 0.07;
        const pts = [];
        const cx = x + b.w / 2, cy = y + b.h / 2, rx = b.w / 2 + 26, ry = b.h / 2 + 12;
        for (let q = 0; q <= 48; q++) {
          const a = -2.4 + (q / 48) * Math.PI * 2.15;
          pts.push([cx + Math.cos(a) * rx * (1 + 0.04 * noise(q * 0.4 + i)), cy + Math.sin(a) * ry + q * 0.12]);
        }
        marker(ctx, pts, E.inOut(prog(t, p0, p0 + 0.22)), 5, C.ink, 50 + i, 1.1);
      }
      if (isReturn && t > tr) {
        const n = MSGS.slice(0, i).filter((m) => m.startsWith("Can I return")).length;
        const p0 = tr + n * 0.08;
        marker(ctx, [[x + 8, y + b.h + 8], [x + b.w * 0.5, y + b.h + 12], [x + b.w - 4, y + b.h + 5]], E.inOut(prog(t, p0, p0 + 0.2)), 5, C.ink, 70 + i, 1.2);
      }
    }
    // your reply: typing, by hand
    if (t > tType) {
      const k = spring(t - tType, 3, 0.6);
      const bw = 160, bh = 72;
      const bx = CHAT.x + CHAT.w - 28 - bw;
      const by = CHAT.y + CHAT.h - CHAT.foot - 30 - bh;
      ctx.save();
      ctx.globalAlpha = clamp((t - tType) * 10);
      ctx.translate(bx + bw, by + bh / 2);
      ctx.scale(lerp(0.6, 1, k), lerp(0.6, 1, k));
      ctx.beginPath();
      ctx.roundRect(-bw, -bh / 2, bw, bh, [18, 6, 18, 18]);
      ctx.fillStyle = C.surface;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.hairline;
      ctx.stroke();
      for (let d = 0; d < 3; d++) {
        const ph = Math.sin((t - tType) * 7 - d * 0.9) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(-bw + 50 + d * 30, -4 * ph, 7, 0, Math.PI * 2);
        ctx.fillStyle = mixA(C.ink2, 0.35 + 0.65 * ph);
        ctx.fill();
      }
      font(ctx, 500, 17, MONO, 1);
      ctx.fillStyle = C.ink2;
      ctx.textAlign = "right";
      ctx.fillText("YOU, TYPING", 0, -bh / 2 - 12);
      ctx.textAlign = "left";
      ctx.restore();
    }
    ctx.restore();
    // header + footer
    font(ctx, 600, 26, SANS, -0.2);
    ctx.fillStyle = C.ink;
    ctx.fillText("Your store", CHAT.x + 28, CHAT.y + 49);
    font(ctx, 500, 18, MONO, 0.8);
    ctx.fillStyle = C.ink2;
    ctx.textAlign = "right";
    ctx.fillText("WHATSAPP", CHAT.x + CHAT.w - 28, CHAT.y + 48);
    ctx.textAlign = "left";
    font(ctx, 500, 16, MONO, 0.7);
    ctx.fillText("AN ILLUSTRATIVE FLOW · NO CUSTOMER DATA", CHAT.x + 28, CHAT.y + CHAT.h - 20);
    ctx.restore();
    rrect(ctx, CHAT.x, CHAT.y, CHAT.w, CHAT.h, 22);
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.hairline;
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
  function mixA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ---------------------------------------------------------------- scene 2: the product, named (over the lane)
  function drawTitle(ctx, t) {
    const t0 = Math.max(w("intro", "lane") - 0.05, Einv(2.14));
    const tEnd = VO.routes - 1.0;
    if (t < t0 || t > tEnd + 0.5) return;
    const out = (i) => {
      const dt = t - (tEnd + i * 0.04);
      return dt > 0 ? 0.5 * -9000 * dt * dt : 0;
    };
    const k = spring(t - t0, 2.4, 0.62);
    font(ctx, 700, 210, SANS, lerp(0.4, -0.03, clamp(k, 0, 1.1)) * 210);
    const tw = ctx.measureText("Lane Desk").width;
    ctx.save();
    ctx.translate(0, out(0));
    ctx.globalAlpha = clamp((t - t0) * 8);
    ctx.fillStyle = C.ink;
    ctx.fillText("Lane Desk", 960 - tw / 2, 296);
    ctx.restore();
    const lines = [
      ["A MANAGED WHATSAPP SUPPORT DESK", Math.max(t0 + 0.2, w("intro", "managed") - 0.05), 372],
      ["FOR INDIAN ONLINE STORES", w("intro", "indian") - 0.1, 418],
    ];
    lines.forEach(([txt, a, y], i) => {
      const p = prog(t, a, a + 0.45);
      if (p <= 0) return;
      font(ctx, 500, 32, MONO, 2.2);
      const lw = ctx.measureText(txt).width;
      ctx.save();
      ctx.translate(0, out(i + 1));
      ctx.fillStyle = C.ink2;
      ctx.fillText(txt.slice(0, Math.ceil(txt.length * E.brand(p))), 960 - lw / 2, y);
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------- scene 5: managed service (notes on the system)
  function serviceWorld(ctx, t) {
    const a = 1 - prog(t, CONV - 0.05, CONV + 0.3);
    if (t < VO.service + 1.4 || a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    const lw = 11;
    const note = (txt, x, y, t0, align = "left") => {
      const p = prog(t, t0, t0 + 0.35);
      if (p <= 0) return;
      font(ctx, 500, 44, MONO, 2.4);
      const tw = ctx.measureText(txt).width;
      const n = Math.ceil(txt.length * E.brand(p));
      ctx.fillStyle = C.ink;
      ctx.fillText(txt.slice(0, n), align === "right" ? x - tw : x, y);
      return tw;
    };
    // 1. connects your store
    const t1 = w("service", "connects") - 0.1;
    if (t > t1) {
      const lx = X_F - 1010, ly = LANE_Y - 330;
      note("CONNECTED ON ONE CALL", lx, ly, t1);
      font(ctx, 500, 34, MONO, 1.8);
      ctx.fillStyle = C.ink2;
      if (t > t1 + 0.3) ctx.fillText("YOUR STORE + WHATSAPP NUMBER", lx, ly + 54);
      const p0 = [lx + 640, ly + 70], p2 = [X_F - 60, LANE_Y - 50], p1 = [X_F - 240, ly + 40];
      marker(ctx, curve(p0, p1, p2), E.inOut(prog(t, t1 + 0.25, t1 + 0.6)), lw, C.ink, 81, 2);
      arrowHead(ctx, p1, p2, prog(t, t1 + 0.58, t1 + 0.7), lw, 83);
    }
    // 2. writes the policy wording
    const t2 = w("service", "policy") - 0.3;
    if (t > t2) {
      const g = X.gateBox();
      const cx = g.x + g.w / 2, cy = g.y + g.h / 2;
      const pts = [];
      for (let q = 0; q <= 60; q++) {
        const ang = -2.2 + (q / 60) * Math.PI * 2.2;
        pts.push([cx + Math.cos(ang) * (g.w / 2 + 70) * (1 + 0.04 * noise(q * 0.3 + 2)), cy + Math.sin(ang) * (g.h / 2 + 60) + q * 0.4]);
      }
      marker(ctx, pts, E.inOut(prog(t, t2, t2 + 0.35)), lw, C.ink, 91, 2.4);
      const nx = X.W.X_F + 1250 + 80;
      note("POLICY WORDING,", nx, LANE_Y - 44, t2 + 0.2);
      note("WRITTEN WITH YOU", nx, LANE_Y + 14, t2 + 0.4);
      const from = [nx - 20, LANE_Y - 40], tip = [g.x + g.w + 84, cy - 10], mid = [nx - 60, cy - 60];
      marker(ctx, curve(from, mid, tip), E.inOut(prog(t, t2 + 0.35, t2 + 0.6)), lw, C.ink, 93, 1.2);
      arrowHead(ctx, mid, tip, prog(t, t2 + 0.58, t2 + 0.7), lw, 95);
    }
    // 3. reviews every week
    const t3 = w("service", "reviews") - 0.15;
    if (t > t3) {
      const lay = L.cards.owner;
      const x0 = L.ownerPos.x - 40, y0 = L.ownerPos.y - 40, x1 = L.ownerPos.x + lay.w + 40, y1 = L.ownerPos.y + lay.h + 40;
      const pts = [[x0, y0 + 20], [x1 - 10, y0 - 6], [x1 + 8, y1 - 12], [x0 + 16, y1 + 6], [x0 - 6, y0 + 60]];
      const sm = [];
      for (let q = 0; q < pts.length - 1; q++) for (let s = 0; s < 12; s++) {
        const u = s / 12;
        sm.push([lerp(pts[q][0], pts[q + 1][0], u), lerp(pts[q][1], pts[q + 1][1], u)]);
      }
      marker(ctx, sm, E.inOut(prog(t, t3, t3 + 0.4)), lw, C.ink, 97, 2.6);
      note("REVIEWED EVERY WEEK", x0 - 60, y0 - 50, t3 + 0.25, "right");
      font(ctx, 500, 34, MONO, 1.8);
      ctx.fillStyle = C.ink2;
      if (t > t3 + 0.6) {
        const s = "HELD REPLIES + HANDOFFS";
        ctx.fillText(s, x0 - 60 - ctx.measureText(s).width, y0 + 6);
      }
    }
    ctx.restore();
  }
  function curve(p0, p1, p2) {
    const out = [];
    for (let k = 0; k <= 28; k++) {
      const s = k / 28, u = 1 - s;
      out.push([u * u * p0[0] + 2 * u * s * p1[0] + s * s * p2[0], u * u * p0[1] + 2 * u * s * p1[1] + s * s * p2[1]]);
    }
    return out;
  }
  function arrowHead(ctx, from, tip, p, lw, seed) {
    if (p <= 0) return;
    const ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
    for (const [side, sd] of [[1, seed], [-1, seed + 1]]) {
      const a = ang + Math.PI + side * 0.55;
      marker(ctx, [[tip[0] + Math.cos(a) * 70, tip[1] + Math.sin(a) * 70], tip], E.brand(p), lw, C.ink, sd, 0.5);
    }
  }
  function drawServiceType(ctx, t) {
    const t0 = VO.service - 0.02;
    const a = 1 - prog(t, CONV - 0.05, CONV + 0.3);
    if (t < t0 || a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    const k = E.brand(prog(t, t0, t0 + 0.45));
    font(ctx, 700, 96, SANS, -0.03 * 96);
    ctx.save();
    ctx.beginPath();
    ctx.rect(100, 40, 1600, 140);
    ctx.clip();
    ctx.fillStyle = C.ink;
    ctx.fillText("You don’t set up a bot.", 120, 150 + (1 - k) * 110);
    ctx.restore();
    const b = prog(t, w("service", "bot", 1) - 0.1, w("service", "bot", 1) + 0.3);
    if (b > 0) {
      font(ctx, 500, 30, MONO, 2);
      const s = "BOTLANE RUNS IT FOR YOU";
      ctx.fillStyle = C.ink2;
      ctx.fillText(s.slice(0, Math.ceil(s.length * E.brand(b))), 124, 206);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- scene 6: the pilot (the plate opens into the ink band)
  function drawPilot(ctx, t, cam) {
    if (t < PILOT_IN - 0.02 || t > PILOT_OUT + 0.01) return;
    const open = E.brand(prog(t, PILOT_IN, PILOT_IN + 0.5)) * (1 - E.inOut(prog(t, PILOT_OUT - 0.5, PILOT_OUT)));
    const z = cam.z;
    const pw = MS * z, ph = MS * z, pr = (8 / 32) * MS * z;
    const cx = 960 + (MX - cam.x) * z, cy = 540 + (MY - cam.y) * z;
    const w0 = lerp(pw, 2200, open), h0 = lerp(ph, 1300, open), r0 = lerp(pr, 0, open);
    ctx.save();
    rrect(ctx, cx - w0 / 2, cy - h0 / 2, w0, h0, r0);
    ctx.fillStyle = C.ink;
    ctx.fill();
    ctx.restore();
    // the slot closes as the plate opens
    const slotK = 1 - clamp(open * 2.2);
    if (slotK > 0) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineWidth = 7 * (MS / 32) * z * slotK;
      ctx.strokeStyle = C.paper;
      ctx.beginPath();
      ctx.moveTo(cx - 6.5 * (MS / 32) * z * slotK, cy);
      ctx.lineTo(cx + 6.5 * (MS / 32) * z * slotK, cy);
      ctx.stroke();
      ctx.restore();
    }
    // the lamp travels from the slot to the eyebrow and back
    const lampHome = { x: cx + (10 - 16) * (MS / 32) * z, y: cy, r: 2.25 * (MS / 32) * z };
    const lampPilot = { x: 142, y: 214, r: 12 };
    const lp = open;
    dot(ctx, lerp(lampHome.x, lampPilot.x, lp), lerp(lampHome.y, lampPilot.y, lp) - Math.sin(lp * Math.PI) * 60, lerp(lampHome.r, lampPilot.r, lp));

    const vis = clamp((open - 0.85) / 0.15);
    if (vis <= 0) return;
    ctx.save();
    ctx.globalAlpha = vis;
    font(ctx, 500, 28, MONO, 1.8);
    ctx.fillStyle = C.onInk2;
    ctx.fillText("PILOT", 168, 224);
    const say = (txt, x, y, px, t0, weight, color) => {
      const k = E.brand(prog(t, t0, t0 + 0.42));
      if (k <= 0) return;
      font(ctx, weight, px, SANS, -0.03 * px);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 20, y - px * 1.05, 1800, px * 1.32);
      ctx.clip();
      ctx.fillStyle = color;
      ctx.fillText(txt, x, y + (1 - k) * px * 1.05);
      ctx.restore();
    };
    say("Start with a pilot.", 130, 360, 120, VO.pilot - 0.02, 700, C.onInk);
    // the price, digit by digit
    const tp = w("pilot", "6") - 0.1;
    if (t > tp) {
      const price = "₹6,999";
      font(ctx, 700, 230, SANS, -0.03 * 230);
      let x = 126;
      for (let i = 0; i < price.length; i++) {
        const ch = price[i];
        const k = spring(t - (tp + i * 0.06), 3, 0.55);
        const cw = ctx.measureText(ch).width;
        if (k > 0) {
          ctx.save();
          ctx.globalAlpha = vis * clamp((t - tp - i * 0.06) * 12);
          ctx.translate(x, 640 - (1 - k) * 120);
          ctx.fillStyle = C.onInk;
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        }
        x += cw;
      }
      const tm = w("pilot", "rupees") - 0.1;
      const k2 = E.brand(prog(t, tm, tm + 0.4));
      if (k2 > 0) {
        ctx.save();
        ctx.globalAlpha = vis * k2;
        font(ctx, 500, 54, SANS, -0.5);
        ctx.fillStyle = C.onInk2;
        ctx.fillText("/month", x + 22, 640);
        font(ctx, 500, 26, MONO, 1.6);
        ctx.fillText("SETUP SCOPED SEPARATELY", 132, 712);
        ctx.restore();
      }
    }
    // launch offer
    const to = w("pilot", "rupees") + 0.6;
    const ko = spring(t - to, 2.6, 0.6);
    if (t > to) {
      ctx.save();
      ctx.globalAlpha = vis * clamp((t - to) * 8);
      ctx.translate(1120, 430 + (1 - ko) * 60);
      rrect(ctx, 0, 0, 660, 250, 16);
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.inkLine;
      ctx.stroke();
      font(ctx, 500, 22, MONO, 1.4);
      ctx.fillStyle = C.onInk2;
      ctx.fillText("LAUNCH OFFER · FIRST 5 PILOTS", 36, 60);
      font(ctx, 600, 40, SANS, -0.6);
      ctx.fillStyle = C.onInk;
      ctx.fillText("Setup waived and 50% off", 36, 128);
      ctx.fillText("for 60 days, for a case study.", 36, 182);
      ctx.restore();
    }
    // the one orange button, pressed once
    const tb = w("pilot", "month") - 0.05;
    if (t > tb) {
      const kb = spring(t - tb, 2.8, 0.6);
      const press = Math.sin(Math.PI * prog(t, PILOT_OUT - 0.95, PILOT_OUT - 0.8));
      ctx.save();
      ctx.globalAlpha = vis * clamp((t - tb) * 8);
      ctx.translate(130, 820 + (1 - kb) * 50 + press * 3);
      font(ctx, 600, 34, SANS, -0.3);
      const label = "Talk about a pilot";
      const lw = ctx.measureText(label).width;
      const bw = lw + 40 + 36 + 34, bh = 80;
      rrect(ctx, 0, 0, bw, bh + 5 * (1 - press), 14);
      ctx.fillStyle = "#c2410c";
      ctx.fill();
      rrect(ctx, 0, 0, bw, bh, 14);
      ctx.fillStyle = C.orange;
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.fillText(label, 36, 52);
      // north-east arrow drawn as a path (the font subset has no arrows)
      ctx.save();
      ctx.translate(36 + lw + 16, 40);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(18, -8);
      ctx.moveTo(4, -8);
      ctx.lineTo(18, -8);
      ctx.lineTo(18, 6);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- inside the guard: checking against policy
  function drawChecking(ctx, t) {
    const a0 = darkE + 0.55, a1 = w("guard", "discount") - 0.3;
    if (t < a0 || t > a1 + 0.2) return;
    const fade = 1 - prog(t, a1, a1 + 0.2);
    ctx.save();
    ctx.globalAlpha = fade;
    // a thin scan line sweeping across the draft
    const sweep = ((t - a0) / 1.3) % 1;
    const x = 130 + sweep * (L.draftW + 40);
    ctx.fillStyle = C.onInk2;
    ctx.globalAlpha = fade * 0.55;
    ctx.fillRect(x, 440, 3, 200);
    ctx.globalAlpha = fade;
    font(ctx, 500, 30, MONO, 1.8);
    ctx.fillStyle = C.onInk2;
    const s = "CHECKING AGAINST YOUR POLICY";
    const n = Math.ceil(s.length * prog(t, a0, a0 + 0.5));
    ctx.fillText(s.slice(0, n), 130, 760);
    if (Math.floor(t * 2.5) % 2 === 0) ctx.fillRect(130 + ctx.measureText(s.slice(0, n)).width + 8, 736, 16, 28);
    ctx.restore();
  }

  // ---------------------------------------------------------------- the end line
  function drawCTA(ctx, t, cam) {
    const t0 = w("close", "matters") + 0.45;
    const k = E.brand(prog(t, t0, t0 + 0.5));
    if (k <= 0) return;
    const y = 540 + (L.tagY - cam.y) * cam.z + 86;
    font(ctx, 500, 24, MONO, 1.9);
    const s = "TALK TO US · BOTLANE.IN/CONTACT";
    const tw = ctx.measureText(s).width;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = C.ink2;
    ctx.fillText(s, 960 - tw / 2, y + (1 - k) * 16);
    ctx.restore();
  }

  // ---------------------------------------------------------------- frame
  let ready = false;
  function init(ctx) {
    F.layout(ctx);
    layoutProblem(ctx);
    buildMap();
    buildCam();
    buildImpacts();
    ready = true;
  }

  function render(ctx, t, W, H) {
    if (!ready) init(ctx);
    const S = W / 1920;
    const sh = shake(t);
    if (t < HOOK) {
      ctx.setTransform(S, 0, 0, S, sh.x * S, sh.y * S);
      drawProblem(ctx, t);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return;
    }
    const f = fmap(t);
    const cam = camAt(t);
    F.render(ctx, f, W, H, {
      cam,
      sh,
      world: (c) => serviceWorld(c, t),
    });
    ctx.setTransform(S, 0, 0, S, sh.x * S, sh.y * S);
    drawTitle(ctx, t);
    drawChecking(ctx, t);
    drawServiceType(ctx, t);
    drawPilot(ctx, t, cam);
    drawCTA(ctx, t, cam);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function samplesAt(t) {
    if (!ready) return 5; // the time map is built on the first render
    const fast = [
      [HOOK - 0.3, HOOK + 0.02],
      [VO.guard - 0.8, VO.guard - 0.3],
      [darkE - 0.25, darkE + 0.02],
      [E_iris - 0.02, E_iris + 0.3],
      [Einv(8.3), Einv(8.3) + 0.3],
      [PILOT_IN, PILOT_IN + 0.35],
      [PILOT_OUT - 0.5, PILOT_OUT],
    ];
    return fast.some(([a, b]) => t >= a && t <= b) ? 16 : 5;
  }

  // sound cues: the film's own cues, carried through the time map, plus the new scenes
  function cues() {
    const out = [];
    for (const c of F.cues()) {
      const e = Einv(c.t);
      const d = c.d ? Einv(c.t + c.d) - e : undefined;
      if (e < HOOK - 0.01) continue;
      out.push({ ...c, t: +e.toFixed(3), ...(d ? { d: +Math.max(0.05, d).toFixed(3) } : {}) });
    }
    const tType = w("problem", "and") + 0.15;
    ARRIVE.forEach((a, i) => out.push({ t: a, k: "tick", g: 0.32, p: 1 + i * 0.045 }));
    out.push({ t: 0.0, k: "thud", g: 0.5 });
    MSGS.forEach((m, i) => {
      if (m.startsWith("Where")) {
        const n = MSGS.slice(0, i).filter((x) => x.startsWith("Where")).length;
        if (n < 3) out.push({ t: w("problem", "where") - 0.06 + n * 0.07, k: "marker", g: 0.3, d: 0.22 });
      }
    });
    out.push({ t: w("problem", "return") - 0.1, k: "marker", g: 0.3, d: 0.2 });
    out.push({ t: tType, k: "type", g: 0.25, d: 1.1 });
    out.push({ t: w("problem", "hand") - 0.12, k: "slam", g: 0.55 });
    out.push({ t: w("problem", "hand") + 0.13, k: "marker", g: 0.35, d: 0.25 });
    out.push({ t: HOOK - 0.5, k: "riser", g: 0.55, d: 0.5 });
    out.push({ t: w("intro", "lane") - 0.05, k: "whoosh", g: 0.3, d: 0.4 });
    out.push({ t: VO.routes - 1.0, k: "whoosh", g: 0.3, d: 0.4 });
    out.push({ t: VO.service, k: "thud", g: 0.45 });
    out.push({ t: w("service", "connects") + 0.15, k: "marker", g: 0.4, d: 0.35 });
    out.push({ t: w("service", "policy") - 0.3, k: "marker", g: 0.4, d: 0.35 });
    out.push({ t: w("service", "reviews") - 0.15, k: "marker", g: 0.4, d: 0.4 });
    out.push({ t: PILOT_IN, k: "whoosh", g: 0.45, d: 0.5 });
    out.push({ t: VO.pilot, k: "thud", g: 0.5 });
    out.push({ t: w("pilot", "6") - 0.1, k: "stamp", g: 0.55 });
    out.push({ t: w("pilot", "rupees") + 0.6, k: "pop", g: 0.4 });
    out.push({ t: w("pilot", "month") - 0.05, k: "pop", g: 0.4, p: 1.3 });
    out.push({ t: PILOT_OUT - 0.9, k: "click", g: 0.6 });
    out.push({ t: PILOT_OUT - 0.5, k: "whoosh", g: 0.4, d: 0.5 });
    out.push({ t: w("close", "matters") + 0.45, k: "tick", g: 0.4, p: 1.5 });
    return out.sort((a, b) => a.t - b.t);
  }

  function voice() {
    return Object.entries(VO).map(([id, t]) => ({ id, t }));
  }

  window.PIECE = { render, samplesAt, cues, voice, DUR, FPS, VO, fmap, Einv: (f) => Einv(f), sections: () => ({ HOOK, darkE, E_iris, E_v, E_held, PILOT_IN, PILOT_OUT, conv: Einv(10.84), plate: Einv(12.05), lock: Einv(12.55), closeEnd: w("close", "matters") + 0.4, VO, DUR }) };
})();

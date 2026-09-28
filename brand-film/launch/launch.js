/*
 * BotLane (botlane.in): 60-second English explainer, built from the live site.
 *
 * The picture is the real website: two full-page captures of botlane.in and botlane.in/assist
 * (launch/capture.py) that a camera moves over, with the site's own focus ring as the highlight,
 * a cursor that clicks what the voice names, browser-window transitions between pages, captions,
 * and a clean branded end frame. Every beat is timed to the voiceover's word timings (launch/timing.js).
 * Pure function of t, like the films.
 */
(function () {
  "use strict";
  const C = {
    paper: "#faf8f5", surface: "#ffffff", surface2: "#f3f1ed", ink: "#111111", ink2: "#5c5c5c",
    hairline: "#e7e4df", border: "#d4d0c9", orange: "#ff5b1f", orangeEdge: "#c2410c", onInk: "#ffffff",
  };
  const SANS = "Inter", MONO = "JetBrains Mono";
  const FPS = 60, DUR = 60;
  const VT = window.VO_TIMING, SITE = window.SITE;
  const R = (page, name) => SITE[page].r[name];

  // ---------------------------------------------------------------- helpers
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  function bez(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let lo = 0, hi = 1, s = x;
      for (let i = 0; i < 26; i++) { const v = ((ax * s + bx) * s + cx) * s; if (v < x) lo = s; else hi = s; s = (lo + hi) / 2; }
      return ((ay * s + by) * s + cy) * s;
    };
  }
  const E = { brand: bez(0.22, 1, 0.36, 1), inOut: bez(0.65, 0, 0.35, 1), soft: bez(0.4, 0, 0.2, 1), lin: (x) => x };
  function font(ctx, w, px, fam = SANS, ls = 0) { ctx.font = `${w} ${px}px "${fam}"`; ctx.letterSpacing = `${ls}px`; }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  const center = (r) => [r[0] + r[2] / 2, r[1] + r[3] / 2];

  // ---------------------------------------------------------------- voice schedule and word times
  const VO = { hook: 0.35, intro: 5.0, assist: 13.9, guard: 23.5, trust: 34.0, india: 43.2, cta: 55.0 };
  function w(id, word, nth = 0, end = false) {
    let k = 0;
    for (const [txt, a, b] of VT.words[id]) {
      const t = txt.toLowerCase().replace(/[^a-z0-9']/g, "");
      if (t.startsWith(word)) { if (k === nth) return VO[id] + (end ? b : a); k++; }
    }
    throw new Error(`word not found: ${id}/${word}`);
  }
  const vend = (id) => VO[id] + VT.lengths[id];

  // ---------------------------------------------------------------- the gap strip's "manual step" pills sit between the cards
  function pill(a, b) {
    const A = R("home", a), B = R("home", b);
    const cx = (A[0] + A[2] + B[0]) / 2;
    return [cx - 38, A[1] + 29, 76, 22];
  }

  // ---------------------------------------------------------------- the shot list
  // Each shot: page, camera keys [t, cx, cy, z] (page CSS px; z = screen px per CSS px), highlights, cursor.
  let SHOTS, HL, CUR, CAPS, WIN, CUES;
  function build() {
    const gapRow = [400, 1169.4, 1120, 80];
    const gapChips = [R("home", "gap_whatsapp"), pill("gap_whatsapp", "gap_excel"), R("home", "gap_excel"),
      pill("gap_excel", "gap_tally"), R("home", "gap_tally"), pill("gap_tally", "gap_gst"), R("home", "gap_gst"),
      pill("gap_gst", "gap_market"), R("home", "gap_market")];
    const hero = R("home", "hero_h1");
    const heroCard = R("assist", "hero_card");
    const heldCard = R("assist", "guard_held_card");
    const handCard = R("assist", "handoff_card");
    const footerA = (() => { const f = R("home", "footer_pmh"); return [f[0], SITE.assist.h - (SITE.home.h - f[1]), f[2], f[3]]; })();
    const tNav1 = VO.assist + 0.15; // click Lane Assist
    const tNav2 = VO.india - 0.55; // back to the homepage's India section
    const tNav3 = w("india", "and") - 0.1; // to the pilot
    const tEnd = vend("india") + 0.35; // the end frame

    // camera keys per page segment
    SHOTS = [
      { page: "home", t0: 0, t1: tNav1 + 0.55, keys: [
        [0.0, 552, 986, 2.35], [1.7, 600, 990, 2.2],
        [w("hook", "so") + 0.15, 960, 1209, 1.28], [VO.intro - 0.35, 960, 1225, 1.34],
        [VO.intro + 0.25, 740, 316, 1.55], // scroll up to the hero: "Software for the work…"
        [w("intro", "for", 1) , 870, 360, 1.18],
        [w("intro", "whatsapp") + 0.2, 960, 470, 1.0],
        [vend("intro") - 0.6, 1040, 500, 1.02],
        [tNav1 + 0.2, 1120, 520, 1.12],
      ] },
      { page: "assist", t0: tNav1 + 0.55, t1: tNav2 + 0.55, over: 220, keys: [
        [tNav1 + 0.55, 960, 540, 1.0], [w("assist", "answers") + 0.6, 960, 520, 1.0],
        [w("assist", "order") - 0.3, 960, 520, 1.0],
        // framed a little low so the page heading above the card stays out of shot
        [w("assist", "order") + 0.55, center(heroCard)[0], center(heroCard)[1] + 30, 2.05],
        [w("assist", "number") + 0.1, center(heroCard)[0], center(heroCard)[1] + 32, 2.2],
        [vend("assist") + 0.2, center(heroCard)[0] + 20, center(heroCard)[1] + 38, 2.25],
        [VO.guard - 0.1, 960, 2110, 1.0], // scroll to the reply guard
        [w("guard", "if") - 0.25, 960, 2120, 1.03],
        [w("guard", "if") + 0.5, ...center(heldCard), 2.25],
        [w("guard", "held") + 0.35, center(heldCard)[0], center(heldCard)[1] + 12, 2.35],
        [w("guard", "and", 0) + 0.25, 960, 2840, 1.0], // scroll to the handoff
        [w("guard", "person") + 0.1, center(handCard)[0] - 40, center(handCard)[1], 1.75],
        [vend("guard") + 0.3, center(handCard)[0] - 20, center(handCard)[1] + 30, 1.9],
        [VO.trust + 0.2, 960, 3560, 1.0], // scroll to the managed service
        [w("trust", "private") - 0.35, 960, 3575, 1.06],
        [w("trust", "private") + 0.15, ...center(footerA), 3.1], // "Private · Managed · Human-controlled"
        [vend("trust") + 0.2, center(footerA)[0] + 6, center(footerA)[1], 3.25],
        [tNav2 + 0.2, center(footerA)[0], center(footerA)[1], 2.9],
      ] },
      { page: "home", t0: tNav2 + 0.55, t1: tNav3 + 0.55, keys: [
        [tNav2 + 0.55, 960, 3715, 1.0], [w("india", "work") - 0.1, 960, 3745, 1.5],
        [tNav3 + 0.2, 960, 3760, 1.56],
      ] },
      { page: "assist", t0: tNav3 + 0.55, t1: DUR, keys: [
        [tNav3 + 0.55, 960, 5225, 1.0],
        [w("india", "6") - 0.1, 960, 5215, 1.3],
        [tEnd, 950, 5212, 1.36],
      ] },
    ];

    // browser-window transitions: [t, from page/url, to url]
    WIN = [
      { t: tNav1, urlA: "botlane.in", urlB: "botlane.in/assist" },
      { t: tNav2, urlA: "botlane.in/assist", urlB: "botlane.in/#india" },
      { t: tNav3, urlA: "botlane.in/#india", urlB: "botlane.in/assist#pilot" },
    ];

    // highlights: [page, rect, t0, t1]
    HL = [];
    gapChips.forEach((r, i) => {
      const t0 = w("hook", "so") + 0.3 + i * 0.26;
      HL.push(["home", r, t0, t0 + 0.55, i % 2 ? "pill" : "ring"]);
    });
    HL.push(["home", R("home", "gap_note"), w("hook", "hand") - 0.2, VO.intro - 0.2, "ring"]);
    HL.push(["home", R("home", "lane_assist_row"), w("intro", "systems") - 0.2, tNav1 + 0.5, "ring"]);
    HL.push(["assist", R("assist", "chip_number"), w("assist", "number") - 0.05, vend("assist") + 0.4, "ring"]);
    HL.push(["assist", R("assist", "chip_order"), w("assist", "number") + 0.15, vend("assist") + 0.4, "ring"]);
    HL.push(["assist", R("assist", "chip_verified"), w("assist", "matches") + 0.1, vend("assist") + 0.4, "ring"]);
    HL.push(["assist", R("assist", "guard_draft"), w("guard", "promises") - 0.1, w("guard", "held") + 0.9, "ring"]);
    HL.push(["assist", R("assist", "guard_held_pill"), w("guard", "held") - 0.05, w("guard", "and", 0) + 0.2, "ring"]);
    HL.push(["assist", R("assist", "handoff_owner"), w("guard", "chat") - 0.3, vend("guard") + 0.5, "ring"]);
    HL.push(["assist", R("assist", "svc_1"), w("trust", "connects") - 0.05, w("trust", "private") - 0.3, "ring"]);
    HL.push(["assist", R("assist", "svc_2"), w("trust", "writes") - 0.05, w("trust", "private") - 0.3, "ring"]);
    HL.push(["assist", R("assist", "svc_3"), w("trust", "reviews") - 0.05, w("trust", "private") - 0.3, "ring"]);
    HL.push(["home", R("home", "india_whatsapp"), w("india", "whatsapp") - 0.1, tNav3 + 0.4, "ring"]);
    HL.push(["home", R("home", "india_rupees"), w("india", "priced") - 0.1, tNav3 + 0.4, "ring"]);
    HL.push(["assist", R("assist", "pilot_price"), w("india", "6") - 0.05, tEnd + 0.2, "ring"]);
    // footer words, one at a time: the footer text is "PRIVATE · MANAGED · HUMAN-CONTROLLED"
    const fw = footerA[2];
    [["private", 0, 0.235], ["managed", 0.3, 0.535], ["human", 0.6, 1.0]].forEach(([word, a, b]) =>
      HL.push(["assist", [footerA[0] + fw * a - 3, footerA[1] - 3, fw * (b - a) + 6, footerA[3] + 6], w("trust", word) - 0.05, vend("trust") + 0.6, "under"]));

    // cursor: [t, page, x, y, click?]  (page coords)
    const la = R("home", "lane_assist_row");
    CUR = [
      [w("intro", "systems") - 0.9, "home", 1600, 900, 0],
      [w("intro", "systems") + 0.2, "home", la[0] + 40, la[1] + la[3] / 2, 0],
      [tNav1, "home", la[0] + 44, la[1] + la[3] / 2, 1],
      [tNav1 + 0.5, "home", la[0] + 44, la[1] + la[3] / 2, 0],
    ];

    CAPS = buildCaptions();
    CUES = buildCues(tNav1, tNav2, tNav3, tEnd);
    Object.assign(T, { tNav1, tNav2, tNav3, tEnd });
  }
  const T = {};

  // ---------------------------------------------------------------- captions from the script, timed by the voice's words
  function buildCaptions() {
    const caps = [];
    for (const id of Object.keys(VO)) {
      const text = VT.script[id];
      const tokens = text.split(/\s+/);
      const heard = VT.words[id];
      // map each script token to a heard word by relative position (the voice says every word)
      const at = (i) => { const k = Math.min(heard.length - 1, Math.round((i / tokens.length) * heard.length)); return heard[k]; };
      // display tokens: [text, first spoken index, last spoken index]; the spoken price shows as "₹6,999"
      const disp = [];
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === "six" && tokens[i + 1] === "thousand,") { disp.push(["₹6,999", i, i + 6]); i += 6; continue; }
        disp.push([tokens[i], i, i]);
      }
      // phrases at punctuation, merged up to ~44 characters; long phrases split in balanced halves
      const phrases = []; let cur = [];
      disp.forEach((d) => { cur.push(d); if (/[.,?!]$/.test(d[0])) { phrases.push(cur); cur = []; } });
      if (cur.length) phrases.push(cur);
      const len = (ws) => ws.map((d) => d[0]).join(" ").length;
      const split = (ws) => {
        if (len(ws) <= 48) return [ws];
        let best = 1, bd = 1e9;
        for (let k = 1; k < ws.length; k++) { const d = Math.abs(len(ws.slice(0, k)) - len(ws.slice(k))); if (d < bd) { bd = d; best = k; } }
        return [...split(ws.slice(0, best)), ...split(ws.slice(best))];
      };
      const lines = [];
      for (const ph of phrases.flatMap(split)) {
        const last = lines[lines.length - 1];
        if (last && len(last) + 1 + len(ph) <= 44 && !/[.?!]$/.test(last[last.length - 1][0])) last.push(...ph);
        else lines.push([...ph]);
      }
      for (const ln of lines) {
        const a = at(ln[0][1])[1], b = at(ln[ln.length - 1][2])[2];
        caps.push({ t0: VO[id] + a, t1: VO[id] + b + 0.25, text: ln.map((d) => d[0]).join(" ").replace(/Bot Lane/g, "BotLane").replace(/botlane dot in/gi, "botlane.in") });
      }
    }
    // captions never overlap: each ends where the next begins
    for (let i = 0; i < caps.length - 1; i++) caps[i].t1 = Math.min(caps[i].t1, caps[i + 1].t0 - 0.02);
    return caps;
  }

  // ---------------------------------------------------------------- sound cues (read by the mixer)
  function buildCues(n1, n2, n3, tEnd) {
    const c = [{ t: 0.0, k: "thud", g: 0.35 }];
    HL.forEach(([, , t0, , kind]) => c.push({ t: t0, k: "tick", g: kind === "pill" ? 0.18 : 0.22, p: 1.2 }));
    [n1, n2, n3].forEach((t) => { c.push({ t: t - 0.02, k: "click", g: 0.35 }); c.push({ t: t + 0.1, k: "whoosh", g: 0.22, d: 0.8 }); });
    c.push({ t: VO.intro + 0.0, k: "whoosh", g: 0.18, d: 0.5 });
    c.push({ t: VO.guard - 0.2, k: "whoosh", g: 0.15, d: 0.5 }, { t: w("guard", "and", 0) + 0.1, k: "whoosh", g: 0.15, d: 0.5 }, { t: VO.trust, k: "whoosh", g: 0.15, d: 0.5 });
    c.push({ t: tEnd, k: "whoosh", g: 0.25, d: 0.7 }, { t: tEnd + 0.8, k: "resolve", g: 0.5 });
    c.push({ t: w("cta", "talk") + 0.35, k: "click", g: 0.4 });
    return c.sort((a, b) => a.t - b.t);
  }

  // ---------------------------------------------------------------- camera
  function shotAt(t) { return SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1]; }
  function camOf(s, t) {
    const k = s.keys;
    if (t <= k[0][0]) return { x: k[0][1], y: k[0][2], z: k[0][3] };
    for (let i = 1; i < k.length; i++) {
      if (t <= k[i][0]) {
        const a = k[i - 1], b = k[i];
        const p = E.inOut((t - a[0]) / (b[0] - a[0]));
        return { x: lerp(a[1], b[1], p), y: lerp(a[2], b[2], p), z: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), p)), over: s.over };
      }
    }
    const l = k[k.length - 1];
    return { x: l[1], y: l[2], z: l[3], over: s.over };
  }

  // ---------------------------------------------------------------- drawing
  const IMG = {};
  function drawPage(ctx, page, cam, box) {
    // box: screen rect the page view fills [x, y, w, h]
    const [bx, by, bw, bh] = box;
    const s = bw / 1920; // the view is always 1920 CSS px wide at z=1
    const z = cam.z;
    const vw = 1920 / z, vh = (bh / s) / z;
    let x0 = cam.x - vw / 2, y0 = cam.y - vh / 2;
    x0 = clamp(x0, 0, 1920 - vw); y0 = clamp(y0, 0, SITE[page].h - vh + (cam.over || 0));
    ctx.save();
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    ctx.fillStyle = C.surface; ctx.fillRect(bx, by, bw, bh); // both pages end on a white footer
    const img = IMG[page];
    ctx.drawImage(img, x0 * 2, y0 * 2, vw * 2, vh * 2, bx, by, bw, bh);
    ctx.restore();
    return { x0, y0, k: (bw / vw) }; // page->screen: X = bx + (x - x0) * k
  }
  function toScreen(view, box, x, y) { return [box[0] + (x - view.x0) * view.k, box[1] + (y - view.y0) * view.k]; }

  function drawHighlights(ctx, page, view, box, t) {
    for (const [pg, r, t0, t1, kind] of HL) {
      if (pg !== page || t < t0 - 0.01 || t > t1 + 0.35) continue;
      const a = E.brand(prog(t, t0, t0 + 0.28)) * (1 - prog(t, t1, t1 + 0.3));
      if (a <= 0) continue;
      const [x, y] = toScreen(view, box, r[0], r[1]);
      const W = r[2] * view.k, H = r[3] * view.k;
      const pad = kind === "pill" ? 5 : 7 + (1 - E.brand(prog(t, t0, t0 + 0.35))) * 10;
      ctx.save();
      ctx.globalAlpha = a;
      if (kind === "under") {
        ctx.fillStyle = C.orange;
        ctx.fillRect(x, y + H + 4, W * E.brand(prog(t, t0, t0 + 0.35)), 4);
      } else {
        // the site's focus style: a 2px orange outline with a soft 35% ring
        rrect(ctx, x - pad, y - pad, W + pad * 2, H + pad * 2, 12);
        ctx.lineWidth = 8; ctx.strokeStyle = "rgba(255,91,31,0.28)"; ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = C.orange; ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawCursor(ctx, page, view, box, t) {
    if (!CUR.length || t < CUR[0][0] || t > CUR[CUR.length - 1][0] + 0.4) return;
    let i = 1;
    while (i < CUR.length - 1 && CUR[i][0] < t) i++;
    const a = CUR[i - 1], b = CUR[i];
    if (a[1] !== page) return;
    const p = E.inOut(prog(t, a[0], b[0]));
    const [sx, sy] = toScreen(view, box, lerp(a[2], b[2], p), lerp(a[3], b[3], p));
    const fade = prog(t, CUR[0][0], CUR[0][0] + 0.2) * (1 - prog(t, CUR[CUR.length - 1][0], CUR[CUR.length - 1][0] + 0.3));
    const click = CUR.find((c) => c[4] && t >= c[0] && t < c[0] + 0.45);
    drawArrow(ctx, sx, sy, fade, click ? t - click[0] : -1);
  }
  function drawArrow(ctx, x, y, alpha, clickT) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (clickT >= 0) {
      const k = E.brand(clamp(clickT / 0.45));
      ctx.beginPath(); ctx.arc(x, y, 8 + 26 * k, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,91,31,${0.5 * (1 - k)})`; ctx.lineWidth = 3; ctx.stroke();
    }
    const s = clickT >= 0 && clickT < 0.12 ? 0.9 : 1;
    ctx.translate(x, y); ctx.scale(s * 1.25, s * 1.25);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(5.5, 17); ctx.lineTo(9.5, 26); ctx.lineTo(13, 24.5); ctx.lineTo(9, 15.5); ctx.lineTo(16, 15.5); ctx.closePath();
    ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillStyle = C.surface; ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = 1.6; ctx.strokeStyle = C.ink; ctx.lineJoin = "round"; ctx.stroke();
    ctx.restore();
  }

  // window chrome during page changes: 0 = full bleed, 1 = framed browser window
  function frameAmount(t) {
    let f = 0;
    for (const n of WIN) f = Math.max(f, E.inOut(prog(t, n.t - 0.1, n.t + 0.35)) * (1 - E.inOut(prog(t, n.t + 0.75, n.t + 1.3))));
    return f;
  }
  function windowBox(f) {
    const x = lerp(0, 150, f), top = lerp(0, 118, f), bottom = lerp(0, 66, f);
    return [x, top, 1920 - 2 * x, 1080 - top - bottom];
  }
  function drawChromeBack(ctx, box, f) {
    if (f <= 0.001) return;
    const [x, y, w, h] = box;
    ctx.save();
    ctx.globalAlpha = f;
    ctx.shadowColor = "rgba(0,0,0,0.12)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
    rrect(ctx, x, y - 52, w, h + 52, 16); ctx.fillStyle = C.surface; ctx.fill();
    ctx.restore();
  }
  function drawChrome(ctx, box, f, url) {
    if (f <= 0.001) return;
    const [x, y, w, h] = box;
    ctx.save();
    ctx.globalAlpha = f;
    // window edge and address bar, in the site's own tokens (the body is drawn behind the page)
    rrect(ctx, x, y - 52, w, h + 52, 16); ctx.lineWidth = 1.5; ctx.strokeStyle = C.hairline; ctx.stroke();
    ctx.fillStyle = C.hairline; ctx.fillRect(x, y - 1, w, 1.5);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + 26 + i * 20, y - 26, 5.5, 0, Math.PI * 2); ctx.fillStyle = C.border; ctx.fill(); }
    const pw = 460, px = x + w / 2 - pw / 2;
    rrect(ctx, px, y - 40, pw, 28, 14); ctx.fillStyle = C.surface2; ctx.fill();
    font(ctx, 500, 15, MONO, 0.4); ctx.fillStyle = C.ink2; ctx.textAlign = "center";
    ctx.fillText(url, px + pw / 2, y - 21); ctx.textAlign = "left";
    ctx.restore();
  }

  function drawCaption(ctx, t, dark) {
    const c = CAPS.find((c) => t >= c.t0 && t < c.t1);
    if (!c) return;
    const a = prog(t, c.t0, c.t0 + 0.12) * (1 - prog(t, c.t1 - 0.1, c.t1));
    font(ctx, 500, 34, SANS, -0.2);
    const tw = ctx.measureText(c.text).width;
    const px = 26, h = 58, y = 1080 - 78 - h, x = 960 - tw / 2 - px;
    ctx.save();
    ctx.globalAlpha = a;
    rrect(ctx, x, y, tw + px * 2, h, 12);
    ctx.fillStyle = dark ? "rgba(255,255,255,0.94)" : "rgba(17,17,17,0.86)"; ctx.fill();
    ctx.fillStyle = dark ? C.ink : C.onInk;
    ctx.fillText(c.text, x + px, y + 40);
    ctx.restore();
  }

  // ---------------------------------------------------------------- the end frame
  const PLATE = new Path2D("M8 0h16a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8ZM9.5 12.5h13a3.5 3.5 0 0 1 0 7h-13a3.5 3.5 0 0 1 0-7Z");
  function mark(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 32, s / 32);
    ctx.fillStyle = C.ink; ctx.fill(PLATE, "evenodd");
    ctx.beginPath(); ctx.arc(10, 16, 2.25, 0, Math.PI * 2); ctx.fillStyle = C.orange; ctx.fill();
    ctx.restore();
  }
  function drawEnd(ctx, t) {
    const t0 = T.tEnd;
    if (t < t0) return;
    const k = E.brand(prog(t, t0, t0 + 0.7));
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, 1920, 1080);
    ctx.restore();
    const rise = (a, dur = 0.6) => E.brand(prog(t, t0 + a, t0 + a + dur));
    // lockup: the site header's mark + "botLane"
    const r1 = rise(0.35);
    ctx.save(); ctx.globalAlpha = r1; ctx.translate(0, (1 - r1) * 18);
    font(ctx, 600, 64, SANS, -1.2);
    const ww = ctx.measureText("botLane").width, ms = 76, gap = 22, total = ms + gap + ww;
    const lx = 960 - total / 2;
    mark(ctx, lx, 318, ms);
    ctx.fillStyle = C.ink; ctx.fillText("botLane", lx + ms + gap, 378);
    ctx.restore();
    const r2 = rise(0.6);
    ctx.save(); ctx.globalAlpha = r2; ctx.translate(0, (1 - r2) * 18);
    font(ctx, 700, 58, SANS, -1.74); ctx.fillStyle = C.ink; ctx.textAlign = "center";
    ctx.fillText("Software for the work", 960, 506);
    ctx.fillText("that still gets done manually.", 960, 570);
    ctx.restore();
    // the primary CTA, exactly as the site draws it
    const r3 = rise(0.85);
    const tp = w("cta", "talk") + 0.35;
    const press = t > tp && t < tp + 0.18 ? 1 : 0;
    ctx.save(); ctx.globalAlpha = r3; ctx.translate(0, (1 - r3) * 18 + press * 2);
    font(ctx, 600, 30, SANS, -0.3);
    const label = "Talk to BotLane";
    const lw = ctx.measureText(label).width, bw = lw + 40 + 30 + 34, bh = 72, bx = 960 - bw / 2, by = 640;
    rrect(ctx, bx, by, bw, bh + (press ? 1 : 4), 12); ctx.fillStyle = C.orangeEdge; ctx.fill();
    rrect(ctx, bx, by, bw, bh, 12); ctx.fillStyle = C.orange; ctx.fill();
    ctx.fillStyle = C.ink; ctx.textAlign = "left"; ctx.fillText(label, bx + 34, by + 47);
    ctx.save(); ctx.translate(bx + 34 + lw + 16, by + 36);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(16, -7); ctx.moveTo(3, -7); ctx.lineTo(16, -7); ctx.lineTo(16, 6); ctx.stroke();
    ctx.restore();
    ctx.restore();
    const r4 = rise(1.05);
    ctx.save(); ctx.globalAlpha = r4;
    font(ctx, 500, 24, MONO, 2); ctx.fillStyle = C.ink2; ctx.textAlign = "center";
    ctx.fillText("BOTLANE.IN/CONTACT", 960, 772);
    font(ctx, 500, 18, MONO, 2.2); ctx.fillStyle = C.ink2;
    ctx.fillText("PRIVATE · MANAGED · HUMAN-CONTROLLED", 960, 842);
    ctx.textAlign = "left";
    ctx.restore();
    // cursor presses the button
    const ca = [tp - 1.2, 1500, 930], cb = [tp, 960 + 60, 640 + 44];
    if (t > ca[0]) {
      const p = E.inOut(prog(t, ca[0], cb[0]));
      drawArrow(ctx, lerp(ca[1], cb[1], p), lerp(ca[2], cb[2], p), prog(t, ca[0], ca[0] + 0.2), t >= tp && t < tp + 0.45 ? t - tp : -1);
    }
  }

  // ---------------------------------------------------------------- frame
  let ready = false;
  function render(ctx, t, W, H) {
    if (!ready) { build(); ready = true; }
    const S = W / 1920;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.fillStyle = C.surface2; ctx.fillRect(0, 0, 1920, 1080);
    const f = frameAmount(t);
    const box = windowBox(f);
    drawChromeBack(ctx, box, f);
    // page change happens behind the framed window: slide the old page out and the new one in
    const nav = WIN.find((n) => t >= n.t + 0.35 && t < n.t + 0.75);
    const s = shotAt(t);
    if (nav) {
      const p = E.inOut(prog(t, nav.t + 0.35, nav.t + 0.75));
      const prev = SHOTS[SHOTS.indexOf(shotAt(nav.t + 0.34))];
      const next = SHOTS[SHOTS.indexOf(shotAt(nav.t + 0.76))];
      const off = box[2] * p;
      ctx.save(); ctx.beginPath(); ctx.rect(box[0], box[1], box[2], box[3]); ctx.clip();
      const v1 = drawPage(ctx, prev.page, camOf(prev, nav.t + 0.35), [box[0] - off, box[1], box[2], box[3]]);
      const v2 = drawPage(ctx, next.page, camOf(next, nav.t + 0.76), [box[0] + box[2] - off, box[1], box[2], box[3]]);
      ctx.restore();
    } else {
      const cam = camOf(s, t);
      const view = drawPage(ctx, s.page, cam, box);
      drawHighlights(ctx, s.page, view, box, t);
      drawCursor(ctx, s.page, view, box, t);
    }
    const url = (() => {
      let u = "botlane.in";
      for (const n of WIN) if (t >= n.t + 0.55) u = n.urlB; else if (t >= n.t - 0.2) { u = n.urlA; break; }
      return u;
    })();
    drawChrome(ctx, box, f, url);
    drawEnd(ctx, t);
    const dark = false; // the caption sits below the pilot band, on white, so the ink pill reads throughout
    drawCaption(ctx, t, dark);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function finish(ctx, t, W, H) {
    // fine grain so H.264 doesn't band on the flat paper
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.globalCompositeOperation = "overlay";
    if (!finish.g) {
      const g = document.createElement("canvas"); g.width = g.height = 256;
      const x = g.getContext("2d"), im = x.createImageData(256, 256);
      let s = 99991;
      for (let i = 0; i < im.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = (s >> 8) & 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0); finish.g = g;
    }
    const f = Math.round(t * FPS), ox = (f * 73) % 256, oy = (f * 151) % 256;
    ctx.translate(-ox, -oy);
    for (let x = 0; x < W + 256; x += 256) for (let y = 0; y < H + 256; y += 256) ctx.drawImage(finish.g, x, y);
    ctx.restore();
  }
  function samplesAt(t) {
    if (!ready) return 5;
    const fast = [];
    for (const n of WIN) fast.push([n.t - 0.1, n.t + 1.3]);
    for (const s of SHOTS) for (let i = 1; i < s.keys.length; i++) {
      const a = s.keys[i - 1], b = s.keys[i];
      if (Math.abs(b[2] - a[2]) > 500) fast.push([a[0], b[0]]); // long scrolls
    }
    return fast.some(([a, b]) => t >= a && t <= b) ? 12 : 5;
  }
  window.PIECE = {
    render, finish, samplesAt, DUR, FPS, IMG,
    cues: () => { if (!ready) { build(); ready = true; } return CUES; },
    captions: () => { if (!ready) { build(); ready = true; } return CAPS; },
    voice: () => Object.entries(VO).map(([id, t]) => ({ id, t })),
    sections: () => ({ DUR, VO, ...T }),
  };
})();

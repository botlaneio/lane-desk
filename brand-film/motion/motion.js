/*
 * BotLane: 60-second motion-graphics explainer (botlane.in).
 *
 * One idea carries the film: the orange lamp from the BotLane mark travels a single hairline lane and lights
 * each station as the voice names it. Scenes arrive and leave by diffusion (blur, drift and fade), chips float
 * in depth, text blurs in or types. Palette, type and radii are the site's own (paper, ink, hairline, orange;
 * Inter and JetBrains Mono). Every claim on screen is on botlane.in or botlane.in/assist.
 *
 * Everything is a pure function of t. Voice timing comes from motion/timing.js (window.VO_TIMING).
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------- tokens
  const C = {
    paper: "#faf8f5", surface: "#ffffff", surface2: "#f3f1ed", ink: "#111111", ink2: "#5c5c5c", ink3: "#8f8a83",
    hairline: "#e7e4df", border: "#d4d0c9", orange: "#ff5b1f", orangeEdge: "#c2410c", green: "#15803d", greenBg: "#e7f6ec",
  };
  const SANS = '"Inter", system-ui, sans-serif';
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const W = 1920, H = 1080, FPS = 60;

  // ---------------------------------------------------------------- math
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  function bez(x1, y1, x2, y2) {
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
        const dx = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
        if (Math.abs(dx) < 1e-6) break;
        t -= cx / dx;
      }
      return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
    };
  }
  const E = { brand: bez(0.22, 1, 0.36, 1), inOut: bez(0.65, 0, 0.35, 1), out: bez(0.16, 1, 0.3, 1), in: bez(0.5, 0, 0.75, 0) };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  function font(ctx, w, px, fam = SANS, ls = 0) { ctx.font = `${w} ${px}px ${fam}`; ctx.letterSpacing = `${ls}px`; }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  // ---------------------------------------------------------------- voice schedule
  const VT = window.VO_TIMING;
  const LEN = VT.lengths;
  const ORDER = ["gap", "meet", "assist", "order", "guard", "person", "service", "close"];
  const GAPS = { gap: 0.8, meet: 0.8, assist: 0.6, order: 0.5, guard: 0.5, person: 0.4, service: 0.6, close: 1.7 };
  const VO = {};
  {
    let t = GAPS.gap;
    for (const id of ORDER) { VO[id] = t; t += LEN[id] + (GAPS[ORDER[ORDER.indexOf(id) + 1]] || 0); }
  }
  const vend = (id) => VO[id] + LEN[id];
  const DUR = Math.max(60, vend("close") + 1.8);
  function w(id, word, nth = 0) {
    let k = 0;
    for (const [txt, a] of VT.words[id]) {
      const s = txt.toLowerCase().replace(/[^a-z0-9#]/g, "");
      if (s.startsWith(word)) { if (k === nth) return VO[id] + a; k++; }
    }
    throw new Error(`word not found: ${id}/${word}`);
  }
  // scene windows: each scene is on screen from a little before its line to a little after the next begins
  const S = {};
  for (let i = 0; i < ORDER.length; i++) {
    const id = ORDER[i];
    S[id] = [i === 0 ? 0 : VO[id] - 0.55, i === ORDER.length - 1 ? DUR + 1 : VO[ORDER[i + 1]] - 0.25];
  }

  // ---------------------------------------------------------------- layers and diffusion
  const off = [];
  function layerCanvas(i) {
    if (!off[i]) { const c = document.createElement("canvas"); c.width = W; c.height = H; off[i] = c; }
    return off[i];
  }
  // envelope for a scene: arrives from blur and a small rise, leaves by diffusing (blur, lift, fade)
  function env(t, a, b, fin = 0.7, fout = 0.6) {
    const i = E.brand(prog(t, a, a + fin));
    const o = E.in(prog(t, b - fout, b));
    return { a: i * (1 - o), blur: (1 - i) * 18 + o * 26, dy: (1 - i) * 26 - o * 30, s: 1 + (1 - i) * 0.02 + o * 0.035 };
  }
  // draw fn into an offscreen layer, then composite it through the envelope
  let layerDepth = 0;
  function layer(ctx, e, fn) {
    if (e.a <= 0.002) return;
    if (e.blur < 0.4 && e.a > 0.998 && Math.abs(e.dy) < 0.2 && Math.abs(e.s - 1) < 1e-4) { fn(ctx); return; }
    const c = layerCanvas(layerDepth++);
    const x = c.getContext("2d");
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.filter = "none"; x.globalAlpha = 1;
    fn(x);
    layerDepth--;
    ctx.save();
    ctx.globalAlpha = e.a;
    if (e.blur >= 0.4) ctx.filter = `blur(${e.blur.toFixed(1)}px)`;
    ctx.translate(W / 2, H / 2 + e.dy); ctx.scale(e.s, e.s); ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(c, 0, 0);
    ctx.restore();
  }
  // a single element that blurs in: alpha, blur and rise from t0
  function blurIn(t, t0, d = 0.7) { const p = E.brand(prog(t, t0, t0 + d)); return { a: p, blur: (1 - p) * 12, dy: (1 - p) * 16 }; }
  function withFx(ctx, fx, fn) {
    if (fx.a <= 0.002) return;
    ctx.save();
    ctx.globalAlpha *= fx.a;
    if (fx.blur > 0.3) ctx.filter = `blur(${fx.blur.toFixed(1)}px)`;
    ctx.translate(fx.dx || 0, fx.dy || 0);
    fn();
    ctx.restore();
  }

  // ---------------------------------------------------------------- shared drawing
  function label(ctx, x, y, num, text, a = 1) {
    // "— 01 / CHECK THE ORDER", the site's section labels
    ctx.save(); ctx.globalAlpha *= a;
    ctx.strokeStyle = C.ink3; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 36, y - 7); ctx.stroke();
    font(ctx, 500, 22, MONO, 2.4); ctx.fillStyle = C.ink; ctx.fillText(num, x + 52, y);
    ctx.fillStyle = C.ink3; ctx.fillText(`/  ${text}`, x + 52 + ctx.measureText(num).width + 18, y);
    ctx.restore();
  }
  function mono(ctx, text, x, y, px = 16, color = C.ink3, align = "left", ls = 1.8) {
    font(ctx, 500, px, MONO, ls); ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.textAlign = "left";
  }
  // soft card shadow from a pre-blurred sprite (a live shadowBlur on every card is slow)
  let SHADOW;
  function shadow(ctx, x, y, w, h) {
    if (!SHADOW) {
      SHADOW = document.createElement("canvas"); SHADOW.width = SHADOW.height = 320;
      const c = SHADOW.getContext("2d"); c.filter = "blur(26px)"; c.fillStyle = "rgba(17,17,17,0.10)";
      c.beginPath(); c.roundRect(80, 80, 160, 160, 20); c.fill();
    }
    ctx.drawImage(SHADOW, x - w * 0.5, y + 12 - h * 0.5, w * 2, h * 2);
  }
  const SPR = new Map();
  // a static element drawn once; blurred copies cached per whole pixel of blur
  function sprite(key, w, h, draw) {
    let e = SPR.get(key);
    if (!e) {
      const pad = 90, c = document.createElement("canvas");
      c.width = Math.ceil(w + pad * 2); c.height = Math.ceil(h + pad * 2);
      const x = c.getContext("2d"); x.translate(pad + w / 2, pad + h / 2); draw(x);
      e = { c, pad, w, h, b: new Map() }; SPR.set(key, e);
    }
    return e;
  }
  function drawSprite(ctx, e, cx, cy, sc, a, blur) {
    if (a <= 0.004) return;
    const b = Math.min(40, Math.round(blur));
    let img = e.c;
    if (b > 0) {
      img = e.b.get(b);
      if (!img) {
        img = document.createElement("canvas"); img.width = e.c.width; img.height = e.c.height;
        const x = img.getContext("2d"); x.filter = `blur(${b}px)`; x.drawImage(e.c, 0, 0); e.b.set(b, img);
      }
    }
    ctx.save(); ctx.globalAlpha *= a;
    const W2 = img.width * sc, H2 = img.height * sc;
    ctx.drawImage(img, cx - W2 / 2, cy - H2 / 2, W2, H2);
    ctx.restore();
  }
  function card(ctx, x, y, w, h, opt = {}) {
    shadow(ctx, x, y, w, h);
    rrect(ctx, x, y, w, h, opt.r || 14); ctx.fillStyle = opt.fill || C.surface; ctx.fill();
    rrect(ctx, x, y, w, h, opt.r || 14); ctx.lineWidth = opt.lw || 1.5; ctx.strokeStyle = opt.stroke || C.hairline; ctx.stroke();
  }
  function pill(ctx, text, x, cy, kind = "line", px = 14) {
    font(ctx, 500, px, MONO, 1.4);
    const tw = ctx.measureText(text).width, h = px + 16, pw = tw + 24;
    rrect(ctx, x, cy - h / 2, pw, h, h / 2);
    if (kind === "ink") { ctx.fillStyle = C.ink; ctx.fill(); ctx.fillStyle = C.surface; }
    else if (kind === "green") { ctx.fillStyle = C.greenBg; ctx.fill(); ctx.fillStyle = C.green; }
    else if (kind === "orange") { ctx.fillStyle = C.orange; ctx.fill(); ctx.fillStyle = C.ink; }
    else { ctx.fillStyle = C.surface; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = C.border; ctx.stroke(); ctx.fillStyle = C.ink2; }
    ctx.fillText(text, x + 12, cy + px * 0.36);
    return pw;
  }
  function check(ctx, x, y, s, color, lw = 2.4, p = 1) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(x - s * 0.45, y);
    if (p < 0.5) ctx.lineTo(lerp(x - s * 0.45, x - s * 0.1, p * 2), lerp(y, y + s * 0.35, p * 2));
    else { ctx.lineTo(x - s * 0.1, y + s * 0.35); ctx.lineTo(lerp(x - s * 0.1, x + s * 0.5, (p - 0.5) * 2), lerp(y + s * 0.35, y - s * 0.4, (p - 0.5) * 2)); }
    ctx.stroke(); ctx.restore();
  }
  // a line of text typed on, with a caret while typing
  function typed(ctx, text, x, y, t, t0, cps = 38, caret = true) {
    const n = Math.floor(clamp((t - t0) * cps, 0, text.length));
    const s = text.slice(0, n);
    ctx.fillText(s, x, y);
    if (caret && t >= t0 && n < text.length && Math.floor(t * 3) % 2 === 0) {
      const tw = ctx.measureText(s).width; ctx.fillRect(x + tw + 2, y - 26, 2.5, 32);
    }
    return n / text.length;
  }
  // words of a headline blurring in one by one, timed to the voice
  function headline(ctx, lines, x, y, lh, px, t, times, align = "left", weight = 700, color = C.ink) {
    font(ctx, weight, px, SANS, -px * 0.03);
    let k = 0;
    lines.forEach((line, li) => {
      const ws = line.split(" ");
      const total = ctx.measureText(line).width;
      let cx = align === "center" ? x - total / 2 : x;
      ws.forEach((word, wi) => {
        const t0 = times[Math.min(k, times.length - 1)] ?? times[times.length - 1];
        const fx = blurIn(t, t0, 0.65);
        withFx(ctx, fx, () => { ctx.fillStyle = color; ctx.fillText(word, cx, y + li * lh); });
        cx += ctx.measureText(word + " ").width;
        k++;
      });
    });
  }
  const PLATE = new Path2D("M8 0h16a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8ZM9.5 12.5h13a3.5 3.5 0 0 1 0 7h-13a3.5 3.5 0 0 1 0-7Z");
  function mark(ctx, x, y, s, lamp = true) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 32, s / 32);
    ctx.fillStyle = C.ink; ctx.fill(PLATE, "evenodd");
    if (lamp) { ctx.beginPath(); ctx.arc(10, 16, 2.25, 0, Math.PI * 2); ctx.fillStyle = C.orange; ctx.fill(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- the lane (a hairline with stations)
  function lane(ctx, y, x0, x1, p, a = 1) {
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, "rgba(212,208,201,0)"); g.addColorStop(0.08, C.border); g.addColorStop(0.92, C.border); g.addColorStop(1, "rgba(212,208,201,0)");
    ctx.strokeStyle = g; ctx.lineWidth = 1.5;
    const m = (x0 + x1) / 2, half = (x1 - x0) / 2 * p;
    ctx.beginPath(); ctx.moveTo(m - half, y); ctx.lineTo(m + half, y); ctx.stroke();
    ctx.restore();
  }
  // a station: empty ring -> lit (orange) -> done (green check)
  function station(ctx, x, y, t, tOn, tLit, tDone, a = 1) {
    const on = E.brand(prog(t, tOn, tOn + 0.5));
    if (on <= 0) return;
    ctx.save(); ctx.globalAlpha *= a * on;
    const lit = tLit != null ? E.brand(prog(t, tLit, tLit + 0.35)) : 0;
    const done = tDone != null ? E.brand(prog(t, tDone, tDone + 0.35)) : 0;
    const r = 14 + lit * 3;
    if (lit > 0 && done < 1) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 60);
      g.addColorStop(0, `rgba(255,91,31,${0.22 * lit * (1 - done)})`); g.addColorStop(1, "rgba(255,91,31,0)");
      ctx.fillStyle = g; ctx.fillRect(x - 60, y - 60, 120, 120);
    }
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = done > 0 ? `rgba(231,246,236,${done})` : C.paper; ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = done > 0.5 ? C.green : lit > 0.5 ? C.orange : C.border; ctx.stroke();
    if (done > 0) check(ctx, x, y - 1, 14, C.green, 2.8, done);
    ctx.restore();
  }

  // ---------------------------------------------------------------- the lamp
  // keyframes [t, x, y, radius, alpha]; eased between; a streak trails fast moves
  let LAMP = [];
  function lampAt(t) {
    const L = lampKey(t);
    if (t > S.guard[0] && t < S.person[1]) L.y -= guardCamY(t);
    return L;
  }
  function lampKey(t) {
    const k = LAMP;
    if (t <= k[0][0]) return { x: k[0][1], y: k[0][2], r: k[0][3], a: k[0][4] };
    for (let i = 1; i < k.length; i++) {
      if (t <= k[i][0]) {
        const A = k[i - 1], B = k[i];
        const p = (B[5] || E.inOut)(prog(t, A[0], B[0]));
        return { x: lerp(A[1], B[1], p), y: lerp(A[2], B[2], p), r: lerp(A[3], B[3], p), a: lerp(A[4], B[4], p) };
      }
    }
    const l = k[k.length - 1];
    return { x: l[1], y: l[2], r: l[3], a: l[4] };
  }
  function drawLamp(ctx, t) {
    const L = lampAt(t);
    if (L.a <= 0.01) return;
    const pulse = 1 + 0.06 * Math.sin(t * 5.2);
    ctx.save();
    // streak: earlier positions, fading
    for (let i = 8; i >= 1; i--) {
      const P = lampAt(t - i * 0.014);
      const d = Math.hypot(P.x - L.x, P.y - L.y);
      if (d < 2) continue;
      ctx.globalAlpha = L.a * 0.22 * (1 - i / 9);
      ctx.beginPath(); ctx.arc(P.x, P.y, L.r * (1 - i / 14), 0, Math.PI * 2); ctx.fillStyle = C.orange; ctx.fill();
    }
    ctx.globalAlpha = L.a;
    const R = L.r * 7 * pulse;
    const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, R);
    g.addColorStop(0, "rgba(255,91,31,0.34)"); g.addColorStop(0.35, "rgba(255,91,31,0.10)"); g.addColorStop(1, "rgba(255,91,31,0)");
    ctx.fillStyle = g; ctx.fillRect(L.x - R, L.y - R, R * 2, R * 2);
    const c = ctx.createRadialGradient(L.x - L.r * 0.3, L.y - L.r * 0.3, 0, L.x, L.y, L.r);
    c.addColorStop(0, "#ffb08e"); c.addColorStop(0.55, C.orange); c.addColorStop(1, C.orangeEdge);
    ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- background: paper, grid, drifting warmth
  function background(ctx, t) {
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
    // two slow warm glows (the diffusion under everything)
    const blobs = [[0.28 + 0.04 * Math.sin(t * 0.11), 0.34 + 0.05 * Math.cos(t * 0.09), 720, "255,91,31", 0.055],
      [0.74 + 0.05 * Math.cos(t * 0.08), 0.7 + 0.04 * Math.sin(t * 0.13), 820, "212,180,150", 0.12]];
    for (const [bx, by, r, rgb, a] of blobs) {
      const g = ctx.createRadialGradient(bx * W, by * H, 0, bx * W, by * H, r);
      g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // grid, faded toward the edges
    ctx.save();
    ctx.strokeStyle = "rgba(17,17,17,0.035)"; ctx.lineWidth = 1;
    const step = 64, ox = (t * 3) % step;
    ctx.beginPath();
    for (let x = -ox; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0);
    v.addColorStop(0, "rgba(250,248,245,0)"); v.addColorStop(1, "rgba(250,248,245,0.95)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  function footerNote(ctx, t) {
    const a = E.brand(prog(t, 1.0, 2.0)) * (1 - prog(t, S.close[0], S.close[0] + 0.6));
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a * 0.9;
    mono(ctx, "AN ILLUSTRATIVE FLOW · NO CUSTOMER DATA", W - 120, H - 64, 13, C.ink3, "right", 1.6);
    mark(ctx, 120, H - 84, 26);
    font(ctx, 600, 20, SANS, -0.3); ctx.fillStyle = C.ink; ctx.fillText("botLane", 158, H - 63);
    ctx.restore();
  }

  // ---------------------------------------------------------------- scene 1: the gap
  const SYS = [
    { name: "WhatsApp", sub: "ORDERS · QUESTIONS", x: 1060, y: 300, z: 0.2, word: ["gap", "whatsapp"] },
    { name: "Excel", sub: "SHEETS", x: 1480, y: 250, z: 0.5, word: ["gap", "excel"] },
    { name: "Tally", sub: "BOOKS", x: 1580, y: 560, z: 0.1, word: ["gap", "tally"] },
    { name: "GST portal", sub: "RETURNS", x: 1140, y: 640, z: 0.35, word: ["gap", "gst"] },
    { name: "Marketplaces", sub: "PAYOUTS", x: 1380, y: 860, z: 0.7, word: ["gap", "you"] },
  ];
  const SHUTTLE = [["COPY", 0, 1, "copies"], ["RE-ENTER", 1, 2, "re"], ["MATCH", 2, 3, "reconciles"], ["RECONCILE", 3, 4, "reconciles"]];
  function sysPos(i, t) {
    const s = SYS[i];
    return [s.x + Math.sin(t * 0.5 + i * 1.7) * 10, s.y + Math.cos(t * 0.42 + i * 2.3) * 8];
  }
  function sceneGap(ctx, t) {
    // the systems, floating in depth
    SYS.forEach((s, i) => {
      const t0 = w(...s.word);
      const fx = blurIn(t, t0 - 0.05, 0.8);
      const depthBlur = s.z * 3.2;
      const [x, y] = sysPos(i, t);
      font(ctx, 600, 40, SANS, -0.8);
      const tw = Math.max(ctx.measureText(s.name).width, 190) + 72;
      const e = sprite("sys" + i, tw, 120, (c) => {
        card(c, -tw / 2, -60, tw, 120, { r: 20 });
        font(c, 600, 40, SANS, -0.8); c.fillStyle = C.ink; c.textAlign = "center"; c.fillText(s.name, 0, 6);
        mono(c, s.sub, 0, 40, 15, C.ink3, "center", 1.8);
      });
      drawSprite(ctx, e, x, y + fx.dy, 1 - s.z * 0.18, fx.a * (1 - s.z * 0.35), fx.blur + depthBlur);
    });
    // tired dashed paths between them, with the manual steps shuttling along
    const tp = w("gap", "yet");
    SHUTTLE.forEach(([txt, a, b, word], k) => {
      const t0 = w("gap", word) + (k === 3 ? 0.35 : 0);
      const on = E.brand(prog(t, t0 - 0.2, t0 + 0.4));
      if (on <= 0) return;
      const [x0, y0] = sysPos(a, t), [x1, y1] = sysPos(b, t);
      ctx.save(); ctx.globalAlpha = on * 0.9;
      ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t * 18; ctx.strokeStyle = C.ink3; ctx.lineWidth = 2;
      const mx = (x0 + x1) / 2 + (y1 - y0) * 0.18, my = (y0 + y1) / 2 - (x1 - x0) * 0.18;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
      ctx.setLineDash([]);
      // the pill goes back and forth: someone on your team, all day
      const ph = ((t - t0) * 0.42 + k * 0.3) % 2, q = 0.24 + 0.52 * E.inOut(ph < 1 ? ph : 2 - ph);
      const px = (1 - q) ** 2 * x0 + 2 * (1 - q) * q * mx + q * q * x1, py = (1 - q) ** 2 * y0 + 2 * (1 - q) * q * my + q * q * y1;
      font(ctx, 500, 16, MONO, 1.4);
      const pw = ctx.measureText(txt).width + 24;
      pill(ctx, txt, px - pw / 2, py, "ink", 16);
      ctx.restore();
    });
    // the words, left
    const lA = 1 - E.in(prog(t, tp - 0.4, tp + 0.1));
    ctx.save(); ctx.globalAlpha = lA;
    headline(ctx, ["You already have", "the software."], 160, 470, 88, 76, t,
      [w("gap", "you"), w("gap", "already"), w("gap", "have"), w("gap", "the", 1), w("gap", "software")]);
    ctx.restore();
    if (t > tp - 0.4) {
      headline(ctx, ["The manual work", "is still there."], 160, 470, 88, 76, t,
        [tp, tp + 0.08, tp + 0.16, tp + 0.3, tp + 0.38, tp + 0.46]);
      const n = blurIn(t, w("gap", "by") - 0.1, 0.8);
      withFx(ctx, n, () => mono(ctx, "EVERY STEP BETWEEN TWO SYSTEMS", 164, 630, 19, C.ink2, "left", 2)); withFx(ctx, n, () => mono(ctx, "IS SOMEONE ON YOUR TEAM.", 164, 662, 19, C.ink2, "left", 2));
    }
  }

  // ---------------------------------------------------------------- scene 2: meet BotLane
  const LANE_Y = 640;
  function sceneMeet(ctx, t) {
    const t0 = VO.meet;
    lane(ctx, LANE_Y, 120, W - 120, E.inOut(prog(t, t0 - 0.2, t0 + 1.2)));
    const lk = blurIn(t, w("meet", "botlane") - 0.15, 0.8);
    withFx(ctx, lk, () => {
      font(ctx, 600, 46, SANS, -0.9);
      const tw = ctx.measureText("botLane").width, ms = 52, total = ms + 18 + tw, x = W / 2 - total / 2;
      mark(ctx, x, 230, ms, true);
      ctx.fillStyle = C.ink; ctx.fillText("botLane", x + ms + 18, 272);
    });
    withFx(ctx, blurIn(t, w("meet", "focused") - 0.3, 0.8), () => mono(ctx, "BOTLANE / 01 · INDIA", W / 2, 350, 20, C.ink3, "center", 2.6));
    headline(ctx, ["Software for the work", "that still gets done manually."], W / 2, 450, 98, 86, t,
      ["for", "for", "the", "work", "that", "still", "gets", "done", "manually"].map((x, i) => i === 0 ? w("meet", "software") : w("meet", x)), "center");
  }

  // ---------------------------------------------------------------- scene 3: the lanes, Lane Assist lights
  const LANES = [["01", "Lane Assist", "AVAILABLE"], ["02", "Lane Verify", "IN DEVELOPMENT"], ["03", "Lane Engage", "IN RESEARCH"], ["04", "Lane Settle", "IN RESEARCH"]];
  const LX = [360, 760, 1160, 1560];
  // illustrative customer questions (the kind the site says Lane Assist answers)
  const QS = [
    ["Where is my order?", 1080, 190, 0.0], ["Is COD available?", 1520, 150, 0.4], ["Can I return this?", 1380, 300, 0.15],
    ["Has it shipped yet?", 820, 330, 0.5], ["Do you have it in blue?", 1640, 400, 0.6], ["What’s the return window?", 1000, 440, 0.3],
    ["When will it ship?", 640, 190, 0.7], ["Size chart?", 1780, 250, 0.8],
  ];
  function sceneAssist(ctx, t) {
    const t0 = VO.assist, lit = w("assist", "lane", 0) + 0.15;
    lane(ctx, LANE_Y, 120, W - 120, 1);
    withFx(ctx, blurIn(t, t0 - 0.2, 0.7), () => label(ctx, 160, 160, "01", "THE LANES"));
    LANES.forEach(([n, name, status], i) => {
      const on = t0 - 0.3 + i * 0.16;
      const dim = i === 0 ? 1 : 1 - 0.55 * E.brand(prog(t, lit + 0.3, lit + 0.9));
      station(ctx, LX[i], LANE_Y, t, on, i === 0 ? lit : null, null, dim);
      withFx(ctx, { ...blurIn(t, on + 0.1, 0.7), a: blurIn(t, on + 0.1, 0.7).a * dim }, () => {
        mono(ctx, n, LX[i], LANE_Y - 96, 17, C.ink3, "center", 1.8);
        font(ctx, 600, 40, SANS, -0.8); ctx.fillStyle = C.ink; ctx.textAlign = "center"; ctx.fillText(name, LX[i], LANE_Y - 44); ctx.textAlign = "left";
        const kind = i === 0 ? "green" : "line";
        font(ctx, 500, 15, MONO, 1.4);
        const pw = ctx.measureText(status).width + 24;
        pill(ctx, status, LX[i] - pw / 2, LANE_Y + 62, kind, 15);
      });
    });
    // the routine questions, floating in depth, then drawn into Lane Assist
    const tq = w("assist", "routine") - 0.2, tg = w("assist", "store") + 0.35;
    QS.forEach(([q, x, y, z], i) => {
      const fx = blurIn(t, tq + i * 0.09, 0.8);
      const g = E.inOut(prog(t, tg + i * 0.04, tg + 0.9 + i * 0.04));
      if (fx.a <= 0 || g >= 1) return;
      const fl = [Math.sin(t * 0.7 + i * 1.3) * 10, Math.cos(t * 0.6 + i * 2.1) * 8];
      const px = lerp(x + fl[0], LX[0], g), py = lerp(y + fl[1], LANE_Y, g);
      font(ctx, 500, 30, SANS, -0.3);
      const tw = ctx.measureText(q).width + 44;
      const e = sprite("q" + i, tw, 60, (c) => {
        card(c, -tw / 2, -30, tw, 60, { r: 14, fill: C.surface, stroke: C.hairline });
        font(c, 500, 30, SANS, -0.3); c.fillStyle = C.ink; c.textAlign = "center"; c.fillText(q, 0, 10);
      });
      drawSprite(ctx, e, px, py + fx.dy, (1 - z * 0.25) * (1 - g * 0.6), fx.a * (1 - z * 0.45) * (1 - g), fx.blur + z * 5 + g * 6);
    });
    headline(ctx, ["Answers routine WhatsApp", "questions for online stores."], 160, 820, 70, 60, t,
      ["answers", "routine", "whatsapp", "questions", "for", "online", "store"].map((x) => w("assist", x)));
  }

  // ---------------------------------------------------------------- scene 4: check the order
  const OX = [560, 960, 1360];
  function sceneOrder(ctx, t) {
    const t0 = VO.order;
    const tNum = w("order", "matches") + 0.2, tFound = w("order", "answers"), tVer = w("order", "store") + 0.2;
    lane(ctx, LANE_Y, 120, W - 120, 1);
    withFx(ctx, blurIn(t, t0 - 0.4, 0.7), () => label(ctx, 160, 160, "01", "CHECK THE ORDER"));
    // the customer asks
    withFx(ctx, blurIn(t, t0 - 0.3, 0.6), () => {
      card(ctx, 160, 226, 600, 112, { fill: C.surface, stroke: C.hairline, r: 22 });
      font(ctx, 500, 36, SANS, -0.4); ctx.fillStyle = C.ink;
      typed(ctx, "Where is my order? It’s #1042", 196, 294, t, t0 - 0.1, 30);
      mono(ctx, "09:41", 736, 322, 14, C.ink3, "right", 1);
    });
    [["NUMBER MATCHED", tNum], ["ORDER FOUND", tFound], ["VERIFIED", tVer]].forEach(([name, td], i) => {
      station(ctx, OX[i], LANE_Y, t, t0 + 0.2 + i * 0.15, td - 0.35, td);
      withFx(ctx, blurIn(t, t0 + 0.3 + i * 0.15, 0.6), () => {
        mono(ctx, `0${i + 1}`, OX[i], LANE_Y - 74, 16, C.ink3, "center", 1.8);
        mono(ctx, name, OX[i], LANE_Y - 42, 20, t > td ? C.ink : C.ink2, "center", 2);
      });
    });
    // the number match, under the first station
    withFx(ctx, blurIn(t, tNum - 0.9, 0.6), () => {
      const x = OX[0] - 250, y = LANE_Y + 64;
      card(ctx, x, y, 500, 190, { r: 18 });
      mono(ctx, "STORE ORDER #1042", x + 30, y + 44, 15, C.ink3, "left", 1.8);
      font(ctx, 500, 28, MONO, 0.5); ctx.fillStyle = C.ink;
      ctx.fillText("phone  ••••••  3210", x + 30, y + 82);
      mono(ctx, "WHATSAPP SENDER", x + 30, y + 126, 15, C.ink3, "left", 1.8);
      font(ctx, 500, 28, MONO, 0.5); ctx.fillStyle = C.ink;
      const n = Math.floor(clamp((t - (tNum - 0.6)) * 26, 0, 17));
      ctx.fillText("from   ••••••  3210".slice(0, 2 + n), x + 30, y + 164);
      if (t > tNum) check(ctx, x + 458, y + 154, 20, C.green, 3, E.brand(prog(t, tNum, tNum + 0.35)));
    });
    // the verified reply, right
    withFx(ctx, blurIn(t, tVer - 0.1, 0.7), () => {
      const x = 900, y = 716, w2 = 900;
      card(ctx, x, y, w2, 206, { r: 22 });
      font(ctx, 500, 32, SANS, -0.3); ctx.fillStyle = C.ink;
      const tt = tVer + 0.2;
      typed(ctx, "Hi Priya, order #1042 left our warehouse on", x + 34, y + 62, t, tt, 60, false);
      typed(ctx, "14 Oct with Delhivery. Expected delivery: 17 Oct.", x + 34, y + 108, t, tt + 0.72, 60, false);
      if (t > tt + 1.4) {
        const a = E.brand(prog(t, tt + 1.4, tt + 1.8));
        ctx.save(); ctx.globalAlpha *= a; pill(ctx, "✓ VERIFIED", x + 34, y + 164, "green", 16); ctx.restore();
      }
      mono(ctx, "LANE ASSIST · WHATSAPP", x + w2 - 34, y + 170, 14, C.ink3, "right", 1.6);
    });
  }

  // ---------------------------------------------------------------- scenes 5 and 6: the reply guard, then a person
  const GX = W / 2;
  function guardCamY(t) { return E.inOut(prog(t, VO.person - 0.5, VO.person + 0.7)) * 400; }
  function sceneGuard(ctx, t) {
    const t0 = VO.guard;
    const tCheck = w("guard", "checked"), tDisc = w("guard", "discount"), tHeld = w("guard", "held");
    ctx.save(); ctx.translate(0, -guardCamY(t));
    lane(ctx, LANE_Y, 120, W - 120, 1);
    withFx(ctx, blurIn(t, t0 - 0.4, 0.7), () => label(ctx, 160, 160, "02", "THE REPLY GUARD"));
    // the AI draft
    withFx(ctx, blurIn(t, t0 - 0.3, 0.7), () => {
      const x = 460, y = 236, w2 = 1000, h = 176;
      const held = E.brand(prog(t, tHeld, tHeld + 0.4));
      card(ctx, x, y, w2, h, { r: 16, stroke: held > 0.5 ? "rgba(255,91,31,0.55)" : C.hairline });
      mono(ctx, "AI DRAFT · NOT SENT", x + 34, y + 46, 16, C.ink3, "left", 1.8);
      mono(ctx, "AI", x + w2 - 34, y + 46, 16, C.ink3, "right", 1.8);
      font(ctx, 500, 42, SANS, -0.6);
      const txt = "So sorry! Here’s 20% off your next order.";
      const hs = "So sorry! Here’s ".length;
      const tt = t0 + 0.1;
      // highlight the promise the store never made
      const hl = E.brand(prog(t, tDisc - 0.15, tDisc + 0.35));
      if (hl > 0) {
        const x0 = x + 34 + ctx.measureText(txt.slice(0, hs)).width, ww = ctx.measureText("20% off your next order").width;
        ctx.save(); ctx.fillStyle = `rgba(255,91,31,${0.16 * hl})`; rrect(ctx, x0 - 5, y + 90, ww * hl + 10, 58, 8); ctx.fill(); ctx.restore();
        ctx.fillStyle = C.orange; ctx.fillRect(x0, y + 146, ww * hl, 4);
      }
      ctx.fillStyle = held > 0 ? `rgba(17,17,17,${1 - 0.5 * held})` : C.ink;
      typed(ctx, txt, x + 34, y + 134, t, tt, 34);
      if (held > 0) { const ww = ctx.measureText(txt).width; ctx.fillStyle = C.ink; ctx.fillRect(x + 34, y + 120, ww * held, 3); }
    });
    // the policy check node
    const lit = tCheck + 0.1;
    station(ctx, GX, LANE_Y, t, t0 - 0.2, lit, null);
    withFx(ctx, blurIn(t, t0, 0.6), () => {
      mono(ctx, "POLICY", GX, LANE_Y - 74, 16, C.ink3, "center", 1.8);
      mono(ctx, "REPLY CHECK", GX, LANE_Y - 44, 20, C.ink, "center", 2);
    });
    // verdict
    withFx(ctx, blurIn(t, tHeld + 0.05, 0.6), () => {
      const x = 460, y = 700, w2 = 1000, h = 132;
      card(ctx, x, y, w2, h, { r: 16, fill: "#fff6f1", stroke: "rgba(255,91,31,0.35)" });
      ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x + 34, y + 44); ctx.lineTo(x + 54, y + 64); ctx.moveTo(x + 54, y + 44); ctx.lineTo(x + 34, y + 64); ctx.stroke();
      font(ctx, 600, 34, SANS, -0.5); ctx.fillStyle = C.ink; ctx.fillText("Reply held", x + 78, y + 66);
      font(ctx, 500, 27, SANS, -0.2); ctx.fillStyle = C.ink2; ctx.fillText("Discount not in store policy. Sent to a person.", x + 78, y + 106);
      pill(ctx, "HELD", x + w2 - 110, y + 54, "ink", 16);
    });
    // the branch down to a person
    const tp = VO.person - 0.3;
    const br = E.inOut(prog(t, tp, tp + 0.8));
    if (br > 0) {
      ctx.strokeStyle = C.border; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(GX, LANE_Y + 17); ctx.lineTo(GX, LANE_Y + 17 + br * 500); ctx.stroke();
      // the guard's triggers, as the site lists them
      const TR = ["CUSTOMER ASKS FOR A PERSON", "AN ORDER LOOKUP FAILS", "THE SYSTEM ISN’T CONFIDENT"];
      TR.forEach((s, i) => withFx(ctx, blurIn(t, tp + 0.35 + i * 0.18, 0.6), () => {
        font(ctx, 500, 16, MONO, 1.4);
        const pw = ctx.measureText(s).width + 24;
        pill(ctx, s, GX - 60 - pw, LANE_Y + 260 + i * 54, "line", 16);
      }));
    }
    const tc = w("person", "person") - 0.1;
    withFx(ctx, blurIn(t, tc, 0.7), () => {
      const x = GX + 60, y = LANE_Y + 330, w2 = 720, h = 230;
      card(ctx, x, y, w2, h, { r: 16 });
      mono(ctx, "HANDOFF TO THE OWNER", x + 34, y + 46, 16, C.ink3, "left", 1.8);
      mono(ctx, "WHATSAPP", x + w2 - 34, y + 46, 16, C.ink3, "right", 1.8);
      font(ctx, 600, 38, SANS, -0.6); ctx.fillStyle = C.ink; ctx.fillText("Customer asked for a person", x + 34, y + 108);
      font(ctx, 500, 27, SANS, -0.2); ctx.fillStyle = C.ink2;
      ctx.fillText("Order #1187 · 6 messages", x + 34, y + 152);
      const fc = E.brand(prog(t, w("person", "whole") - 0.1, w("person", "whole") + 0.4));
      ctx.save(); ctx.globalAlpha *= fc; pill(ctx, "FULL CHAT ATTACHED", x + 34, y + 196, "green", 16); ctx.restore();
    });
    ctx.restore();
    // headline for the person beat stays put while the camera moves
    headline(ctx, ["A person", "when it matters."], 160, 840, 76, 64, t,
      [w("person", "person") - 0.1, w("person", "person"), w("person", "takes"), w("person", "over"), w("person", "over") + 0.1]);
  }

  // ---------------------------------------------------------------- scene 7: the managed service, and India
  const SX = [520, 960, 1400];
  const INDIA = [
    ["GST and Tally", 360, 330, 0.45], ["WhatsApp first", 820, 250, 0.1], ["UPI, COD and payouts", 1360, 300, 0.5],
    ["Indian marketplaces", 400, 900, 0.6], ["A person at the exception", 1520, 900, 0.35], ["Priced in rupees", 980, 470, 0],
  ];
  function sceneService(ctx, t) {
    const t0 = VO.service, tIndia = w("service", "built") - 0.2;
    const sv = 1 - E.in(prog(t, tIndia - 0.2, tIndia + 0.5));
    // service stations
    if (sv > 0) {
      ctx.save(); ctx.globalAlpha *= sv;
      if (sv < 1) ctx.filter = `blur(${((1 - sv) * 20).toFixed(1)}px)`;
      lane(ctx, LANE_Y, 120, W - 120, 1);
      withFx(ctx, blurIn(t, t0 - 0.4, 0.7), () => label(ctx, 160, 160, "03", "MANAGED SERVICE"));
      headline(ctx, ["You don’t set up a bot.", "BotLane runs it for you."], 160, 290, 72, 60, t,
        [t0 - 0.3, t0 - 0.25, t0 - 0.2, t0 - 0.15, t0 - 0.1, t0 - 0.05, t0 + 0.1, t0 + 0.15, t0 + 0.2, t0 + 0.25, t0 + 0.3]);
      [["CONNECTED", "On one call", w("service", "connect")], ["RULES", "Written with you", w("service", "write")], ["REVIEWED", "Every week", w("service", "review")]].forEach(([k, v, td], i) => {
        station(ctx, SX[i], LANE_Y, t, t0 + i * 0.12, td - 0.3, td + 0.1);
        withFx(ctx, blurIn(t, t0 + 0.1 + i * 0.12, 0.6), () => mono(ctx, k, SX[i], LANE_Y - 44, 20, C.ink, "center", 2));
        withFx(ctx, blurIn(t, td - 0.1, 0.6), () => {
          font(ctx, 600, 40, SANS, -0.7); ctx.fillStyle = C.ink; ctx.textAlign = "center"; ctx.fillText(v, SX[i], LANE_Y + 84); ctx.textAlign = "left";
        });
      });
      ctx.restore();
    }
    // India: the site's six facts float in depth; "Priced in rupees" comes forward with the pilot
    if (t > tIndia - 0.3) {
      const tR = w("service", "priced") - 0.1;
      INDIA.forEach(([txt, x, y, z], i) => {
        const fx = blurIn(t, tIndia + i * 0.14, 0.9);
        const fwd = i === 5 ? E.brand(prog(t, tR, tR + 0.6)) : 0;
        const back = i === 5 ? 0 : E.brand(prog(t, tR, tR + 0.8));
        const zz = z + back * 0.4;
        const fx2 = { a: fx.a * (1 - zz * 0.5), blur: fx.blur + zz * 6, dy: fx.dy + Math.sin(t * 0.6 + i) * 6 };
        font(ctx, 600, 38, SANS, -0.6);
        const tw = ctx.measureText(txt).width + 72;
        const mk = (hl) => (c) => {
          card(c, -tw / 2, -44, tw, 88, { r: 44, stroke: hl ? C.orange : C.hairline, lw: hl ? 2.5 : 1.5 });
          font(c, 600, 38, SANS, -0.6); c.fillStyle = C.ink; c.textAlign = "center"; c.fillText(txt, 0, 13);
        };
        const cx = x + Math.cos(t * 0.45 + i * 2) * 8, cy = y + fx2.dy, sc = 1 - zz * 0.22 + fwd * 0.18;
        drawSprite(ctx, sprite("in" + i, tw, 88, mk(false)), cx, cy, sc, fx2.a * (1 - fwd), fx2.blur);
        if (fwd > 0) drawSprite(ctx, sprite("inh" + i, tw, 88, mk(true)), cx, cy, sc, fx2.a * fwd, fx2.blur);
      });
      headline(ctx, ["Built for India."], W / 2, 640, 0, 88, t, [tIndia + 0.1, tIndia + 0.2, tIndia + 0.3], "center");
      withFx(ctx, blurIn(t, tR + 0.4, 0.8), () => {
        const x = W / 2 - 330, y = 712;
        card(ctx, x, y, 660, 124, { r: 18 });
        mono(ctx, "LANE ASSIST PILOT", x + 34, y + 44, 15, C.ink3, "left", 1.8);
        font(ctx, 700, 48, SANS, -1.1); ctx.fillStyle = C.ink; ctx.fillText("₹6,999", x + 34, y + 98);
        const pw = ctx.measureText("₹6,999").width;
        font(ctx, 500, 26, SANS, -0.2); ctx.fillStyle = C.ink2; ctx.fillText("/month, setup scoped separately", x + 46 + pw, y + 96);
      });
    }
  }

  // ---------------------------------------------------------------- scene 8: the close
  function sceneClose(ctx, t) {
    const t0 = VO.close;
    const tm = t0 - 0.2;
    // the mark's plate forms around the lamp
    const pl = E.brand(prog(t, tm, tm + 0.9));
    const ms = 96;
    font(ctx, 600, 84, SANS, -1.7);
    const tw = ctx.measureText("botLane").width, total = ms + 30 + tw;
    const slide = E.brand(prog(t, tm + 0.35, tm + 1.2));
    const mx = lerp(W / 2 - ms / 2, W / 2 - total / 2, slide), my = 250;
    ctx.save(); ctx.globalAlpha = pl; ctx.translate(mx + ms / 2, my + ms / 2); ctx.scale(0.7 + 0.3 * pl, 0.7 + 0.3 * pl); ctx.translate(-ms / 2, -ms / 2);
    ctx.scale(ms / 32, ms / 32); ctx.fillStyle = C.ink; ctx.fill(PLATE, "evenodd"); ctx.restore();
    withFx(ctx, { ...blurIn(t, tm + 0.5, 0.8), dx: 0 }, () => {
      font(ctx, 600, 84, SANS, -1.7); ctx.fillStyle = C.ink; ctx.fillText("botLane", mx + ms + 30, my + 76);
    });
    const tl = w("close", "software");
    headline(ctx, ["Software for the work", "that still gets done manually."], W / 2, 520, 72, 60, t,
      ["software", "for", "the", "work", "that", "still", "gets", "done", "manually"].map((x) => w("close", x)), "center");
    // the primary call to action, exactly as the site draws it
    const tb = w("close", "talk") - 0.15;
    withFx(ctx, blurIn(t, tb, 0.7), () => {
      font(ctx, 600, 30, SANS, -0.3);
      const label = "Talk to BotLane";
      const lw = ctx.measureText(label).width, bw = lw + 104, bh = 72, bx = W / 2 - bw / 2, by = 640;
      rrect(ctx, bx, by, bw, bh + 4, 12); ctx.fillStyle = C.orangeEdge; ctx.fill();
      rrect(ctx, bx, by, bw, bh, 12); ctx.fillStyle = C.orange; ctx.fill();
      ctx.fillStyle = C.ink; ctx.fillText(label, bx + 34, by + 47);
      ctx.save(); ctx.translate(bx + 34 + lw + 16, by + 36);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(16, -7); ctx.moveTo(3, -7); ctx.lineTo(16, -7); ctx.lineTo(16, 6); ctx.stroke();
      ctx.restore();
    });
    withFx(ctx, blurIn(t, w("close", "botlane", 1) - 0.1, 0.7), () => mono(ctx, "BOTLANE.IN", W / 2, 790, 26, C.ink, "center", 3));
    withFx(ctx, blurIn(t, w("close", "botlane", 1) + 0.5, 0.9), () => mono(ctx, "PRIVATE · MANAGED · HUMAN-CONTROLLED", W / 2, 860, 16, C.ink3, "center", 2.4));
  }

  // ---------------------------------------------------------------- lamp path
  function buildLamp() {
    const Y = LANE_Y;
    const inout = E.inOut, out = E.brand;
    const tm = VO.close - 0.2;
    LAMP = [
      [0.0, W / 2, H / 2, 9, 0], [0.5, W / 2, H / 2, 9, 1],
      [w("gap", "whatsapp") - 0.2, W / 2, H / 2, 9, 1],
      [w("gap", "whatsapp") + 0.5, 700, 900, 6, 0.0, inout], // steps aside while the systems speak
      [VO.meet - 0.8, W / 2, Y, 7, 0.0],
      [VO.meet - 0.2, W / 2, Y, 11, 1, out], // ignites on the new lane
      [VO.assist - 0.3, W / 2, Y, 10, 1],
      [VO.assist - 0.05, 160, Y, 9, 1, inout],
      [w("assist", "lane", 0) + 0.15, LX[0], Y, 10, 1, out], // lands on Lane Assist
      [VO.order - 0.5, LX[0], Y, 10, 1],
      [VO.order - 0.1, 160, Y, 9, 1, inout],
      [w("order", "matches") - 0.15, OX[0], Y, 10, 1, out],
      [w("order", "answers") - 0.2, OX[1], Y, 10, 1, inout],
      [w("order", "store"), OX[2], Y, 10, 1, inout],
      [VO.guard - 0.5, OX[2], Y, 10, 1],
      [VO.guard - 0.1, 160, Y, 9, 1, inout],
      [w("guard", "checked") + 0.1, GX, Y, 11, 1, out], // hits the policy check
      [VO.person - 0.3, GX, Y, 11, 1],
      // down the branch to the handoff (scene space; lampAt adds the camera move)
      [VO.person + 0.9, GX, Y + 500, 10, 1, inout],
      [VO.service - 0.75, GX, Y + 500, 10, 1],
      [VO.service - 0.45, GX, Y + 500, 10, 0],
      [VO.service - 0.35, 160, Y, 9, 0],
    ];
    LAMP.push([VO.service - 0.1, 160, Y, 9, 1, inout],
      [w("service", "connect") - 0.1, SX[0], Y, 10, 1, out], [w("service", "write") - 0.1, SX[1], Y, 10, 1, inout],
      [w("service", "review") - 0.1, SX[2], Y, 10, 1, inout],
      [w("service", "built") - 0.3, SX[2], Y, 10, 1], [w("service", "built") + 0.4, W / 2, 470, 8, 0, inout],
      [tm - 0.6, W / 2, 470, 8, 0], [tm - 0.1, W / 2 - 48 + 30, 250 + 48, 9, 1, out]);
    // then it rides the plate as the mark's lamp (see drawCloseLamp)
  }
  function closeLamp(t) {
    // after the plate forms, the lamp sits at the mark's lamp position and scales with it
    const tm = VO.close - 0.2;
    if (t < tm + 0.05) return null;
    const ms = 96;
    const ctx = window.__mctx;
    font(ctx, 600, 84, SANS, -1.7);
    const tw = ctx.measureText("botLane").width, total = ms + 30 + tw;
    const slide = E.brand(prog(t, tm + 0.35, tm + 1.2));
    const mx = lerp(W / 2 - ms / 2, W / 2 - total / 2, slide);
    const k = E.brand(prog(t, tm + 0.05, tm + 0.7));
    return { x: mx + (10 / 32) * ms, y: 250 + ms / 2, r: lerp(9, (2.25 / 32) * ms, k) };
  }

  // ---------------------------------------------------------------- frame
  let ready = false;
  function build() { buildLamp(); ready = true; }
  function render(ctx, t, Wc, Hc) {
    if (!ready) build();
    window.__mctx = ctx;
    ctx.setTransform(Wc / W, 0, 0, Hc / H, 0, 0);
    ctx.filter = "none"; ctx.globalAlpha = 1;
    background(ctx, t);
    // a slow breath of the whole world
    const br = 1 + 0.012 * Math.sin(t * 0.25);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(br, br); ctx.translate(-W / 2, -H / 2);
    const scenes = [["gap", sceneGap], ["meet", sceneMeet], ["assist", sceneAssist], ["order", sceneOrder], ["guard", sceneGuard], ["service", sceneService], ["close", sceneClose]];
    for (const [id, fn] of scenes) {
      let [a, b] = S[id];
      if (id === "guard") b = S.person[1];
      if (t < a - 0.1 || t > b + 0.1) continue;
      layer(ctx, env(t, a, b, id === "gap" ? 0.01 : 0.7, 0.65), (c) => fn(c, t));
    }
    // the lamp rides above the scenes
    const cl = closeLamp(t);
    if (cl) {
      ctx.save(); ctx.beginPath(); ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2); ctx.fillStyle = C.orange; ctx.fill(); ctx.restore();
      const glow = 1 - E.brand(prog(t, VO.close + 0.6, VO.close + 1.6));
      if (glow > 0) {
        const R = 70 * glow + 10;
        const g = ctx.createRadialGradient(cl.x, cl.y, 0, cl.x, cl.y, R);
        g.addColorStop(0, `rgba(255,91,31,${0.35 * glow})`); g.addColorStop(1, "rgba(255,91,31,0)");
        ctx.fillStyle = g; ctx.fillRect(cl.x - R, cl.y - R, R * 2, R * 2);
      }
    } else drawLamp(ctx, t);
    ctx.restore();
    footerNote(ctx, t);
    // open from and close to paper
    const fin = 1 - prog(t, 0, 0.4), fout = prog(t, DUR - 0.6, DUR - 0.05);
    if (fin > 0 || fout > 0) { ctx.fillStyle = C.paper; ctx.globalAlpha = Math.max(fin, fout * 0.0); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }
  function finish(ctx, t, Wc, Hc) {
    ctx.save();
    ctx.globalAlpha = 0.035; ctx.globalCompositeOperation = "overlay";
    if (!finish.g) {
      const g = document.createElement("canvas"); g.width = g.height = 256;
      const x = g.getContext("2d"), im = x.createImageData(256, 256);
      for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0); finish.g = g;
    }
    const ox = Math.floor(hash(Math.floor(t * 24)) * 256), oy = Math.floor(hash(Math.floor(t * 24) + 7) * 256);
    ctx.fillStyle = ctx.createPattern(finish.g, "repeat");
    ctx.translate(-ox, -oy); ctx.fillRect(0, 0, Wc + 256, Hc + 256);
    ctx.restore();
  }

  // ---------------------------------------------------------------- sound cues, sections, captions
  function cues() {
    if (!ready) build();
    const c = [{ t: 0.3, k: "light", g: 0.3 }];
    SYS.forEach((s) => c.push({ t: w(...s.word), k: "pop", g: 0.22 }));
    c.push({ t: w("gap", "copies"), k: "tick", g: 0.2 }, { t: w("gap", "re"), k: "tick", g: 0.2 }, { t: w("gap", "reconciles"), k: "tick", g: 0.2 });
    c.push({ t: VO.meet - 0.5, k: "whoosh", g: 0.22, d: 0.8 }, { t: VO.meet - 0.2, k: "light", g: 0.35 });
    c.push({ t: w("assist", "lane", 0) + 0.15, k: "tick", g: 0.3 });
    c.push({ t: VO.order - 0.4, k: "whoosh", g: 0.16, d: 0.6 });
    [w("order", "matches") + 0.2, w("order", "answers"), w("order", "store") + 0.2].forEach((t) => c.push({ t, k: "tick", g: 0.26 }));
    c.push({ t: VO.guard - 0.4, k: "whoosh", g: 0.16, d: 0.6 }, { t: w("guard", "checked") + 0.1, k: "knock", g: 0.3 }, { t: w("guard", "held"), k: "stamp", g: 0.3 });
    c.push({ t: VO.person - 0.3, k: "drop", g: 0.2 }, { t: w("person", "person") - 0.1, k: "pop", g: 0.22 });
    c.push({ t: VO.service - 0.4, k: "whoosh", g: 0.16, d: 0.6 });
    ["connect", "write", "review"].forEach((x) => c.push({ t: w("service", x) + 0.1, k: "tick", g: 0.24 }));
    c.push({ t: w("service", "built") - 0.2, k: "swell", g: 0.22 }, { t: w("service", "rupees"), k: "pop", g: 0.24 });
    c.push({ t: VO.close - 0.2, k: "resolve", g: 0.45 }, { t: w("close", "talk"), k: "click", g: 0.3 });
    return c.sort((a, b) => a.t - b.t);
  }
  function captions() {
    // sentence-level captions (for the SRT; the film itself carries its words on screen)
    const out = [];
    for (const id of ORDER) {
      const ws = VT.words[id];
      let cur = [], t0 = null;
      ws.forEach(([txt, a, b], i) => {
        if (t0 == null) t0 = a;
        cur.push(txt);
        const len = cur.join(" ").length;
        if (/[.?!]$/.test(txt) && len > 18 || len > 48 || i === ws.length - 1) {
          out.push({ t0: VO[id] + t0, t1: VO[id] + b + 0.2, text: cur.join(" ").replace(/botlane dot in/gi, "botlane.in") });
          cur = []; t0 = null;
        }
      });
    }
    for (let i = 0; i < out.length - 1; i++) out[i].t1 = Math.min(out[i].t1, out[i + 1].t0 - 0.02);
    return out;
  }
  function samplesAt(t) {
    if (!ready) return 3;
    // more sub-frames while the lamp moves fast
    const a = lampAt(t - 0.01), b = lampAt(t + 0.01);
    return Math.hypot(a.x - b.x, a.y - b.y) > 6 ? 6 : 3;
  }
  window.PIECE = {
    render, finish, samplesAt, DUR, FPS, IMG: {}, cues, captions,
    voice: () => ORDER.map((id) => ({ id, t: VO[id] })),
    sections: () => ({ DUR, VO, LEN, S }),
  };
})();

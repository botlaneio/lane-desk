/*
 * Lane Desk: 15-second brand film.
 *
 * One idea: the orange lamp in the Lane Desk mark is a customer message, and
 * the slot it sits in is the lane. The dot of a "?" falls onto a lane, the
 * lane forks into the five real routes (app/page.tsx ROUTES), one message is
 * verified, one AI draft is held by the reply guard and handed to a person,
 * and every lane collapses back into the slot of the mark.
 *
 * Everything is a pure function of t: render(ctx, t) never reads a clock, so
 * any frame can be rendered alone and preview matches the export.
 *
 * Brand rules followed (source: app/globals.css, components/*.tsx):
 *  - palette is the @theme tokens only; orange is the single message dot / lamp
 *  - Inter 700 display at -0.03em, JetBrains Mono 500 uppercase labels
 *  - the one dark environment is the ink band colour (#111111)
 *  - site easing cubic-bezier(0.22, 1, 0.36, 1)
 *  - example chats carry "AN ILLUSTRATIVE FLOW · NO CUSTOMER DATA"
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------- tokens
  const C = {
    paper: "#faf8f5",
    surface: "#ffffff",
    surface2: "#f3f1ed",
    ink: "#111111",
    ink2: "#5c5c5c",
    hairline: "#e7e4df",
    border: "#d4d0c9",
    onInk: "#ffffff",
    onInk2: "#b8b5b0",
    inkLine: "#2c2b29",
    orange: "#ff5b1f",
    verified: "#15803d",
    verifiedWash: "#dcfce7",
  };
  const SANS = "Inter";
  const MONO = "JetBrains Mono";
  const DUR = 15;
  const FPS = 60;

  // ---------------------------------------------------------------- math
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));

  function bez(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (s) => ((ax * s + bx) * s + cx) * s;
    const Y = (s) => ((ay * s + by) * s + cy) * s;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let lo = 0, hi = 1, s = x;
      for (let i = 0; i < 28; i++) {
        const v = X(s);
        if (Math.abs(v - x) < 1e-6) break;
        if (v < x) lo = s; else hi = s;
        s = (lo + hi) / 2;
      }
      return Y(s);
    };
  }
  const E = {
    brand: bez(0.22, 1, 0.36, 1), // the site's own curve (globals.css .rise)
    inOut: bez(0.65, 0, 0.35, 1),
    in: bez(0.55, 0, 0.9, 0.35),
    whip: bez(0.85, 0, 0.15, 1),
    expoIn: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    lin: (x) => x,
  };

  // damped spring from 0 to 1 (overshoots, then settles)
  function spring(dt, f = 2.6, z = 0.42) {
    if (dt <= 0) return 0;
    const w = 2 * Math.PI * f;
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt));
  }
  function hash(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function noise(x) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i), hash(i + 1), u) * 2 - 1;
  }

  // ---------------------------------------------------------------- timeline
  const T = {
    slam: 0.0, my: 0.3, order: 0.56,
    squash: 1.12, launch: 1.24, collapse: 1.3,
    stroke: 1.66, strokeEnd: 1.98,
    rollStart: 2.52, forkArrive: 3.34,
    sprout: 2.98, circle: 3.36, click: 3.58, shoot: 3.64, card: 4.18,
    verified: 5.24,
    dot2: 5.96, whip: 6.0, gate: 6.55, push: 6.58, dark: 7.0,
    draft: 7.08, strike: 7.48, held: 7.78, reason: 7.96,
    dropAway: 8.3, hard: 8.66, dotDrop: 8.78, dotLand: 9.06, iris: 9.28,
    owner: 9.38, noteLand: 9.86,
    pullOut: 10.2, dissolve: 10.85, converge: 10.95, lampFly: 11.05, lampLand: 11.62,
    thicken: 11.66, plate: 12.05, lockup: 12.55, tagline: 13.3,
  };

  // camera shakes: [time, amplitude px, decay]
  const IMPACTS = [
    [0.07, 22, 9], [2.1, 7, 10], [T.card, 4, 12], [T.verified, 6, 14], [T.dark, 18, 8],
    [T.held, 24, 9], [T.hard, 8, 12], [T.iris, 10, 10], [T.plate, 5, 12],
  ];

  // ---------------------------------------------------------------- world layout
  const LANE_Y = 1150;
  const GAP = 170;
  const X_F = 1800; // the sort switch
  const X_E = X_F + 1250; // lane ends
  const X_G = X_F + 1000; // reply guard gate
  const LC = { x: X_E + 500, y: LANE_Y + 800 }; // the "person takes over" view
  const OV = { x: 2650, y: LANE_Y + 262, z: 0.48 }; // overview
  const MS = 360; // mark size in world units (32 viewBox units)
  const MU = MS / 32;
  const MX = 2650, MY = LANE_Y + 230; // where the mark is born
  const LAMP = { x: MX + (10 - 16) * MU, y: MY + (16 - 16) * MU, r: 2.25 * MU };
  const SLOT_HALF = (22.5 - 9.5) / 2 * MU; // straight part of the capsule, half length
  const SLOT_H = 7 * MU;
  const DOT_R = 22;

  const ROUTES = [
    { n: "01", name: "ORDER STATUS", llm: false },
    { n: "02", name: "PRODUCT QUESTION", llm: true },
    { n: "03", name: "RETURNS OR POLICY", llm: true },
    { n: "04", name: "WANTS A PERSON", llm: false },
    { n: "05", name: "UNCLEAR", llm: false },
  ];
  const laneY = (i, spread = 1) => LANE_Y + (i - 2) * GAP * spread;

  // measured once fonts are ready
  const L = {};

  // ---------------------------------------------------------------- canvas helpers
  let VZ = 1; // current device pixels per world unit (for shadows / hairlines)

  function font(ctx, w, px, fam = SANS, ls = 0) {
    ctx.font = `${w} ${px}px "${fam}"`;
    ctx.letterSpacing = `${ls}px`;
  }
  function wrap(ctx, text, maxW) {
    const words = text.split(" ");
    const lines = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (ctx.measureText(next).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  function arrowPath(ctx, x, y, s, color, lw) {
    // right arrow, left end at x, vertical centre y, width s
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + s, y);
    ctx.moveTo(x + s * 0.62, y - s * 0.36);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x + s * 0.62, y + s * 0.36);
    ctx.stroke();
    ctx.restore();
  }
  function checkPath(ctx, x, y, s, color, lw) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x + 0.22 * s, y + 0.53 * s);
    ctx.lineTo(x + 0.41 * s, y + 0.72 * s);
    ctx.lineTo(x + 0.78 * s, y + 0.28 * s);
    ctx.stroke();
    ctx.restore();
  }

  // chip: pill with mono uppercase text. segs: strings or "ARROW" / "CHECK".
  function chip(ctx, x, cy, kind, segs, px = 20, align = "left") {
    const K = {
      verified: [C.verifiedWash, C.verified, null],
      held: [C.ink, C.onInk, null],
      heldOnInk: [C.ink, C.onInk, C.onInk],
      quiet: [C.surface2, C.ink2, null],
      outline: [C.surface, C.ink, C.border],
      dark: [C.ink, C.onInk, null],
    }[kind];
    font(ctx, 500, px, MONO, px * 0.04);
    const padX = px * 0.62, h = px * 1.62, gap = px * 0.32, icon = px * 0.9;
    let w = padX * 2;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      w += s === "ARROW" || s === "CHECK" ? icon : ctx.measureText(s).width;
      if (i < segs.length - 1) w += gap;
    }
    if (align === "right") x -= w;
    if (align === "center") x -= w / 2;
    rrect(ctx, x, cy - h / 2, w, h, h / 2);
    ctx.fillStyle = K[0];
    ctx.fill();
    if (K[2]) {
      ctx.lineWidth = Math.max(1.5, px * 0.08);
      ctx.strokeStyle = K[2];
      ctx.stroke();
    }
    let cx = x + padX;
    ctx.fillStyle = K[1];
    ctx.textBaseline = "middle";
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (s === "ARROW") {
        arrowPath(ctx, cx + icon * 0.08, cy, icon * 0.84, K[1], px * 0.09);
        cx += icon;
      } else if (s === "CHECK") {
        checkPath(ctx, cx - icon * 0.05, cy - icon * 0.5, icon, K[1], px * 0.12);
        cx += icon;
      } else {
        font(ctx, 500, px, MONO, px * 0.04);
        ctx.fillText(s, cx, cy + px * 0.04);
        cx += ctx.measureText(s).width;
      }
      cx += gap;
    }
    ctx.textBaseline = "alphabetic";
    return w;
  }

  // marker stroke: hand-drawn, width varies, revealed by progress p (0..1)
  function marker(ctx, pts, p, width, color, seed = 1, jitter = 1.6) {
    if (p <= 0 || pts.length < 2) return;
    // resample
    const seg = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d);
      total += d;
    }
    const step = 6;
    const n = Math.max(2, Math.ceil(total / step));
    const out = [];
    let si = 0, acc = 0;
    for (let k = 0; k <= n; k++) {
      const target = (k / n) * total;
      while (si < seg.length - 1 && acc + seg[si] < target) acc += seg[si++];
      const f = seg[si] ? (target - acc) / seg[si] : 0;
      const a = pts[si], b = pts[si + 1];
      let x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f);
      const nx = -(b[1] - a[1]) / (seg[si] || 1), ny = (b[0] - a[0]) / (seg[si] || 1);
      const j = noise(k * 0.21 + seed * 13.7) * jitter;
      out.push([x + nx * j, y + ny * j]);
    }
    const upto = Math.max(1, Math.floor(p * n));
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let k = 1; k <= upto; k++) {
      const u = k / n;
      // taper in and out, pressure noise
      const taper = Math.min(1, u / 0.06, (1 - u) / 0.1 + 0.35);
      ctx.lineWidth = width * (0.82 + 0.18 * noise(k * 0.37 + seed * 3.1)) * clamp(taper, 0.35, 1);
      ctx.beginPath();
      ctx.moveTo(out[k - 1][0], out[k - 1][1]);
      ctx.lineTo(out[k][0], out[k][1]);
      ctx.stroke();
    }
    ctx.restore();
  }

  function dot(ctx, x, y, r, sx = 1, sy = 1, rot = 0) {
    if (r <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sx, sy);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = C.orange;
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- layout (fonts ready)
  function layout(ctx) {
    // hook type
    L.hookPx = 360;
    font(ctx, 700, L.hookPx, SANS, -0.03 * L.hookPx);
    L.w1 = ctx.measureText("Where’s").width;
    L.wMy = ctx.measureText("my ").width;
    const second = "my order?";
    L.w2 = ctx.measureText(second).width;
    const blockW = Math.max(L.w1, L.w2);
    L.hx = -blockW / 2;
    L.b1 = -30;
    L.b2 = L.b1 + L.hookPx * 0.98;
    L.orderChars = [];
    const word = "order?";
    for (let i = 0; i < word.length; i++) {
      L.orderChars.push({
        ch: word[i],
        x: L.hx + L.wMy + ctx.measureText(word.slice(0, i)).width,
        w: ctx.measureText(word[i]).width,
      });
    }
    // the question mark's dot, measured from the full stop's box
    const q = L.orderChars[5];
    const mq = ctx.measureText("?");
    const md = ctx.measureText(".");
    L.dotH = md.actualBoundingBoxAscent + md.actualBoundingBoxDescent;
    L.qInk = { l: q.x - mq.actualBoundingBoxLeft, r: q.x + mq.actualBoundingBoxRight };
    L.qDot = {
      x: (L.qInk.l + L.qInk.r) / 2 - L.hookPx * 0.004,
      y: L.b2 - md.actualBoundingBoxAscent / 2 + md.actualBoundingBoxDescent / 2,
      r: L.dotH * 0.56,
    };
    L.hookCam = { x: 0, y: (L.b1 - L.hookPx * 0.73 + L.b2 + L.hookPx * 0.2) / 2 };

    // dot physics: launch, fall to the lane, one bounce
    const g = 5200;
    const vy = -980, vx = 190;
    const rest = LANE_Y - DOT_R - 4;
    const dy = rest - L.qDot.y;
    const tFall = (-vy + Math.sqrt(vy * vy + 2 * g * dy)) / g;
    L.phys = { g, vy, vx, tLand: T.launch + tFall, rest };
    L.landX = L.qDot.x + vx * tFall;
    const vImp = vy + g * tFall;
    L.bounceV = -vImp * 0.28;
    L.tBounceEnd = L.phys.tLand + (2 * L.bounceV) / g;
    L.xBounceEnd = L.landX + vx * 0.5 * (L.tBounceEnd - L.phys.tLand);
    L.trunkStart = L.landX - 1500;

    // wordmark (components/logo.tsx: size-7 mark = 28px, gap-2.5 = 10px, text 15px)
    const k = MS / 28;
    L.wmPx = 15 * k;
    L.wmGap = 10 * k;
    L.wmInner = 6 * k;
    font(ctx, 500, L.wmPx, SANS, 0);
    L.wmA = ctx.measureText("botLane").width;
    L.wmSlash = ctx.measureText("/").width;
    font(ctx, 600, L.wmPx, SANS, -0.01 * L.wmPx);
    L.wmB = ctx.measureText("Lane Desk").width;
    L.wmW = L.wmA + L.wmInner + L.wmSlash + L.wmInner + L.wmB;
    L.lockW = MS + L.wmGap + L.wmW;
    L.markShift = L.lockW / 2 - MS / 2;
    // baseline inside a leading-none line centred on the mark (Inter ascent .96875, descent .2421875)
    L.wmBase = MY - MS / 2 + (MS - L.wmPx) / 2 + L.wmPx * (0.96875 - (0.96875 + 0.2421875 - 1) / 2);

    L.tagPx = 66;
    L.tagY = MY + MS / 2 + 150;
    font(ctx, 600, L.tagPx, SANS, -0.02 * L.tagPx);
    L.tagWords = "Fast answers, safe answers, and a human when it matters.".split(" ");
    L.tagW = ctx.measureText(L.tagWords.join(" ")).width;
    L.spaceW = ctx.measureText(" ").width;

    L.cards = {
      order: layoutCard(ctx, ORDER_CARD),
      owner: layoutCard(ctx, OWNER_CARD),
    };
    L.ownerPos = { x: LC.x + 130, y: LC.y + 20 - L.cards.owner.h / 2 };
    L.orderPos = { x: X_E + 40, y: laneY(0) - L.cards.order.h / 2 };

    // dark scene
    font(ctx, 700, 206, SANS, -0.03 * 206);
    L.draftW = ctx.measureText("Here’s 20% off.").width;
    L.hardPx = 206;
    L.hardW = ctx.measureText("When it’s hard,").width;

    L.lanes = [0, 1, 2, 3, 4].map((i) => lanePoly(i, 1));
    L.ready = true;
  }

  // ---------------------------------------------------------------- cards (components/chat.tsx)
  const ILLUSTRATIVE = "AN ILLUSTRATIVE FLOW · NO CUSTOMER DATA";
  const ORDER_CARD = {
    title: "Order status",
    rows: [
      { from: "customer", text: "Hi, where’s my order? It’s #1042" },
      {
        from: "desk",
        text: "Hi Priya, order #1042 left our warehouse on 14 Oct with Delhivery. Expected delivery: 17 Oct.",
        meta: "verified",
      },
    ],
  };
  const OWNER_CARD = {
    title: "Handoff to the owner",
    rows: [
      { from: "customer", text: "My order came late. Can I get something off?" },
      { note: true },
    ],
  };

  function layoutCard(ctx, spec) {
    const w = 720, pad = 26;
    let y = 66 + 26;
    const items = [];
    for (const row of spec.rows) {
      if (row.from) {
        font(ctx, 500, 26, SANS, -0.1);
        const maxW = (w - 2 * pad) * 0.88 - 40;
        const lines = wrap(ctx, row.text, maxW);
        const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const bw = tw + 40, bh = lines.length * 38 + 28;
        const bx = row.from === "customer" ? pad : w - pad - bw;
        items.push({ type: "bubble", from: row.from, x: bx, y, w: bw, h: bh, lines });
        y += bh;
        if (row.meta) {
          y += 14;
          items.push({ type: "meta", x: w - pad, y: y + 17 });
          y += 34;
        }
        y += 18;
      } else if (row.note) {
        items.push({ type: "note", x: pad, y, w: w - 2 * pad, h: 150 });
        y += 150 + 18;
      }
    }
    y += 6;
    return { w, h: y + 52, foot: y, items, pad };
  }

  // anim: { rows: [0..1 per item], stamp: 0..1+ spring, notePulse }
  function drawCard(ctx, spec, lay, x, y, anim) {
    const { w, h } = lay;
    ctx.save();
    ctx.translate(x, y);
    // card
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.09)";
    ctx.shadowBlur = 18 * VZ;
    ctx.shadowOffsetY = 6 * VZ;
    rrect(ctx, 0, 0, w, h, 20);
    ctx.fillStyle = C.surface;
    ctx.fill();
    ctx.restore();
    ctx.save();
    rrect(ctx, 0, 0, w, h, 20);
    ctx.clip();
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 66, w, lay.foot - 66);
    ctx.fillStyle = C.hairline;
    ctx.fillRect(0, 65, w, 2);
    ctx.fillRect(0, lay.foot, w, 2);
    ctx.restore();
    rrect(ctx, 0, 0, w, h, 20);
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.hairline;
    ctx.stroke();
    font(ctx, 600, 25, SANS, -0.1);
    ctx.fillStyle = C.ink;
    ctx.fillText(spec.title, 26, 42);
    font(ctx, 500, 18, MONO, 0.72);
    ctx.fillStyle = C.ink2;
    ctx.textAlign = "right";
    ctx.fillText("WHATSAPP", w - 26, 41);
    ctx.textAlign = "left";
    font(ctx, 500, 16, MONO, 0.64);
    ctx.fillText(ILLUSTRATIVE, 26, lay.foot + 32);

    lay.items.forEach((it, idx) => {
      const a = anim.rows ? anim.rows[idx] ?? 1 : 1;
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha *= clamp(a * 1.6);
      ctx.translate(0, (1 - E.brand(clamp(a))) * 22);
      if (it.type === "bubble") {
        const cust = it.from === "customer";
        ctx.save();
        if (!cust) {
          ctx.shadowColor = "rgba(0,0,0,0.05)";
          ctx.shadowBlur = 3 * VZ;
          ctx.shadowOffsetY = 1 * VZ;
        }
        ctx.beginPath();
        ctx.roundRect(it.x, it.y, it.w, it.h, cust ? [5, 16, 16, 16] : [16, 5, 16, 16]);
        ctx.fillStyle = cust ? C.surface2 : C.surface;
        ctx.fill();
        ctx.restore();
        if (!cust) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = C.hairline;
          ctx.stroke();
        }
        font(ctx, 500, 26, SANS, -0.1);
        ctx.fillStyle = C.ink;
        it.lines.forEach((l, i) => ctx.fillText(l, it.x + 20, it.y + 14 + 27 + i * 38));
      } else if (it.type === "meta") {
        const s = anim.stamp ?? 1;
        font(ctx, 500, 16, MONO, 0.64);
        ctx.fillStyle = C.ink2;
        ctx.textAlign = "right";
        ctx.fillText("NUMBER MATCHED · NO LLM", it.x, it.y + 6);
        const mw = ctx.measureText("NUMBER MATCHED · NO LLM").width;
        ctx.textAlign = "left";
        if (s > 0) {
          ctx.save();
          const cx = it.x - mw - 22 - 78;
          ctx.translate(cx, it.y);
          const sc = lerp(2.8, 1, spring(s, 3.4, 0.4));
          ctx.scale(sc, sc);
          ctx.globalAlpha *= clamp(s * 10);
          chip(ctx, 0, 0, "verified", ["CHECK", "VERIFIED"], 21, "center");
          ctx.restore();
        }
      } else if (it.type === "note") {
        rrect(ctx, it.x, it.y, it.w, it.h, 14);
        ctx.fillStyle = C.surface;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = C.hairline;
        ctx.stroke();
        font(ctx, 500, 16, MONO, 0.64);
        ctx.fillStyle = C.ink2;
        ctx.fillText("TO THE OWNER · WHATSAPP", it.x + 24, it.y + 38);
        font(ctx, 600, 27, SANS, -0.2);
        ctx.fillStyle = C.ink;
        ctx.fillText("A reply was held for you", it.x + 64, it.y + 84);
        font(ctx, 500, 21, SANS, -0.1);
        ctx.fillStyle = C.ink2;
        ctx.fillText("Discount not in store policy · full chat attached", it.x + 64, it.y + 120);
      }
      ctx.restore();
    });
    ctx.restore();
  }
  function noteDot(lay, pos) {
    const n = lay.items.find((i) => i.type === "note");
    return { x: pos.x + n.x + 36, y: pos.y + n.y + 75 };
  }

  // ---------------------------------------------------------------- lanes
  function cubic(p0, p1, p2, p3, n, out) {
    for (let k = 1; k <= n; k++) {
      const s = k / n, u = 1 - s;
      out.push([
        u * u * u * p0[0] + 3 * u * u * s * p1[0] + 3 * u * s * s * p2[0] + s * s * s * p3[0],
        u * u * u * p0[1] + 3 * u * u * s * p1[1] + 3 * u * s * s * p2[1] + s * s * s * p3[1],
      ]);
    }
  }
  function lanePoly(i, spread) {
    const y = laneY(i, spread);
    const pts = [[X_F, LANE_Y]];
    cubic([X_F, LANE_Y], [X_F + 170, LANE_Y], [X_F + 150, y], [X_F + 320, y], 20, pts);
    if (i === 3) {
      pts.push([LC.x + 280, y]);
      const cardTop = LC.y + 20 - (L.cards ? L.cards.owner.h / 2 : 280);
      cubic([LC.x + 280, y], [LC.x + 430, y], [LC.x + 490, y + 100], [LC.x + 490, cardTop], 20, pts);
    } else {
      pts.push([i === 0 ? X_E + 40 : X_E, y]);
    }
    return withLengths(pts);
  }
  function withLengths(pts) {
    const len = [0];
    for (let k = 1; k < pts.length; k++)
      len.push(len[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    return { pts, len, total: len[len.length - 1] };
  }
  function atDist(poly, d) {
    d = clamp(d, 0, poly.total);
    let k = 1;
    while (k < poly.len.length - 1 && poly.len[k] < d) k++;
    const a = poly.pts[k - 1], b = poly.pts[k];
    const f = (d - poly.len[k - 1]) / (poly.len[k] - poly.len[k - 1] || 1);
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), Math.atan2(b[1] - a[1], b[0] - a[0])];
  }
  function strokePoly(ctx, poly, d0, d1, xf) {
    if (d1 <= d0) return;
    ctx.beginPath();
    const s = atDist(poly, d0);
    const P = (p) => (xf ? xf(p[0], p[1]) : p);
    let q = P(s);
    ctx.moveTo(q[0], q[1]);
    for (let k = 1; k < poly.pts.length; k++) {
      if (poly.len[k] <= d0) continue;
      if (poly.len[k] >= d1) break;
      q = P(poly.pts[k]);
      ctx.lineTo(q[0], q[1]);
    }
    q = P(atDist(poly, d1));
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
  }

  // convergence transform: everything folds onto the slot of the mark
  function convergeXf(c) {
    if (c <= 0) return null;
    const XA = X_F - 900, XB = LC.x + 490;
    return (x, y) => {
      const u = clamp((x - XA) / (XB - XA));
      return [lerp(x, MX + (u - 0.5) * 2 * SLOT_HALF, c), lerp(y, MY, c)];
    };
  }

  // ---------------------------------------------------------------- camera
  const CAM = [];
  function buildCam() {
    const hc = L.hookCam;
    const y12 = (laneY(1) + laneY(2)) / 2;
    const card = { x: L.orderPos.x + L.cards.order.w / 2, y: laneY(0) };
    const meta = L.cards.order.items.find((i) => i.type === "meta");
    const chipW = { x: L.orderPos.x + L.cards.order.w - 300, y: L.orderPos.y + meta.y };
    CAM.push(
      { t: 0, x: hc.x, y: hc.y, z: 1 },
      { t: 1.26, x: hc.x, y: hc.y, z: 1, e: E.lin },
      { t: 2.1, x: L.landX + 160, y: LANE_Y, z: 1, e: E.inOut },
      { t: 2.6, x: L.landX + 420, y: LANE_Y, z: 1, e: E.lin },
      { t: 3.5, x: X_F + 640, y: LANE_Y, z: 0.64, e: E.inOut },
      { t: 3.78, x: X_F + 660, y: LANE_Y, z: 0.645, e: E.lin },
      { t: 4.5, x: card.x, y: card.y, z: 1.12, e: E.brand },
      { t: 5.2, x: card.x + 10, y: card.y, z: 1.14, e: E.lin },
      { t: 5.62, x: lerp(card.x, chipW.x, 0.55), y: lerp(card.y, chipW.y, 0.55), z: 1.42, e: E.brand },
      { t: 5.97, x: lerp(card.x, chipW.x, 0.58), y: lerp(card.y, chipW.y, 0.58), z: 1.46, e: E.lin },
      { t: 6.3, x: X_G - 190, y: y12, z: 1.0, e: E.whip },
      { t: T.push, x: X_G - 80, y: y12, z: 1.06, e: E.lin },
      { t: T.dark, x: X_G, y: y12, z: 44, e: E.expoIn },
      { t: T.iris, x: X_G, y: y12, z: 44, e: E.lin },
      { t: T.iris + 1e-4, x: LC.x, y: LC.y, z: 1, e: null },
      { t: T.pullOut, x: LC.x + 10, y: LC.y + 4, z: 1.03, e: E.lin },
      { t: 11.0, x: OV.x, y: OV.y, z: OV.z, e: E.inOut },
      { t: 12.25, x: MX, y: MY, z: 0.95, e: E.inOut },
      { t: 13.25, x: MX, y: MY + 110, z: 0.52, e: E.brand },
      { t: DUR, x: MX, y: MY + 110, z: 0.535, e: E.lin }
    );
  }
  function camAt(t) {
    let i = 1;
    while (i < CAM.length - 1 && CAM[i].t < t) i++;
    const a = CAM[i - 1], b = CAM[i];
    if (t <= a.t) return { ...a };
    if (t >= b.t || !b.e) return { x: b.x, y: b.y, z: b.z };
    const p = b.e((t - a.t) / (b.t - a.t));
    return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), p)) };
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

  // ---------------------------------------------------------------- dots
  function dot1(t) {
    // returns world {x,y,r,sx,sy,rot} or null
    const q = L.qDot;
    if (t < T.squash) {
      // rides in with its "?" during the tracking slam
      const lt = t - (T.order + 5 * 0.028);
      if (lt <= 0) return null;
      const dx = (1 - spring(lt, 3.2, 0.82)) * (520 + 5 * 170);
      return { x: q.x + dx, y: q.y, r: q.r, sx: 1, sy: 1 };
    }
    if (t < T.launch) {
      const p = prog(t, T.squash, T.launch);
      const s = Math.sin(p * Math.PI * 0.5);
      return { x: q.x, y: q.y + q.r * 0.3 * s, r: q.r, sx: 1 + 0.32 * s, sy: 1 - 0.3 * s };
    }
    const P = L.phys;
    if (t < P.tLand) {
      const dt = t - T.launch;
      const vy = P.vy + P.g * dt;
      const st = clamp(Math.abs(vy) / 5200, 0, 0.32);
      const r = lerp(q.r, DOT_R, E.brand(prog(t, T.launch, T.launch + 0.3)));
      return {
        x: q.x + P.vx * dt,
        y: q.y + P.vy * dt + 0.5 * P.g * dt * dt,
        r,
        sx: 1 - st * 0.55,
        sy: 1 + st,
      };
    }
    if (t < L.tBounceEnd) {
      const dt = t - P.tLand;
      const imp = Math.exp(-dt * 40);
      return {
        x: L.landX + P.vx * 0.5 * dt,
        y: P.rest - (L.bounceV * dt - 0.5 * P.g * dt * dt) + DOT_R * 0.28 * imp,
        r: DOT_R,
        sx: 1 + 0.4 * imp,
        sy: 1 - 0.34 * imp,
      };
    }
    if (t < T.forkArrive) {
      // settle, then roll to the switch: accelerate, decelerate with a little overshoot
      const d = X_F - 44 - L.xBounceEnd;
      let x;
      if (t < T.rollStart) x = L.xBounceEnd + 40 * E.brand(prog(t, L.tBounceEnd, T.rollStart));
      else x = L.xBounceEnd + 40 + (d - 40) * E.inOut(prog(t, T.rollStart, T.forkArrive));
      const v = t > T.rollStart ? Math.sin(Math.PI * prog(t, T.rollStart, T.forkArrive)) : 0;
      return { x, y: L.phys.rest, r: DOT_R, sx: 1 + 0.35 * v, sy: 1 - 0.14 * v };
    }
    if (t < T.shoot) {
      // arrive at the switch: settle, then anticipation (pulls back)
      const a = spring(t - T.forkArrive, 3, 0.5);
      const back = Math.sin(Math.PI * prog(t, T.click, T.shoot)) * 10;
      return { x: X_F - 44 + a * 0 - back, y: L.phys.rest, r: DOT_R, sx: 1, sy: 1 };
    }
    // shoot along lane 0 to its end
    const lane = L.lanes[0];
    if (t < T.card) {
      const p = E.in(prog(t, T.shoot, T.card));
      const d = lerp(-44, lane.total, p);
      const pt = d < 0 ? [X_F + d, LANE_Y, 0] : atDist(lane, d);
      const v = prog(t, T.shoot, T.card);
      return { x: pt[0], y: pt[1] - (d < 0 ? DOT_R + 4 : 0), r: DOT_R, sx: 1 + 1.1 * v, sy: 1 - 0.3 * v, rot: pt[2], onLane: d >= 0 };
    }
    const k = prog(t, T.card, T.card + 0.14);
    if (k >= 1) return null;
    const end = atDist(lane, lane.total);
    return { x: end[0] + 20 * k, y: end[1], r: DOT_R * (1 - E.in(k)), sx: 1, sy: 1 };
  }

  function dot2World(t) {
    const lane = L.lanes[2];
    const stopD = X_G - 118 - X_F - 20; // just before the gate's left face (approx along lane)
    if (t < T.dot2 || t >= T.gate + 0.06) return null;
    const p = E.in(prog(t, T.dot2, T.gate));
    const pt = atDist(lane, lerp(0, stopD + 60, p));
    const v = Math.min(1, p * 1.4);
    return { x: pt[0], y: pt[1], r: DOT_R, sx: 1 + 0.9 * v, sy: 1 - 0.25 * v, rot: pt[2] };
  }

  // ---------------------------------------------------------------- scene: world
  function drawWorld(ctx, t, cam) {
    const conv = E.inOut(prog(t, T.converge, T.converge + 0.72));
    const xf = convergeXf(conv);
    const dissolve = E.in(prog(t, T.dissolve, T.dissolve + 0.4));
    const fade = 1 - dissolve;

    // ---- hook type
    if (t < 2.4) drawHook(ctx, t);

    // ---- trunk (hand-drawn marker line)
    if (t >= T.stroke && t < T.thicken + 0.03) {
      const pts = [];
      const x0 = L.trunkStart, x1 = X_F;
      const tl = L.phys.tLand;
      for (let x = x0; x <= x1; x += 24) {
        let y = LANE_Y;
        const dt = t - tl;
        if (dt > 0 && dt < 1.2) {
          const g = Math.exp(-Math.pow((x - L.landX) / 260, 2));
          y += 30 * Math.exp(-dt * 7) * Math.sin(dt * 34) * g;
        }
        pts.push(xf ? xf(x, y) : [x, y]);
      }
      pts.push(xf ? xf(x1, LANE_Y) : [x1, LANE_Y]);
      const p = E.inOut(prog(t, T.stroke, T.strokeEnd));
      marker(ctx, pts, p, lerp(8, 7, conv), C.ink, 3, 1.4 * (1 - conv));
    }

    // ---- "MESSAGE IN" label with a hand-drawn arrow
    if (t >= 2.2 && fade > 0) {
      ctx.save();
      ctx.globalAlpha = fade;
      const a = E.brand(prog(t, 2.2, 2.55));
      font(ctx, 500, 30, MONO, 1.8);
      ctx.fillStyle = C.ink2;
      const lx = L.landX - 360, ly = LANE_Y - 200;
      ctx.globalAlpha *= a;
      ctx.fillText("MESSAGE IN", lx - 24 * (1 - a), ly);
      ctx.globalAlpha = fade;
      // one smooth curve from the label to the dot, then a two-stroke head
      const p0 = [lx + 222, ly - 10], p1 = [L.landX - 150, ly - 40], p2 = [L.landX - 46, LANE_Y - 64];
      const ap = [];
      for (let k = 0; k <= 24; k++) {
        const s = k / 24, u = 1 - s;
        ap.push([u * u * p0[0] + 2 * u * s * p1[0] + s * s * p2[0], u * u * p0[1] + 2 * u * s * p1[1] + s * s * p2[1]]);
      }
      marker(ctx, ap, E.inOut(prog(t, 2.3, 2.58)), 5.5, C.ink, 7, 0.9);
      if (t > 2.56) {
        const hp = E.brand(prog(t, 2.56, 2.68));
        const tip = p2;
        const ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
        for (const [side, seed] of [[1, 9], [-1, 11]]) {
          const a = ang + Math.PI + side * 0.55;
          marker(ctx, [[tip[0] + Math.cos(a) * 34, tip[1] + Math.sin(a) * 34], tip], hp, 5.5, C.ink, seed, 0.4);
        }
      }
      ctx.restore();
    }

    // ---- the five lanes
    const spreadT = t - T.sprout;
    if (spreadT > 0 && t < T.thicken + 0.03) {
      for (let i = 0; i < 5; i++) {
        const sp = spring(spreadT - i * 0.035, 2.2, 0.5);
        const poly = conv > 0 ? L.lanes[i] : lanePoly(i, sp);
        const rev = E.brand(prog(t, T.sprout + i * 0.035, T.sprout + 0.62 + i * 0.035));
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = lerp(6, 7, conv);
        ctx.strokeStyle = conv > 0 ? mix(C.border, C.ink, conv) : C.border;
        strokePoly(ctx, poly, 0, poly.total * rev, xf);
        // travelled path turns ink
        const trail = laneTrail(i, t, poly);
        if (trail > 0 && conv < 1) {
          ctx.strokeStyle = C.ink;
          strokePoly(ctx, poly, 0, trail, xf);
        }
        ctx.restore();
        // terminal rings
        const showRing = i === 1 || i === 2 || i === 4 || (i === 0 && t < T.card + 0.1) || (i === 3 && t < T.owner + 0.1);
        if (showRing && rev > 0.98 && fade > 0) {
          const e = poly.pts[poly.pts.length - 1];
          const q = xf ? xf(e[0], e[1]) : e;
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.beginPath();
          ctx.arc(q[0], q[1], 11, 0, Math.PI * 2);
          ctx.fillStyle = C.paper;
          ctx.fill();
          ctx.lineWidth = 5;
          ctx.strokeStyle = C.border;
          ctx.stroke();
          ctx.restore();
        }
        // labels
        if (fade > 0) {
          const la = E.brand(prog(t, T.sprout + 0.2 + i * 0.06, T.sprout + 0.62 + i * 0.06));
          if (la > 0) {
            const y = laneY(i, sp);
            ctx.save();
            ctx.globalAlpha = la * fade;
            const lx = X_F + 380 - 30 * (1 - la);
            font(ctx, 500, 30, MONO, 1.2);
            ctx.fillStyle = C.ink2;
            ctx.fillText(ROUTES[i].n, lx, y - 26);
            ctx.fillStyle = C.ink;
            ctx.fillText(ROUTES[i].name, lx + 58, y - 26);
            if (i === 0) L.label0 = { x: lx + 58, y: y - 26, w: ctx.measureText(ROUTES[i].name).width };
            if (i === 2) L.label2 = { x: lx + 58, y: y - 26, w: ctx.measureText(ROUTES[i].name).width };
            chip(
              ctx,
              lx + 58,
              y + 40,
              ROUTES[i].llm ? "quiet" : "outline",
              ROUTES[i].llm ? ["AI DRAFT", "ARROW", "GUARD"] : ["NO LLM"],
              20
            );
            ctx.restore();
          }
        }
      }
      // marker circle around ORDER STATUS, underline under RETURNS OR POLICY
      if (L.label0 && t >= T.circle && fade > 0) {
        const b = L.label0;
        const cx = b.x + b.w / 2 - 10, cy = b.y - 11, rx = b.w / 2 + 44, ry = 38;
        const pts = [];
        for (let k = 0; k <= 60; k++) {
          const a = -2.6 + (k / 60) * Math.PI * 2.18;
          const wob = 1 + 0.05 * noise(k * 0.3 + 4);
          pts.push([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob + k * 0.18]);
        }
        ctx.save();
        ctx.globalAlpha = fade;
        marker(ctx, pts, E.inOut(prog(t, T.circle, T.circle + 0.26)), 5.5, C.ink, 5, 1.2);
        ctx.restore();
      }
      if (L.label2 && t >= 6.22 && fade > 0) {
        const b = L.label2;
        ctx.save();
        ctx.globalAlpha = fade;
        marker(
          ctx,
          [[b.x - 6, b.y + 12], [b.x + b.w * 0.5, b.y + 16], [b.x + b.w + 10, b.y + 9]],
          E.inOut(prog(t, 6.22, 6.4)),
          5.5,
          C.ink,
          21,
          1.4
        );
        ctx.restore();
      }
      // the sort switch
      if (conv < 1) drawSwitch(ctx, t, fade, xf);
      // reply guard gate
      drawGate(ctx, t, fade);
    }

    // ---- order card (unfolds from dot 1)
    if (t >= T.card && fade > 0) {
      const lay = L.cards.order;
      const s = spring(t - T.card, 2.3, 0.5);
      const ax = L.orderPos.x, ay = laneY(0);
      ctx.save();
      ctx.globalAlpha = fade * clamp((t - T.card) * 12);
      const toM = dissolve * 0.35;
      ctx.translate(lerp(ax, MX, toM), lerp(ay, MY, toM));
      const sc = lerp(0.04, 1, s) * lerp(1, 0.86, dissolve);
      ctx.scale(sc, sc);
      ctx.translate(-0, -lay.h / 2);
      drawCard(ctx, ORDER_CARD, lay, 0, 0, {
        rows: [prog(t, T.card + 0.2, T.card + 0.5), prog(t, T.card + 0.42, T.card + 0.72), 1],
        stamp: t - T.verified,
      });
      ctx.restore();
    }

    // ---- light scene: "a person takes over." + owner card
    if (t >= T.iris) {
      ctx.save();
      ctx.globalAlpha = fade;
      const toM = dissolve * 0.35;
      ctx.translate(lerp(0, MX - LC.x, toM), lerp(0, MY - LC.y, toM));
      drawPersonType(ctx, t);
      ctx.restore();
      const lay = L.cards.owner;
      const e = spring(t - T.owner, 1.9, 0.62);
      if (e > 0 && fade > 0) {
        ctx.save();
        ctx.globalAlpha = fade;
        const px = L.ownerPos.x + (1 - e) * 900, py = L.ownerPos.y;
        const cx = px + lay.w / 2, cy = py + lay.h / 2;
        ctx.translate(lerp(cx, MX, toM), lerp(cy, MY, toM));
        ctx.rotate((1 - e) * 0.06);
        const sc = lerp(1, 0.86, dissolve);
        ctx.scale(sc, sc);
        drawCard(ctx, OWNER_CARD, lay, -lay.w / 2, -lay.h / 2, {
          rows: [prog(t, T.owner + 0.12, T.owner + 0.4), prog(t, T.owner + 0.26, T.owner + 0.56)],
        });
        ctx.restore();
      }
    }

    // ---- the mark: capsule, lamp, plate, wordmark
    drawMark(ctx, t, conv);

    // ---- dots (always on top in world)
    const d1 = dot1(t);
    if (d1) dot(ctx, d1.x, d1.y, d1.r, d1.sx, d1.sy, d1.rot || 0);
    const d2 = dot2World(t);
    if (d2) dot(ctx, d2.x, d2.y, d2.r, d2.sx, d2.sy, d2.rot || 0);
    // AI DRAFT tag riding with dot 2
    if (d2 && d2.x > X_F + 780) {
      ctx.save();
      ctx.globalAlpha = E.brand(clamp((d2.x - X_F - 780) / 90));
      chip(ctx, d2.x - 30, d2.y - 56, "dark", ["AI DRAFT"], 22, "center");
      ctx.restore();
    }
    // gate front face drawn over dot 2 so it disappears inside
    if (t >= T.sprout) drawGateFront(ctx, t, fade);
    const d3 = dot3World(t);
    if (d3) dot(ctx, d3.x, d3.y, d3.r, d3.sx, d3.sy, d3.rot || 0);
  }

  function laneTrail(i, t, poly) {
    if (i === 0 && t >= T.shoot) return poly.total * E.in(prog(t, T.shoot, T.card));
    if (i === 2 && t >= T.dot2) return (X_G - X_F - 120) * E.in(prog(t, T.dot2, T.gate));
    if (i === 3 && t >= T.iris) return poly.total;
    return 0;
  }

  function mix(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, k));
    const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, k));
    const bl = Math.round(lerp(pa & 255, pb & 255, k));
    return `rgb(${r},${g},${bl})`;
  }

  function drawSwitch(ctx, t, fade, xf) {
    const a = E.brand(prog(t, T.sprout - 0.1, T.sprout + 0.2));
    if (a <= 0) return;
    const p = xf ? xf(X_F, LANE_Y) : [X_F, LANE_Y];
    const rot = Math.PI / 4 + (Math.PI / 2) * spring(t - T.click, 4, 0.35) * (t > T.click ? 1 : 0);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(p[0], p[1]);
    ctx.scale(a, a);
    ctx.rotate(rot);
    rrect(ctx, -19, -19, 38, 38, 6);
    ctx.fillStyle = C.ink;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = fade * a;
    font(ctx, 500, 26, MONO, 1.6);
    ctx.fillStyle = C.ink2;
    ctx.textAlign = "center";
    ctx.fillText("SORT", p[0], p[1] + 76);
    ctx.textAlign = "left";
    ctx.restore();
  }

  function gateBox() {
    const cy = (laneY(1) + laneY(2)) / 2;
    return { x: X_G - 118, y: cy - (GAP + 190) / 2, w: 236, h: GAP + 190, cy };
  }
  function drawGate() {}
  function drawGateFront(ctx, t, fade) {
    const a = spring(t - (T.sprout + 0.35), 2.4, 0.45);
    if (a <= 0 || fade <= 0) return;
    const g = gateBox();
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(0, (1 - a) * -260);
    rrect(ctx, g.x, g.y, g.w, g.h, 22);
    ctx.fillStyle = C.ink;
    ctx.fill();
    // scan line while the draft is inside
    if (t > T.gate && t < T.dark) {
      const s = ((t - T.gate) * 2.6) % 1;
      ctx.save();
      rrect(ctx, g.x, g.y, g.w, g.h, 22);
      ctx.clip();
      ctx.fillStyle = C.inkLine;
      ctx.fillRect(g.x, g.y + s * g.h - 3, g.w, 6);
      ctx.restore();
    }
    font(ctx, 500, 24, MONO, 1.4);
    ctx.fillStyle = C.onInk;
    ctx.textAlign = "center";
    ctx.fillText("REPLY", X_G, g.cy - 6);
    ctx.fillText("GUARD", X_G, g.cy + 26);
    ctx.fillStyle = C.onInk2;
    font(ctx, 500, 17, MONO, 1);
    ctx.fillText("EVERY AI DRAFT", X_G, g.y + g.h - 26);
    ctx.textAlign = "left";
    ctx.restore();
  }

  function drawHook(ctx, t) {
    const px = L.hookPx;
    ctx.save();
    ctx.fillStyle = C.ink;
    // falling apart after the dot leaves
    const fall = (i, x, y) => {
      const dt = t - (T.collapse + i * 0.025);
      if (dt <= 0) return [x, y, 0];
      return [x, y + 0.5 * 380 * dt * dt, (hash(i + 3) - 0.5) * 0.5 * dt * dt];
    };
    // 1. "Where's": starts huge on frame 0 and slams down to size
    {
      font(ctx, 700, px, SANS, -0.03 * px);
      const s = lerp(2.5, 1, spring(t - T.slam, 2.1, 0.5));
      const cx = L.hx + L.w1 / 2, cy = L.b1 - px * 0.36;
      const [fx, fy, fr] = fall(0, 0, 0);
      ctx.save();
      ctx.translate(cx + fx, cy + fy);
      ctx.rotate(fr + (1 - clamp(spring(t, 2.1, 0.5))) * -0.07);
      ctx.scale(s, s);
      ctx.fillText("Where’s", -L.w1 / 2, L.b1 - cy);
      ctx.restore();
    }
    // 2. "my": out of depth
    if (t >= T.my) {
      const k = spring(t - T.my, 2.6, 0.5);
      const s = lerp(0.12, 1, k);
      const [fx, fy, fr] = fall(1, 0, 0);
      const cx = L.hx + (L.wMy - px * 0.25) / 2, cy = L.b2 - px * 0.26;
      ctx.save();
      ctx.globalAlpha = clamp((t - T.my) * 9);
      ctx.translate(cx + fx, cy + fy);
      ctx.rotate(fr);
      ctx.scale(s, s);
      font(ctx, 700, px, SANS, -0.03 * px);
      ctx.fillText("my", L.hx - cx, L.b2 - cy);
      ctx.restore();
    }
    // 3. "order?": tracking slam, letters arrive from the right
    if (t >= T.order) {
      font(ctx, 700, px, SANS, -0.03 * px);
      L.orderChars.forEach((c, i) => {
        const lt = t - (T.order + i * 0.028);
        if (lt <= 0) return;
        const k = spring(lt, 3.2, 0.82);
        const dx = (1 - k) * (520 + i * 170);
        const [fx, fy, fr] = fall(2 + i, 0, 0);
        ctx.save();
        ctx.globalAlpha = clamp(lt * 14);
        ctx.translate(c.x + dx + fx + c.w / 2, L.b2 + fy);
        ctx.rotate(fr);
        if (c.ch === "?") {
          // hide the glyph's own dot: the orange dot replaces it
          ctx.beginPath();
          ctx.rect(-c.w, -px, c.w * 2, px - L.dotH * 1.16);
          ctx.clip();
        }
        ctx.fillText(c.ch, -c.w / 2, 0);
        ctx.restore();
        if (c.ch === "?") L.qSlide = dx;
      });
    }
    ctx.restore();
  }

  function drawPersonType(ctx, t) {
    const px = 170;
    const x = LC.x - 850;
    const lines = [
      ["a person", LC.y - 70, T.iris + 0.02],
      ["takes over.", LC.y + 110, T.iris + 0.12],
    ];
    font(ctx, 700, px, SANS, -0.03 * px);
    for (const [txt, base, t0] of lines) {
      const k = E.brand(prog(t, t0, t0 + 0.42));
      if (k <= 0) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 40, base - px * 1.02, 2000, px * 1.3);
      ctx.clip();
      ctx.fillStyle = C.ink;
      ctx.fillText(txt, x, base + (1 - k) * px * 1.05);
      ctx.restore();
    }
  }

  // dot 3: the held message, from the dark scene into the owner card, then into the mark
  function dot3World(t) {
    if (t < T.iris) return null;
    const cam = camAt(T.iris + 0.001);
    const s = darkDot(T.iris);
    const W0 = 1920, H0 = 1080;
    const start = { x: cam.x + (s.x - W0 / 2) / cam.z, y: cam.y + (s.y - H0 / 2) / cam.z };
    const lay = L.cards.owner;
    const cardAt = (tt) => {
      const e = spring(tt - T.owner, 1.9, 0.62);
      return { x: L.ownerPos.x + (1 - e) * 900, y: L.ownerPos.y };
    };
    if (t < T.noteLand) {
      const p = E.inOut(prog(t, T.iris + 0.18, T.noteLand));
      const end = noteDot(lay, cardAt(t));
      const ctrl = { x: lerp(start.x, end.x, 0.5), y: Math.min(start.y, end.y) - 380 };
      const u = 1 - p;
      const x = u * u * start.x + 2 * u * p * ctrl.x + p * p * end.x;
      const y = u * u * start.y + 2 * u * p * ctrl.y + p * p * end.y;
      const r = lerp(26, 13, E.inOut(prog(t, T.iris + 0.2, T.noteLand)));
      return { x, y, r, sx: 1, sy: 1 };
    }
    const home = noteDot(lay, cardAt(t));
    const land = Math.exp(-(t - T.noteLand) * 16);
    if (t < T.lampFly) {
      // ride the card as it dissolves toward the mark
      const dissolve = E.in(prog(t, T.dissolve, T.dissolve + 0.4));
      const lay2 = L.cards.owner;
      const cx = L.ownerPos.x + lay2.w / 2, cy = L.ownerPos.y + lay2.h / 2;
      const toM = dissolve * 0.35;
      const sc = lerp(1, 0.86, dissolve);
      const x = lerp(cx, MX, toM) + (home.x - cx) * sc;
      const y = lerp(cy, MY, toM) + (home.y - cy) * sc;
      return { x, y, r: 13, sx: 1 + 0.35 * land, sy: 1 - 0.3 * land };
    }
    // fly into the slot: this dot becomes the lamp
    const from = (() => {
      const cx = L.ownerPos.x + lay.w / 2, cy = L.ownerPos.y + lay.h / 2;
      const d = E.in(prog(T.lampFly, T.dissolve, T.dissolve + 0.4));
      const toM = d * 0.35, sc = lerp(1, 0.86, d);
      return { x: lerp(cx, MX, toM) + (home.x - cx) * sc, y: lerp(cy, MY, toM) + (home.y - cy) * sc };
    })();
    if (t < T.lampLand) {
      const p = E.inOut(prog(t, T.lampFly, T.lampLand));
      const ctrl = { x: lerp(from.x, LAMP.x, 0.4), y: Math.min(from.y, LAMP.y) - 520 };
      const u = 1 - p;
      const x = u * u * from.x + 2 * u * p * ctrl.x + p * p * LAMP.x;
      const y = u * u * from.y + 2 * u * p * ctrl.y + p * p * LAMP.y;
      const r = lerp(13, LAMP.r * 0.9, p);
      const st = Math.sin(p * Math.PI) * 0.35;
      return { x, y, r, sx: 1 + st, sy: 1 - st * 0.5, rot: Math.atan2(LAMP.y - y, LAMP.x - x) };
    }
    const dt = t - T.lampLand;
    const sq = Math.exp(-dt * 12) * Math.sin(dt * 30);
    const r = lerp(LAMP.r * 0.9, LAMP.r, E.brand(prog(t, T.lampLand, T.thicken + 0.3)));
    const m = markOffset(t);
    return { x: LAMP.x + m, y: LAMP.y, r, sx: 1 + 0.3 * sq, sy: 1 - 0.3 * sq };
  }

  function markOffset(t) {
    return -L.markShift * E.brand(prog(t, T.lockup, T.lockup + 0.7));
  }

  function drawMark(ctx, t, conv) {
    if (t < T.thicken - 0.02) return;
    const m = markOffset(t);
    const inverted = t >= T.plate;
    // plate grows out of the slot
    if (inverted) {
      const k = spring(t - T.plate, 2.4, 0.46);
      const w = lerp(2 * (SLOT_HALF + SLOT_H / 2) + 40, MS, k);
      const h = lerp(SLOT_H + 40, MS, k);
      const r = lerp((SLOT_H + 40) / 2, 8 * MU, clamp(k));
      rrect(ctx, MX + m - w / 2, MY - h / 2, w, h, Math.max(0, r));
      ctx.fillStyle = C.ink;
      ctx.fill();
    }
    // the lane becomes the slot: a round-capped line thickening to the slot height
    const k = spring(t - T.thicken, 2.2, 0.5);
    const lw = lerp(7, SLOT_H, k);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1, lw);
    ctx.strokeStyle = inverted ? C.paper : C.ink;
    ctx.beginPath();
    ctx.moveTo(MX + m - SLOT_HALF, MY);
    ctx.lineTo(MX + m + SLOT_HALF, MY);
    ctx.stroke();
    ctx.restore();

    // wordmark, revealed from behind the mark's right edge
    if (t >= T.lockup + 0.12) {
      const p = E.brand(prog(t, T.lockup + 0.12, T.lockup + 0.9));
      const left = MX + m + MS / 2 + L.wmGap;
      ctx.save();
      ctx.beginPath();
      ctx.rect(MX + m + MS / 2 + 2, MY - MS, (L.wmW + L.wmGap + 20) * p + 1, MS * 2);
      ctx.clip();
      const dx = -(1 - p) * 180;
      let x = left + dx;
      font(ctx, 500, L.wmPx, SANS, 0);
      ctx.fillStyle = C.ink2;
      ctx.fillText("botLane", x, L.wmBase);
      x += L.wmA + L.wmInner;
      ctx.fillStyle = C.border;
      ctx.fillText("/", x, L.wmBase);
      x += L.wmSlash + L.wmInner;
      font(ctx, 600, L.wmPx, SANS, -0.01 * L.wmPx);
      ctx.fillStyle = C.ink;
      ctx.fillText("Lane Desk", x, L.wmBase);
      ctx.restore();
    }

    // tagline, word by word
    if (t >= T.tagline) {
      font(ctx, 600, L.tagPx, SANS, -0.02 * L.tagPx);
      let x = MX - L.tagW / 2;
      L.tagWords.forEach((w, i) => {
        const k = E.brand(prog(t, T.tagline + i * 0.055, T.tagline + 0.5 + i * 0.055));
        const ww = ctx.measureText(w).width;
        if (k > 0) {
          ctx.save();
          ctx.globalAlpha = k;
          ctx.fillStyle = i >= 7 ? C.ink : C.ink2;
          ctx.fillText(w, x, L.tagY + (1 - k) * 26);
          ctx.restore();
        }
        x += ww + L.spaceW;
      });
    }
  }

  // ---------------------------------------------------------------- scene: dark (inside the guard)
  function darkDot(t) {
    // screen-space position of the message dot in the dark scene (1920x1080 base)
    const L0 = 130;
    const start = { x: L0 + 11, y: 183 };
    const end = { x: L0 + L.hardW + 58, y: 604 - 26 };
    if (t < T.dotDrop) return { x: start.x, y: start.y, r: 11, sx: 1, sy: 1 };
    if (t < T.dotLand) {
      const p = prog(t, T.dotDrop, T.dotLand);
      const dt = T.dotLand - T.dotDrop;
      const vy0 = -620;
      const g = (2 * (end.y - start.y - vy0 * dt)) / (dt * dt);
      const tt = p * dt;
      const vy = vy0 + g * tt;
      const st = clamp(Math.abs(vy) / 7000, 0, 0.3);
      return {
        x: lerp(start.x, end.x, E.inOut(p)),
        y: start.y + vy0 * tt + 0.5 * g * tt * tt,
        r: lerp(11, 26, E.brand(p)),
        sx: 1 - st * 0.5,
        sy: 1 + st,
      };
    }
    const dt = t - T.dotLand;
    const imp = Math.exp(-dt * 26);
    const hop = Math.max(0, Math.sin(Math.min(dt, 0.14) / 0.14 * Math.PI)) * 22 * (dt < 0.14 ? 1 : 0);
    const ant = Math.sin(Math.PI * prog(t, T.iris - 0.1, T.iris)) * 0.22;
    return { x: end.x, y: end.y - hop + 26 * ant * 0.4, r: 26, sx: 1 + 0.4 * imp + ant, sy: 1 - 0.36 * imp - ant };
  }

  function drawDark(ctx, t) {
    const L0 = 130;
    ctx.fillStyle = C.ink;
    ctx.fillRect(-200, -200, 2320, 1480);
    const away = (i) => {
      const dt = t - (T.dropAway + i * 0.03);
      if (dt <= 0) return [0, 0];
      return [0.5 * 12000 * dt * dt, (hash(i + 40) - 0.5) * 1.6 * dt * dt];
    };
    // label + customer line
    {
      const [dy, r] = away(0);
      const a = E.brand(prog(t, T.dark, T.dark + 0.3));
      ctx.save();
      ctx.translate(0, dy);
      ctx.rotate(r);
      ctx.globalAlpha = a;
      font(ctx, 500, 26, MONO, 1.6);
      ctx.fillStyle = C.onInk2;
      ctx.fillText("AI DRAFT · NOT SENT", L0 + 36, 192);
      font(ctx, 500, 40, SANS, -0.4);
      const q = "Customer: “My order came late. Can I get something off?”";
      const n = Math.floor(q.length * E.brand(prog(t, T.dark + 0.04, T.dark + 0.4)));
      ctx.fillText(q.slice(0, n), L0, 282);
      ctx.restore();
    }
    // the draft, huge, from depth
    if (t >= T.draft) {
      const [dy, r] = away(1);
      const k = spring(t - T.draft, 2.6, 0.5);
      const jolt = t > T.held ? 14 * Math.exp(-(t - T.held) * 14) * Math.sin((t - T.held) * 60) : 0;
      ctx.save();
      ctx.translate(L0 + L.draftW / 2, 540 + dy + jolt);
      ctx.rotate(r);
      const s = lerp(1.45, 1, k);
      ctx.scale(s, s);
      ctx.globalAlpha = clamp((t - T.draft) * 12);
      font(ctx, 700, 206, SANS, -0.03 * 206);
      ctx.fillStyle = C.onInk;
      ctx.fillText("Here’s 20% off.", -L.draftW / 2, 540 - 540 + 70);
      // marker strike-through
      const sp = E.inOut(prog(t, T.strike, T.strike + 0.2));
      if (sp > 0) {
        const y0 = 70 - 206 * 0.3;
        const pts = [
          [-L.draftW / 2 - 36, y0 + 16],
          [0, y0 - 2],
          [L.draftW / 2 + 40, y0 - 22],
        ];
        marker(ctx, pts, sp, 20, C.onInk, 31, 2.2);
      }
      ctx.restore();
    }
    // HELD stamp
    if (t >= T.held) {
      const [dy, r] = away(2);
      const dt = t - T.held;
      const hit = dt < 0.07 ? lerp(2.4, 1, E.in(dt / 0.07)) : 1 + 0.06 * Math.exp(-(dt - 0.07) * 14) * Math.sin((dt - 0.07) * 50);
      ctx.save();
      ctx.translate(1540, 770 + dy);
      ctx.rotate(-0.07 + r);
      ctx.scale(hit, hit);
      ctx.globalAlpha = clamp(dt * 30);
      font(ctx, 500, 68, MONO, 68 * 0.08);
      const w = ctx.measureText("HELD").width + 90;
      rrect(ctx, -w / 2, -62, w, 124, 62);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = C.onInk;
      ctx.stroke();
      ctx.fillStyle = C.onInk;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("HELD", 0, 4);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.restore();
    }
    // reason
    if (t >= T.reason) {
      const [dy, r] = away(3);
      ctx.save();
      ctx.translate(0, dy);
      ctx.rotate(r);
      font(ctx, 500, 30, MONO, 1.8);
      ctx.fillStyle = C.onInk2;
      const a = "DISCOUNT NOT IN STORE POLICY";
      ctx.fillText(a.slice(0, Math.floor(a.length * prog(t, T.reason, T.reason + 0.24))), L0, 760);
      if (t > T.reason + 0.26) {
        const b = "SENT TO A PERSON";
        ctx.fillStyle = C.onInk;
        ctx.fillText(b.slice(0, Math.floor(b.length * prog(t, T.reason + 0.26, T.reason + 0.42))), L0 + 44, 812);
        arrowPath(ctx, L0, 801, 26, C.onInk, 3);
      }
      ctx.restore();
    }
    // "When it's hard," tracking slam
    if (t >= T.hard) {
      const k = spring(t - T.hard, 2.6, 0.6);
      const ls = lerp(0.55, -0.03, clamp(k, -0.2, 1.2)) * 206;
      font(ctx, 700, 206, SANS, ls);
      ctx.save();
      ctx.globalAlpha = clamp((t - T.hard) * 10);
      ctx.fillStyle = C.onInk;
      ctx.fillText("When it’s hard,", L0, 604);
      ctx.restore();
    }
    // footer
    ctx.save();
    font(ctx, 500, 18, MONO, 0.9);
    ctx.fillStyle = C.onInk2;
    ctx.globalAlpha = 0.9;
    ctx.fillText(ILLUSTRATIVE, L0, 1000);
    ctx.restore();
    // the message dot
    const d = darkDot(t);
    dot(ctx, d.x, d.y, d.r, d.sx, d.sy);
  }

  // ---------------------------------------------------------------- frame
  function render(ctx, t, W, H) {
    if (!L.ready) layout(ctx);
    if (!CAM.length) buildCam();
    const S = W / 1920;
    const cam = camAt(t);
    const sh = shake(t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);

    const darkOn = t >= T.dark - 0.02 && t < T.iris + 0.4;
    const irisR = t >= T.iris ? 2300 * E.brand(prog(t, T.iris, T.iris + 0.3)) : 0;

    // world
    if (!(darkOn && t < T.iris)) {
      const z = cam.z * S;
      VZ = z;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(W / 2 + sh.x * S, H / 2 + sh.y * S);
      ctx.rotate(sh.r);
      ctx.scale(z, z);
      ctx.translate(-cam.x, -cam.y);
      drawWorld(ctx, t, cam);
    }

    // dark scene, opened by the iris from the message dot
    if (darkOn) {
      ctx.setTransform(S, 0, 0, S, sh.x * S, sh.y * S);
      ctx.save();
      if (irisR > 0) {
        const d = darkDot(T.iris);
        ctx.beginPath();
        ctx.rect(-400, -400, 2720, 1880);
        ctx.arc(d.x, d.y, irisR, 0, Math.PI * 2, true);
        ctx.clip("evenodd");
      }
      drawDark(ctx, Math.min(t, T.iris));
      ctx.restore();
      if (irisR > 0 && irisR < 2300) {
        // the dot sits on the iris edge's origin until the light scene takes over
        const d = darkDot(T.iris);
        dot(ctx, d.x, d.y, 26 * (1 - prog(t, T.iris, T.iris + 0.2)));
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // film finish: vignette + fine grain (keeps H.264 from banding)
  let grain = null;
  function finish(ctx, t, W, H) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.07)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (!grain) {
      grain = document.createElement("canvas");
      grain.width = grain.height = 256;
      const gx = grain.getContext("2d");
      const img = gx.createImageData(256, 256);
      let s = 1234567;
      for (let i = 0; i < img.data.length; i += 4) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const v = (s >> 8) & 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      gx.putImageData(img, 0, 0);
    }
    const f = Math.round(t * FPS);
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.globalCompositeOperation = "overlay";
    const ox = Math.floor(hash(f) * 256), oy = Math.floor(hash(f + 99) * 256);
    ctx.translate(-ox, -oy);
    for (let x = 0; x < W + 256; x += 256) for (let y = 0; y < H + 256; y += 256) ctx.drawImage(grain, x, y);
    ctx.restore();
  }

  // sound cues: every cue sits on a visual event (read by audio.py)
  function cues() {
    const tl = L.phys.tLand;
    return [
      { t: 0.0, k: "slam", g: 1.0 },
      { t: T.my + 0.06, k: "thud", g: 0.7 },
      ...[0, 1, 2, 3, 4, 5].map((i) => ({ t: T.order + 0.05 + i * 0.028, k: "tick", g: 0.5, p: 1 + i * 0.06 })),
      { t: T.squash, k: "creak", g: 0.5 },
      { t: T.launch, k: "pop", g: 0.8 },
      { t: T.collapse, k: "whoosh", g: 0.55, d: 0.8 },
      { t: T.stroke, k: "marker", g: 0.6, d: T.strokeEnd - T.stroke },
      { t: tl, k: "land", g: 0.9 },
      { t: L.tBounceEnd, k: "tick", g: 0.45, p: 0.8 },
      { t: 2.3, k: "marker", g: 0.35, d: 0.3 },
      { t: T.rollStart, k: "roll", g: 0.45, d: T.forkArrive - T.rollStart },
      ...[1, 9 / 8, 5 / 4, 3 / 2, 5 / 3].map((r, i) => ({ t: T.sprout + i * 0.035, k: "pluck", g: 0.45, p: r })),
      { t: T.forkArrive, k: "knock", g: 0.6 },
      { t: T.circle, k: "marker", g: 0.45, d: 0.26 },
      { t: T.click, k: "click", g: 0.8 },
      { t: T.shoot, k: "whoosh", g: 0.6, d: 0.5 },
      { t: T.card, k: "pop", g: 0.7, p: 1.3 },
      { t: T.verified, k: "stamp", g: 0.8 },
      { t: T.whip, k: "whip", g: 0.7 },
      { t: 6.22, k: "marker", g: 0.3, d: 0.18 },
      { t: T.gate, k: "knock", g: 0.7, p: 0.8 },
      { t: T.gate, k: "riser", g: 0.7, d: T.dark - T.gate },
      { t: T.dark, k: "drop", g: 1.0 },
      { t: T.draft, k: "thud", g: 0.6 },
      { t: T.strike, k: "marker", g: 0.8, d: 0.2 },
      { t: T.held, k: "stamp", g: 1.0, p: 0.7 },
      { t: T.reason, k: "type", g: 0.4, d: 0.42 },
      { t: T.dropAway, k: "whoosh", g: 0.5, d: 0.4 },
      { t: T.hard, k: "slam", g: 0.75 },
      { t: T.dotLand, k: "tick", g: 0.6, p: 1.2 },
      { t: T.iris - 0.35, k: "reverse", g: 0.6, d: 0.35 },
      { t: T.iris, k: "light", g: 0.9 },
      { t: T.owner, k: "whoosh", g: 0.4, d: 0.4 },
      { t: T.noteLand, k: "tick", g: 0.55, p: 1.4 },
      { t: T.pullOut, k: "whoosh", g: 0.5, d: 0.9 },
      { t: T.converge, k: "swell", g: 0.6, d: T.lampLand - T.converge },
      { t: T.lampLand, k: "tick", g: 0.6, p: 1.6 },
      { t: T.thicken, k: "thud", g: 0.55 },
      { t: T.plate, k: "resolve", g: 0.9 },
      { t: T.lockup + 0.12, k: "whoosh", g: 0.25, d: 0.6 },
    ];
  }

  // very fast moves need more motion-blur samples, or the average shows stepped copies
  function samplesAt(t) {
    const fast = [[5.98, 6.36], [6.78, 7.02], [T.iris - 0.02, T.iris + 0.3], [T.dropAway, T.dropAway + 0.3]];
    return fast.some(([a, b]) => t >= a && t <= b) ? 16 : 5;
  }

  window.FILM = { render, finish, cues, samplesAt, DUR, FPS, T, layout: (ctx) => layout(ctx) };
})();

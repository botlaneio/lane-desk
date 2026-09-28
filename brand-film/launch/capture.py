"""Capture the live botlane.in pages for the launch film: full-page 2x screenshots in their
fully played-in state, plus page-coordinate rectangles of every element the film highlights.

    python3 launch/capture.py        # writes out/launch-site/{home,assist}@2x.png and launch/rects.js

Needs network access to botlane.in. The film itself only reads the saved files.
"""
import json, pathlib, os
from playwright.sync_api import sync_playwright

CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
OUT = pathlib.Path("out/launch-site"); OUT.mkdir(parents=True, exist_ok=True)
REVEAL = "[data-reveal],.rise{opacity:1!important;transform:none!important;animation:none!important} *{scroll-behavior:auto!important}"
FIND = """([root, text, up]) => {
  const scope = root ? document.querySelector(root) : document.body;
  if (!scope) return null;
  const all = [...scope.querySelectorAll('*')].filter(e => e.innerText && e.innerText.trim().replace(/\\s+/g,' ').startsWith(text));
  if (!all.length) return null;
  all.sort((a, b) => a.innerText.length - b.innerText.length);  // the tightest element holding the text
  let e = all[0];
  if (up) e = e.closest(up) || e;
  const r = e.getBoundingClientRect();
  return [r.left, r.top + window.scrollY, r.width, r.height];
}"""
SPECS = {
  "home": ("https://botlane.in/", {
    "gap_h": ["#gap", "You already have software.", "h2"],
    "gap_whatsapp": ["#gap", "WhatsApp", None], "gap_copy": ["#gap", "COPY", None],
    "gap_excel": ["#gap", "Excel", None], "gap_reenter": ["#gap", "RE-ENTER", None],
    "gap_tally": ["#gap", "Tally", None], "gap_match": ["#gap", "MATCH", None],
    "gap_gst": ["#gap", "GST portal", None], "gap_reconcile": ["#gap", "RECONCILE", None],
    "gap_note": ["#gap", "EVERY STEP BETWEEN", None],
    "hero_h1": [None, "Software for the work", "h1"], "hero_sub": [None, "BotLane builds and operates", None],
    "lanes": [None, "THE LANES", "div"], "lane_assist_row": [None, "01 Lane Assist", "li"],
    "lane_verify_row": [None, "02 Lane Verify", "li"],
    "india_h": ["#india", "Built around how business", "h2"],
    "footer_pmh": ["footer", "PRIVATE · MANAGED · HUMAN-CONTROLLED", None],
    "managed_h": ["#managed", "Software shouldn", "h2"],
  }),
  "assist": ("https://botlane.in/assist", {
    "hero_h1": [None, "Support that knows", "h1"], "hero_card": ["main", "Order status", "figure"],
    "chip_number": ["main figure", "✓ NUMBER MATCHED", None], "chip_order": ["main figure", "✓ ORDER FOUND", None],
    "chip_nollm": ["main figure", "✓ NO LLM", None], "chip_verified": ["main figure", "✓ VERIFIED", None],
    "hero_q": ["main figure", "Hi, where", None], "hero_a": ["main figure", "Hi Priya", None],
    "guard_h": ["#the-guard", "Every AI draft is checked", "h2"],
    "guard_held_card": ["#the-guard", "Draft held", "figure"], "guard_passed_card": ["#the-guard", "Draft passed", "figure"],
    "guard_held_pill": ["#the-guard figure", "HELD", None], "guard_draft": ["#the-guard figure", "AI DRAFT · NOT SENT", "div"],
    "guard_list": ["#the-guard", "A DRAFT IS HELD IF IT PROMISES", "div"],
    "handoff_h": ["#handoff", "When it", "h2"], "handoff_card": ["#handoff", "Handoff to the owner", "figure"],
    "handoff_owner": ["#handoff figure", "TO THE OWNER", "div"],
    "service_h": ["#service", "You don", "h2"], "svc_1": ["#service", "01Connected on one call", "div"],
    "svc_1t": ["#service", "Connected on one call", None], "svc_2t": ["#service", "Policy wording and thresholds", None],
    "svc_3t": ["#service", "Reviewed every week", None], "svc_4t": ["#service", "Kept current", None],
    "svc_official": ["#service", "Runs on the official WhatsApp", None],
    "pilot_h": ["#pilot", "Start with a pilot.", "h2"], "pilot_price": ["#pilot", "₹6,999", None],
    "pilot_offer": ["#pilot", "LAUNCH OFFER", "div"], "pilot_btn": ["#pilot", "Talk about a pilot", "a"],
  }),
}
# merge into the existing rects so hand-measured entries (the India cards, the marketplaces chip, the
# service cards) survive a re-capture; --only <slug> recaptures one page
import sys
ONLY = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
old = pathlib.Path("launch/rects.js")
rects = json.loads(old.read_text().split("=", 1)[1].strip().rstrip(";")) if old.exists() else {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    ctx = b.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=2, ignore_https_errors=True)
    pg = ctx.new_page()
    for slug, (url, spec) in SPECS.items():
        if ONLY and slug != ONLY: continue
        for attempt in range(8):
            try:
                pg.goto(url, wait_until="networkidle", timeout=60000); pg.wait_for_timeout(1500)
            except Exception as e:
                print("retry", url, str(e)[:80]); pg.wait_for_timeout(3000); continue
            # the family name alone is not enough: wait until an Inter face has actually loaded
            if pg.evaluate("document.fonts.ready.then(() => [...document.fonts].some((f) => /inter/i.test(f.family) && f.status === 'loaded'))"): break
            pg.wait_for_timeout(2000)
        pg.add_style_tag(content=REVEAL); pg.wait_for_timeout(600)
        if slug == "assist":
            # let the in-view chats play, then freeze the hero carousel on the order-status flow
            for sel in ["#the-guard figure", "#handoff figure"]:
                pg.locator(sel).first.scroll_into_view_if_needed(); pg.wait_for_timeout(7000)
            pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(500)
            for _ in range(40):
                t = pg.evaluate("(() => { const f = document.querySelector('main figure'); return f ? f.innerText : '' })()")
                if "Order status" in t and "VERIFIED" in t: break
                pg.wait_for_timeout(400)
            pg.get_by_role("button", name="PAUSE").click(); pg.wait_for_timeout(1200)
        H = pg.evaluate("document.documentElement.scrollHeight")
        prev = rects.get(slug, {}).get("r", {})
        rects[slug] = {"url": url, "w": 1920, "h": H, "r": dict(prev)}
        for name, (root, text, up) in spec.items():
            r = pg.evaluate(FIND, [root, text, up])
            if r or name not in prev: rects[slug]["r"][name] = [round(v, 1) for v in r] if r else None
            if not r: print("MISSING", slug, name)
        pg.screenshot(path=str(OUT / f"{slug}@2x.png"), full_page=True)
        print(slug, "captured", H)
    b.close()
pathlib.Path("launch/rects.js").write_text("// generated by launch/capture.py (page coordinates in CSS px at 1920 wide)\nwindow.SITE = " + json.dumps(rects) + ";\n")
print(json.dumps({k: {n: v for n, v in d["r"].items()} for k, d in rects.items()}, indent=0)[:3000])

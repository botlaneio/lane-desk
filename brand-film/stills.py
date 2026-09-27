"""Render stills at given times and tile them into a labelled contact sheet.

    python3 stills.py out/sheet.png 0 0.3 0.8 1.2 ...
    python3 stills.py --page explainer/index.html out/sheet.png 5 20 40
"""
import base64
import pathlib
import os
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")


def main():
    args = sys.argv[1:]
    page_path = HERE / "index.html"
    if args[0] == "--page":
        page_path = pathlib.Path(args[1]).resolve()
        args = args[2:]
    dest = pathlib.Path(args[0])
    times = [float(x) for x in args[1:]]
    dest.parent.mkdir(parents=True, exist_ok=True)
    frames = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=["--allow-file-access-from-files"])
        page = b.new_page(viewport={"width": 1920, "height": 1080})
        page.on("console", lambda m: print("console:", m.text))
        page.on("pageerror", lambda e: print("pageerror:", e))
        page.goto(page_path.as_uri())
        page.evaluate("window.ready")
        for t in times:
            page.evaluate(f"renderFrame({round(t * 60)}, 1)")
            data = page.evaluate("grab()")
            frames.append((t, base64.b64decode(data.split(",")[1])))
        # tile with a canvas in the page
        cols = 3 if len(frames) > 4 else 2
        page.set_content("<canvas id=s></canvas>")
        imgs = [base64.b64encode(f).decode() for _, f in frames]
        sheet = page.evaluate(
            """async ([imgs, labels, cols]) => {
              const tw = 640, th = 360, pad = 8, lh = 26;
              const rows = Math.ceil(imgs.length / cols);
              const c = document.getElementById('s');
              c.width = cols * (tw + pad) + pad; c.height = rows * (th + lh + pad) + pad;
              const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0,0,c.width,c.height);
              for (let i = 0; i < imgs.length; i++) {
                const im = new Image(); im.src = 'data:image/png;base64,' + imgs[i]; await im.decode();
                const cx = pad + (i % cols) * (tw + pad), cy = pad + Math.floor(i / cols) * (th + lh + pad);
                x.drawImage(im, cx, cy + lh, tw, th);
                x.fillStyle = '#fff'; x.font = '16px monospace'; x.fillText(labels[i], cx + 4, cy + 18);
              }
              return c.toDataURL('image/png');
            }""",
            [imgs, [f"t={t:.2f}s" for t, _ in frames], cols],
        )
        dest.write_bytes(base64.b64decode(sheet.split(",")[1]))
        b.close()
    print("wrote", dest)


if __name__ == "__main__":
    main()

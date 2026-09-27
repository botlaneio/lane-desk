"""Render the film frame by frame in headless Chromium and pipe PNGs into ffmpeg.

    python3 render.py out/lanedesk-film-16x9.mp4            # full film, 60fps, motion blur
    python3 render.py out/test.mp4 --from 6.0 --to 7.5      # a range
    python3 render.py out/test.mp4 --samples 1              # no motion blur (fast draft)
    python3 render.py --cues out/cues.json                  # export sound cues only
"""
import argparse
import base64
import json
import os
import pathlib
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")


def ffmpeg_bin():
    env = os.environ.get("FFMPEG")
    if env:
        return env
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out", nargs="?")
    ap.add_argument("--from", dest="t0", type=float, default=0.0)
    ap.add_argument("--to", dest="t1", type=float, default=None)
    ap.add_argument("--samples", type=int, default=5)
    ap.add_argument("--cues")
    ap.add_argument("--page", default=str(HERE / "index.html"), help="harness page (explainer/index.html for the explainer)")
    a = ap.parse_args()

    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=["--allow-file-access-from-files"])
        page = b.new_page(viewport={"width": 1920, "height": 1080})
        page.on("pageerror", lambda e: print("pageerror:", e, file=sys.stderr))
        page.goto(pathlib.Path(a.page).resolve().as_uri())
        page.evaluate("window.ready")
        dur = page.evaluate("(window.PIECE || FILM).DUR")
        fps = page.evaluate("(window.PIECE || FILM).FPS")

        if a.cues:
            page.evaluate("renderFrame(0, 1)")
            pathlib.Path(a.cues).write_text(json.dumps(page.evaluate("cues()"), indent=1))
            print("wrote", a.cues)
            if not a.out:
                return

        f0 = round(a.t0 * fps)
        f1 = round((a.t1 if a.t1 is not None else dur) * fps)
        out = pathlib.Path(a.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            ffmpeg_bin(), "-nostdin", "-y", "-loglevel", "error",
            "-f", "image2pipe", "-framerate", str(fps), "-c:v", "png", "-i", "-",
            "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
            "-movflags", "+faststart", str(out),
        ]
        enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        start = time.time()
        for f in range(f0, f1):
            page.evaluate(f"renderFrame({f}, {a.samples})")
            data = page.evaluate("grab()")
            enc.stdin.write(base64.b64decode(data.split(",", 1)[1]))
            if (f - f0) % 60 == 0:
                el = time.time() - start
                print(f"frame {f}/{f1}  {el:.0f}s  {el / max(1, f - f0):.2f}s/frame", flush=True)
        enc.stdin.close()
        enc.wait()
        b.close()
        print(f"wrote {out} in {time.time() - start:.0f}s")


if __name__ == "__main__":
    main()

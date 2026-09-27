"""Two-pass loudness normalisation, mux with the picture, then re-measure the final AAC.

    python3 master.py out/bed.wav out/film-video.mp4 out/lanedesk-film-16x9.mp4

Targets: -14 LUFS integrated, -2 dBTP true peak (measured again after AAC encoding).
"""
import json
import re
import subprocess
import sys

from render import ffmpeg_bin

I, TP, LRA = -14.0, -2.0, 11.0
FF = ffmpeg_bin()


def loudnorm_measure(path, extra=None):
    cmd = [FF, "-hide_banner", "-nostats", "-i", path]
    cmd += ["-af", f"loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json", "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    return json.loads(re.findall(r"\{[^{}]*\}", err)[-1])


def ebur128(path):
    err = subprocess.run(
        [FF, "-hide_banner", "-nostats", "-i", path, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True,
        text=True,
    ).stderr
    summary = err[err.rfind("Summary:") :]
    integ = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summary).group(1))
    peak = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summary).group(1))
    return integ, peak


def encode(wav, video, out, tp):
    m = loudnorm_measure(wav)
    norm = out.replace(".mp4", "-audio.wav")
    af = (
        f"loudnorm=I={I}:TP={tp}:LRA={LRA}:linear=true:"
        f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
        f"measured_thresh={m['input_thresh']}:offset={m['target_offset']},aresample=48000"
    )
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", wav, "-af", af, "-ar", "48000", norm], check=True)
    subprocess.run(
        [FF, "-y", "-loglevel", "error", "-i", video, "-i", norm, "-map", "0:v", "-map", "1:a",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-shortest", "-movflags", "+faststart", out],
        check=True,
    )
    return ebur128(out)


def main(wav, video, out):
    # AAC encoding can push peaks up; if the encoded file overshoots, master again with that much headroom
    tp = TP
    for _ in range(3):
        integ, peak = encode(wav, video, out, tp)
        if peak <= TP + 0.05:
            break
        tp -= peak - TP + 0.2
    print(f"final AAC: {integ:.1f} LUFS integrated, {peak:.1f} dBTP true peak (targets {I}, {TP})")
    return integ, peak


if __name__ == "__main__":
    main(*sys.argv[1:4])

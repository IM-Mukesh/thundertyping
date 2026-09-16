#!/usr/bin/env python3
"""
Turn the raw WAVs in assets-raw/audio/ into shippable Opus under public/audio/.

Music is not simply re-encoded. Every generated take on this project arrived
with an intro ramp, a fade or a dropout near the end, and weak periodicity --
they are through-composed rather than looping. So each track is analysed, the
steady-level body is located, a loop is cut from it, and the tail is crossfaded
into the head so the wrap is inaudible.

SFX are trimmed of leading/trailing silence and peak-normalised so the whole set
sits at a consistent level -- generated one-shots arrive at wildly different
loudness, which reads as some effects being "wrong" when they are only quiet.

  ./scripts/process-audio.py --dry-run
  ./scripts/process-audio.py
"""

import argparse
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "assets-raw" / "audio"
OUT_MUSIC = ROOT / "public" / "audio" / "music"
OUT_SFX = ROOT / "public" / "audio" / "sfx"

MUSIC_BITRATE = "64k"          # Opus at 64k stereo is transparent for background music
SFX_BITRATE = "128k"          # short, transient-heavy: worth the extra bits
CROSSFADE = 3.0               # seconds blended from tail into head
WINDOW = 4.0                  # analysis window
MAX_LOOP = 165.0              # cap; longer wastes bytes for little variety
MIN_LOOP = 45.0


def run(args: list[str]) -> str:
    return subprocess.run(args, capture_output=True, text=True).stderr


def duration(path: pathlib.Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def mean_db(path: pathlib.Path, start: float, length: float) -> float:
    """Mean volume of one window, in dBFS. -99 when silent."""
    err = run(["ffmpeg", "-v", "info", "-ss", str(start), "-t", str(length),
               "-i", str(path), "-af", "volumedetect", "-f", "null", "-"])
    for line in err.splitlines():
        if "mean_volume:" in line:
            return float(line.split("mean_volume:")[1].replace("dB", "").strip())
    return -99.0


def find_loop(path: pathlib.Path) -> tuple[float, float, float]:
    """
    Pick loop start/end inside the track's steady-level region.

    Scans the level envelope, takes the median of the loud half as the
    reference, then walks in from both ends until the level is within 3dB of it.
    That skips the intro ramp and stops before any end fade or dropout without
    needing to know where either is.
    """
    total = duration(path)
    step = WINDOW
    points = []
    t = 0.0
    while t + step <= total:
        points.append((t, mean_db(path, t, step)))
        t += step

    levels = sorted(db for _, db in points)
    ref = levels[len(levels) * 3 // 4]          # upper-quartile level
    ok = [t for t, db in points if db >= ref - 3.0]
    if not ok:
        return 0.0, min(total, MAX_LOOP), total

    start = ok[0]
    end = ok[-1] + step
    # never start at the very top of the file: generated intros ramp
    start = max(start, min(8.0, total * 0.05))
    end = min(end, total - 2.0)

    if end - start > MAX_LOOP:
        mid = (start + end) / 2
        start, end = mid - MAX_LOOP / 2, mid + MAX_LOOP / 2
    if end - start < MIN_LOOP:
        start, end = 0.0, min(total, MAX_LOOP)
    return round(start, 2), round(end, 2), total


def process_sting(src: pathlib.Path, dst: pathlib.Path, dry: bool) -> dict:
    """
    Victory/defeat stings are one-shots, not loops -- they play once when a run
    ends. The generator had no option below a minute, so the usable few seconds
    sit somewhere inside a long take: find the loudest window, start slightly
    before it, and let it ring out. No crossfade, and a real ending.
    """
    total = duration(src)
    best_t, best_db = 0.0, -99.0
    t = 0.0
    while t + 2.0 <= total:
        db = mean_db(src, t, 2.0)
        if db > best_db:
            best_db, best_t = db, t
        t += 2.0
    start = max(0.0, best_t - 1.0)
    length = min(7.0, total - start)
    info = {"file": dst.name, "source_len": round(total, 1),
            "sting": f"{round(start,2)}s +{round(length,2)}s", "peak_at": best_t}
    if dry:
        return info
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(length),
         "-i", str(src), "-af", f"afade=t=out:st={max(0,length-1.2)}:d=1.2,"
         "loudnorm=I=-16:TP=-1.5:LRA=11",
         "-c:a", "libopus", "-b:a", MUSIC_BITRATE, "-vbr", "on", str(dst)],
        check=True,
    )
    info["out_kb"] = dst.stat().st_size // 1024
    return info


def process_music(src: pathlib.Path, dst: pathlib.Path, dry: bool) -> dict:
    start, end, total = find_loop(src)
    length = round(end - start, 2)
    xf = min(CROSSFADE, length / 8)
    info = {"file": dst.name, "source_len": round(total, 1),
            "loop": f"{start}s-{end}s", "loop_len": length, "crossfade": xf}
    if dry:
        return info
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y",
         "-ss", str(start), "-t", str(length), "-i", str(src),
         "-ss", str(start), "-t", str(xf), "-i", str(src),
         "-filter_complex", f"[0:a][1:a]acrossfade=d={xf}:c1=tri:c2=tri[a]",
         "-map", "[a]", "-c:a", "libopus", "-b:a", MUSIC_BITRATE, "-vbr", "on",
         str(dst)],
        check=True,
    )
    info["out_kb"] = dst.stat().st_size // 1024
    return info


def process_sfx(src: pathlib.Path, dst: pathlib.Path, dry: bool) -> dict:
    info = {"file": dst.name, "source_len": round(duration(src), 2)}
    if dry:
        return info
    dst.parent.mkdir(parents=True, exist_ok=True)
    # silenceremove strips dead air at both ends; loudnorm then brings the whole
    # set to one perceived level so no single effect jumps out or vanishes.
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(src),
         "-af",
         "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,"
         "areverse,"
         "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,"
         "areverse,"
         "loudnorm=I=-16:TP=-1.5:LRA=11",
         "-c:a", "libopus", "-b:a", SFX_BITRATE, "-vbr", "on", str(dst)],
        check=True,
    )
    info["out_kb"] = dst.stat().st_size // 1024
    info["out_len"] = round(duration(dst), 2)
    return info


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    music = sorted(RAW.glob("music-*.wav"))
    sfx = sorted((RAW / "sfx").glob("sfx-*.wav"))
    if not music and not sfx:
        print(f"nothing found under {RAW}", file=sys.stderr)
        return 1

    print(f"MUSIC ({len(music)})")
    for f in music:
        name = f.stem.replace("music-", "") + ".opus"
        handler = process_sting if "sting" in f.stem else process_music
        info = handler(f, OUT_MUSIC / name, args.dry_run)
        print("  " + json.dumps(info))

    print(f"\nSFX ({len(sfx)})")
    for f in sfx:
        info = process_sfx(f, OUT_SFX / (f.stem + ".opus"), args.dry_run)
        print("  " + json.dumps(info))

    if not args.dry_run:
        tot = sum(p.stat().st_size for p in (ROOT / "public" / "audio").rglob("*.opus"))
        print(f"\ntotal public/audio: {tot / 1_048_576:.2f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())

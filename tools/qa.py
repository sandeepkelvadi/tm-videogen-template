#!/usr/bin/env python3
"""
Video pipeline quality gates.

Two subcommands:
  preflight <composition-id>    — run BEFORE `npx remotion render`
  postrender <rendered.mp4>     — run AFTER render, on the output file

Preflight checks (source-asset level, cheap):
  • Photos: source dimensions must be ≥ canvas × 1.15 (Ken Burns max zoom).
    Exempt if the segment declares fit:"contain" (letterboxed).
  • Videos: source dimensions ≥ canvas.
  • Music/voiceover:
      - Leading/trailing loud content (>0.3s of −40 dB or above = possibly untrimmed).

Post-render checks (final MP4):
  • File size ≤ 32 MB (soft cap for fast ad loading).
  • Contains a video stream and an audio stream.
  • Duration present.
  • Mean audio volume between −30 and −6 dB.
  • Tail audio is either (a) a clean fade to silence (<−32 dB at end) or
    (b) matches overall volume within 4 dB. Partial ducks in between are a bug
    (e.g., voiceover getting cut off by a music-style fade-out).
  • No silent window > 1s in the first 80% of the video (end card is allowed silent).
  • Output pixel dims match one of: 1080x1080, 1080x1920, 1920x1080.

Exit 0 = pass, 1 = fail, 2 = error.

Assumes the project layout:
  <repo root>/
    src/Root.tsx
    public/              — static assets referenced by staticFile()
    tools/qa.py          — this file
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# Project layout — tools/qa.py → parent is repo root.
ROOT = Path(__file__).resolve().parent.parent
ROOT_TSX = ROOT / "src" / "Root.tsx"
PUBLIC = ROOT / "public"

KEN_BURNS_MAX_ZOOM = 1.15  # must match KenBurnsImage.tsx
MAX_FILE_SIZE_MB = 32.0
MIN_MEAN_DB = -30.0
MAX_MEAN_DB = -6.0

# Duration constants — extend if your project defines more.
DURATION_CONSTANTS = {
    "DURATION_FRAMES": 375,   # 15s at 25fps
    "DURATION_30S": 750,      # 30s at 25fps
}


# ── helpers ────────────────────────────────────────────────────────────────

def ffprobe_json(path: Path) -> dict[str, Any]:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_format", "-show_streams",
         "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout)


def mean_volume(path: Path, ss: float | None = None, t: float | None = None) -> float | None:
    cmd = ["ffmpeg", "-hide_banner", "-nostats"]
    if ss is not None:
        cmd += ["-ss", str(ss)]
    if t is not None:
        cmd += ["-t", str(t)]
    cmd += ["-i", str(path), "-af", "volumedetect", "-f", "null", "-"]
    out = subprocess.run(cmd, capture_output=True, text=True)
    m = re.search(r"mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB", out.stderr)
    return float(m.group(1)) if m else None


def silence_windows(path: Path, noise_db: int = -40, min_dur: float = 1.0) -> list[tuple[float, float]]:
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
         "-af", f"silencedetect=noise={noise_db}dB:d={min_dur}", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    starts = [float(m.group(1)) for m in re.finditer(r"silence_start:\s*(-?\d+(?:\.\d+)?)", out.stderr)]
    ends = [float(m.group(1)) for m in re.finditer(r"silence_end:\s*(-?\d+(?:\.\d+)?)", out.stderr)]
    return list(zip(starts, ends + [float("inf")] * (len(starts) - len(ends))))


@dataclass
class Finding:
    level: str   # PASS | WARN | FAIL
    msg: str


def emit(findings: list[Finding]) -> int:
    for f in findings:
        color = {"PASS": "\033[32m", "WARN": "\033[33m", "FAIL": "\033[31m"}.get(f.level, "")
        print(f"  {color}[{f.level}]\033[0m {f.msg}")
    fails = sum(1 for f in findings if f.level == "FAIL")
    warns = sum(1 for f in findings if f.level == "WARN")
    print(f"\n  → {len(findings)} checks, {fails} fail, {warns} warn")
    return 1 if fails else 0


# ── preflight ──────────────────────────────────────────────────────────────
#
# Lightweight TS parser — keys off the composition id in Root.tsx, extracts
# the referenced segments array name, and resolves it. Good enough for the
# standard patterns produced by this template; compositions built with
# unusual control flow may need manual inspection.

def parse_segments_for_comp(comp_id: str) -> tuple[list[dict], tuple[int, int], int] | None:
    if not ROOT_TSX.exists():
        return None
    root = ROOT_TSX.read_text()

    m = re.search(rf'id="{re.escape(comp_id)}".*?defaultProps=\{{(.*?)\}}\s*satisfies', root, re.DOTALL)
    if not m:
        return None
    props = m.group(1)
    sm = re.search(r'segments:\s*(\w+)', props)
    broll_m = re.search(r'broll:\s*(\w+)', props)
    seg_var = sm.group(1) if sm else (broll_m.group(1) if broll_m else None)
    if not seg_var:
        return None
    wh = re.search(rf'id="{re.escape(comp_id)}".*?width=\{{(\d+)\}}\s+height=\{{(\d+)\}}', root, re.DOTALL)
    dur = re.search(rf'id="{re.escape(comp_id)}".*?durationInFrames=\{{(\w+)\}}', root, re.DOTALL)
    if not wh:
        return None
    width, height = int(wh.group(1)), int(wh.group(2))
    dur_const = dur.group(1) if dur else "DURATION_FRAMES"
    duration_frames = DURATION_CONSTANTS.get(dur_const, 375)

    seg_block = re.search(rf'const\s+{seg_var}[^=]*=\s*\[(.*?)\];', root, re.DOTALL)
    if not seg_block:
        return None
    body = seg_block.group(1)

    # Split on top-level {} entries.
    entries: list[str] = []
    depth = 0
    buf: list[str] = []
    for ch in body:
        if ch == "{":
            depth += 1
            if depth == 1:
                buf = []
                continue
        if ch == "}":
            depth -= 1
            if depth == 0:
                entries.append("".join(buf))
                continue
        if depth >= 1:
            buf.append(ch)

    def field(s: str, name: str) -> str | None:
        mm = re.search(rf'{name}:\s*"([^"]*)"', s)
        if mm:
            return mm.group(1)
        mm = re.search(rf'{name}:\s*(\w+)', s)
        return mm.group(1) if mm else None

    segs = [
        {
            "type": field(e, "type"),
            "src": field(e, "src"),
            "verticalSrc": field(e, "verticalSrc"),
            "kenBurns": field(e, "kenBurns"),
            "fit": field(e, "fit"),
            "raw": e,
        }
        for e in entries
    ]
    return segs, (width, height), duration_frames


def check_photo(seg: dict, canvas: tuple[int, int]) -> list[Finding]:
    src = seg.get("src")
    if not src or seg.get("type") != "image":
        return []
    path = PUBLIC / src
    if not path.exists():
        return [Finding("FAIL", f"photo missing: {src}")]
    try:
        probe = ffprobe_json(path)
        st = probe["streams"][0]
        w, h = st["width"], st["height"]
    except Exception as exc:
        return [Finding("FAIL", f"{src}: ffprobe failed ({exc})")]

    cw, ch = canvas
    src_aspect = w / h
    target_aspect = cw / ch
    # Cover-fit scaling factor the runtime will apply.
    if target_aspect > src_aspect:
        scale = cw / w
    else:
        scale = ch / h
    effective_scale = scale * KEN_BURNS_MAX_ZOOM

    if seg.get("fit") == "contain":
        return [Finding("PASS", f"{src}: contain mode ({w}x{h}) — no upscale concern")]

    if effective_scale > 1.05:
        return [Finding(
            "FAIL",
            f"{src}: source {w}x{h} → needs {effective_scale:.2f}× upscale "
            f"for {cw}x{ch} canvas. Either set fit:\"contain\" on the segment, "
            f"provide a higher-res source, or pick a photo of matching aspect."
        )]
    return [Finding("PASS", f"{src}: {w}x{h} sufficient for {cw}x{ch} (scale {effective_scale:.2f}×)")]


def check_video(seg: dict, canvas: tuple[int, int]) -> list[Finding]:
    is_vertical = canvas[1] > canvas[0]
    src = seg.get("verticalSrc") if is_vertical and seg.get("verticalSrc") else seg.get("src")
    if not src or seg.get("type") != "video":
        return []
    path = PUBLIC / src
    if not path.exists():
        return [Finding("FAIL", f"video missing: {src}")]
    try:
        probe = ffprobe_json(path)
        vs = next(s for s in probe["streams"] if s["codec_type"] == "video")
    except Exception as exc:
        return [Finding("FAIL", f"{src}: ffprobe failed ({exc})")]
    w, h = vs["width"], vs["height"]
    cw, ch = canvas
    if w < cw or h < ch:
        return [Finding("WARN", f"{src}: {w}x{h} smaller than {cw}x{ch} — will upscale")]
    return [Finding("PASS", f"{src}: {w}x{h} ≥ {cw}x{ch}")]


def check_audio_track(root: str, comp_id: str) -> list[Finding]:
    m = re.search(rf'id="{re.escape(comp_id)}".*?musicSrc:\s*"([^"]+)"', root, re.DOTALL)
    if not m:
        return []
    path = PUBLIC / m.group(1)
    if not path.exists():
        return [Finding("FAIL", f"audio missing: {m.group(1)}")]
    try:
        probe = ffprobe_json(path)
        dur = float(probe["format"]["duration"])
    except Exception as exc:
        return [Finding("FAIL", f"{m.group(1)}: ffprobe failed ({exc})")]

    findings: list[Finding] = []
    lead = mean_volume(path, ss=0, t=0.3)
    trail = mean_volume(path, ss=max(0, dur - 0.3))
    if lead is not None and lead > -40:
        findings.append(Finding("WARN", f"{m.group(1)}: first 0.3s at {lead:.1f} dB — OK for music, but for voiceover consider trimming pre-speech noise"))
    else:
        findings.append(Finding("PASS", f"{m.group(1)}: leading silence OK"))
    if trail is not None and trail > -40:
        findings.append(Finding("WARN", f"{m.group(1)}: last 0.3s at {trail:.1f} dB — tail will be cut off by the composition's fade-out"))
    return findings


def preflight(comp_id: str) -> int:
    print(f"\n── Preflight: {comp_id} ──")
    parsed = parse_segments_for_comp(comp_id)
    if not parsed:
        print(f"  [FAIL] cannot parse composition {comp_id} in {ROOT_TSX}")
        return 2
    segs, canvas, dur_frames = parsed
    print(f"  canvas: {canvas[0]}x{canvas[1]}, duration: {dur_frames} frames, segments: {len(segs)}")

    findings: list[Finding] = []
    for seg in segs:
        if seg.get("type") == "image":
            findings.extend(check_photo(seg, canvas))
        elif seg.get("type") == "video":
            findings.extend(check_video(seg, canvas))

    findings.extend(check_audio_track(ROOT_TSX.read_text(), comp_id))
    return emit(findings)


# ── postrender ─────────────────────────────────────────────────────────────

def postrender(mp4_path: str) -> int:
    path = Path(mp4_path).resolve()
    print(f"\n── Post-render: {path.name} ──")
    if not path.exists():
        print(f"  [FAIL] file not found: {path}")
        return 2

    findings: list[Finding] = []
    size_mb = path.stat().st_size / 1e6
    if size_mb > MAX_FILE_SIZE_MB:
        findings.append(Finding("FAIL", f"size {size_mb:.2f} MB > {MAX_FILE_SIZE_MB} MB"))
    else:
        findings.append(Finding("PASS", f"size {size_mb:.2f} MB ≤ {MAX_FILE_SIZE_MB} MB"))

    probe = ffprobe_json(path)
    vs = next((s for s in probe["streams"] if s["codec_type"] == "video"), None)
    aus = next((s for s in probe["streams"] if s["codec_type"] == "audio"), None)
    if not vs:
        findings.append(Finding("FAIL", "no video stream"))
    if not aus:
        findings.append(Finding("FAIL", "no audio stream"))

    if vs:
        w, h = vs["width"], vs["height"]
        valid = (w, h) in {(1080, 1080), (1080, 1920), (1920, 1080)}
        level = "PASS" if valid else "WARN"
        findings.append(Finding(level, f"dimensions {w}x{h}"))

    dur = float(probe["format"]["duration"])
    findings.append(Finding("PASS", f"duration {dur:.2f}s"))

    overall = mean_volume(path)
    if overall is None:
        findings.append(Finding("WARN", "could not measure audio mean volume"))
    else:
        if MIN_MEAN_DB <= overall <= MAX_MEAN_DB:
            findings.append(Finding("PASS", f"mean volume {overall:.1f} dB in target [{MIN_MEAN_DB}, {MAX_MEAN_DB}]"))
        else:
            findings.append(Finding("WARN", f"mean volume {overall:.1f} dB outside target [{MIN_MEAN_DB}, {MAX_MEAN_DB}]"))

        # Tail shape: clean fade (last 0.25s < −32 dB) OR sustained (last 1s
        # within 4 dB of overall). Anything else = partial duck.
        tail_end = mean_volume(path, ss=max(0, dur - 0.25))
        tail_win = mean_volume(path, ss=max(0, dur - 1.0))
        if tail_end is not None and tail_win is not None:
            delta = overall - tail_win
            if tail_end < -32:
                findings.append(Finding("PASS", f"tail end {tail_end:.1f} dB — clean fade to silence"))
            elif delta <= 4:
                findings.append(Finding("PASS", f"tail {tail_win:.1f} dB ≈ overall (Δ {delta:.1f} dB)"))
            else:
                findings.append(Finding("FAIL",
                    f"tail at {tail_win:.1f} dB (end {tail_end:.1f}) vs overall {overall:.1f} dB "
                    f"(Δ {delta:.1f} dB) — partial duck; voiceover may be getting trimmed"))

    content_end = dur * 0.8
    sils = silence_windows(path, noise_db=-40, min_dur=1.0)
    mid_sils = [(s, e) for s, e in sils if s < content_end]
    if mid_sils:
        findings.append(Finding("WARN",
            f"{len(mid_sils)} silent window(s) >1s in content: {['%.1f-%.1f' % w for w in mid_sils]}"))
    else:
        findings.append(Finding("PASS", "no unexpected mid-content silence"))

    return emit(findings)


# ── CLI ────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    pre = sub.add_parser("preflight", help="validate assets before rendering")
    pre.add_argument("comp_id")
    post = sub.add_parser("postrender", help="validate a rendered mp4")
    post.add_argument("mp4")
    args = ap.parse_args()

    if args.cmd == "preflight":
        return preflight(args.comp_id)
    return postrender(args.mp4)


if __name__ == "__main__":
    sys.exit(main())

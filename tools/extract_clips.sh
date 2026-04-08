#!/bin/bash
# Extract vertical (9:16) clips from source videos.
# Usage: ./extract_clips.sh <source_video> <output_dir> <subject_x>
#
# Arguments:
#   source_video   Path to source 16:9 video file
#   output_dir     Directory to write output clips (e.g., public/clips)
#   subject_x      Horizontal subject position (0.0=left, 0.5=center, 1.0=right)
#
# Prerequisites:
#   - FFmpeg must be installed: npm run install-ffmpeg
#   - Source video must be 16:9 (1920x1080)
#
# Environment:
#   CLIP_START    Start time in seconds (default: 0)
#   CLIP_DURATION Duration in seconds (default: 5)
#   PLAYBACK_RATE Playback rate multiplier (default: 1.0)
#   VERTICAL_SUFFIX Suffix for vertical output file (default: _9x16)

set -euo pipefail

if [ $# -lt 3 ]; then
  echo "Usage: $0 <source_video> <output_dir> <subject_x>"
  echo ""
  echo "Extracts a 9:16 vertical clip from a 16:9 source video."
  echo ""
  echo "Example:"
  echo "  CLIP_START=10 CLIP_DURATION=5 $0 video.mp4 public/clips 0.5"
  echo ""
  echo "Environment variables:"
  echo "  CLIP_START        Start time in seconds (default: 0)"
  echo "  CLIP_DURATION     Duration in seconds (default: 5)"
  echo "  PLAYBACK_RATE     Playback rate (default: 1.0)"
  echo "  VERTICAL_SUFFIX   Output suffix (default: _9x16)"
  exit 1
fi

SRC="$1"
OUT_DIR="$2"
SUBJECT_X="$3"

START="${CLIP_START:-0}"
DURATION="${CLIP_DURATION:-5}"
RATE="${PLAYBACK_RATE:-1.0}"
SUFFIX="${VERTICAL_SUFFIX:-_9x16}"

if [ ! -f "$SRC" ]; then
  echo "Error: Source file not found: $SRC"
  exit 1
fi

mkdir -p "$OUT_DIR"

# Calculate crop position from subject_x (0.0-1.0)
# Source: 1920x1080, crop to 608x1080
# Max crop_x offset: 1920 - 608 = 1312
CROP_X=$(python3 -c "print(int($SUBJECT_X * 1312))")

# Generate output filename from source
BASENAME=$(basename "$SRC" | sed 's/\.[^.]*$//')
OUT_FILE="$OUT_DIR/${BASENAME}${SUFFIX}.mp4"

if [ -f "$OUT_FILE" ]; then
  echo "SKIP (exists): $OUT_FILE"
  exit 0
fi

echo "Extracting vertical clip..."
echo "  Source: $SRC"
echo "  Output: $OUT_FILE"
echo "  Start: ${START}s, Duration: ${DURATION}s"
echo "  Subject X: $SUBJECT_X (crop_x=$CROP_X)"
echo "  Playback rate: $RATE"

VFLAGS="-r 25 -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 128k -y"

ffmpeg -hide_banner -loglevel warning \
  -ss "$START" -t "$DURATION" -i "$SRC" \
  -vf "crop=608:1080:${CROP_X}:0,scale=1080:1920" \
  $VFLAGS "$OUT_FILE"

SIZE=$(du -h "$OUT_FILE" | cut -f1)
echo "Done: $OUT_FILE ($SIZE)"

#!/usr/bin/env bash
# Contact-sheet preview for a Remotion composition.
# Usage: ./tools/make_preview_sheet.sh <comp-id> [out.jpg]
#
# Renders stills at 1 frame every ~1.5s then tiles them into a grid so you
# can visually audit framing (subject centering, crop issues) before
# committing to a full render.

set -euo pipefail

COMP="${1:?composition id required}"
OUT="${2:-/tmp/preview_${COMP}.jpg}"
FRAME_INTERVAL="${FRAME_INTERVAL:-38}"  # 38 frames ≈ 1.5s at 25fps

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ Extracting stills from $COMP"
DURATION=$(npx remotion compositions src/index.ts 2>/dev/null | grep -E "^\s*$COMP\s" | awk '{print $NF}')
if [[ -z "$DURATION" ]]; then
  echo "✗ Composition '$COMP' not found" >&2
  exit 1
fi

i=0
for frame in $(seq 0 "$FRAME_INTERVAL" $((DURATION - 1))); do
  i=$((i + 1))
  printf "  frame %d → %s\n" "$i" "$frame"
  npx remotion still src/index.ts "$COMP" "$TMP/$(printf "%03d" $i).jpg" \
    --frame="$frame" --image-format=jpeg --quality=80 >/dev/null 2>&1
done

if command -v montage >/dev/null 2>&1; then
  montage "$TMP"/*.jpg -tile 4x -geometry 400x+6+6 -background black "$OUT"
else
  # ffmpeg tile filter fallback
  COUNT=$(ls "$TMP"/*.jpg | wc -l | tr -d ' ')
  COLS=4
  ROWS=$(( (COUNT + COLS - 1) / COLS ))
  ffmpeg -y -pattern_type glob -i "$TMP/*.jpg" \
    -vf "scale=400:-1,tile=${COLS}x${ROWS}:padding=6:margin=6:color=black" \
    -frames:v 1 "$OUT" 2>/dev/null
fi

echo "✓ Preview sheet: $OUT"
open "$OUT" 2>/dev/null || true

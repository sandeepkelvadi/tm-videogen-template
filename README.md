# Video Pipeline Template

A generalized, plug-and-play Remotion video production pipeline for ads, promos, and social video.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install FFmpeg (required for clip extraction)
npm run install-ffmpeg

# 3. Open Remotion Studio for preview
npm run studio

# 4. Render a composition
npx remotion render src/index.ts myproject-square out/myproject.mp4
```

## Project Structure

```
├── config/
│   ├── brand.json          # Colors, font, logo, URL
│   └── campaign.json       # Headline, CTA, year, location
├── public/
│   ├── logo.png            # Your logo
│   ├── clips/              # Video segments
│   ├── photos/             # Image segments
│   └── music/              # Background music
├── src/
│   ├── pipeline/            # Reusable components
│   │   ├── VideoMontage.tsx # Base montage with transitions
│   │   ├── AdVideoV2.tsx    # Standard ad (15s)
│   │   ├── DayAtSchool.tsx  # Day-in-life (30s)
│   │   ├── FounderSpeaks.tsx # Founder testimonial
│   │   ├── CinematicAd.tsx  # Cinematic brand film (30s)
│   │   ├── KenBurnsImage.tsx
│   │   ├── SuperText.tsx
│   │   ├── EndCard.tsx
│   │   └── WhatsAppIcon.tsx
│   ├── types/
│   │   └── index.ts         # All TypeScript types
│   ├── brand.ts             # Brand constants from config/
│   ├── Root.tsx             # Composition registration
│   └── index.ts             # Entry point
└── tools/
    ├── ffmpeg_install.sh    # Auto-install FFmpeg
    ├── extract_clips.sh     # Extract vertical clips
    ├── qa.py                # Preflight + post-render quality gates
    └── make_preview_sheet.sh # Contact-sheet preview for framing audits
```

## Configuration

Edit `config/brand.json` and `config/campaign.json` to customize for your brand.

## Adding New Compositions

Edit `src/Root.tsx` to add new `<Composition>` entries:

```typescript
<Composition
  id="myproject-square"
  component={AdVideoV2}
  durationInFrames={375}  // 15s at 25fps
  fps={25}
  width={1080}
  height={1080}
  defaultProps={{
    segments: mySegments,
    musicSrc: "music/background.mp3",
    endCardCtaText: CAMPAIGN.ctaText,
  } satisfies AdVideoV2Props}
/>
```

## Quality Gates

Every render should pass automated checks — preflight before rendering (catches upstream issues cheaply) and post-render after (catches encoding issues).

```bash
# BEFORE rendering: validate source assets referenced by a composition
python3 tools/qa.py preflight <composition-id>

# AFTER rendering: validate the rendered MP4
python3 tools/qa.py postrender out/<file>.mp4
```

**Preflight catches:**
- Photos requiring > 1.05× upscale on the target canvas (visible pixelation) — unless `fit: "contain"` is set on the segment
- Videos with source dimensions smaller than canvas
- Music/voiceover files with untrimmed pre-speech noise or trailing audio that the fade-out will clip

**Post-render catches:**
- File size > 32 MB (soft cap for fast ad loading)
- Non-standard dimensions
- Missing video or audio stream
- Mean audio volume outside −30 to −6 dB
- Audio tails that are neither a clean fade-to-silence nor sustained — i.e. partial ducks, which indicate a voiceover getting truncated by a music-style fade
- Silent windows > 1s in the first 80% of the video

For visual framing audits (the one thing automated QA can't reliably verify — subject centering in 9:16 crops), generate a contact sheet:

```bash
tools/make_preview_sheet.sh <composition-id>
```

## Handling Pixelated Photos

If preflight FAILs a photo (`source X×Y → needs N× upscale`), you have three options:

1. **Easiest — `fit: "contain"`** on the `MediaSegment` or `BrollCutaway`. The photo renders at its native aspect, centered on a blurred/darkened fill of itself. No upscaling, polished look.
2. **Higher-res source** — replace the file in `public/` with a larger image.
3. **Different photo** — pick one whose aspect matches the canvas.

`KenBurnsImage` accepts `fit: "cover" | "contain"`. Both `MediaSegment` (AdVideoV2/CinematicAd) and `BrollCutaway` (FounderSpeaks) expose the `fit?` field.

## Voiceover Audio

Set `musicVolume: 1.0` to signal a voiceover track. The pipeline will:
- Apply a 2-frame fade-in/out (vs 0.5s in / 1.5s out for background music), so closing words aren't ducked
- For `AdVideoV2`, a `letterbox: true` flag renders a landscape 16:9 clip centered on a 9:16 canvas (useful when you don't want a center-crop)

Trim silence and pre-speech noise from the source mp3 directly (e.g., `ffmpeg -ss 0.5 -to 29.0 -i voice.mp3 -c:a libmp3lame -q:a 2 voice_trimmed.mp3`). The preflight check flags loud content in the first/last 0.3s of the source so you notice when trimming is needed.

## Composition Types

| Component | Duration | Best For |
|-----------|----------|----------|
| `AdVideoV2` | 15s | Standard ad with text overlay |
| `DayAtSchool` | 30s | Day-in-life with timestamps |
| `FounderSpeaks` | 15-30s | Founder testimonial |
| `CinematicAd` | 30s | Cinematic brand film |

## Generating with mkt-skills

This template is typically generated via:

```bash
npx mkt-skills generate video
```

This scaffolds a new project with your brand config applied.

## License

MIT

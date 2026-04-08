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
    └── extract_clips.sh     # Extract vertical clips
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

import { Composition, Folder } from "remotion";
import { AdVideoV2, AdVideoV2Props, MediaSegment } from "./pipeline/AdVideoV2";
import { DayAtSchool, DayAtSchoolProps, DaySegment } from "./pipeline/DayAtSchool";
import { FounderSpeaks, FounderSpeaksProps, BrollCutaway } from "./pipeline/FounderSpeaks";
import { CinematicAd, CinematicAdProps, CinematicSegment } from "./pipeline/CinematicAd";
import { CAMPAIGN } from "./brand";

const FPS = 25;
const DURATION_FRAMES = 15 * FPS;
const DURATION_30S = 30 * FPS;

// ─────────────────────────────────────────────────────────────
// EDIT SEGMENTS BELOW — these define your ad compositions
// ─────────────────────────────────────────────────────────────

const sampleSegments: MediaSegment[] = [
  {
    type: "image",
    src: "photos/placeholder_1.jpg",
    kenBurns: "zoom-in",
    text: "Your first message here",
  },
  {
    type: "video",
    src: "clips/sample_video.mp4",
    playbackRate: 0.85,
    text: "Your second message here",
  },
  {
    type: "image",
    src: "photos/placeholder_2.jpg",
    kenBurns: "pan-right",
    text: "Your third message here",
  },
  {
    type: "image",
    src: "photos/placeholder_3.jpg",
    kenBurns: "zoom-out",
    text: "Your fourth message here",
  },
];

// ─────────────────────────────────────────────────────────────
// REGISTRATION — add new Compositions here
// ─────────────────────────────────────────────────────────────

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="MyProject">
        <Composition
          id="myproject-square"
          component={AdVideoV2}
          durationInFrames={DURATION_FRAMES}
          fps={FPS}
          width={1080}
          height={1080}
          defaultProps={{
            segments: sampleSegments,
            musicSrc: "music/background.mp3",
            endCardCtaText: CAMPAIGN.ctaText,
          } satisfies AdVideoV2Props}
        />
        <Composition
          id="myproject-vertical"
          component={AdVideoV2}
          durationInFrames={DURATION_FRAMES}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{
            segments: sampleSegments,
            musicSrc: "music/background.mp3",
            endCardCtaText: CAMPAIGN.ctaText,
          } satisfies AdVideoV2Props}
        />
      </Folder>
    </>
  );
};

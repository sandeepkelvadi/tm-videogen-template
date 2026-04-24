export type KenBurnsDirection = "zoom-in" | "zoom-out" | "pan-left" | "pan-right";
export type KenBurnsFit = "cover" | "contain";

export type MediaSegment = {
  type: "video" | "image";
  src: string;
  verticalSrc?: string;
  text: string;
  playbackRate?: number;
  kenBurns?: KenBurnsDirection;
  fit?: KenBurnsFit;
};

export type DaySegment = {
  type: "video" | "image";
  src: string;
  verticalSrc?: string;
  time: string;
  activity: string;
  playbackRate?: number;
  kenBurns?: KenBurnsDirection;
  fit?: KenBurnsFit;
};

export type BrollCutaway = {
  src: string;
  verticalSrc?: string;
  type: "video" | "image";
  startSec: number;
  durationSec: number;
  kenBurns?: KenBurnsDirection;
  fit?: KenBurnsFit;
  playbackRate?: number;
  videoStartFrom?: number;
};

export type CinematicSegment = {
  type: "video" | "image";
  src: string;
  verticalSrc?: string;
  text?: string;
  playbackRate?: number;
  kenBurns?: KenBurnsDirection;
  fit?: KenBurnsFit;
};

export type MontageConfig = {
  transitionFrames: number;
  endCardFrames: number;
  logo: {
    position: "left" | "right";
    sizeVertical: number;
    sizeSquare: number;
    paddingVertical: string;
    paddingSquare: string;
  };
  musicVolume?: number;
};

export type AdVideoV2Props = {
  segments: MediaSegment[];
  musicSrc?: string;
  musicVolume?: number;
  endCardCtaText?: string;
  /**
   * Letterbox mode: force the landscape `src` (ignore `verticalSrc`) and
   * contain-fit the video on the canvas. On a 9:16 canvas the result is a
   * 16:9 clip centered with black bars above and below.
   */
  letterbox?: boolean;
};

export type DayAtSchoolProps = {
  segments: DaySegment[];
  musicSrc?: string;
  endCardCtaText?: string;
};

export type FounderSpeaksProps = {
  founderSrc: string;
  founderStartFrom?: number;
  founderName: string;
  founderRole: string;
  founderOffsetY?: number;
  founderAspect?: number;
  broll: BrollCutaway[];
  musicSrc?: string;
  musicVolume?: number;
  endCardCtaText?: string;
};

export type CinematicAdProps = {
  segments: CinematicSegment[];
  musicSrc?: string;
  endCardCtaText?: string;
};

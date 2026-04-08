export type KenBurnsDirection = "zoom-in" | "zoom-out" | "pan-left" | "pan-right";

export type MediaSegment = {
  type: "video" | "image";
  src: string;
  verticalSrc?: string;
  text: string;
  playbackRate?: number;
  kenBurns?: KenBurnsDirection;
};

export type DaySegment = {
  type: "video" | "image";
  src: string;
  verticalSrc?: string;
  time: string;
  activity: string;
  playbackRate?: number;
  kenBurns?: KenBurnsDirection;
};

export type BrollCutaway = {
  src: string;
  verticalSrc?: string;
  type: "video" | "image";
  startSec: number;
  durationSec: number;
  kenBurns?: KenBurnsDirection;
  playbackRate?: number;
};

export type CinematicSegment = {
  type: "video" | "image";
  src: string;
  verticalSrc?: string;
  text?: string;
  playbackRate?: number;
  kenBurns?: KenBurnsDirection;
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
  endCardCtaText?: string;
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

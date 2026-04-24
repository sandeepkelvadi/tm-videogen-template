import React from "react";
import {
  useVideoConfig,
  staticFile,
  Sequence,
  Img,
  interpolate,
} from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { EndCard } from "./EndCard";
import { MontageConfig } from "../types";

export type VideoMontageProps<T> = {
  segments: T[];
  renderScene: (
    segment: T,
    ctx: { isVertical: boolean; width: number; height: number }
  ) => React.ReactNode;
  musicSrc?: string;
  endCardCtaText?: string;
  config: MontageConfig;
};

export function VideoMontage<T>({
  segments,
  renderScene,
  musicSrc,
  endCardCtaText,
  config,
}: VideoMontageProps<T>) {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const isVertical = height > width;

  const { transitionFrames, endCardFrames, logo } = config;
  const peakVolume = config.musicVolume ?? 0.8;

  const numTransitions = segments.length;
  const totalTransitionFrames = numTransitions * transitionFrames;
  const totalSegFrames = durationInFrames + totalTransitionFrames;
  const contentSegFrames = totalSegFrames - endCardFrames;
  const perSegFrames = Math.round(contentSegFrames / segments.length);
  const contentEndFrame = durationInFrames - endCardFrames + transitionFrames;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <TransitionSeries>
        {segments.map((seg, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={perSegFrames}>
              {renderScene(seg, { isVertical, width, height })}
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition
              presentation={fade()}
              timing={linearTiming({ durationInFrames: transitionFrames })}
            />
          </React.Fragment>
        ))}
        <TransitionSeries.Sequence durationInFrames={endCardFrames}>
          <EndCard
            startSec={0}
            endSec={endCardFrames / fps}
            ctaText={endCardCtaText}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Sequence
        from={0}
        durationInFrames={contentEndFrame}
        layout="none"
        premountFor={fps}
      >
        <div
          style={{
            position: "absolute",
            top: isVertical ? logo.paddingVertical : logo.paddingSquare,
            ...(logo.position === "left"
              ? { left: "5%" }
              : { right: "5%" }),
            zIndex: 20,
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: 12,
            padding: isVertical ? "10px 18px" : "8px 14px",
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{
              height: isVertical ? logo.sizeVertical : logo.sizeSquare,
              objectFit: "contain",
            }}
          />
        </div>
      </Sequence>

      {musicSrc && (
        <Audio
          src={staticFile(musicSrc)}
          volume={(f) => {
            // Voiceover (peakVolume ≥ 1.0) gets a 2-frame in/out so closing
            // words aren't ducked; background music gets a 0.5s in / 1.5s out.
            const isVoiceover = peakVolume >= 1.0;
            const fadeInEnd = isVoiceover ? 2 : Math.round(0.5 * fps);
            const fadeOutLen = isVoiceover ? 2 : Math.round(1.5 * fps);
            const fadeOutStart = durationInFrames - fadeOutLen;
            return interpolate(
              f,
              [0, fadeInEnd, fadeOutStart, durationInFrames],
              [0, peakVolume, peakVolume, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }
            );
          }}
        />
      )}
    </div>
  );
}

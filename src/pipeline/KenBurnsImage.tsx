import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { KenBurnsDirection, KenBurnsFit } from "../types";

type KenBurnsImageProps = {
  src: string;
  direction: KenBurnsDirection;
  /**
   * "cover" (default) fills the canvas, cropping as needed — will upscale
   * if the source is smaller than the canvas. "contain" preserves the source
   * aspect, centers it on a blurred/darkened version of itself, and never
   * upscales past native. Use "contain" when a photo's resolution is lower
   * than the target canvas × Ken Burns zoom.
   */
  fit?: KenBurnsFit;
};

export const KenBurnsImage: React.FC<KenBurnsImageProps> = ({
  src,
  direction,
  fit = "cover",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let scale: number;
  let translateX: number;

  switch (direction) {
    case "zoom-in":
      scale = interpolate(progress, [0, 1], [1.0, 1.15]);
      translateX = 0;
      break;
    case "zoom-out":
      scale = interpolate(progress, [0, 1], [1.15, 1.0]);
      translateX = 0;
      break;
    case "pan-left":
      scale = 1.1;
      translateX = interpolate(progress, [0, 1], [2, -2]);
      break;
    case "pan-right":
      scale = 1.1;
      translateX = interpolate(progress, [0, 1], [-2, 2]);
      break;
  }

  if (fit === "contain") {
    // Native-aspect foreground centered on a blurred/darkened fill of the
    // same image — preserves source resolution and avoids upscaling
    // artifacts when the source is smaller than canvas × zoom.
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          backgroundColor: "#000",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(40px) brightness(0.5)",
            transform: "scale(1.1)",
          }}
        />
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `scale(${scale}) translate(${translateX}%, 0)`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${translateX}%, 0)`,
        }}
      />
    </div>
  );
};

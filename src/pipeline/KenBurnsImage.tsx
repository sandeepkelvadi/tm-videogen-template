import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { KenBurnsDirection } from "../types";

type KenBurnsImageProps = {
  src: string;
  direction: KenBurnsDirection;
};

export const KenBurnsImage: React.FC<KenBurnsImageProps> = ({
  src,
  direction,
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

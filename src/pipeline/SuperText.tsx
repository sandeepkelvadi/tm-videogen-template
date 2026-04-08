import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { ACCENT, WHITE, poppins } from "../brand";

type SuperTextProps = {
  text: string;
  fontSize: number;
};

export const SuperTextInline: React.FC<SuperTextProps> = ({
  text,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 10,
  });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 6, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = enterProgress * exitOpacity;
  const translateX = interpolate(enterProgress, [0, 1], [-12, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "12%",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        opacity,
        padding: "0 8%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          transform: `translateX(${translateX}px)`,
        }}
      >
        <div
          style={{
            width: 4,
            height: fontSize * 1.6,
            backgroundColor: ACCENT,
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontFamily: poppins,
            fontWeight: 600,
            fontSize,
            color: WHITE,
            lineHeight: 1.3,
            textShadow:
              "0 2px 12px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

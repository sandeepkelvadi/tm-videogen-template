import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  interpolate,
  spring,
} from "remotion";
import { Video } from "@remotion/media";
import { KenBurnsImage } from "./KenBurnsImage";
import { ACCENT, WHITE, poppins } from "../brand";
import { VideoMontage } from "./VideoMontage";
import { DaySegment, DayAtSchoolProps } from "../types";

const CONFIG = {
  transitionFrames: 8,
  endCardFrames: 100,
  logo: {
    position: "right" as const,
    sizeVertical: 36,
    sizeSquare: 30,
    paddingVertical: "4%",
    paddingSquare: "5%",
  },
};

const TimestampOverlay: React.FC<{
  time: string;
  activity: string;
  isVertical: boolean;
}> = ({ time, activity, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 140 },
    durationInFrames: 12,
  });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 6, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = enterProgress * exitOpacity;
  const translateY = interpolate(enterProgress, [0, 1], [20, 0]);

  const timeFontSize = isVertical ? 52 : 42;
  const activityFontSize = isVertical ? 28 : 22;

  return (
    <div
      style={{
        position: "absolute",
        top: isVertical ? "12%" : "14%",
        left: "8%",
        zIndex: 15,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 700,
          fontSize: timeFontSize,
          color: ACCENT,
          lineHeight: 1.1,
          fontStyle: "italic",
          textShadow:
            "0 2px 16px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)",
        }}
      >
        {time}
      </div>
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 600,
          fontSize: activityFontSize,
          color: WHITE,
          lineHeight: 1.3,
          marginTop: 4,
          textShadow:
            "0 2px 12px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)",
        }}
      >
        {activity}
      </div>
    </div>
  );
};

const DayScene: React.FC<{
  segment: DaySegment;
  isVertical: boolean;
  width: number;
  height: number;
}> = ({ segment, isVertical, width, height }) => {
  const effectiveSrc = isVertical && segment.verticalSrc
    ? segment.verticalSrc
    : segment.src;
  const sourceAspect = (isVertical && segment.verticalSrc) ? 9 / 16 : 16 / 9;
  const targetAspect = width / height;
  let videoWidth: number;
  let videoHeight: number;
  if (targetAspect > sourceAspect) {
    videoWidth = width;
    videoHeight = width / sourceAspect;
  } else {
    videoHeight = height;
    videoWidth = height * sourceAspect;
  }

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
      {segment.type === "video" ? (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: videoWidth,
            height: videoHeight,
          }}
        >
          <Video
            src={staticFile(effectiveSrc)}
            muted
            playbackRate={segment.playbackRate ?? 1.0}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      ) : (
        <KenBurnsImage
          src={effectiveSrc}
          direction={segment.kenBurns ?? "zoom-in"}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "35%",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
        }}
      />

      <TimestampOverlay
        time={segment.time}
        activity={segment.activity}
        isVertical={isVertical}
      />
    </div>
  );
};

export const DayAtSchool: React.FC<DayAtSchoolProps> = ({
  segments,
  musicSrc,
  endCardCtaText,
}) => {
  return (
    <VideoMontage
      segments={segments}
      renderScene={(seg, ctx) => (
        <DayScene
          segment={seg}
          isVertical={ctx.isVertical}
          width={ctx.width}
          height={ctx.height}
        />
      )}
      musicSrc={musicSrc}
      endCardCtaText={endCardCtaText}
      config={CONFIG}
    />
  );
};

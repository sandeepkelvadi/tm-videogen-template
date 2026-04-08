import React from "react";
import {
  useVideoConfig,
  useCurrentFrame,
  staticFile,
  spring,
  interpolate,
} from "remotion";
import { Video } from "@remotion/media";
import { KenBurnsImage } from "./KenBurnsImage";
import { VideoMontage } from "./VideoMontage";
import { WHITE, poppins } from "../brand";
import { CinematicSegment, CinematicAdProps } from "../types";

const CONFIG = {
  transitionFrames: 25,
  endCardFrames: 100,
  logo: {
    position: "right" as const,
    sizeVertical: 36,
    sizeSquare: 30,
    paddingVertical: "5%",
    paddingSquare: "6%",
  },
  musicVolume: 0.5,
};

const CinematicScene: React.FC<{
  segment: CinematicSegment;
  isVertical: boolean;
  width: number;
  height: number;
}> = ({ segment, isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fontSize = isVertical ? 32 : 28;
  const hasText = !!segment.text;

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

  const textEntry = spring({
    frame: frame - 8,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const textSlide = interpolate(textEntry, [0, 1], [10, 0]);

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
            playbackRate={segment.playbackRate ?? 0.85}
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
          height: "20%",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 100%)",
        }}
      />

      {hasText && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "35%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)",
          }}
        />
      )}

      {hasText && (
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? "10%" : "9%",
            left: isVertical ? "8%" : "6%",
            right: "12%",
            opacity: textEntry,
            transform: `translateY(${textSlide}px)`,
            fontFamily: poppins,
            fontWeight: 400,
            fontSize,
            color: WHITE,
            textShadow:
              "0 2px 16px rgba(0,0,0,0.6), 0 1px 6px rgba(0,0,0,0.4)",
            lineHeight: 1.3,
          }}
        >
          {segment.text}
        </div>
      )}
    </div>
  );
};

export const CinematicAd: React.FC<CinematicAdProps> = ({
  segments,
  musicSrc,
  endCardCtaText,
}) => {
  return (
    <VideoMontage
      segments={segments}
      renderScene={(seg, ctx) => (
        <CinematicScene
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

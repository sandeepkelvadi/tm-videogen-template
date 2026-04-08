import React from "react";
import { staticFile } from "remotion";
import { Video } from "@remotion/media";
import { KenBurnsImage } from "./KenBurnsImage";
import { SuperTextInline } from "./SuperText";
import { VideoMontage, VideoMontageProps } from "./VideoMontage";
import { MediaSegment, AdVideoV2Props } from "../types";

const CONFIG = {
  transitionFrames: 10,
  endCardFrames: 75,
  logo: {
    position: "left" as const,
    sizeVertical: 44,
    sizeSquare: 36,
    paddingVertical: "5%",
    paddingSquare: "6%",
  },
};

const MediaScene: React.FC<{
  segment: MediaSegment;
  isVertical: boolean;
  width: number;
  height: number;
}> = ({ segment, isVertical, width, height }) => {
  const fontSize = isVertical ? 44 : 38;

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
          height: "25%",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "45%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
        }}
      />

      <SuperTextInline text={segment.text} fontSize={fontSize} />
    </div>
  );
};

export const AdVideoV2: React.FC<AdVideoV2Props> = ({
  segments,
  musicSrc,
  endCardCtaText,
}) => {
  return (
    <VideoMontage
      segments={segments}
      renderScene={(seg, ctx) => (
        <MediaScene
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

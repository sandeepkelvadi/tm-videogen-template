import React from "react";
import {
  AbsoluteFill,
  useVideoConfig,
  staticFile,
  Sequence,
  Img,
  interpolate,
  useCurrentFrame,
  spring,
} from "remotion";
import { Audio } from "@remotion/media";
import { Video } from "@remotion/media";
import { EndCard } from "./EndCard";
import { KenBurnsImage } from "./KenBurnsImage";
import { ACCENT, WHITE, poppins } from "../brand";
import { BrollCutaway, FounderSpeaksProps } from "../types";

export const FounderSpeaks: React.FC<FounderSpeaksProps> = ({
  founderSrc,
  founderStartFrom = 0,
  founderName,
  founderRole,
  founderOffsetY = 0,
  founderAspect,
  broll,
  musicSrc,
  musicVolume = 0.15,
  endCardCtaText,
}) => {
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const isVertical = height > width;

  const endCardFrames = 75;
  const contentEndFrame = durationInFrames - endCardFrames;
  const fadeFrames = 8;

  const effectiveAspect = founderAspect ?? 9 / 16;
  const targetAspect = width / height;
  let founderW: number, founderH: number;
  if (targetAspect > effectiveAspect) {
    founderW = width;
    founderH = width / effectiveAspect;
  } else {
    founderH = height;
    founderW = height * effectiveAspect;
  }

  const computeBrollCover = (aspect: number) => {
    let w: number, h: number;
    if (targetAspect > aspect) { w = width; h = width / aspect; }
    else { h = height; w = height * aspect; }
    return { w, h };
  };

  const founderVolume = (f: number) => {
    const fadeOut = contentEndFrame - Math.round(0.5 * fps);
    return interpolate(f, [0, fadeOut, contentEndFrame], [1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  const ltEntry = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const ltFade = interpolate(frame, [120, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ltOpacity = frame < 120 ? ltEntry : ltFade;
  const ltSlide = interpolate(ltEntry, [0, 1], [-20, 0]);

  const nameFontSize = isVertical ? 28 : 22;
  const roleFontSize = isVertical ? 18 : 14;

  const coverStyle = (
    w: number,
    h: number,
    offsetY = 0
  ): React.CSSProperties => ({
    position: "absolute",
    top: `calc(50% + ${offsetY}%)`,
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: w,
    height: h,
  });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={0} durationInFrames={contentEndFrame} layout="none">
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Video
            src={staticFile(founderSrc)}
            startFrom={Math.round(founderStartFrom * fps)}
            volume={founderVolume}
            style={coverStyle(founderW, founderH, founderOffsetY)}
          />
        </AbsoluteFill>
      </Sequence>

      {broll.map((b, i) => {
        const sf = Math.round(b.startSec * fps);
        const df = Math.round(b.durationSec * fps);

        const opacity = interpolate(
          frame,
          [sf, sf + fadeFrames, sf + df - fadeFrames, sf + df],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        if (opacity < 0.01) return null;

        const bSrc = isVertical && b.verticalSrc ? b.verticalSrc : b.src;
        const bAspect = (isVertical && b.verticalSrc) ? 9 / 16 : 16 / 9;
        const { w: bW, h: bH } = computeBrollCover(bAspect);

        return (
          <Sequence key={i} from={sf} durationInFrames={df} layout="none">
            <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
              {b.type === "video" ? (
                <Video
                  src={staticFile(bSrc)}
                  muted
                  playbackRate={b.playbackRate ?? 0.85}
                  style={coverStyle(bW, bH)}
                />
              ) : (
                <KenBurnsImage
                  src={bSrc}
                  direction={b.kenBurns ?? "zoom-in"}
                />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {frame < 160 && (
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? "14%" : "12%",
            left: isVertical ? "8%" : "6%",
            opacity: ltOpacity,
            transform: `translateX(${ltSlide}px)`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 15,
          }}
        >
          <div
            style={{
              width: 4,
              height: nameFontSize * 2.2,
              backgroundColor: ACCENT,
              borderRadius: 2,
            }}
          />
          <div>
            <div
              style={{
                fontFamily: poppins,
                fontWeight: 700,
                fontSize: nameFontSize,
                color: WHITE,
                textShadow:
                  "0 2px 12px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)",
                lineHeight: 1.2,
              }}
            >
              {founderName}
            </div>
            <div
              style={{
                fontFamily: poppins,
                fontWeight: 400,
                fontSize: roleFontSize,
                color: ACCENT,
                textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                lineHeight: 1.3,
                marginTop: 2,
              }}
            >
              {founderRole}
            </div>
          </div>
        </div>
      )}

      {frame < contentEndFrame && (
        <div
          style={{
            position: "absolute",
            top: isVertical ? "5%" : "6%",
            right: "5%",
            zIndex: 20,
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: 12,
            padding: isVertical ? "10px 18px" : "8px 14px",
            opacity: interpolate(
              frame,
              [contentEndFrame - 15, contentEndFrame],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{ height: isVertical ? 36 : 30, objectFit: "contain" }}
          />
        </div>
      )}

      <Sequence from={contentEndFrame} durationInFrames={endCardFrames}>
        <EndCard
          startSec={0}
          endSec={endCardFrames / fps}
          ctaText={endCardCtaText}
        />
      </Sequence>

      {musicSrc && (
        <Audio
          src={staticFile(musicSrc)}
          volume={(f) => {
            const fadeInEnd = Math.round(0.5 * fps);
            const fadeOutStart = durationInFrames - Math.round(1.5 * fps);
            return interpolate(
              f,
              [0, fadeInEnd, fadeOutStart, durationInFrames],
              [0, musicVolume, musicVolume, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
          }}
        />
      )}
    </AbsoluteFill>
  );
};

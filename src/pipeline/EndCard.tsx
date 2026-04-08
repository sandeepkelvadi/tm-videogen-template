import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  staticFile,
  Sequence,
} from "remotion";
import { PRIMARY, ACCENT, WHITE, poppins } from "../brand";
import { WhatsAppIcon } from "./WhatsAppIcon";

type EndCardProps = {
  startSec: number;
  endSec: number;
  ctaText?: string;
  headline?: string;
  year?: string;
  location?: string;
  url?: string;
};

type EndCardInnerProps = {
  ctaText: string;
  headline: string;
  year: string;
  location: string;
  url: string;
};

const EndCardInner: React.FC<EndCardInnerProps> = ({
  ctaText,
  headline,
  year,
  location,
  url,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 12,
  });

  const headlineProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 12,
    delay: 4,
  });

  const ctaProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
    durationInFrames: 15,
    delay: 8,
  });

  const urlProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 10,
    delay: 12,
  });

  const logoSize = isVertical ? 120 : 90;
  const headlineFontSize = isVertical ? 56 : 48;
  const subFontSize = isVertical ? 28 : 24;
  const ctaFontSize = isVertical ? 26 : 22;
  const urlFontSize = isVertical ? 22 : 18;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: PRIMARY,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isVertical ? 40 : 28,
        padding: isVertical ? "120px 60px" : "60px 80px",
      }}
    >
      <div
        style={{
          opacity: logoScale,
          transform: `scale(${interpolate(logoScale, [0, 1], [0.8, 1])})`,
          backgroundColor: WHITE,
          borderRadius: 20,
          padding: isVertical ? "20px 36px" : "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile("logo.png")}
          style={{
            height: logoSize,
            objectFit: "contain",
          }}
        />
      </div>

      <div
        style={{
          opacity: headlineProgress,
          transform: `translateY(${interpolate(headlineProgress, [0, 1], [15, 0])}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: poppins,
            fontWeight: 700,
            fontSize: headlineFontSize,
            color: ACCENT,
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontFamily: poppins,
            fontWeight: 700,
            fontSize: headlineFontSize * 0.85,
            color: ACCENT,
            lineHeight: 1.2,
          }}
        >
          {year}
        </div>
        <div
          style={{
            fontFamily: poppins,
            fontWeight: 400,
            fontSize: subFontSize,
            color: WHITE,
            marginTop: 16,
            opacity: 0.9,
          }}
        >
          {location}
        </div>
      </div>

      <div
        style={{
          opacity: ctaProgress,
          transform: `scale(${interpolate(ctaProgress, [0, 1], [0.85, 1])})`,
        }}
      >
        <div
          style={{
            backgroundColor: ACCENT,
            borderRadius: 50,
            padding: isVertical ? "18px 40px" : "14px 32px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <WhatsAppIcon size={ctaFontSize + 4} color={PRIMARY} />
          <span
            style={{
              fontFamily: poppins,
              fontWeight: 700,
              fontSize: ctaFontSize,
              color: PRIMARY,
            }}
          >
            {ctaText}
          </span>
        </div>
      </div>

      <div
        style={{
          opacity: urlProgress,
          transform: `translateY(${interpolate(urlProgress, [0, 1], [10, 0])}px)`,
        }}
      >
        <span
          style={{
            fontFamily: poppins,
            fontWeight: 400,
            fontSize: urlFontSize,
            color: WHITE,
            opacity: 0.75,
          }}
        >
          {url}
        </span>
      </div>
    </div>
  );
};

export const EndCard: React.FC<EndCardProps> = ({
  startSec,
  endSec,
  ctaText = "Message us on WhatsApp",
  headline = "Admissions Open",
  year = "2026-27",
  location = "Your City",
  url = "example.com",
}) => {
  const { fps } = useVideoConfig();
  const startFrame = Math.round(startSec * fps);
  const durationFrames = Math.round((endSec - startSec) * fps);

  return (
    <Sequence
      from={startFrame}
      durationInFrames={durationFrames}
      premountFor={Math.round(0.5 * fps)}
    >
      <EndCardInner
        ctaText={ctaText}
        headline={headline}
        year={year}
        location={location}
        url={url}
      />
    </Sequence>
  );
};

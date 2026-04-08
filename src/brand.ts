import { loadFont } from "@remotion/google-fonts/Poppins";
import brandConfig from "../config/brand.json";
import campaignConfig from "../config/campaign.json";

export const PRIMARY = brandConfig.primaryColor;
export const ACCENT = brandConfig.accentColor;
export const WHITE = brandConfig.textColor;
export const BLACK = brandConfig.backgroundColor;

export const CAMPAIGN = {
  headline: campaignConfig.headline,
  year: campaignConfig.year,
  location: campaignConfig.location,
  url: campaignConfig.url,
  ctaText: campaignConfig.ctaText,
} as const;

export const { fontFamily: poppins } = loadFont("normal", {
  weights: brandConfig.fontWeights as ("400" | "600" | "700")[],
  subsets: ["latin"],
});

export const LOGO_PATH = brandConfig.logoPath;
export const WEBSITE_URL = brandConfig.websiteUrl;

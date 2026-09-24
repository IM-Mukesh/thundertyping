import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/constants";
import { ogImageElement } from "@/lib/seo/og-image";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    ogImageElement({
      title: "HeroTyping",
      subtitle: SITE_TAGLINE,
      tags: ["Time", "Words", "Quote", "Custom"],
    }),
    { ...size },
  );
}

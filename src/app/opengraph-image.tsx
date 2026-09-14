import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/constants";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0d",
          color: "#e4e4e7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>
          <span style={{ color: "#facc15" }}>Thunder</span>
          <span>Typing</span>
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#8b8b90" }}>{SITE_TAGLINE}</div>
        <div style={{ display: "flex", marginTop: 48, gap: 48, fontSize: 24, color: "#4ade80" }}>
          <span>Time</span>
          <span>Words</span>
          <span>Quote</span>
          <span>Custom</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

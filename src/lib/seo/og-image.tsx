import { SITE_NAME } from "@/lib/seo/constants";

/**
 * Shared layout for every generated OG image (root + per-route). Kept as one
 * function so the root, game, and lesson opengraph-image.tsx files can't
 * visually drift from each other — same wordmark treatment, same spacing,
 * just a different eyebrow/subtitle/tags per route.
 */
export function ogImageElement({
  eyebrow,
  title,
  subtitle,
  tags,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  tags?: string[];
}) {
  return (
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
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      {eyebrow && (
        <div style={{ display: "flex", fontSize: 26, color: "#facc15", letterSpacing: 4, marginBottom: 20 }}>
          {eyebrow.toUpperCase()}
        </div>
      )}
      <div style={{ display: "flex", fontSize: title.length > 22 ? 64 : 84, fontWeight: 700, letterSpacing: -2 }}>
        {title}
      </div>
      <div style={{ display: "flex", marginTop: 24, fontSize: 30, color: "#8b8b90", maxWidth: 900 }}>{subtitle}</div>
      {tags && tags.length > 0 && (
        <div style={{ display: "flex", marginTop: 44, gap: 40, fontSize: 22, color: "#4ade80" }}>
          {tags.map((tag) => (
            <span key={tag} style={{ display: "flex" }}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", marginTop: 56, fontSize: 22, color: "#facc15", fontWeight: 700 }}>
        {SITE_NAME}
      </div>
    </div>
  );
}

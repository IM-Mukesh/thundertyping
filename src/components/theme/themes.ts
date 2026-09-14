export const THEMES = [
  { id: "dark", label: "Dark", swatch: { background: "#1a1a1e", accent: "#facc15" } },
  { id: "light", label: "Light", swatch: { background: "#fafaf8", accent: "#ca8a04" } },
  { id: "midnight", label: "Midnight", swatch: { background: "#12141c", accent: "#7dd3fc" } },
  { id: "forest", label: "Forest", swatch: { background: "#141a16", accent: "#4ade80" } },
  { id: "sunset", label: "Sunset", swatch: { background: "#1c1614", accent: "#fb923c" } },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "dark";

// `swatch` is only the little preview dot in the theme picker — it duplicates
// each theme's --background/--accent from globals.css because CSS variables
// for a theme that isn't currently applied can't be read from the DOM.
// That makes drift possible: these went stale once when the Dark theme was
// re-palettized to MonkeyType's Serika Dark and the swatch kept showing the
// old colors. If you change a theme's --background or --accent in
// globals.css, change its swatch here in the same edit.
export const THEMES = [
  { id: "dark", label: "Dark", swatch: { background: "#323437", accent: "#e2b714" } },
  { id: "light", label: "Light", swatch: { background: "#fafaf8", accent: "#ca8a04" } },
  { id: "midnight", label: "Midnight", swatch: { background: "#12141c", accent: "#7dd3fc" } },
  { id: "forest", label: "Forest", swatch: { background: "#141a16", accent: "#4ade80" } },
  { id: "sunset", label: "Sunset", swatch: { background: "#1c1614", accent: "#fb923c" } },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "dark";

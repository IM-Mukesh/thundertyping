export const THEMES = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "dark";

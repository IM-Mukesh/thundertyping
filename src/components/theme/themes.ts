// ==============================================================================
// HeroTyping — Premium Theme Collection Registry
// Retains all 5 original themes (dark, light, midnight, forest, sunset)
// and adds 8 futuristic, high-contrast, accessible themes.
// Each theme defines multi-color swatch palettes for rich preview miniatures.
// ==============================================================================

export interface ThemeSwatch {
  readonly background: string;
  readonly surface: string;
  readonly accent: string;
  readonly text: string;
  readonly secondary?: string;
}

export interface ThemeDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly category: "Heritage" | "Cyberpunk" | "Atmospheric" | "Minimal";
  readonly swatch: ThemeSwatch;
}

export const THEMES = [
  // --- 1 to 5: Original Heritage Themes (Preserved 100%) ---
  {
    id: "dark",
    label: "Dark",
    description: "Classic HeroTyping charcoal with signature gold accent",
    category: "Heritage",
    swatch: {
      background: "#323437",
      surface: "#2c2e31",
      accent: "#e2b714",
      text: "#d1d0c5",
    },
  },
  {
    id: "light",
    label: "Light",
    description: "Crisp, clean daylight surfaces with amber focus",
    category: "Heritage",
    swatch: {
      background: "#fafaf8",
      surface: "#ececea",
      accent: "#a16207",
      text: "#17171a",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep oceanic slate with soft sky-blue lighting",
    category: "Heritage",
    swatch: {
      background: "#12141c",
      surface: "#1c1f2b",
      accent: "#7dd3fc",
      text: "#e2e5f1",
    },
  },
  {
    id: "forest",
    label: "Forest",
    description: "Earthy deep canopy with vibrant emerald highlights",
    category: "Heritage",
    swatch: {
      background: "#141a16",
      surface: "#1d251f",
      accent: "#4ade80",
      text: "#e3ece6",
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    description: "Warm twilight dusk with radiant burnt-orange glow",
    category: "Heritage",
    swatch: {
      background: "#1c1614",
      surface: "#261e1b",
      accent: "#fb923c",
      text: "#f0e6e0",
    },
  },

  // --- 6 to 13: New Futuristic Themes ---
  {
    id: "cyber-neon",
    label: "Cyber Neon",
    description: "Electric cyan highlights over deep midnight cyber surfaces",
    category: "Cyberpunk",
    swatch: {
      background: "#080c14",
      surface: "#101726",
      accent: "#00f0ff",
      text: "#e2e8f0",
      secondary: "#ff007f",
    },
  },
  {
    id: "aurora",
    label: "Aurora",
    description: "Boreal deep-teal atmosphere with iridescent violet accents",
    category: "Atmospheric",
    swatch: {
      background: "#0b1518",
      surface: "#122226",
      accent: "#2dd4bf",
      text: "#e0f2fe",
      secondary: "#a78bfa",
    },
  },
  {
    id: "synthwave",
    label: "Synthwave",
    description: "Retro-futuristic night purple with neon magenta highlights",
    category: "Cyberpunk",
    swatch: {
      background: "#150d24",
      surface: "#201438",
      accent: "#ff2a85",
      text: "#f5e8ff",
      secondary: "#00f2fe",
    },
  },
  {
    id: "arctic",
    label: "Arctic Glass",
    description: "Cool frosted slate with glacial crystalline blue details",
    category: "Atmospheric",
    swatch: {
      background: "#0a101d",
      surface: "#131d31",
      accent: "#38bdf8",
      text: "#e2e8f0",
      secondary: "#818cf8",
    },
  },
  {
    id: "matrix",
    label: "Emerald Matrix",
    description: "High-contrast technical terminal with surgical emerald flow",
    category: "Cyberpunk",
    swatch: {
      background: "#040b06",
      surface: "#0a170d",
      accent: "#10b981",
      text: "#d1fae5",
      secondary: "#34d399",
    },
  },
  {
    id: "oled",
    label: "OLED Midnight",
    description: "Pure pitch-black negative space with ultra-high contrast",
    category: "Minimal",
    swatch: {
      background: "#000000",
      surface: "#0f0f10",
      accent: "#f3f4f6",
      text: "#e5e7eb",
      secondary: "#e2b714",
    },
  },
  {
    id: "cosmic",
    label: "Cosmic Violet",
    description: "Deep celestial indigo with soft lavender and starlight",
    category: "Atmospheric",
    swatch: {
      background: "#0b0816",
      surface: "#15102a",
      accent: "#8b5cf6",
      text: "#ede9fe",
      secondary: "#c084fc",
    },
  },
  {
    id: "solar",
    label: "Solar Flare",
    description: "Refined dark charcoal with blazing radiant amber and gold",
    category: "Heritage",
    swatch: {
      background: "#14110e",
      surface: "#211b15",
      accent: "#f59e0b",
      text: "#fef3c7",
      secondary: "#fbbf24",
    },
  },

  // --- 14 to 20: 7 New Iconic World-Class Community Themes ---
  {
    id: "tokyo-night",
    label: "Tokyo Night",
    description: "Electric neo-Tokyo dusk with electric sapphire, indigo, and soft purple",
    category: "Cyberpunk",
    swatch: {
      background: "#1a1b26",
      surface: "#24283b",
      accent: "#7aa2f7",
      text: "#c0caf5",
      secondary: "#bb9af7",
    },
  },
  {
    id: "nord",
    label: "Nordic Frost",
    description: "Iconic Arctic frost palette with cool polar slate and aurora cyan",
    category: "Atmospheric",
    swatch: {
      background: "#242933",
      surface: "#2e3440",
      accent: "#88c0d0",
      text: "#eceff4",
      secondary: "#81a1c1",
    },
  },
  {
    id: "dracula",
    label: "Dracula",
    description: "Legendary gothic aesthetic with vivid lavender, hot pink, and neon green",
    category: "Cyberpunk",
    swatch: {
      background: "#1e1f29",
      surface: "#282a36",
      accent: "#bd93f9",
      text: "#f8f8f2",
      secondary: "#ff79c6",
    },
  },
  {
    id: "catppuccin",
    label: "Catppuccin",
    description: "Warm soothing pastel palette with velvety mocha and mauve accents",
    category: "Atmospheric",
    swatch: {
      background: "#181825",
      surface: "#1e1e2e",
      accent: "#cba6f7",
      text: "#cdd6f4",
      secondary: "#fab387",
    },
  },
  {
    id: "rose-pine",
    label: "Rosé Pine",
    description: "Alluring dark rosewood dusk with delicate blush and seafoam highlights",
    category: "Atmospheric",
    swatch: {
      background: "#191724",
      surface: "#1f1d2e",
      accent: "#eb6f92",
      text: "#e0def4",
      secondary: "#9ccfd8",
    },
  },
  {
    id: "gruvbox",
    label: "Gruvbox Dark",
    description: "Warm retro groove palette with deep umber and golden honey tones",
    category: "Heritage",
    swatch: {
      background: "#1d2021",
      surface: "#282828",
      accent: "#fabd2f",
      text: "#ebdbb2",
      secondary: "#fe8019",
    },
  },
  {
    id: "crimson",
    label: "Crimson Abyss",
    description: "Stealth obsidian black with striking racing ruby and crimson glow",
    category: "Minimal",
    swatch: {
      background: "#0c0608",
      surface: "#140b0e",
      accent: "#ff2d55",
      text: "#f5e6e8",
      secondary: "#ff6b81",
    },
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "dark";

export const THEME_CATEGORIES = ["All", "Heritage", "Cyberpunk", "Atmospheric", "Minimal"] as const;
export type ThemeCategory = (typeof THEME_CATEGORIES)[number];

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_THEME, THEMES, type ThemeId } from "@/components/theme/themes";
import {
  WORD_COUNTS,
  QUOTE_LENGTHS,
  MIN_CUSTOM_TIME_DURATION,
  MAX_CUSTOM_TIME_DURATION,
  type TestMode,
  type TimeDuration,
  type WordCountOption,
  type QuoteLength,
} from "@/lib/typing-engine/engine-types";

interface SettingsState {
  theme: ThemeId;
  mode: TestMode;
  timeDuration: TimeDuration;
  wordCount: WordCountOption;
  quoteLength: QuoteLength;
  punctuation: boolean;
  numbers: boolean;
  soundEnabled: boolean;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: TestMode) => void;
  setTimeDuration: (duration: TimeDuration) => void;
  setWordCount: (count: WordCountOption) => void;
  setQuoteLength: (length: QuoteLength) => void;
  togglePunctuation: () => void;
  toggleNumbers: () => void;
  toggleSound: () => void;
}

const THEME_IDS: ThemeId[] = THEMES.map((t) => t.id);
// "custom" is deliberately excluded — its content (customText) lives in
// component state, not this persisted store, so restoring "custom" as the
// mode on a fresh page load would leave the engine with no text to build a
// test from. Treat a persisted "custom" as if it were never set.
const RESTORABLE_MODES: TestMode[] = ["time", "words", "quote"];

type PersistedSettings = Pick<
  SettingsState,
  "theme" | "mode" | "timeDuration" | "wordCount" | "quoteLength" | "punctuation" | "numbers" | "soundEnabled"
>;

function isValidTimeDuration(value: unknown): value is TimeDuration {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_CUSTOM_TIME_DURATION &&
    value <= MAX_CUSTOM_TIME_DURATION
  );
}

// Defends against corrupted/edited/stale-schema localStorage content: every
// field is validated against its allowed values and falls back to the fresh
// store's default rather than trusting whatever JSON.parse handed back.
function sanitizePersistedSettings(persisted: unknown, fallback: PersistedSettings): PersistedSettings {
  const p = (typeof persisted === "object" && persisted !== null ? persisted : {}) as Partial<PersistedSettings>;

  return {
    theme: THEME_IDS.includes(p.theme as ThemeId) ? (p.theme as ThemeId) : fallback.theme,
    mode: RESTORABLE_MODES.includes(p.mode as TestMode) ? (p.mode as TestMode) : fallback.mode,
    timeDuration: isValidTimeDuration(p.timeDuration) ? p.timeDuration : fallback.timeDuration,
    wordCount: WORD_COUNTS.includes(p.wordCount as WordCountOption) ? (p.wordCount as WordCountOption) : fallback.wordCount,
    quoteLength: QUOTE_LENGTHS.includes(p.quoteLength as QuoteLength) ? (p.quoteLength as QuoteLength) : fallback.quoteLength,
    punctuation: typeof p.punctuation === "boolean" ? p.punctuation : fallback.punctuation,
    numbers: typeof p.numbers === "boolean" ? p.numbers : fallback.numbers,
    soundEnabled: typeof p.soundEnabled === "boolean" ? p.soundEnabled : fallback.soundEnabled,
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      mode: "time",
      timeDuration: 30,
      wordCount: 25,
      quoteLength: "medium",
      punctuation: false,
      numbers: false,
      // On by default for the games, which feel inert without it. Nothing can
      // actually sound until the player clicks Start (browsers gate audio
      // behind a gesture), so this never autoplays at someone, and the games
      // HUD carries a mute toggle. The typing test itself stays silent — it
      // has no sounds wired up.
      soundEnabled: true,
      setTheme: (theme) => set({ theme }),
      setMode: (mode) => set({ mode }),
      setTimeDuration: (timeDuration) => set({ timeDuration }),
      setWordCount: (wordCount) => set({ wordCount }),
      setQuoteLength: (quoteLength) => set({ quoteLength }),
      togglePunctuation: () => set((s) => ({ punctuation: !s.punctuation })),
      toggleNumbers: () => set((s) => ({ numbers: !s.numbers })),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    {
      name: "thundertyping-settings",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedSettings(persistedState, currentState),
      }),
    },
  ),
);

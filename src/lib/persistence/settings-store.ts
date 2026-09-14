import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_THEME, type ThemeId } from "@/components/theme/themes";

export type TestMode = "time" | "words" | "quote" | "custom";
export type TimeDuration = 15 | 30 | 60 | 120;
export type WordCount = 10 | 25 | 50 | 100;
export type QuoteLength = "short" | "medium" | "long";

interface SettingsState {
  theme: ThemeId;
  mode: TestMode;
  timeDuration: TimeDuration;
  wordCount: WordCount;
  quoteLength: QuoteLength;
  punctuation: boolean;
  numbers: boolean;
  soundEnabled: boolean;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: TestMode) => void;
  setTimeDuration: (duration: TimeDuration) => void;
  setWordCount: (count: WordCount) => void;
  setQuoteLength: (length: QuoteLength) => void;
  togglePunctuation: () => void;
  toggleNumbers: () => void;
  toggleSound: () => void;
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
      soundEnabled: false,
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
    },
  ),
);

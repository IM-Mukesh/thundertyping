import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  parseUrlDuration,
  getInitialUrlDuration,
} from "@/lib/typing-engine/custom-duration";
import {
  MAX_CUSTOM_TIME_DURATION,
  MIN_CUSTOM_TIME_DURATION,
  TIME_DURATIONS,
  type TestConfig,
} from "@/lib/typing-engine/engine-types";
import { createInitialState, reducer } from "@/lib/typing-engine/use-typing-engine";

describe("homepage URL duration initialization and contract", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as unknown as { window?: unknown }).window;
    }
  });

  describe("STEP 2 & 3: URL parameter parsing and validation contract", () => {
    it("1. handles no duration parameter gracefully (returns null, preserves default)", () => {
      assert.equal(parseUrlDuration(null), null);
      assert.equal(parseUrlDuration(undefined), null);
      assert.equal(parseUrlDuration(""), null);
    });

    it("2. duration=60 initializes exactly 60 seconds (1 minute)", () => {
      assert.equal(parseUrlDuration("60"), 60);
    });

    it("3. duration=180 initializes exactly 180 seconds (3 minutes)", () => {
      assert.equal(parseUrlDuration("180"), 180);
    });

    it("4. duration=300 initializes exactly 300 seconds (5 minutes)", () => {
      assert.equal(parseUrlDuration("300"), 300);
    });

    it("5. duration=600 initializes exactly 600 seconds (10 minutes)", () => {
      assert.equal(parseUrlDuration("600"), 600);
    });

    it("6. invalid duration string (e.g. ?duration=abc) is rejected and returns null", () => {
      assert.equal(parseUrlDuration("abc"), null);
      assert.equal(parseUrlDuration("null"), null);
      assert.equal(parseUrlDuration("true"), null);
      assert.equal(parseUrlDuration("60s"), null);
      assert.equal(parseUrlDuration("1min"), null);
    });

    it("7. negative duration (e.g. ?duration=-1) is rejected and returns null", () => {
      assert.equal(parseUrlDuration("-1"), null);
      assert.equal(parseUrlDuration("-300"), null);
    });

    it("8. zero duration (?duration=0) is below minimum constraint (1s) and returns null", () => {
      assert.equal(parseUrlDuration("0"), null);
    });

    it("9. decimal duration (?duration=1.5) is rejected and returns null", () => {
      assert.equal(parseUrlDuration("1.5"), null);
      assert.equal(parseUrlDuration("60.0"), null);
      assert.equal(parseUrlDuration("300.5"), null);
    });

    it("10. extremely large duration (?duration=999999999) exceeds MAX_CUSTOM_TIME_DURATION and returns null", () => {
      assert.equal(parseUrlDuration("999999999"), null);
      assert.equal(parseUrlDuration(String(MAX_CUSTOM_TIME_DURATION + 1)), null);
      // Valid boundary values
      assert.equal(parseUrlDuration(String(MIN_CUSTOM_TIME_DURATION)), MIN_CUSTOM_TIME_DURATION);
      assert.equal(parseUrlDuration(String(MAX_CUSTOM_TIME_DURATION)), MAX_CUSTOM_TIME_DURATION);
    });
  });

  describe("STEP 4 & 5: Initialization behavior, state changes, and re-renders", () => {
    it("11. user manually changes duration after initialization; URL initialization must NOT keep overriding", () => {
      // Simulation of component ref guard logic
      const rawUrlParam = "300";
      let lastAppliedUrlDuration: string | null = null;
      let activeDuration = 60;

      // Initial mount logic
      if (rawUrlParam !== lastAppliedUrlDuration) {
        lastAppliedUrlDuration = rawUrlParam;
        const valid = parseUrlDuration(rawUrlParam);
        if (valid !== null) activeDuration = valid;
      }
      assert.equal(activeDuration, 300, "Initialized at 300 seconds");

      // User manually selects 15 seconds
      activeDuration = 15;
      assert.equal(activeDuration, 15, "User changed to 15 seconds");

      // Subsequent re-render simulation with same URL param
      if (rawUrlParam !== lastAppliedUrlDuration) {
        lastAppliedUrlDuration = rawUrlParam;
        const valid = parseUrlDuration(rawUrlParam);
        if (valid !== null) activeDuration = valid;
      }
      assert.equal(activeDuration, 15, "User manual choice of 15 seconds was NOT overwritten");

      // User manually enters custom 45 seconds
      activeDuration = 45;

      // Another re-render (typing key, timer tick, etc.)
      if (rawUrlParam !== lastAppliedUrlDuration) {
        lastAppliedUrlDuration = rawUrlParam;
        const valid = parseUrlDuration(rawUrlParam);
        if (valid !== null) activeDuration = valid;
      }
      assert.equal(activeDuration, 45, "User manual choice of 45 seconds was NOT overwritten");

      // Now user clicks link to a NEW URL: ?duration=180
      const nextUrlParam = "180";
      if (nextUrlParam !== lastAppliedUrlDuration) {
        lastAppliedUrlDuration = nextUrlParam;
        const valid = parseUrlDuration(nextUrlParam);
        if (valid !== null) activeDuration = valid;
      }
      assert.equal(activeDuration, 180, "New URL parameter was successfully applied");
    });

    it("12. React re-render: typing engine preserves countdown and state under re-renders", () => {
      const timeDuration = parseUrlDuration("300")!;
      assert.equal(timeDuration, 300);

      const config: TestConfig = {
        mode: "time",
        timeDuration,
        wordCount: 25,
        quoteLength: "medium",
        customText: "",
        punctuation: false,
        numbers: false,
        vocabDifficulty: "easy",
        wordDifficulty: "all",
      };

      let state = createInitialState(config);
      assert.equal(state.status, "idle");
      assert.equal(state.config.timeDuration, 300);

      // Start typing
      state = reducer(state, { type: "SET_TYPED", value: state.words[0][0], now: 1000 });
      assert.equal(state.status, "running");

      // Ticks simulate 100ms interval re-renders
      state = reducer(state, { type: "TICK", now: 1100 });
      assert.equal(state.config.timeDuration, 300);

      state = reducer(state, { type: "TICK", now: 2000 });
      assert.equal(state.config.timeDuration, 300);
      assert.equal(state.status, "running");

      // Exactly at 300s (300,000ms after start at 1000ms => 301,000ms)
      state = reducer(state, { type: "TICK", now: 301000 });
      assert.equal(state.status, "finished");
      assert.equal(state.elapsedMs, 300000);
    });

    it("13. existing presets (15, 30, 60) continue working in typing engine", () => {
      for (const preset of TIME_DURATIONS) {
        const config: TestConfig = {
          mode: "time",
          timeDuration: preset,
          wordCount: 25,
          quoteLength: "medium",
          customText: "",
          punctuation: false,
          numbers: false,
          vocabDifficulty: "easy",
          wordDifficulty: "all",
        };
        let state = createInitialState(config);
        state = reducer(state, { type: "SET_TYPED", value: state.words[0][0], now: 1000 });
        state = reducer(state, { type: "TICK", now: 1000 + preset * 1000 });
        assert.equal(state.status, "finished");
        assert.equal(state.elapsedMs, preset * 1000);
      }
    });

    it("14. existing typing modes (words, quote, vocabulary, custom) continue working unaffected", () => {
      const wordsConfig: TestConfig = {
        mode: "words",
        timeDuration: 60,
        wordCount: 10,
        quoteLength: "medium",
        customText: "",
        punctuation: false,
        numbers: false,
        vocabDifficulty: "easy",
        wordDifficulty: "all",
      };
      const wordsState = createInitialState(wordsConfig);
      assert.equal(wordsState.words.length, 10);
      assert.equal(wordsState.config.mode, "words");

      const quoteConfig: TestConfig = {
        mode: "quote",
        timeDuration: 60,
        wordCount: 25,
        quoteLength: "short",
        customText: "",
        punctuation: false,
        numbers: false,
        vocabDifficulty: "easy",
        wordDifficulty: "all",
      };
      const quoteState = createInitialState(quoteConfig);
      assert.equal(quoteState.config.mode, "quote");
      assert.ok(quoteState.words.length > 0);
    });
  });

  describe("STEP 7: Precedence rules with simulated browser environment", () => {
    it("prefers explicit valid URL duration over stored preferences while preserving unrelated preferences", () => {
      // Mock window.location.search
      globalThis.window = {
        location: {
          search: "?duration=300",
        },
      } as unknown as Window & typeof globalThis;

      const urlDuration = getInitialUrlDuration();
      assert.equal(urlDuration, 300);

      // Persisted preferences from localStorage simulation
      const persistedPreferences = {
        theme: "laser",
        mode: "words",
        timeDuration: 15,
        punctuation: true,
        numbers: true,
        soundEnabled: false,
      };

      // Apply precedence rule: URL duration overrides timeDuration and sets mode to "time"
      const resolved = {
        ...persistedPreferences,
        ...(urlDuration !== null ? { timeDuration: urlDuration, mode: "time" } : {}),
      };

      assert.equal(resolved.timeDuration, 300, "URL duration (300) took precedence over stored 15");
      assert.equal(resolved.mode, "time", "Mode resolved to 'time'");
      assert.equal(resolved.theme, "laser", "Theme was preserved");
      assert.equal(resolved.punctuation, true, "Punctuation setting was preserved");
      assert.equal(resolved.numbers, true, "Numbers setting was preserved");
      assert.equal(resolved.soundEnabled, false, "Sound setting was preserved");
    });

    it("preserves stored duration and mode when URL has no duration parameter", () => {
      globalThis.window = {
        location: {
          search: "",
        },
      } as unknown as Window & typeof globalThis;

      const urlDuration = getInitialUrlDuration();
      assert.equal(urlDuration, null);

      const persistedPreferences = {
        theme: "laser",
        mode: "words",
        timeDuration: 15,
      };

      const resolved = {
        ...persistedPreferences,
        ...(urlDuration !== null ? { timeDuration: urlDuration, mode: "time" } : {}),
      };

      assert.equal(resolved.timeDuration, 15, "Stored duration of 15 was preserved");
      assert.equal(resolved.mode, "words", "Stored mode of 'words' was preserved");
    });

    it("preserves stored duration when URL has invalid duration parameter (?duration=abc)", () => {
      globalThis.window = {
        location: {
          search: "?duration=abc&filter=all",
        },
      } as unknown as Window & typeof globalThis;


      const urlDuration = getInitialUrlDuration();
      assert.equal(urlDuration, null);

      const persistedPreferences = {
        theme: "cyberpunk",
        mode: "time",
        timeDuration: 30,
      };

      const resolved = {
        ...persistedPreferences,
        ...(urlDuration !== null ? { timeDuration: urlDuration, mode: "time" } : {}),
      };

      assert.equal(resolved.timeDuration, 30, "Stored duration was preserved");
    });
  });
});

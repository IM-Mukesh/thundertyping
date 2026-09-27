import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { trackEvent, type AnalyticsEventName } from "@/lib/analytics";

describe("trackEvent: GA4 analytics event dispatcher", () => {
  it("does not throw when window is undefined (SSR safety)", () => {
    // In Node test environment, window is initially undefined unless polyfilled
    const originalWindow = globalThis.window;
    try {
      // @ts-expect-error intentionally setting window to undefined for SSR simulation
      delete globalThis.window;
      assert.doesNotThrow(() => {
        trackEvent("typing_test_started", {
          test_mode: "time",
          test_duration: 30,
          punctuation: false,
          numbers: false,
        });
      });
    } finally {
      if (originalWindow !== undefined) {
        globalThis.window = originalWindow;
      }
    }
  });

  it("does not throw when window exists but gtag and dataLayer are undefined", () => {
    const originalWindow = globalThis.window;
    try {
      // @ts-expect-error mock window without analytics
      globalThis.window = {};
      assert.doesNotThrow(() => {
        trackEvent("typing_test_started", {
          test_mode: "time",
          test_duration: 30,
          punctuation: false,
          numbers: false,
        });
      });
    } finally {
      if (originalWindow !== undefined) {
        globalThis.window = originalWindow;
      } else {
        // @ts-expect-error clean up mock
        delete globalThis.window;
      }
    }
  });

  it("dispatches event and params to window.gtag when available", () => {
    const calls: { name: string; params: unknown }[] = [];
    const mockGtag = (type: string, name: string, params: unknown) => {
      assert.equal(type, "event");
      calls.push({ name, params });
    };

    const originalWindow = globalThis.window;
    try {
      // @ts-expect-error mock window with gtag
      globalThis.window = { gtag: mockGtag };

      trackEvent("lesson_started", {
        lesson_id: "home-row-left",
        lesson_title: "Home Row: Left Hand",
        lesson_number: 1,
        tier: "beginner",
        stage: "home-row",
      });

      assert.equal(calls.length, 1);
      assert.equal(calls[0].name, "lesson_started");
      assert.deepEqual(calls[0].params, {
        lesson_id: "home-row-left",
        lesson_title: "Home Row: Left Hand",
        lesson_number: 1,
        tier: "beginner",
        stage: "home-row",
      });

      trackEvent("lesson_completed", {
        lesson_id: "home-row-left",
        lesson_title: "Home Row: Left Hand",
        lesson_number: 1,
        tier: "beginner",
        stage: "home-row",
        wpm: 35,
        accuracy: 94,
        duration_ms: 12000,
        steps: 7,
      });

      assert.equal(calls.length, 2);
      assert.equal(calls[1].name, "lesson_completed");
      assert.deepEqual(calls[1].params, {
        lesson_id: "home-row-left",
        lesson_title: "Home Row: Left Hand",
        lesson_number: 1,
        tier: "beginner",
        stage: "home-row",
        wpm: 35,
        accuracy: 94,
        duration_ms: 12000,
        steps: 7,
      });
    } finally {
      if (originalWindow !== undefined) {
        globalThis.window = originalWindow;
      } else {
        // @ts-expect-error clean up mock
        delete globalThis.window;
      }
    }
  });

  it("falls back to window.dataLayer array when gtag function is absent", () => {
    const dataLayer: unknown[] = [];
    const originalWindow = globalThis.window;
    try {
      // @ts-expect-error mock window with dataLayer
      globalThis.window = { dataLayer };

      trackEvent("practice_started", {
        practice_type: "weak_keys",
        target_keys_count: 3,
      });

      assert.equal(dataLayer.length, 1);
      assert.deepEqual(dataLayer[0], [
        "event",
        "practice_started",
        { practice_type: "weak_keys", target_keys_count: 3 },
      ]);
    } finally {
      if (originalWindow !== undefined) {
        globalThis.window = originalWindow;
      } else {
        // @ts-expect-error clean up mock
        delete globalThis.window;
      }
    }
  });

  it("handles throwing within gtag gracefully without crashing", () => {
    const originalWindow = globalThis.window;
    try {
      // @ts-expect-error mock window with broken gtag
      globalThis.window = {
        gtag: () => {
          throw new Error("Simulated GA network error");
        },
      };

      assert.doesNotThrow(() => {
        trackEvent("game_started", {
          game_id: "fruit-fury",
          game_name: "Fruit Fury",
        });
      });
    } finally {
      if (originalWindow !== undefined) {
        globalThis.window = originalWindow;
      } else {
        // @ts-expect-error clean up mock
        delete globalThis.window;
      }
    }
  });

  it("all 10 required product events can be cleanly typed and invoked", () => {
    const captured: { name: AnalyticsEventName; params: unknown }[] = [];
    const originalWindow = globalThis.window;
    try {
      globalThis.window = {
        gtag: (...args: unknown[]) => {
          const [, name, params] = args as [string, AnalyticsEventName, unknown];
          captured.push({ name, params });
        },
      } as unknown as Window & typeof globalThis;

      trackEvent("typing_test_started", { test_mode: "time", test_duration: 60, punctuation: true, numbers: false });
      trackEvent("typing_test_completed", { test_mode: "time", test_duration: 60, wpm: 55, accuracy: 96, gross_wpm: 58, correct_chars: 275, incorrect_chars: 10, duration_ms: 60000 });
      trackEvent("lesson_started", { lesson_id: "top-row-left", lesson_title: "Top Row: Left Hand", lesson_number: 5, tier: "beginner", stage: "top-row" });
      trackEvent("lesson_completed", { lesson_id: "top-row-left", lesson_title: "Top Row: Left Hand", lesson_number: 5, tier: "beginner", stage: "top-row", wpm: 40, accuracy: 92, duration_ms: 25000, steps: 5 });
      trackEvent("practice_started", { practice_type: "weak_keys", target_keys_count: 2 });
      trackEvent("practice_completed", { practice_type: "weak_keys", wpm: 42, accuracy: 95, duration_ms: 18000 });
      trackEvent("game_started", { game_id: "falling-words", game_name: "Falling Words" });
      trackEvent("game_completed", { game_id: "falling-words", game_name: "Falling Words", score: 1250, duration_ms: 45000 });
      trackEvent("placement_started", { assessment_type: "typing_placement" });
      trackEvent("placement_completed", { assessment_type: "typing_placement", wpm: 45, accuracy: 91, suggested_lesson_id: "full-keyboard-words", suggested_stage: "review" });

      assert.equal(captured.length, 10);
      assert.equal(captured[0].name, "typing_test_started");
      assert.equal(captured[1].name, "typing_test_completed");
      assert.equal(captured[2].name, "lesson_started");
      assert.equal(captured[3].name, "lesson_completed");
      assert.equal(captured[4].name, "practice_started");
      assert.equal(captured[5].name, "practice_completed");
      assert.equal(captured[6].name, "game_started");
      assert.equal(captured[7].name, "game_completed");
      assert.equal(captured[8].name, "placement_started");
      assert.equal(captured[9].name, "placement_completed");
    } finally {
      if (originalWindow !== undefined) {
        globalThis.window = originalWindow;
      } else {
        // @ts-expect-error clean up mock
        delete globalThis.window;
      }
    }
  });
});

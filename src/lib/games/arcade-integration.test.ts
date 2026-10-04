import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_DEFINITIONS } from "@/lib/games/game-types";
import { formatGameScore } from "@/lib/games/score-format";
import { advanceLaneTargets, availableWord, safeGameBoardHeight } from "@/lib/games/arcade-layout";
import { isGameRestartShortcut } from "@/lib/games/input-controls";
import { comboMultiplier, getRushTier, createInitialState as comboInitial, reducer as comboReducer } from "@/lib/games/use-combo-rush";
import { createInitialState as rainInitial, reducer as rainReducer } from "@/lib/games/use-word-rain";
import { createInitialState as blasterInitial, reducer as blasterReducer } from "@/lib/games/use-word-blaster";
import { createInitialState as fallingInitial, reducer as fallingReducer } from "@/lib/games/use-falling-words";
import { createInitialState as bossInitial, reducer as bossReducer } from "@/lib/games/use-boss-battle";

describe("arcade integration contracts", () => {
  it("formats survival seconds, racing WPM and Survivor points honestly", () => {
    assert.equal(formatGameScore(GAME_DEFINITIONS["word-rain"], 90), "90s");
    assert.equal(formatGameScore(GAME_DEFINITIONS["ghost-racer"], 80), "80 WPM");
    assert.equal(formatGameScore(GAME_DEFINITIONS["typing-survivor"], 500), "500");
  });

  it("tier metadata agrees with actual Combo Rush points and time refunds", () => {
    for (const combo of [0, 4, 5, 10, 12, 15, 25, 200]) {
      assert.equal(getRushTier(combo).multiplier, comboMultiplier(combo));
      const s = { ...comboInitial(GAME_DEFINITIONS["combo-rush"]), status: "running" as const, queue: ["hello"], combo, timeLeftMs: 1000 };
      const next = comboReducer(s, { type: "SET_TYPED", value: "hello" });
      assert.equal(next.score, Math.round(50 * getRushTier(combo).multiplier));
      assert.equal(next.timeLeftMs, 1000 + Math.round(1350 * getRushTier(combo).multiplier));
    }
  });

  it("Word Rain rejects duplicate live words and pauses all state changes", () => {
    let s = rainReducer(rainInitial(GAME_DEFINITIONS["word-rain"]), { type: "START" });
    s = rainReducer(s, { type: "SPAWN", text: "rain", lane: 0 });
    assert.equal(rainReducer(s, { type: "SPAWN", text: "rain", lane: 1 }), s);
    const paused = rainReducer(s, { type: "PAUSE" });
    assert.equal(rainReducer(paused, { type: "TICK" }), paused);
    assert.equal(rainReducer(paused, { type: "SET_TYPED", value: "rain" }), paused);
    assert.equal(rainReducer(paused, { type: "SPAWN", text: "storm", lane: 1 }), paused);
  });

  it("mixed-speed lane targets keep clearance without affecting other lanes", () => {
    let targets = [{ lane: 0, progress: 0.4, speed: 0.005 }, { lane: 0, progress: 0.1, speed: 0.03 }, { lane: 1, progress: 0.1, speed: 0.03 }];
    for (let i = 0; i < 10; i++) {
      const before = targets;
      targets = advanceLaneTargets(targets, (t) => t.progress + t.speed, 0.2);
      assert.ok(targets[0].progress - targets[1].progress >= 0.19999);
      assert.ok(targets.every((t, index) => t.progress >= before[index].progress));
    }
    assert.ok(targets[2].progress > targets[1].progress);
  });

  it("tank core replacement never duplicates any active word", () => {
    const state = { ...blasterInitial(GAME_DEFINITIONS["word-blaster"]), status: "running" as const,
      enemies: [{ id: 1, text: "shield", lane: 0, progress: 0.2, travelMs: 8000, type: "tank" as const, shieldHp: 2 },
        { id: 2, text: "other", lane: 1, progress: 0.4, travelMs: 8000, type: "standard" as const, shieldHp: 1 }] };
    const next = blasterReducer(state, { type: "SET_TYPED", value: "shield" });
    assert.notEqual(next.enemies[0].text, "shield");
    assert.notEqual(next.enemies[0].text, "other");
    assert.equal(availableWord(["busy", "free"], new Set(["busy"])), "free");
  });

  it("Danger-word copy matches rewarded clears and life-costing misses", () => {
    const definition = GAME_DEFINITIONS["falling-words"];
    assert.ok(definition.rules.some((rule) => rule.includes("Danger words")));
    assert.ok(!definition.rules.some((rule) => rule.includes("avoid Hazard")));
    const state = { ...fallingInitial(definition), status: "running" as const,
      words: [{ id: 1, text: "danger", kind: "hazard" as const, lane: 0, progress: 0.999, fallMs: 1000 }] };
    assert.ok(fallingReducer(state, { type: "SET_TYPED", value: "danger" }).score > 0);
    assert.equal(fallingReducer(state, { type: "TICK" }).lives, 2);
  });

  it("short keyboard viewports no longer force a 260px board", () => {
    assert.equal(safeGameBoardHeight(280, true, true), 100);
    assert.equal(safeGameBoardHeight(600, true, true), 420);
    assert.equal(safeGameBoardHeight(800, false, false), 540);
  });

  it("Boss Battle cannot inflate finish bonuses by retyping a prefix", () => {
    const initial = { ...bossInitial(GAME_DEFINITIONS["boss-battle"]), status: "running" as const,
      word: "hello", queue: ["world"], bossHp: 1, elapsedMs: 10000, incorrectKeystrokes: 1 };
    let repeated = { ...initial } as ReturnType<typeof bossInitial>;
    for (let i = 0; i < 20; i++) {
      repeated = bossReducer(repeated, { type: "SET_TYPED", value: "hell" });
      repeated = bossReducer(repeated, { type: "SET_TYPED", value: "" });
    }
    const honest = bossReducer(initial, { type: "SET_TYPED", value: "hello" });
    const replayed = bossReducer(repeated, { type: "SET_TYPED", value: "hello" });
    assert.equal(replayed.completedChars, 5);
    assert.equal(replayed.speedBonus, honest.speedBonus);
    assert.equal(replayed.accuracyBonus, honest.accuracyBonus);
    assert.equal(replayed.score, honest.score);
  });

  it("global restart shortcuts ignore modifiers, repeats and ordinary keys", () => {
    const event = { key: "Enter", repeat: false, ctrlKey: false, altKey: false, metaKey: false, target: null };
    assert.equal(isGameRestartShortcut(event), true);
    for (const change of [{ key: "a" }, { repeat: true }, { ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      assert.equal(isGameRestartShortcut({ ...event, ...change }), false);
    }
  });
});

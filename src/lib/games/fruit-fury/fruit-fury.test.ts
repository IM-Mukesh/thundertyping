import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_DEFINITIONS, GAME_LIST } from "@/lib/games/game-types";
import {
  DIFFICULTY_CONFIGS,
  FRUIT_CONFIGS,
  STANDARD_FRUIT_TYPES,
} from "@/lib/games/fruit-fury/fruit-fury-types";
import { ACHIEVEMENTS_BY_ID, GAME_LABELS } from "@/lib/profile/achievements";

describe("fruit fury: game definition & system registry", () => {
  it("fruit-fury exists in GAME_DEFINITIONS with valid arcade contract", () => {
    const def = GAME_DEFINITIONS["fruit-fury"];
    assert.ok(def, "definition must exist");
    assert.equal(def.id, "fruit-fury");
    assert.equal(def.name, "Fruit Fury");
    assert.equal(def.category, "Arcade");
    assert.equal(def.lives, 3);
    assert.equal(def.scoreBy, "points");
    assert.ok(def.rules.length >= 4, "must display core rules");
    assert.ok(def.about.length >= 3, "must include in-depth about copy");
  });

  it("fruit-fury is present in GAME_LIST for routing, hub and achievements", () => {
    const found = GAME_LIST.find((g) => g.id === "fruit-fury");
    assert.ok(found, "fruit-fury must be in GAME_LIST");
  });

  it("registers all 8 standard fruits, 2 specials, and 1 bomb", () => {
    assert.equal(STANDARD_FRUIT_TYPES.length, 8);
    STANDARD_FRUIT_TYPES.forEach((type) => {
      const cfg = FRUIT_CONFIGS[type];
      assert.ok(cfg, `Config for ${type} must exist`);
      assert.equal(cfg.isBomb, false);
      assert.equal(cfg.isSpecial, false);
      assert.ok(cfg.baseScore >= 100);
      assert.ok(cfg.radius >= 25);
    });

    const golden = FRUIT_CONFIGS.golden;
    assert.ok(golden.isSpecial, "Golden Dragon must be special");
    assert.equal(golden.baseScore, 500);

    const frozen = FRUIT_CONFIGS.frozen;
    assert.ok(frozen.isSpecial, "Frost Berry must be special");
    assert.equal(frozen.baseScore, 250);

    const bomb = FRUIT_CONFIGS.bomb;
    assert.ok(bomb.isBomb, "Bomb must be marked as bomb");
    assert.equal(bomb.baseScore, 0);
  });
});

describe("fruit fury: difficulty tuning", () => {
  it("difficulty scales initial launch speed, gravity, and bomb chance logically", () => {
    const easy = DIFFICULTY_CONFIGS.easy;
    const med = DIFFICULTY_CONFIGS.medium;
    const hard = DIFFICULTY_CONFIGS.hard;

    // Harder launch velocity (more negative)
    assert.ok(Math.abs(hard.initialSpeedY) > Math.abs(med.initialSpeedY));
    assert.ok(Math.abs(med.initialSpeedY) > Math.abs(easy.initialSpeedY));

    // Harder gravity
    assert.ok(hard.gravity > med.gravity);
    assert.ok(med.gravity > easy.gravity);

    // Harder bomb chance
    assert.ok(hard.bombChanceMax > med.bombChanceMax);
    assert.ok(med.bombChanceMax > easy.bombChanceMax);

    // Spawn interval tighter on hard
    assert.ok(hard.initialSpawnInterval < med.initialSpawnInterval);
    assert.ok(med.initialSpawnInterval < easy.initialSpawnInterval);
  });
});

describe("fruit fury: combo and fever multipliers", () => {
  function getScoreMultiplier(combo: number, isFever: boolean): number {
    const comboMult =
      combo >= 10 ? 3.0 : combo >= 5 ? 2.0 : combo >= 3 ? 1.5 : 1.0;
    const feverMult = isFever ? 2.0 : 1.0;
    return comboMult * feverMult;
  }

  it("combo multipliers scale progressively", () => {
    assert.equal(getScoreMultiplier(1, false), 1.0);
    assert.equal(getScoreMultiplier(2, false), 1.0);
    assert.equal(getScoreMultiplier(3, false), 1.5);
    assert.equal(getScoreMultiplier(5, false), 2.0);
    assert.equal(getScoreMultiplier(10, false), 3.0);
    assert.equal(getScoreMultiplier(25, false), 3.0);
  });

  it("fever mode doubles the total multiplier at every combo tier", () => {
    assert.equal(getScoreMultiplier(1, true), 2.0);
    assert.equal(getScoreMultiplier(3, true), 3.0);
    assert.equal(getScoreMultiplier(5, true), 4.0);
    assert.equal(getScoreMultiplier(10, true), 6.0);
  });
});

describe("fruit fury: achievement registry", () => {
  const expectedAchievements = [
    "fruit-fury:first-slice",
    "fruit-fury:combo-10",
    "fruit-fury:fever",
    "fruit-fury:golden",
    "fruit-fury:bomb-dodger",
    "fruit-fury:level-5",
    "fruit-fury:score-10000",
  ];

  it("all Fruit Fury achievements are registered with descriptions and game tag", () => {
    expectedAchievements.forEach((id) => {
      const ach = ACHIEVEMENTS_BY_ID[id];
      assert.ok(ach, `Achievement ${id} must be in registry`);
      assert.equal(ach.game, "fruit-fury");
      assert.ok(ach.name.length > 0);
      assert.ok(ach.description.length > 0);
    });
  });

  it("GAME_LABELS contains fruit-fury label", () => {
    assert.equal(GAME_LABELS["fruit-fury"], "Fruit Fury");
  });
});

describe("fruit fury: typing practice modes", () => {
  it("defines all 5 typing modes with valid key sets and labels", async () => {
    const { TYPING_MODES } = await import("@/lib/games/fruit-fury/fruit-fury-types");
    const expectedModes = ["all", "home", "top", "bottom", "numbers"] as const;

    expectedModes.forEach((mode) => {
      const config = TYPING_MODES[mode];
      assert.ok(config, `Mode ${mode} must be configured`);
      assert.ok(config.label.length > 0);
      assert.ok(config.description.length > 0);
      assert.ok(config.keys.length > 0);
    });

    assert.equal(TYPING_MODES.all.keys.length, 26);
    assert.deepEqual(
      TYPING_MODES.home.keys,
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    );
    assert.deepEqual(
      TYPING_MODES.top.keys,
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    );
    assert.deepEqual(
      TYPING_MODES.bottom.keys,
      ["Z", "X", "C", "V", "B", "N", "M"],
    );
    assert.deepEqual(
      TYPING_MODES.numbers.keys,
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    );
  });

  it("validates alphanumeric key inputs including numbers", () => {
    const validKeys = ["A", "Z", "k", "f", "1", "9", "0"];
    const invalidKeys = [" ", "Enter", "Tab", ";", "-", "Shift", "ArrowUp"];

    validKeys.forEach((k) => {
      const upper = k.toUpperCase();
      assert.ok(/^[A-Z0-9]$/.test(upper), `Key ${k} should be valid`);
    });

    invalidKeys.forEach((k) => {
      const upper = k.toUpperCase();
      assert.ok(!/^[A-Z0-9]$/.test(upper), `Key ${k} should be invalid`);
    });
  });
});

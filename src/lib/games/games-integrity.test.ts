/**
 * Anti-exploit tests for the games.
 *
 * Every game here is won by reproducing text. The thing each test guards is
 * the same: that pressing keys which are not the text cannot move you forward.
 * Two games shipped without that guarantee and were winnable by holding the
 * spacebar.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { racePositionOf, wordStartAt } from "@/lib/games/racer/progress";
import {
  createInitialState as gpInitialState,
  reducer as gpReducer,
} from "@/lib/games/use-typing-grand-prix";
import { GAME_DEFINITIONS } from "@/lib/games/game-types";
import type { GrandPrixState } from "@/lib/games/use-typing-grand-prix";
import {
  createInitialState as wbInitialState,
  reducer as wbReducer,
  TICK_MS,
} from "@/lib/games/use-word-blaster";
import type { WordBlasterState } from "@/lib/games/use-word-blaster";
import {
  createInitialState as bbInitialState,
  reducer as bbReducer,
  damageFor,
} from "@/lib/games/use-boss-battle";
import {
  createInitialState as fwInitialState,
  reducer as fwReducer,
  OVERDRIVE_MS,
} from "@/lib/games/use-falling-words";
import type { GameState as FallingWordsState } from "@/lib/games/use-falling-words";

describe("ghost racer: distance is correct characters, not keystrokes", () => {
  const text = "the quick brown fox";

  it("does not advance for spaces alone", () => {
    // The original exploit: 400 spaces crossed the finish line and saved
    // itself as the new personal-best ghost.
    assert.equal(racePositionOf(" ".repeat(400), text), 0);
  });

  it("does not advance for any wrong character", () => {
    assert.equal(racePositionOf("xxxxxxxxxxxx", text), 0);
  });

  it("advances exactly as far as the correct prefix", () => {
    assert.equal(racePositionOf("the qu", text), 6);
  });

  it("stops at the first wrong character, however much follows it", () => {
    assert.equal(racePositionOf("the qXick brown fox", text), 5);
  });

  it("counts the space between words as progress when it is correct", () => {
    assert.equal(racePositionOf("the ", text), 4);
  });

  it("reaches the end only for a full correct reproduction", () => {
    assert.equal(racePositionOf(text, text), text.length);
  });

  it("cannot exceed the text length", () => {
    assert.ok(racePositionOf(text + "extra", text) <= text.length);
  });

  it("anchors the displayed word to the car, not to the buffer", () => {
    assert.equal(wordStartAt(text, 0), 0, "first word");
    assert.equal(wordStartAt(text, 2), 0, "mid first word");
    assert.equal(wordStartAt(text, 4), 4, "start of second word");
    assert.equal(wordStartAt(text, 6), 4, "mid second word");
    assert.equal(wordStartAt(text, 10), 10, "start of third word");
  });
});

describe("typing grand prix: the car banks only what was typed correctly", () => {
  /** A running race with a known word list, lead-in already elapsed. */
  function race(words: string[]): GrandPrixState {
    const base = gpInitialState(GAME_DEFINITIONS["typing-grand-prix"]);
    return {
      ...base,
      status: "running",
      leadInMs: 0,
      words,
      wordIndex: 0,
      totalChars: words.reduce((n, w) => n + w.length, 0),
      bankedChars: 0,
      typed: "",
    };
  }

  /** Types `value` into the active word, then presses space. */
  function typeAndCommit(state: GrandPrixState, value: string): GrandPrixState {
    const typed = gpReducer(state, { type: "SET_TYPED", value });
    return gpReducer(typed, { type: "COMMIT_WORD" });
  }

  it("banks the whole word when it is typed correctly", () => {
    const after = typeAndCommit(race(["hello", "world"]), "hello");
    assert.equal(after.bankedChars, 5);
  });

  it("banks nothing for a word that is entirely wrong", () => {
    // The original exploit: one letter plus space advanced the car a full
    // word, so a rival could be beaten without typing anything real.
    const after = typeAndCommit(race(["hello", "world"]), "z");
    assert.equal(after.bankedChars, 0);
  });

  it("banks only the characters that matched", () => {
    const after = typeAndCommit(race(["hello", "world"]), "hexlo");
    assert.equal(after.bankedChars, 4, "h, e, l, o matched positionally");
  });

  it("does not move the car for a wrong word", () => {
    const after = typeAndCommit(race(["hello", "world"]), "zzzzz");
    assert.equal(after.playerProgress, 0);
  });

  it("moves the car proportionally for a correct word", () => {
    const after = typeAndCommit(race(["hello", "world"]), "hello");
    assert.equal(after.playerProgress, 0.5, "5 of 10 characters");
  });

  it("a space on an empty word does nothing at all", () => {
    const start = race(["hello", "world"]);
    const after = gpReducer(start, { type: "COMMIT_WORD" });
    assert.equal(after.bankedChars, 0);
    assert.equal(after.wordIndex, 0, "cursor must not advance");
  });

  it("spamming one letter and space never finishes the race", () => {
    let s = race(["alpha", "bravo", "charlie", "delta"]);
    for (let i = 0; i < 40; i++) s = typeAndCommit(s, "z");
    assert.equal(s.bankedChars, 0);
    assert.ok(s.playerProgress < 1, "the car never reaches the line");
  });

  it("a player who spaced through the race places last", () => {
    const words = ["alpha", "bravo"];
    let s = race(words);
    // Give the opponents some real distance, as they would have after a race.
    s = { ...s, opponents: s.opponents.map((o) => ({ ...o, progress: 0.4 })) };
    for (let i = 0; i < words.length; i++) s = typeAndCommit(s, "z");
    assert.equal(s.status, "over");
    assert.equal(s.playerProgress, 0, "the car never moved");
    assert.equal(s.place, 1 + s.opponents.length, "behind every opponent");
  });

  it("a player who typed it all places ahead of unfinished opponents", () => {
    const words = ["alpha", "bravo"];
    let s = race(words);
    s = { ...s, opponents: s.opponents.map((o) => ({ ...o, progress: 0.4 })) };
    for (const w of words) s = typeAndCommit(s, w);
    assert.equal(s.playerProgress, 1);
    assert.equal(s.place, 1);
  });

  it("typing every word correctly does finish the race", () => {
    const words = ["alpha", "bravo", "charlie"];
    let s = race(words);
    for (const w of words) s = typeAndCommit(s, w);
    assert.equal(s.bankedChars, words.join("").length);
    assert.equal(s.playerProgress, 1);
  });
});

describe("typing grand prix: combo, boost and overtakes", () => {
  function race(words: string[], overrides: Partial<GrandPrixState> = {}): GrandPrixState {
    const base = gpInitialState(GAME_DEFINITIONS["typing-grand-prix"]);
    return {
      ...base,
      status: "running",
      leadInMs: 0,
      words,
      wordIndex: 0,
      totalChars: words.reduce((n, w) => n + w.length, 0),
      bankedChars: 0,
      typed: "",
      ...overrides,
    };
  }

  function typeAndCommit(state: GrandPrixState, value: string): GrandPrixState {
    const typed = gpReducer(state, { type: "SET_TYPED", value });
    return gpReducer(typed, { type: "COMMIT_WORD" });
  }

  it("combo climbs on clean words and resets the instant a keystroke is wrong", () => {
    let s = race(["alpha", "bravo", "charlie"]);
    s = typeAndCommit(s, "alpha");
    assert.equal(s.combo, 1);
    s = typeAndCommit(s, "bravo");
    assert.equal(s.combo, 2);

    s = gpReducer(s, { type: "SET_TYPED", value: "z" });
    assert.equal(s.combo, 0, "a single wrong keystroke breaks the streak immediately");
  });

  it("committing a wrong or incomplete word earns no score and resets combo", () => {
    // Three words, not two — committing the wrong word must land on the
    // *middle* word, or it would also be the last word of the race and pull
    // in finishRace's separate placement/speed bonus, which would make this
    // test about the wrong thing.
    let s = race(["alpha", "bravo", "charlie"]);
    s = typeAndCommit(s, "alpha");
    assert.equal(s.combo, 1);
    const scoreAfterFirst = s.score;

    s = typeAndCommit(s, "zzzzz");
    assert.equal(s.status, "running", "sanity check: the race is not over yet");
    assert.equal(s.combo, 0, "spacing past a wrong word is not a clean word");
    assert.equal(s.score, scoreAfterFirst, "no points for a word that wasn't actually typed");
  });

  it("boost caps at 100 and spending it into a window resets it to 0", () => {
    let s = race(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"], { boost: 92 });
    s = typeAndCommit(s, "a");
    assert.equal(s.boost, 0, "crossing the cap spends it, not caps it at 100");
    assert.ok(s.boostMs > 0, "Overdrive-style window starts the instant boost caps");
  });

  it("boost never advances the car — only real correct characters do", () => {
    const words = ["alpha", "bravo"];
    let s = race(words, { boostMs: 6000 });
    s = typeAndCommit(s, "alpha");
    // The anti-exploit invariant this whole game was fixed for: distance can
    // only ever equal correctly-typed characters, whatever else is active.
    assert.equal(s.bankedChars, "alpha".length);
    assert.equal(s.playerProgress, "alpha".length / (words.join("").length));
  });

  it("a clean word during an active boost window scores strictly more than the same word without it", () => {
    const withoutBoost = typeAndCommit(race(["mountain"]), "mountain");
    const withBoost = typeAndCommit(race(["mountain"], { boostMs: 6000 }), "mountain");
    assert.ok(withBoost.score > withoutBoost.score);
  });

  it("the player's own progress passing an opponent sets a real overtake timestamp", () => {
    // Opponents don't move during SET_TYPED, so pushing the player's own
    // progress past a stationary opponent's is a fully deterministic way to
    // exercise the same position-comparison path a tick would.
    const words = ["mountain"];
    const s0 = race(words, {
      elapsedMs: 1000,
      opponents: [
        { id: 0, targetWpm: 50, speedFactor: 1, progress: 0.5, finishedAtMs: null },
        { id: 1, targetWpm: 50, speedFactor: 1, progress: 0.9, finishedAtMs: null },
        { id: 2, targetWpm: 50, speedFactor: 1, progress: 0.95, finishedAtMs: null },
      ],
    });
    assert.equal(s0.lastOvertakeMs, null);

    // "mountain" is 8 chars of 8 total — typing it fully takes the player
    // from 0 to 1, crossing well past opponent 0's 0.5.
    const s = gpReducer(s0, { type: "SET_TYPED", value: "mountain" });
    assert.equal(s.lastOvertakeMs, 1000, "stamped with the tick's own elapsedMs, not fabricated");
  });

  it("an opponent pulling ahead on a tick sets a real overtaken timestamp", () => {
    const s0 = race(["alpha"], {
      playerProgress: 0.5,
      elapsedMs: 1000,
      opponents: [
        // targetWpm=0 still advances (progress can only grow, never reverse)
        // but far too slowly to cross the player inside one tick on its own
        // — instead, place it a hair behind so any forward tick crosses it.
        { id: 0, targetWpm: 500, speedFactor: 1, progress: 0.4999, finishedAtMs: null },
        { id: 1, targetWpm: 10, speedFactor: 1, progress: 0.1, finishedAtMs: null },
        { id: 2, targetWpm: 10, speedFactor: 1, progress: 0.05, finishedAtMs: null },
      ],
    });
    const s = gpReducer(s0, { type: "TICK" });
    assert.ok(s.opponents[0].progress > 0.5, "the fast opponent did cross the player this tick");
    assert.equal(s.lastOvertakenMs, s.elapsedMs, "stamped the instant the position actually changed");
  });
});

describe("word blaster: boss encounters", () => {
  function running(overrides: Partial<WordBlasterState> = {}): WordBlasterState {
    return {
      ...wbInitialState(GAME_DEFINITIONS["word-blaster"]),
      status: "running",
      ...overrides,
    };
  }

  it("spawns a boss exactly when destroyed reaches nextBossAt, clearing the board", () => {
    let s = running({ destroyed: 11, nextBossAt: 12 });
    assert.equal(s.boss, null);

    s = wbReducer(s, { type: "TICK" });
    assert.equal(s.boss, null, "not yet — destroyed is still 11");

    s = { ...s, destroyed: 12 };
    s = wbReducer(s, { type: "TICK" });
    assert.ok(s.boss, "a boss spawns once destroyed reaches nextBossAt");
    assert.equal(s.enemies.length, 0, "lane enemies are cleared for the encounter");
  });

  it("wrong keystrokes against the boss word don't touch its hp", () => {
    let s = running({ boss: { hp: 4, maxHp: 4, word: "sturdy", deadlineMs: 6000 } });
    s = wbReducer(s, { type: "SET_TYPED", value: "z" });
    assert.equal(s.boss?.hp, 4);
    assert.equal(s.incorrectKeystrokes, 1);
    assert.equal(s.combo, 0);
  });

  it("landing the boss's last word defeats it, awards a bonus, and reopens spawning", () => {
    let s = running({
      boss: { hp: 1, maxHp: 4, word: "sturdy", deadlineMs: 6000 },
      score: 0,
      destroyed: 12,
      nextBossAt: 12,
    });
    s = wbReducer(s, { type: "SET_TYPED", value: "sturdy" });
    assert.equal(s.boss, null, "the encounter ends");
    assert.equal(s.bossesDefeated, 1);
    assert.equal(s.destroyed, 13, "counts as exactly one kill toward the lifetime tally");
    assert.ok(s.score > 0, "a defeat bonus is scored");
    assert.equal(s.nextBossAt, 13 + 12, "the next boss is scheduled from here, not from a stale count");
  });

  it("a boss that outlasts its deadline costs exactly one life, not a breach", () => {
    const s0 = running({
      lives: 3,
      breached: 0,
      boss: { hp: 4, maxHp: 4, word: "sturdy", deadlineMs: 10 },
      elapsedMs: 0,
    });
    const s = wbReducer(s0, { type: "TICK" });
    assert.equal(s.boss, null, "the boss escapes");
    assert.equal(s.lives, 2, "exactly one life lost");
    assert.equal(s.breached, 0, "an escape is not a lane breach");
  });

  it("a boss encounter suspends the tick's normal enemy advance", () => {
    const s0 = running({
      boss: { hp: 4, maxHp: 4, word: "sturdy", deadlineMs: 10_000 },
      enemies: [{ id: 1, text: "wontmove", progress: 0.5, travelMs: 5000, lane: 0 }],
    });
    const s = wbReducer(s0, { type: "TICK" });
    // The board was already cleared when the boss spawned in real play; this
    // asserts the tick itself never advances anything while `boss` is set,
    // regardless of how `enemies` got populated.
    assert.equal(s.enemies[0].progress, 0.5);
    assert.equal(s.elapsedMs, TICK_MS);
  });
});

describe("boss battle: damage-number popup reports the real hit", () => {
  it("lastHitDamage matches the damage actually dealt this hit, not a running total", () => {
    const definition = GAME_DEFINITIONS["boss-battle"];
    let s: ReturnType<typeof bbInitialState> = {
      ...bbInitialState(definition),
      status: "running",
      word: "spark",
      queue: ["ember"],
    };
    s = bbReducer(s, { type: "SET_TYPED", value: "spark" });
    assert.equal(s.lastHitDamage, damageFor("spark", 0));
    assert.equal(s.damageDealt, s.lastHitDamage, "first hit: total equals the single hit");

    s = bbReducer(s, { type: "SET_TYPED", value: "ember" });
    assert.equal(s.lastHitDamage, damageFor("ember", 1), "second hit is scored at the prior combo");
    assert.equal(
      s.damageDealt,
      damageFor("spark", 0) + damageFor("ember", 1),
      "the running total is the sum, not overwritten by the latest hit",
    );
  });
});

describe("falling words: target variety, fever and overdrive", () => {
  function running(overrides: Partial<FallingWordsState> = {}): FallingWordsState {
    return {
      ...fwInitialState(GAME_DEFINITIONS["falling-words"]),
      status: "running",
      ...overrides,
    };
  }

  it("a golden word scores strictly more than the same text as a normal word", () => {
    const word = { id: 1, text: "spark", kind: "normal" as const, progress: 0.4, fallMs: 5000, lane: 0 };
    const normal = fwReducer(running({ words: [word] }), { type: "SET_TYPED", value: "spark" });

    const goldenWord = { ...word, id: 2, kind: "golden" as const };
    const golden = fwReducer(running({ words: [goldenWord] }), { type: "SET_TYPED", value: "spark" });

    assert.ok(golden.score > normal.score, "golden must outscore an identical normal word");
  });

  it("fever caps at 100 and spending it into Overdrive resets it to 0", () => {
    let s = running({ words: [{ id: 1, text: "a", kind: "normal", progress: 0, fallMs: 5000, lane: 0 }], fever: 95 });
    s = fwReducer(s, { type: "SET_TYPED", value: "a" });
    assert.equal(s.fever, 0, "crossing the cap spends it, not caps it at 100");
    assert.equal(s.overdriveMs, OVERDRIVE_MS, "Overdrive starts the instant fever caps");
  });

  it("Overdrive doesn't also refill fever while it's already active", () => {
    let s = running({
      words: [{ id: 1, text: "a", kind: "normal", progress: 0, fallMs: 5000, lane: 0 }],
      fever: 0,
      overdriveMs: 3000,
    });
    s = fwReducer(s, { type: "SET_TYPED", value: "a" });
    assert.equal(s.fever, 0, "fever stays at 0 during an active Overdrive");
    assert.equal(s.overdriveMs, 3000, "an already-running Overdrive isn't extended by more clears");
  });

  it("a word reaching the floor sets the miss flash and doesn't touch fever", () => {
    const s0 = running({
      words: [{ id: 1, text: "gone", kind: "normal", progress: 0.999, fallMs: 50, lane: 0 }],
      fever: 40,
      lives: 3,
      elapsedMs: 0,
    });
    const s = fwReducer(s0, { type: "TICK" });
    assert.equal(s.lives, 2);
    assert.ok(s.lastMissMs !== null, "the miss flash timestamp is set");
    assert.equal(s.fever, 40, "a miss costs a life and the combo, not fever progress");
  });

  it("a destroy effect ages itself out after DESTROY_EFFECT_MS", () => {
    let s = running({ words: [{ id: 1, text: "pop", kind: "normal", progress: 0, fallMs: 5000, lane: 0 }] });
    s = fwReducer(s, { type: "SET_TYPED", value: "pop" });
    assert.equal(s.destroyed.length, 1, "a destroy effect is recorded on clear");

    // Advance well past DESTROY_EFFECT_MS in ticks.
    for (let i = 0; i < 20; i++) s = fwReducer(s, { type: "TICK" });
    assert.equal(s.destroyed.length, 0, "the effect ages out on its own without extra cleanup");
  });
});

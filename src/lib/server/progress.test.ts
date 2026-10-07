import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateGameRunAchievements,
  GAME_SCORE_ACHIEVEMENTS,
  type GameScoreRecord,
} from "@/lib/server/progress";
import {
  issueServerGameRunProof,
  issueGameRunChallenge,
  deriveDeterministicWordsForChallenge,
  type GameplayEvidence,
} from "@/lib/server/game-proof";
import { PLAYABLE_GAME_LIST } from "@/lib/games/game-types";

describe("F10 & F23: Type Before Death Achievement Evaluation, Evidence Provenance & Scalability", () => {
  // Helper to generate authentic evidence backed by a genuine server challenge
  const makeAuthenticEvidence = (
    runId: string,
    overrides: Partial<GameplayEvidence> = {},
  ): GameplayEvidence => {
    const challenge = issueGameRunChallenge("type-before-death", runId, { mode: "campaign", mission: 0 });
    const words = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);
    return {
      runId,
      seed: challenge.seed,
      mission: 0,
      difficulty: "normal",
      wordsCompleted: words.slice(0, 32),
      totalKeysTyped: 250,
      elapsedMs: 50000,
      bossDefeated: true,
      overdriveActivations: 1,
      outputChars: 250,
      ...overrides,
    };
  };

  it("F10: evaluates all 6 Type Before Death achievements correctly when authoritative metrics and evidence are met", () => {
    const existing = new Set<string>();

    // 1. first-run: requires score > 0, survived_ms >= 5000, cleared >= 1
    const run1: GameScoreRecord = {
      game_id: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 100,
      cleared: 2,
      best_combo: 3,
      survived_ms: 15000,
      wpm: 45,
      accuracy: 90,
    };
    const unlocked1 = evaluateGameRunAchievements(existing, [run1]);
    assert.deepEqual(unlocked1, ["type-before-death:first-run"]);
    for (const u of unlocked1) existing.add(u);

    // 2. combo-25: requires best_combo >= 25, score >= 250, cleared >= 25
    const runCombo: GameScoreRecord = {
      game_id: "type-before-death",
      score: 400,
      cleared: 30,
      best_combo: 25,
      survived_ms: 20000,
    };
    const unlockedCombo = evaluateGameRunAchievements(existing, [runCombo]);
    assert.deepEqual(unlockedCombo, ["type-before-death:combo-25"]);
    for (const u of unlockedCombo) existing.add(u);

    // 3. 100-wpm: requires wpm >= 100, wpm <= 350, cleared >= 10, survived_ms >= 5000, and server-authoritative proof
    const wpmEvidence = makeAuthenticEvidence("run-wpm-1", {
      outputChars: 250,
      elapsedMs: 12000,
    });
    const runWpm: GameScoreRecord = {
      game_id: "type-before-death",
      score: 500,
      cleared: 15,
      wpm: 105,
      survived_ms: 12000,
      proof: issueServerGameRunProof(
        "type-before-death",
        "run-wpm-1",
        {
          score: 500,
          cleared: 15,
          survivedMs: 12000,
          wpm: 105,
          outputChars: 250,
        },
        ["100-wpm"],
        wpmEvidence,
      ),
    };
    const unlockedWpm = evaluateGameRunAchievements(existing, [runWpm]);
    assert.deepEqual(unlockedWpm, ["type-before-death:100-wpm"]);
    for (const u of unlockedWpm) existing.add(u);

    // 4. daily challenge: requires authentic daily: variant format, score >= 200, cleared >= 5, survived_ms >= 15000
    const runDaily: GameScoreRecord = {
      game_id: "type-before-death",
      variant: "daily:normal:mission-0:rifle:scout:2026-10-07",
      score: 500,
      cleared: 10,
      survived_ms: 22000,
    };
    const unlockedDaily = evaluateGameRunAchievements(existing, [runDaily]);
    assert.deepEqual(unlockedDaily, ["type-before-death:daily"]);
    for (const u of unlockedDaily) existing.add(u);

    // 5. boss: requires campaign mode, score >= 1500, cleared >= 28, survived_ms >= 45000, accuracy >= 80, and server proof
    const bossEvidence = makeAuthenticEvidence("run-boss-1", {
      bossDefeated: true,
      elapsedMs: 50000,
    });
    const runBoss: GameScoreRecord = {
      game_id: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1550,
      cleared: 45,
      best_combo: 20,
      survived_ms: 50000,
      accuracy: 85,
      proof: issueServerGameRunProof(
        "type-before-death",
        "run-boss-1",
        {
          variant: "campaign:normal:mission-0:rifle:scout",
          score: 1550,
          cleared: 45,
          survivedMs: 50000,
          accuracy: 85,
          wavesCleared: 3,
        },
        ["boss-defeated"],
        bossEvidence,
      ),
    };
    const unlockedBoss = evaluateGameRunAchievements(existing, [runBoss]);
    assert.deepEqual(unlockedBoss, ["type-before-death:boss"]);
    for (const u of unlockedBoss) existing.add(u);

    // 6. overdrive: requires cleared >= 15, score >= 600, survived_ms >= 15000, score/cleared >= 35, and server proof
    const overdriveEvidence = makeAuthenticEvidence("run-od-1", {
      overdriveActivations: 1,
      elapsedMs: 18000,
    });
    const runOverdrive: GameScoreRecord = {
      game_id: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 700,
      cleared: 18,
      survived_ms: 18000,
      proof: issueServerGameRunProof(
        "type-before-death",
        "run-od-1",
        {
          variant: "campaign:normal:mission-0:rifle:scout",
          score: 700,
          cleared: 18,
          survivedMs: 18000,
          overdrives: 1,
        },
        ["overdrive-activated"],
        overdriveEvidence,
      ),
    };
    const unlockedOverdrive = evaluateGameRunAchievements(existing, [runOverdrive]);
    assert.deepEqual(unlockedOverdrive, ["type-before-death:overdrive"]);
    for (const u of unlockedOverdrive) existing.add(u);
  });

  // Test 1: Forged metrics, no evidence -> REJECTED
  it("F10 Adversarial 1: forged metrics without evidence are strictly rejected", () => {
    const fakeRun: GameScoreRecord = {
      game_id: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1600,
      cleared: 30,
      survived_ms: 50000,
      accuracy: 85,
    };
    const results = evaluateGameRunAchievements(new Set(), [fakeRun]);
    assert.ok(!results.includes("type-before-death:boss"), "Fake metrics without proof must be rejected");

    const proof = issueServerGameRunProof(
      "type-before-death",
      "attack-no-evidence",
      { score: 1600, cleared: 30, survivedMs: 50000, accuracy: 85, wavesCleared: 3 },
      ["boss-defeated"],
      null,
    );
    assert.equal(proof, null, "Server must refuse proof when evidence is null");
  });

  // Test 2: Forged metrics, forged complete evidence (Attack from Section 2) -> REJECTED
  it("F10 Adversarial 2: forged metrics with complete fabricated evidence (no server challenge) are strictly rejected", () => {
    // Attacker crafts complete, structurally valid GameplayEvidence object with no authentic server challenge
    const forgedCompleteEvidence: GameplayEvidence = {
      runId: "12345678-1234-4234-8234-123456789abc", // valid UUID
      seed: "attacker-chosen-valid-seed-123",
      mission: 0,
      difficulty: "normal",
      wordsCompleted: Array.from({ length: 35 }, (_, i) => `fabricated-word-${i}`),
      totalKeysTyped: 300,
      elapsedMs: 60000,
      bossDefeated: true,
      overdriveActivations: 1,
      outputChars: 300,
    };

    const proof = issueServerGameRunProof(
      "type-before-death",
      "12345678-1234-4234-8234-123456789abc",
      {
        variant: "campaign:normal:mission-0:rifle:scout",
        score: 1600,
        cleared: 35,
        survivedMs: 60000,
        accuracy: 90,
        wavesCleared: 3,
      },
      ["boss-defeated"],
      forgedCompleteEvidence,
    );
    assert.equal(proof, null, "Server MUST return null when evidence has no genuine server-issued challenge");

    const results = evaluateGameRunAchievements(new Set(), [{
      game_id: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1600,
      cleared: 35,
      survived_ms: 60000,
      accuracy: 90,
      proof,
    }]);
    assert.ok(!results.includes("type-before-death:boss"), "Achievement must NOT be granted for forged complete evidence");
  });

  // Test 3: Forged evidence with attacker-chosen seed -> REJECTED
  it("F10 Adversarial 3: forged evidence with attacker-chosen seed is strictly rejected", () => {
    const challenge = issueGameRunChallenge("type-before-death", "run-seed-tamper", { mode: "campaign", mission: 0 });
    const words = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);

    // Attacker tampers with the seed
    const tamperedEvidence: GameplayEvidence = {
      runId: "run-seed-tamper",
      seed: "attacker-chosen-seed-different-from-server",
      wordsCompleted: words.slice(0, 32),
      elapsedMs: 50000,
      bossDefeated: true,
    };

    const proof = issueServerGameRunProof(
      "type-before-death",
      "run-seed-tamper",
      {
        variant: "campaign:normal:mission-0:rifle:scout",
        score: 1600,
        cleared: 30,
        survivedMs: 50000,
        wavesCleared: 3,
        accuracy: 85,
      },
      ["boss-defeated"],
      tamperedEvidence,
    );
    assert.equal(proof, null, "Server MUST refuse proof when seed does not match server challenge");
  });

  // Test 4: Forged bossDefeated=true -> REJECTED
  it("F10 Adversarial 4: forged bossDefeated=true with insufficient transcript is strictly rejected", () => {
    const challenge = issueGameRunChallenge("type-before-death", "run-fake-boss-claim", { mode: "campaign", mission: 0 });
    const words = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);

    // Attacker claims bossDefeated = true but only cleared 5 words (wave 1 not even cleared)
    const fakeBossEvidence: GameplayEvidence = {
      runId: "run-fake-boss-claim",
      seed: challenge.seed,
      wordsCompleted: words.slice(0, 5),
      elapsedMs: 50000,
      bossDefeated: true, // Fabricated boolean!
    };

    const proof = issueServerGameRunProof(
      "type-before-death",
      "run-fake-boss-claim",
      {
        variant: "campaign:normal:mission-0:rifle:scout",
        score: 1600,
        cleared: 5,
        survivedMs: 50000,
        wavesCleared: 3,
        accuracy: 85,
      },
      ["boss-defeated"],
      fakeBossEvidence,
    );
    assert.equal(proof, null, "Server MUST refuse proof when combat verification proves boss was not defeated");
  });

  // Test 5: Forged overdriveActivations=1 -> REJECTED
  it("F10 Adversarial 5: forged overdriveActivations=1 with insufficient transcript is strictly rejected", () => {
    const challenge = issueGameRunChallenge("type-before-death", "run-fake-od-claim", { mode: "campaign", mission: 0 });
    const words = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);

    // Attacker claims overdriveActivations = 1 but only typed 4 words (< 100 energy)
    const fakeOdEvidence: GameplayEvidence = {
      runId: "run-fake-od-claim",
      seed: challenge.seed,
      wordsCompleted: words.slice(0, 4),
      elapsedMs: 18000,
      overdriveActivations: 1, // Fabricated number!
    };

    const proof = issueServerGameRunProof(
      "type-before-death",
      "run-fake-od-claim",
      {
        variant: "campaign:normal:mission-0:rifle:scout",
        score: 700,
        cleared: 18,
        survivedMs: 18000,
        overdrives: 1,
      },
      ["overdrive-activated"],
      fakeOdEvidence,
    );
    assert.equal(proof, null, "Server MUST refuse proof when energy accumulation is insufficient for overdrive");
  });

  // Test 6: Forged wordsCompleted transcript -> REJECTED
  it("F10 Adversarial 6: forged wordsCompleted transcript is strictly rejected", () => {
    const challenge = issueGameRunChallenge("type-before-death", "run-fake-transcript", { mode: "campaign", mission: 0 });

    // Attacker sends words that do NOT exist in the deterministic spawn sequence for that seed
    const fakeTranscriptEvidence: GameplayEvidence = {
      runId: "run-fake-transcript",
      seed: challenge.seed,
      wordsCompleted: ["hacker", "fake", "cheat", "exploit", "fabricated"],
      elapsedMs: 50000,
      bossDefeated: true,
    };

    const proof = issueServerGameRunProof(
      "type-before-death",
      "run-fake-transcript",
      {
        variant: "campaign:normal:mission-0:rifle:scout",
        score: 1600,
        cleared: 30,
        survivedMs: 50000,
        wavesCleared: 3,
        accuracy: 85,
      },
      ["boss-defeated"],
      fakeTranscriptEvidence,
    );
    assert.equal(proof, null, "Server MUST refuse proof when wordsCompleted do not match deterministic seed sequence");
  });

  // Test 7: Forged outputChars/WPM -> REJECTED
  it("F10 Adversarial 7: forged outputChars or WPM is strictly rejected", () => {
    const challenge = issueGameRunChallenge("type-before-death", "run-fake-wpm", { mode: "campaign", mission: 0 });
    const words = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);

    // Attacker claims 150 WPM but transcript shows only 20 chars in 12s
    const lowCharsEvidence: GameplayEvidence = {
      runId: "run-fake-wpm",
      seed: challenge.seed,
      wordsCompleted: words.slice(0, 3),
      outputChars: 20, // 20 chars in 12s => 20 Net WPM
      elapsedMs: 12000,
    };

    const proof = issueServerGameRunProof(
      "type-before-death",
      "run-fake-wpm",
      {
        score: 500,
        cleared: 15,
        survivedMs: 12000,
        wpm: 150, // Fabricated WPM!
      },
      ["100-wpm"],
      lowCharsEvidence,
    );
    assert.equal(proof, null, "Server MUST refuse proof when derived Net WPM < 100");
  });

  // Test 8: Forged variant tag -> REJECTED
  it("F10 Adversarial 8: forged variant tags (:victory, :overdrive, :daily) are strictly rejected", () => {
    const forgedVictoryEndless: GameScoreRecord = {
      game_id: "type-before-death",
      variant: "endless:normal:mission-0:rifle:scout:victory",
      score: 2000,
      cleared: 35,
      survived_ms: 60000,
      accuracy: 90,
    };
    const endlessResults = evaluateGameRunAchievements(new Set(), [forgedVictoryEndless]);
    assert.ok(!endlessResults.includes("type-before-death:boss"), "Endless :victory must never grant boss");

    const forgedDailyInCampaign: GameScoreRecord = {
      game_id: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout:daily",
      score: 800,
      cleared: 20,
      survived_ms: 20000,
    };
    const injectedDailyResults = evaluateGameRunAchievements(new Set(), [forgedDailyInCampaign]);
    assert.ok(!injectedDailyResults.includes("type-before-death:daily"), "Campaign :daily must not grant daily");
  });

  // Test 9: Forged/random HMAC -> REJECTED
  it("F10 Adversarial 9: forged or random HMAC is strictly rejected", () => {
    const fakeSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const forgedRun: GameScoreRecord = {
      game_id: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1600,
      cleared: 30,
      survived_ms: 50000,
      accuracy: 85,
      proof: {
        gameId: "type-before-death",
        runId: "run-forged-hmac",
        events: ["boss-defeated"],
        wavesCleared: 3,
        signature: fakeSignature,
      },
    };
    const results = evaluateGameRunAchievements(new Set(), [forgedRun]);
    assert.ok(!results.includes("type-before-death:boss"), "Forged HMAC must be rejected by timingSafeEqual");
  });

  // Test 10: Authentic server-backed evidence -> proof issued -> achievement granted
  it("F10 Adversarial 10: authentic server-backed evidence receives proof and achievement is granted", () => {
    const challenge = issueGameRunChallenge("type-before-death", "run-auth-test-10", { mode: "campaign", mission: 0 });
    const words = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);

    const authenticEvidence: GameplayEvidence = {
      runId: "run-auth-test-10",
      seed: challenge.seed,
      mission: challenge.mission,
      difficulty: "normal",
      wordsCompleted: words.slice(0, 32),
      totalKeysTyped: 250,
      elapsedMs: 50000,
      bossDefeated: true,
      overdriveActivations: 1,
      outputChars: 250,
    };

    const proof = issueServerGameRunProof(
      "type-before-death",
      "run-auth-test-10",
      {
        variant: "campaign:normal:mission-0:rifle:scout",
        score: 1600,
        cleared: 30,
        survivedMs: 50000,
        accuracy: 85,
        wavesCleared: 3,
      },
      ["boss-defeated"],
      authenticEvidence,
    );
    assert.ok(proof !== null, "Server MUST issue proof for authentic run with verified evidence");

    const run: GameScoreRecord = {
      game_id: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1600,
      cleared: 30,
      survived_ms: 50000,
      accuracy: 85,
      proof,
    };
    const granted = evaluateGameRunAchievements(new Set(), [run]);
    assert.ok(granted.includes("type-before-death:boss"), "Achievement must be granted for verified server proof");
  });

  // Test 11: Authentic proof replay -> no duplicate achievement
  it("F10 Adversarial 11: authentic proof replay grants zero duplicate achievements", () => {
    const challenge = issueGameRunChallenge("type-before-death", "run-auth-test-11", { mode: "campaign", mission: 0 });
    const words = deriveDeterministicWordsForChallenge(challenge.seed, challenge.mission);

    const authenticEvidence: GameplayEvidence = {
      runId: "run-auth-test-11",
      seed: challenge.seed,
      mission: challenge.mission,
      difficulty: "normal",
      wordsCompleted: words.slice(0, 32),
      totalKeysTyped: 250,
      elapsedMs: 50000,
      bossDefeated: true,
      overdriveActivations: 1,
      outputChars: 250,
    };

    const proof = issueServerGameRunProof(
      "type-before-death",
      "run-auth-test-11",
      {
        variant: "campaign:normal:mission-0:rifle:scout",
        score: 1600,
        cleared: 30,
        survivedMs: 50000,
        accuracy: 85,
        wavesCleared: 3,
      },
      ["boss-defeated"],
      authenticEvidence,
    );
    assert.ok(proof !== null);

    const run: GameScoreRecord = {
      game_id: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1600,
      cleared: 30,
      survived_ms: 50000,
      accuracy: 85,
      proof,
    };

    const pass1 = evaluateGameRunAchievements(new Set(), [run]);
    assert.ok(pass1.includes("type-before-death:boss"));
    assert.ok(pass1.includes("type-before-death:first-run"));

    const alreadyUnlocked = new Set(pass1);
    const pass2 = evaluateGameRunAchievements(alreadyUnlocked, [run]);
    assert.deepEqual(pass2, [], "Pass 2 must return 0 duplicate achievements");

    const pass3 = evaluateGameRunAchievements(alreadyUnlocked, [run]);
    assert.deepEqual(pass3, [], "Pass 3 must return 0 duplicate achievements");
  });

  it("F10: unlocks site:all-games once every playable game has at least one valid run", () => {
    const existing = new Set<string>();
    const runs: GameScoreRecord[] = PLAYABLE_GAME_LIST.map((g) => ({
      game_id: g.id,
      score: 100,
    }));

    const unlocked = evaluateGameRunAchievements(existing, runs);
    assert.ok(unlocked.includes("site:all-games"));
  });

  it("F23: evaluates historical achievement event older than newest 250 records", () => {
    const history: GameScoreRecord[] = [];

    // First 300 runs: noise without combo >= 25
    for (let i = 0; i < 300; i++) {
      history.push({
        game_id: "typing-survivor",
        score: 50,
        best_combo: 5,
        survived_ms: 10000,
      });
    }

    // Historical qualifying event at index 301 (outside the newest 250 or 300)
    history.push({
      game_id: "typing-survivor",
      score: 500,
      best_combo: 28,
      survived_ms: 45000,
    });

    // 50 more older runs
    for (let i = 0; i < 50; i++) {
      history.push({
        game_id: "typing-survivor",
        score: 20,
        best_combo: 3,
        survived_ms: 5000,
      });
    }

    assert.equal(history.length, 351);

    const unlocked = evaluateGameRunAchievements(new Set(), history);
    assert.ok(
      unlocked.includes("typing-survivor:combo-25"),
      "Historical qualifying event located beyond newest 250 records must be evaluated and awarded",
    );
  });

  it("F23 Scalability: evaluates large synthetic history (10,000 runs) deterministically and rapidly", () => {
    const syntheticRuns: GameScoreRecord[] = [];
    const games = PLAYABLE_GAME_LIST.map((g) => g.id);

    // Generate 10,000 runs with noise and duplicates
    for (let i = 0; i < 10000; i++) {
      const g = games[i % games.length]!;
      syntheticRuns.push({
        game_id: g,
        score: i % 500,
        best_combo: i % 20,
        cleared: i % 10,
        wpm: 50 + (i % 40),
        accuracy: 95,
      });
    }

    const synthEvidence = makeAuthenticEvidence("run-synth-1", {
      bossDefeated: true,
      outputChars: 500,
      elapsedMs: 50000,
    });

    // Add milestone runs near the middle
    syntheticRuns[5000] = {
      game_id: "type-before-death",
      variant: "campaign:normal:mission-0:rifle:scout",
      score: 1600,
      best_combo: 30,
      wpm: 120,
      cleared: 30,
      survived_ms: 50000,
      accuracy: 90,
      proof: issueServerGameRunProof(
        "type-before-death",
        "run-synth-1",
        {
          variant: "campaign:normal:mission-0:rifle:scout",
          score: 1600,
          cleared: 30,
          survivedMs: 50000,
          wpm: 120,
          accuracy: 90,
          outputChars: 500,
          wavesCleared: 3,
        },
        ["boss-defeated", "100-wpm"],
        synthEvidence,
      ),
    };

    const start = performance.now();
    const unlocked = evaluateGameRunAchievements(new Set(), syntheticRuns);
    const elapsed = performance.now() - start;

    assert.ok(elapsed < 100, `Evaluation took ${elapsed}ms, should be < 100ms`);
    assert.ok(unlocked.includes("type-before-death:first-run"));
    assert.ok(unlocked.includes("type-before-death:combo-25"));
    assert.ok(unlocked.includes("type-before-death:100-wpm"));
    assert.ok(unlocked.includes("type-before-death:boss"));
    assert.ok(unlocked.includes("site:all-games"));
  });

  it("F23: returns empty array when all achievements are already unlocked", () => {
    const allUnlockedSet = new Set(GAME_SCORE_ACHIEVEMENTS);
    const runs: GameScoreRecord[] = [
      { game_id: "type-before-death", score: 9999, best_combo: 100, wpm: 200, cleared: 50, survived_ms: 50000 },
    ];
    const unlocked = evaluateGameRunAchievements(allUnlockedSet, runs);
    assert.deepEqual(unlocked, []);
  });
});

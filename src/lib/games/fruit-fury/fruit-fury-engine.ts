import {
  COMBO_WINDOW_MS, FEVER_DURATION_MS, FROZEN_DURATION_MS, FRUIT_CONFIGS, TYPING_MODES,
  type ActiveFruit, type FruitFuryState, type FruitInputMode, type FruitRunMode,
  type FruitType, type GameDifficulty, type TypingMode,
} from "@/lib/games/fruit-fury/fruit-fury-types";

export const FRUIT_MISSIONS: Record<FruitRunMode, { label: string; description: string; limitMs: number | null }> = {
  classic: { label: "Classic", description: "Original endless arcade. Three lives; bombs end the run. Variant records enabled.", limitMs: null },
  tutorial: { label: "Guided lesson", description: "Four safe targets and one bomb to avoid. No life loss, no time limit, no records.", limitMs: null },
  combo: { label: "Combo eight", description: "Reach an 8-fruit combo in 45 seconds. Practice mission; no records.", limitMs: 45_000 },
  clean: { label: "Clean dozen", description: "Slice 12 in 45 seconds: no dropped fruit, wrong key, or bomb hit. No records.", limitMs: 45_000 },
};

export function fruitVariant(input: FruitInputMode, difficulty: GameDifficulty, pool: TypingMode): string {
  return `${input}:${difficulty}:${input === "touch" ? "all" : pool}`;
}

export function createFruitState(
  difficulty: GameDifficulty = "medium", typingMode: TypingMode = "all",
  inputMode: FruitInputMode = "keyboard", runMode: FruitRunMode = "classic",
): FruitFuryState {
  return {
    status: "idle", gameOverReason: null, difficulty: runMode === "tutorial" ? "easy" : difficulty,
    typingMode: inputMode === "touch" ? "all" : typingMode, inputMode, runMode,
    score: 0, level: 1, fruitsCleared: 0, lives: 3, maxLives: 3, combo: 0, maxCombo: 0,
    lastSliceTime: 0, feverGauge: 0, isFeverActive: false, feverEver: false, goldenSliced: 0,
    feverTimeRemaining: 0, isFrozenActive: false, frozenTimeRemaining: 0,
    totalTyped: 0, correctTyped: 0, bombsAvoided: 0, bombsHit: 0, missedFruits: 0,
    keyErrors: {}, missedKeys: {}, reactionTotalMs: 0, reactionSamples: 0,
    startTime: 0, elapsedMs: 0,
    screenShake: { intensity: 0, decay: 0.9, offsetX: 0, offsetY: 0 }, flashColor: null, flashAlpha: 0,
  };
}

/** Exhausted pools wait for a free key; a bomb never shares a fruit's key. */
export function pickAvailableFruitKey(pool: readonly string[], active: ReadonlySet<string>, random = Math.random): string | undefined {
  const available = [...new Set(pool)].filter((key) => !active.has(key));
  return available[Math.min(available.length - 1, Math.floor(random() * available.length))];
}

export function acceptsFruitInput(state: FruitFuryState, source: FruitInputMode): boolean {
  return state.status === "running" && state.inputMode === source;
}

export function tutorialTarget(state: FruitFuryState): FruitType {
  if (state.fruitsCleared === 0) return "apple";
  if (state.bombsAvoided === 0) return "bomb";
  if (state.fruitsCleared === 1) return "golden";
  if (state.fruitsCleared === 2) return "frozen";
  return "watermelon";
}

export function fruitMissionProgress(state: FruitFuryState): string {
  if (state.runMode === "tutorial") {
    if (state.status === "over") return "Lesson complete — try Classic or a mission.";
    const action = state.inputMode === "keyboard" ? "Type the fruit's key" : "Tap or swipe the fruit";
    switch (tutorialTarget(state)) {
      case "apple": return `1/5 · ${action}. Targets wait for you in this lesson.`;
      case "bomb": return "2/5 · Leave the bomb alone. Let it fall off the board; mistakes are safe here.";
      case "golden": return `3/5 · ${action}: gold gives bonus points and fills fever faster.`;
      case "frozen": return `4/5 · ${action}: frost slows the arena in Classic.`;
      default: return `5/5 · ${action} to finish. In Classic, avoid bombs and keep three lives.`;
    }
  }
  if (state.runMode === "combo") return `Best combo ${state.maxCombo}/8 · keep each slice within 1.4 seconds`;
  if (state.runMode === "clean") return `Clean slices ${state.fruitsCleared}/12 · no drops or wrong keys`;
  return state.inputMode === "keyboard" ? "Type fruit keys; never type a bomb's key. Escape pauses; Tab pauses and moves focus." : "Tap or drag to slice fruit. Leave bombs alone.";
}

function finishMission(state: FruitFuryState): FruitFuryState {
  if (state.status !== "running" || state.runMode === "classic") return state;
  const failed = state.runMode === "clean" && (state.missedFruits > 0 || state.totalTyped > state.correctTyped);
  const completed = state.runMode === "tutorial"
    ? state.fruitsCleared >= 4 && state.bombsAvoided >= 1
    : state.runMode === "combo" ? state.maxCombo >= 8 : state.fruitsCleared >= 12;
  const limit = FRUIT_MISSIONS[state.runMode].limitMs;
  // A slice at the deadline is too late, even if it would satisfy the target.
  const timedOut = limit !== null && state.elapsedMs >= limit;
  if (!failed && !completed && !timedOut) return state;
  return { ...state, status: "over", gameOverReason: failed ? "mission_failed" : timedOut ? "time_up" : "completed" };
}

/** Called synchronously for every target, so several hits in one pointer event accumulate. */
export function sliceFruitState(state: FruitFuryState, fruit: Pick<ActiveFruit, "type" | "letter" | "visibleAt">): FruitFuryState {
  if (state.status !== "running") return state;
  const current = finishMission(state);
  if (current.status !== "running") return current;
  if (fruit.type === "bomb") {
    return {
      ...state, status: state.runMode === "tutorial" ? "running" : "over",
      gameOverReason: state.runMode === "tutorial" ? null : "bombed", combo: 0,
      bombsHit: state.bombsHit + 1, totalTyped: state.totalTyped + 1,
      keyErrors: state.inputMode === "keyboard" ? { ...state.keyErrors, [fruit.letter]: (state.keyErrors[fruit.letter] ?? 0) + 1 } : state.keyErrors,
      screenShake: { intensity: 30, decay: 0.93, offsetX: 0, offsetY: 0 }, flashColor: "#ef4444", flashAlpha: 0.9,
    };
  }
  const combo = state.combo > 0 && state.elapsedMs - state.lastSliceTime < COMBO_WINDOW_MS ? state.combo + 1 : 1;
  const comboMultiplier = combo >= 10 ? 3 : combo >= 5 ? 2 : combo >= 3 ? 1.5 : 1;
  const points = Math.round(FRUIT_CONFIGS[fruit.type].baseScore * comboMultiplier * (state.isFeverActive ? 2 : 1)) + (fruit.type === "golden" ? 400 : 0);
  const gauge = Math.min(100, state.feverGauge + (fruit.type === "golden" ? 25 : fruit.type === "frozen" ? 0 : 6.5));
  const feverStarted = gauge >= 100 && !state.isFeverActive;
  const cleared = state.fruitsCleared + 1;
  return finishMission({
    ...state, score: state.score + points, fruitsCleared: cleared, level: 1 + Math.floor(cleared / 8),
    combo, maxCombo: Math.max(state.maxCombo, combo), lastSliceTime: state.elapsedMs,
    feverGauge: gauge, isFeverActive: state.isFeverActive || feverStarted, feverEver: state.feverEver || feverStarted,
    feverTimeRemaining: feverStarted ? FEVER_DURATION_MS : state.feverTimeRemaining,
    goldenSliced: state.goldenSliced + Number(fruit.type === "golden"),
    isFrozenActive: state.isFrozenActive || fruit.type === "frozen",
    frozenTimeRemaining: fruit.type === "frozen" ? FROZEN_DURATION_MS : state.frozenTimeRemaining,
    correctTyped: state.correctTyped + 1, totalTyped: state.totalTyped + 1,
    reactionTotalMs: state.reactionTotalMs + (fruit.visibleAt === undefined ? 0 : Math.max(0, state.elapsedMs - fruit.visibleAt)),
    reactionSamples: state.reactionSamples + Number(fruit.visibleAt !== undefined),
    screenShake: { intensity: Math.min(state.screenShake.intensity + 4, 12), decay: 0.9, offsetX: 0, offsetY: 0 },
  });
}

export function missFruitKey(state: FruitFuryState, key: string): FruitFuryState {
  if (!acceptsFruitInput(state, "keyboard") || !/^[A-Z0-9]$/i.test(key)) return state;
  const upper = key.toUpperCase();
  return finishMission({ ...state, combo: 0, totalTyped: state.totalTyped + 1, keyErrors: { ...state.keyErrors, [upper]: (state.keyErrors[upper] ?? 0) + 1 } });
}

/** Active wall time is independent of the physics step cap and excludes every pause. */
export function advanceFruitState(state: FruitFuryState, deltaMs: number, missed: readonly string[] = [], bombsAvoided = 0): FruitFuryState {
  if (state.status !== "running") return state;
  const dt = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0);
  const elapsedMs = state.elapsedMs + dt;
  const feverTimeRemaining = Math.max(0, state.feverTimeRemaining - dt);
  const frozenTimeRemaining = Math.max(0, state.frozenTimeRemaining - dt);
  const isFeverActive = state.isFeverActive && feverTimeRemaining > 0;
  const lives = state.runMode === "tutorial" ? state.lives : Math.max(0, state.lives - missed.length);
  const missedKeys = { ...state.missedKeys };
  if (state.inputMode === "keyboard") for (const key of missed) missedKeys[key] = (missedKeys[key] ?? 0) + 1;
  return finishMission({
    ...state, elapsedMs, lives, missedFruits: state.missedFruits + missed.length, missedKeys,
    bombsAvoided: state.bombsAvoided + bombsAvoided,
    status: lives <= 0 ? "over" : state.status, gameOverReason: lives <= 0 ? "lives_depleted" : state.gameOverReason,
    combo: missed.length > 0 || elapsedMs - state.lastSliceTime >= COMBO_WINDOW_MS ? 0 : state.combo,
    isFeverActive, feverTimeRemaining,
    feverGauge: state.isFeverActive ? (isFeverActive ? feverTimeRemaining / FEVER_DURATION_MS * 100 : 0) : state.feverGauge,
    isFrozenActive: state.isFrozenActive && frozenTimeRemaining > 0, frozenTimeRemaining,
  });
}

export function fruitRunSummary(state: FruitFuryState) {
  const troublesome = Object.entries(state.missedKeys).sort((a, b) => b[1] - a[1])[0]?.[0];
  const pool = troublesome ? (Object.keys(TYPING_MODES) as TypingMode[]).find((key) => key !== "all" && TYPING_MODES[key].keys.includes(troublesome)) : undefined;
  const accuracy = state.totalTyped ? Math.round(state.correctTyped / state.totalTyped * 100) : null;
  return {
    eligible: state.runMode === "classic",
    variant: fruitVariant(state.inputMode, state.difficulty, state.typingMode),
    survivedMs: Math.round(state.elapsedMs),
    accuracy: state.inputMode === "keyboard" ? accuracy : null,
    reactionMs: state.reactionSamples ? Math.round(state.reactionTotalMs / state.reactionSamples) : null,
    recommendation: state.runMode === "tutorial" ? "Next: try Easy Classic with the same controls."
      : state.bombsHit > 0 ? "Pause your blade over crowded groups; leave bomb targets alone."
      : state.inputMode === "touch" ? "Use short, deliberate swipes to avoid crossing bomb paths."
      : pool ? `Practice ${TYPING_MODES[pool].label} on Easy next; ${troublesome} was your most-dropped target.`
      : accuracy !== null && accuracy < 90 ? "Try Easy Home Row: identify a fruit before pressing its key."
      : "Keep your eyes on descending fruit and shorten the gap between slices.",
  };
}

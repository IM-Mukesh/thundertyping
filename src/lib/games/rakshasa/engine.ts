import { ENEMY_DEFINITIONS, SPECIALS, WAR_STAGES } from "@/lib/games/rakshasa/content";
import type { EnemyClass, SpecialId, WarDifficulty, WarEffect, WarEnemy, WarPhase, WarState } from "@/lib/games/rakshasa/types";
import { createRng } from "@/lib/rng/seeded-rng";
import { calculateAccuracy, calculateNetWpm } from "@/lib/typing-engine/stats";

export const MAX_ENEMIES = 6;
export const MAX_EFFECTS = 40;

const EPSILON = 0.0000001;
const INTRO_MS = 1600;
const BOSS_INTRO_MS = 1900;
const VICTORY_CINEMATIC_MS = 1400;
const WAVE_COUNTS = [5, 6, 8] as const;
const SPECIAL_KILL_SCORE = 12;
const DIFFICULTIES = {
  easy: { travel: 1.35, spawn: 1.35, hurt: 0.75, charge: 1.4, pace: 35 },
  normal: { travel: 1, spawn: 1, hurt: 1, charge: 1, pace: 50 },
  hard: { travel: 0.83, spawn: 0.8, hurt: 1.2, charge: 0.84, pace: 65 },
} as const;

// Each band covers far more than six starting letters, including replacements
// for armor. Choosing from an available letter never needs a random retry loop.
const WORDS = {
  easy: ["ash", "bane", "claw", "dusk", "ember", "fang", "guard", "hex", "iron", "jolt", "knell", "light", "mist", "night", "omen", "pyre", "quest", "rune", "shade", "thorn", "urn", "vow", "ward", "yell", "zeal"],
  normal: ["abyss", "blight", "cinder", "dread", "ember", "fiend", "gloom", "haunt", "iron", "jailer", "knight", "lament", "mortal", "night", "omen", "phantom", "quiet", "ravage", "shadow", "thorn", "unholy", "venom", "wraith", "yonder", "zealot"],
  hard: ["abyssal", "blighted", "catacomb", "darkness", "embrace", "forsaken", "graveborn", "hallowed", "ironbound", "judgment", "kinslayer", "lamented", "malignant", "nightfall", "oblivion", "phantoms", "quelling", "revenant", "sentinel", "torment", "unbroken", "vengeful", "warbound", "yearning", "zealotry"],
} as const;

const finite = (value: number, fallback = 0): number => Number.isFinite(value) ? value : fallback;
const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
const addTime = (time: number, delta: number): number => Math.min(Number.MAX_VALUE, finite(time) + delta);

export function createWarState(): WarState {
  return {
    phase: "menu", pausedFrom: null, difficulty: "normal", stage: 0, wave: 0,
    health: 100, score: 0, combo: 0, bestCombo: 0, cleared: 0,
    correctKeys: 0, incorrectKeys: 0, outputChars: 0,
    elapsedMs: 0, sceneMs: 0, phaseTimeMs: 0, targetId: null,
    enemies: [], boss: null, effects: [], energy: 0, specialUnlocks: [], specialUses: 0,
    frostMs: 0, spawnMs: 0, spawned: 0, resolved: 0, nextId: 1,
    seed: "rakshasa-war", pressure: 1, message: "Choose a stage and stand against the shadow.", tutorialStep: 0,
  };
}

export function startWar(options: {
  stage: number;
  difficulty: WarDifficulty;
  seed?: string;
  specialUnlocks?: SpecialId[];
  tutorial?: boolean;
}): WarState {
  const state = createWarState();
  state.stage = clamp(Math.trunc(finite(options.stage)), 0, WAR_STAGES.length - 1);
  state.difficulty = options.difficulty === "easy" || options.difficulty === "hard" ? options.difficulty : "normal";
  state.seed = typeof options.seed === "string" ? options.seed : state.seed;
  state.specialUnlocks = SPECIALS.filter((special) => Array.isArray(options.specialUnlocks) && options.specialUnlocks.includes(special.id)).map((special) => special.id);
  state.phase = options.tutorial ? "tutorial" : "intro";
  state.wave = options.tutorial ? 0 : 1;
  state.message = WAR_STAGES[state.stage].intro;
  if (options.tutorial) beginTutorialTarget(state, 1);
  return state;
}

function copyState(state: WarState): WarState {
  return {
    ...state,
    enemies: state.enemies.slice(0, MAX_ENEMIES).map((enemy) => ({ ...enemy })),
    boss: state.boss ? { ...state.boss } : null,
    effects: state.effects.slice(-MAX_EFFECTS).map((effect) => ({ ...effect })),
    specialUnlocks: [...state.specialUnlocks],
  };
}

function enterPhase(state: WarState, phase: WarPhase, message: string): void {
  state.phase = phase;
  state.phaseTimeMs = 0;
  state.message = message;
}

function effect(state: WarState, kind: WarEffect["kind"], lane = 1, progress = 0.8, special?: SpecialId, enemy?: WarEnemy): void {
  state.effects.push({ id: state.nextId++, kind, at: state.sceneMs, lane, progress, ...(special ? { special } : {}), ...(enemy ? { enemyId: enemy.id, enemyClass: enemy.kind } : {}) });
  if (state.effects.length > MAX_EFFECTS) state.effects.splice(0, state.effects.length - MAX_EFFECTS);
}

function advanceClocks(state: WarState, deltaMs: number, active: boolean): void {
  state.sceneMs = addTime(state.sceneMs, deltaMs);
  state.phaseTimeMs = addTime(state.phaseTimeMs, deltaMs);
  if (active) state.elapsedMs = addTime(state.elapsedMs, deltaMs);
  state.effects = state.effects.filter((item) => state.sceneMs - item.at <= (item.kind === "special" ? 1400 : 950));
}

export function warStats(state: WarState): { wpm: number; accuracy: number } {
  const wpm = calculateNetWpm(Math.max(0, finite(state.outputChars)), Math.max(0, finite(state.elapsedMs)));
  return {
    wpm: finite(wpm),
    accuracy: calculateAccuracy(Math.max(0, finite(state.correctKeys)), Math.max(0, finite(state.incorrectKeys))),
  };
}

function wordFor(state: WarState, label: string, previous?: string): string {
  const used = new Set(state.enemies.map((enemy) => enemy.word[0]));
  const band = state.difficulty === "easy" && state.stage >= 5 ? WORDS.normal : WORDS[state.difficulty];
  const choices = band.filter((word) => !used.has(word[0]) && word !== previous);
  // The authored pools have 25 unique letters, while the active cap is six.
  return createRng(`${state.seed}:word:${state.stage}:${state.wave}:${label}`).pick(choices);
}

function waveQuota(state: WarState): number {
  return WAVE_COUNTS[clamp(state.wave - 1, 0, 2)];
}

function spawnInterval(state: WarState): number {
  return 2050 * DIFFICULTIES[state.difficulty].spawn / (state.pressure * (1 + (state.wave - 1) * 0.1 + state.stage * 0.025));
}

function spawnEnemy(state: WarState): void {
  if (state.enemies.length >= MAX_ENEMIES || state.spawned >= waveQuota(state)) return;
  const rng = createRng(`${state.seed}:spawn:${state.stage}:${state.wave}:${state.spawned}`);
  const kind = rng.pick(WAR_STAGES[state.stage].enemies);
  const elite = state.wave === 3 && state.spawned === waveQuota(state) - 1;
  const definition = ENEMY_DEFINITIONS[kind];
  const id = state.nextId++;
  const word = wordFor(state, `spawn:${state.spawned}`);
  const hp = (1 + definition.armor + Number(elite)) * 100;
  state.enemies.push({
    id, kind, word, lane: rng.int(0, 2), progress: 0,
    travelMs: 14500 * DIFFICULTIES[state.difficulty].travel / (definition.speed * state.pressure * (1 + state.stage * 0.025) * (elite ? 1.08 : 1)),
    hp, maxHp: hp, elite, typed: 0, highWater: 0, bornAt: state.sceneMs, lastHitAt: -1,
  });
  state.spawned++;
  state.spawnMs = spawnInterval(state);
}

function beginTutorialTarget(state: WarState, step: number): void {
  state.tutorialStep = step;
  state.targetId = null;
  state.enemies = [];
  if (step === 3) {
    const text = "hold the line and let courage lead.";
    state.boss = { name: "Training Warden", phase: 3, hp: text.length, maxHp: text.length, text, typed: 0, highWater: 0, chargeMs: 0, chargeLimitMs: 30000 };
    state.message = "Type the entire sentence, including its spaces and final period. Take your time.";
    return;
  }
  const word = step === 1 ? "guard" : "shield";
  const hp = step === 1 ? 100 : 200;
  state.enemies.push({
    id: state.nextId++, kind: step === 1 ? "fallen-soldier" : "armored-revenant", word,
    lane: 1, progress: 0.46, travelMs: 1000000, hp, maxHp: hp, elite: false,
    typed: 0, highWater: 0, bornAt: state.sceneMs, lastHitAt: -1,
  });
  state.message = step === 1
    ? "Type guard to strike. Each correct letter attacks; mistakes leave the target unchanged."
    : "Type shield to break the armor, then complete the new word. Backspace retreats without scoring twice.";
}

function bossChargeLimit(state: WarState, phase: number): number {
  return (22000 - phase * 2400 - state.stage * 450) * DIFFICULTIES[state.difficulty].charge;
}

function prepareBoss(state: WarState): void {
  const stage = WAR_STAGES[state.stage];
  const hp = stage.sentences.reduce((total, text) => total + text.length, stage.finisher.length);
  state.boss = {
    name: stage.bossName, phase: 0, hp, maxHp: hp, text: stage.sentences[0],
    typed: 0, highWater: 0, chargeMs: 0, chargeLimitMs: bossChargeLimit(state, 0),
  };
  state.targetId = null;
  state.spawnMs = 0;
  enterPhase(state, "boss-intro", `${stage.bossName} approaches. Finish each sentence before the charged strike.`);
}

function advanceWave(state: WarState): void {
  if (state.wave === 3) {
    prepareBoss(state);
    return;
  }
  // Adapt only between waves, by at most 0.08 per boundary. These are measured
  // unique characters over ALL active time; score and WPM are never adjusted.
  const measured = warStats(state).wpm;
  const desired = clamp(1 + (measured / DIFFICULTIES[state.difficulty].pace - 1) * 0.12, 0.88, 1.14);
  state.pressure = clamp(desired, state.pressure - 0.08, state.pressure + 0.08);
  state.wave++;
  state.spawned = 0;
  state.resolved = 0;
  state.spawnMs = 650;
  state.phaseTimeMs = 0;
  state.message = `Wave ${state.wave}: ${state.wave === 3 ? "an elite warrior leads the final assault." : "the next ranks are approaching."}`;
}

function breachAt(enemy: WarEnemy): number {
  return enemy.kind === "necromancer" ? 0.68 : 1;
}

function accelerationAt(enemy: WarEnemy): number {
  return enemy.kind === "possessed-human" ? 0.55 : enemy.kind === "shadow-soldier" ? 0.72 : 1;
}

function movementRate(state: WarState, enemy: WarEnemy): number {
  let rate = 1 / Math.max(1, finite(enemy.travelMs, 14500));
  if (enemy.progress >= accelerationAt(enemy) - EPSILON) {
    if (enemy.kind === "possessed-human") rate *= 1.6;
    if (enemy.kind === "shadow-soldier") rate *= 1.5;
  }
  if (state.frostMs > 0) {
    rate *= enemy.kind === "burning-undead" ? 0.65 : enemy.kind === "wraith" ? 0.6 : enemy.kind === "flying-wraith" ? 0.45 : 0.35;
  }
  return rate;
}

function hurtPlayer(state: WarState, amount: number, lane: number, progress: number, message: string): void {
  state.health = Math.max(0, state.health - amount);
  state.combo = 0;
  effect(state, "hurt", lane, progress);
  state.message = message;
  if (state.health === 0) enterPhase(state, "defeat", "The line has fallen. Rally and try again.");
}

function settlePlaying(state: WarState): void {
  // Equal-time breaches resolve by ID, independent of array iteration order.
  for (const enemy of [...state.enemies].sort((a, b) => a.id - b.id)) {
    if (enemy.progress < breachAt(enemy) - EPSILON) continue;
    state.enemies = state.enemies.filter((candidate) => candidate.id !== enemy.id);
    state.resolved++;
    if (state.targetId === enemy.id) state.targetId = null;
    const damage = Math.round((ENEMY_DEFINITIONS[enemy.kind].damage + Number(enemy.elite) * 5) * DIFFICULTIES[state.difficulty].hurt);
    hurtPlayer(state, damage, enemy.lane, enemy.progress, enemy.kind === "necromancer" ? "The ranged curse struck. Prioritize the robed caster." : "An enemy breached the line. Complete words before they reach you.");
    if (state.phase === "defeat") return;
  }
  if (state.spawned >= waveQuota(state) && state.enemies.length === 0) {
    advanceWave(state);
    return;
  }
  if (state.spawnMs <= EPSILON && state.spawned < waveQuota(state) && state.enemies.length < MAX_ENEMIES) spawnEnemy(state);
}

function nextPlayingEvent(state: WarState, remaining: number): number {
  let next = remaining;
  if (state.frostMs > 0) next = Math.min(next, state.frostMs);
  if (state.spawned < waveQuota(state) && state.enemies.length < MAX_ENEMIES) next = Math.min(next, Math.max(0, state.spawnMs));
  for (const enemy of state.enemies) {
    const acceleration = accelerationAt(enemy);
    const boundary = enemy.progress < acceleration - EPSILON ? Math.min(acceleration, breachAt(enemy)) : breachAt(enemy);
    next = Math.min(next, Math.max(0, boundary - enemy.progress) / movementRate(state, enemy));
  }
  return next;
}

function advancePlaying(state: WarState, deltaMs: number): void {
  for (const enemy of state.enemies) enemy.progress = Math.min(breachAt(enemy), enemy.progress + deltaMs * movementRate(state, enemy));
  state.spawnMs = Math.max(0, state.spawnMs - deltaMs);
  state.frostMs = Math.max(0, state.frostMs - deltaMs);
  advanceClocks(state, deltaMs, true);
}

function bossAttack(state: WarState): void {
  const boss = state.boss;
  if (!boss) return;
  boss.chargeMs = 0;
  hurtPlayer(state, Math.round((14 + state.stage + boss.phase * 3) * DIFFICULTIES[state.difficulty].hurt), 1, 0.86,
    `${boss.name} released the charged strike. Your typed progress is preserved; finish the sentence.`);
}

function advanceBoss(state: WarState, remaining: number): number {
  const boss = state.boss;
  if (!boss) return remaining;
  const rate = state.frostMs > 0 ? 0.4 : 1;
  const next = Math.min(remaining, state.frostMs > 0 ? state.frostMs : remaining, Math.max(0, boss.chargeLimitMs - boss.chargeMs) / rate);
  boss.chargeMs += next * rate;
  state.frostMs = Math.max(0, state.frostMs - next);
  advanceClocks(state, next, true);
  if (boss.chargeMs >= boss.chargeLimitMs - EPSILON) bossAttack(state);
  return next;
}

/** Event-driven integration consumes the whole delay, including transitions.
 * There is no frame-delta cap: idle time is real time in the typing metrics. */
export function tickWar(state: WarState, deltaMs: number): WarState {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0 || state.phase === "paused" || state.phase === "menu") return state;
  const next = copyState(state);
  let remaining = deltaMs;
  while (remaining > 0) {
    if (next.phase === "intro" || next.phase === "boss-intro") {
      const intro = next.phase === "intro";
      const limit = intro ? INTRO_MS : BOSS_INTRO_MS;
      const step = Math.min(remaining, Math.max(0, limit - next.phaseTimeMs));
      advanceClocks(next, step, false);
      remaining -= step;
      if (next.phaseTimeMs >= limit - EPSILON) {
        enterPhase(next, intro ? "playing" : "boss", intro ? "Wave 1: type a starting letter to lock a target." : "Type the sentence. The charge meter warns of the next attack.");
        if (intro) settlePlaying(next);
      }
      continue;
    }
    if (next.phase === "tutorial") {
      advanceClocks(next, remaining, true);
      remaining = 0;
      continue;
    }
    if (next.phase === "playing") {
      settlePlaying(next);
      if (next.phase !== "playing") continue;
      const step = nextPlayingEvent(next, remaining);
      advancePlaying(next, step);
      remaining -= step;
      settlePlaying(next);
      continue;
    }
    if (next.phase === "boss" || (next.phase === "finisher" && next.boss && next.boss.typed < next.boss.text.length)) {
      if (!next.boss) {
        enterPhase(next, "defeat", "The enemy formation was interrupted. Rally for another run.");
        continue;
      }
      remaining -= advanceBoss(next, remaining);
      continue;
    }
    if (next.phase === "finisher") {
      // A finisher needs real output. Only its COMPLETED buffer starts the
      // cinematic; this also represents the safe tutorial's final sentence.
      if (!next.boss || next.boss.typed < next.boss.text.length) {
        enterPhase(next, "defeat", "Complete the final sentence to claim victory.");
        continue;
      }
      const step = Math.min(remaining, Math.max(0, VICTORY_CINEMATIC_MS - next.phaseTimeMs));
      advanceClocks(next, step, false);
      remaining -= step;
      if (next.phaseTimeMs >= VICTORY_CINEMATIC_MS - EPSILON) enterPhase(next, "victory", next.tutorialStep ? "Training complete. Your blade is ready for the campaign." : "The shadow falls. This land can welcome the dawn.");
      continue;
    }
    advanceClocks(next, remaining, false);
    remaining = 0;
  }
  return next;
}

const PAUSABLE: readonly WarPhase[] = ["tutorial", "intro", "playing", "boss-intro", "boss", "finisher"];

export function pauseWar(state: WarState): WarState {
  if (!PAUSABLE.includes(state.phase)) return state;
  return { ...state, pausedFrom: state.phase, phase: "paused" };
}

export function resumeWar(state: WarState): WarState {
  if (state.phase !== "paused") return state;
  return { ...state, phase: state.pausedFrom && PAUSABLE.includes(state.pausedFrom) ? state.pausedFrom : "menu", pausedFrom: null };
}

function mistake(state: WarState): void {
  state.incorrectKeys++;
  state.combo = 0;
  const target = state.enemies.find((enemy) => enemy.id === state.targetId);
  const expected = state.boss?.text[state.boss.typed] ?? target?.word[target.typed];
  state.message = expected ? `Wrong key — streak broken. Next character: ${expected === " " ? "space" : expected}. Your progress is preserved.` : "Wrong key — streak broken. Type a visible word's first letter to lock a target.";
}

function completeOutput(state: WarState, characters: number): void {
  state.combo++;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.score += Math.round(characters * 10 * (1 + Math.min(state.combo - 1, 20) * 0.05));
  state.energy = Math.min(100, state.energy + 8);
}

function defeatEnemy(state: WarState, enemy: WarEnemy, special = false): void {
  state.enemies = state.enemies.filter((candidate) => candidate.id !== enemy.id);
  if (state.targetId === enemy.id) state.targetId = null;
  state.cleared++;
  state.resolved++;
  effect(state, "kill", enemy.lane, enemy.progress, undefined, enemy);
  if (special) state.score += SPECIAL_KILL_SCORE;
}

function typeEnemy(state: WarState, key: string): void {
  const locked = state.enemies.find((enemy) => enemy.id === state.targetId && enemy.typed > 0);
  const enemy = locked ?? state.enemies
    .filter((candidate) => candidate.word[0] === key)
    .sort((a, b) => b.progress - a.progress || a.id - b.id)[0];
  if (!enemy) {
    mistake(state);
    return;
  }
  state.targetId = enemy.id;
  if (key !== enemy.word[enemy.typed]) {
    mistake(state);
    return;
  }
  state.correctKeys++;
  enemy.typed++;
  enemy.lastHitAt = state.sceneMs;
  effect(state, "attack", enemy.lane, enemy.progress, undefined, enemy);
  // Physical retypes remain correct attempts for accuracy, but cannot deal
  // damage, earn energy, or add typing output for an already reached prefix.
  if (enemy.typed > enemy.highWater) {
    enemy.highWater = enemy.typed;
    state.outputChars++;
    state.energy = Math.min(100, state.energy + 1);
    enemy.hp = Math.max(0, enemy.hp - 100 / enemy.word.length);
  }
  if (enemy.typed !== enemy.word.length) return;
  completeOutput(state, enemy.word.length);
  if (enemy.hp <= EPSILON) {
    defeatEnemy(state, enemy);
    if (state.phase === "tutorial") beginTutorialTarget(state, state.tutorialStep + 1);
    else settlePlaying(state);
    return;
  }
  const previous = enemy.word;
  enemy.hp = Math.round(enemy.hp / 100) * 100;
  enemy.word = state.phase === "tutorial" ? "resolve" : wordFor(state, `armor:${enemy.id}:${enemy.hp}`, previous);
  enemy.typed = 0;
  enemy.highWater = 0;
  state.targetId = null;
  state.message = `Armor shattered. Type ${enemy.word} to continue the attack.`;
}

function typeBoss(state: WarState, key: string): void {
  const boss = state.boss;
  if (!boss || boss.typed >= boss.text.length) return;
  if (key !== boss.text[boss.typed]) {
    mistake(state);
    return;
  }
  state.correctKeys++;
  boss.typed++;
  effect(state, "boss-hit", 1, 0.87);
  if (boss.typed > boss.highWater) {
    boss.highWater = boss.typed;
    state.outputChars++;
    state.energy = Math.min(100, state.energy + 1);
    boss.hp = Math.max(0, boss.hp - 1);
  }
  if (boss.typed !== boss.text.length) return;
  completeOutput(state, boss.text.length);
  if (state.phase === "tutorial" || boss.phase === 3) {
    boss.hp = 0;
    boss.chargeMs = 0;
    enterPhase(state, "finisher", "The final words strike true. The shadow is breaking.");
    return;
  }
  boss.phase++;
  boss.text = boss.phase === 3 ? WAR_STAGES[state.stage].finisher : WAR_STAGES[state.stage].sentences[boss.phase];
  boss.typed = 0;
  boss.highWater = 0;
  boss.chargeMs = 0;
  boss.chargeLimitMs = bossChargeLimit(state, boss.phase);
  enterPhase(state, boss.phase === 3 ? "finisher" : "boss", boss.phase === 3
    ? "One final sentence seals the victory. Type it completely."
    : `The boss changes stance. Sentence ${boss.phase + 1}: the next charge comes sooner.`);
}

function retreat(state: WarState): void {
  if (state.boss && (state.phase === "boss" || state.phase === "finisher" || (state.phase === "tutorial" && state.tutorialStep === 3))) {
    state.boss.typed = Math.max(0, state.boss.typed - 1);
    return;
  }
  const target = state.enemies.find((enemy) => enemy.id === state.targetId);
  if (!target) return;
  target.typed = Math.max(0, target.typed - 1);
  if (target.typed === 0) state.targetId = null;
}

function spectral(kind: EnemyClass): boolean {
  return kind === "wraith" || kind === "flying-wraith";
}

function activateSpecial(state: WarState, key: string): WarState {
  const special = SPECIALS.find((candidate) => candidate.key === key);
  if (!special || !state.specialUnlocks.includes(special.id) || finite(state.energy) < special.cost || state.phase === "tutorial") return state;
  const next = copyState(state);
  next.energy -= special.cost;
  next.specialUses++;
  effect(next, "special", 1, 0.65, special.id);
  if (special.id === "frost") {
    next.frostMs = Math.max(next.frostMs, 6000);
    next.message = "Frost slows the advance and charged attacks for six seconds.";
  } else if (next.phase === "playing") {
    let kills = 0;
    const limit = special.id === "shockwave" ? 2 : 3;
    const ordered = [...next.enemies].sort((a, b) => b.progress - a.progress || a.id - b.id);
    for (const enemy of ordered) {
      if (spectral(enemy.kind) || (special.id === "ember" && enemy.kind === "burning-undead")) continue;
      if (kills < limit && !enemy.elite && ENEMY_DEFINITIONS[enemy.kind].armor === 0) {
        defeatEnemy(next, enemy, true);
        kills++;
      } else if (special.id === "shockwave" && enemy.kind !== "shadow-soldier") {
        enemy.progress = Math.max(0, enemy.progress - 0.22);
      }
    }
    next.message = `${special.name}: ${kills} enemy${kills === 1 ? "" : "s"} cleared, ${kills * SPECIAL_KILL_SCORE} support points. Armor still requires complete words.`;
    settlePlaying(next);
  } else if (next.boss) {
    // A small interruption buys time, never sentence progress or boss damage.
    next.boss.chargeMs = Math.max(0, next.boss.chargeMs - (special.id === "shockwave" ? 1200 : 800));
    next.message = "The boss charge falters, but its guard holds. Finish the typed sentence.";
  }
  return next;
}

export function typeWarKey(state: WarState, key: string): WarState {
  if (typeof key !== "string") return state;
  const normalized = key.toLowerCase();
  const active = state.phase === "playing" || state.phase === "boss" || state.phase === "tutorial" || state.phase === "finisher";
  const cinematic = state.phase === "finisher" && state.boss && state.boss.typed === state.boss.text.length;
  if (!active || cinematic || normalized === "escape" || normalized === "tab") return state;
  if (normalized === "1" || normalized === "2" || normalized === "3") return activateSpecial(state, normalized);
  if (normalized !== "backspace" && normalized.length !== 1) return state;
  const next = copyState(state);
  if (normalized === "backspace") retreat(next);
  else if (next.phase === "boss" || next.phase === "finisher" || (next.phase === "tutorial" && next.tutorialStep === 3)) typeBoss(next, normalized);
  else typeEnemy(next, normalized);
  return next;
}

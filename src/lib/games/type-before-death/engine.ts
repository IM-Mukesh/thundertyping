import { calculateAccuracy, calculateNetWpm } from "@/lib/typing-engine/stats";
import { createRng, dailySeed, dailySeedFor, hashSeed } from "@/lib/rng/seeded-rng";
import {
  DEATH_BRIEFING_MS,
  DEATH_DIFFICULTIES,
  DEATH_ENEMIES,
  DEATH_JAM_MS,
  DEATH_LIMITS,
  DEATH_MISSIONS,
  DEATH_OVERDRIVE_MS,
  DEATH_SPIT_MS,
  DEATH_WORDS,
  DEATH_UPGRADES,
  DEATH_UPGRADE_REGISTRY,
  DEATH_SURVIVOR_REGISTRY,
  DEATH_WEAPON_REGISTRY,
} from "@/lib/games/type-before-death/content";
import type {
  DeathBoss,
  DeathDailyChallenge,
  DeathDifficulty,
  DeathEffect,
  DeathEnemy,
  DeathEnemyKind,
  DeathMode,
  DeathPhase,
  DeathRunStats,
  DeathState,
  DeathStats,
  DeathStartOptions,
  DeathUpgradeId,
  DeathWordTier,
} from "@/lib/games/type-before-death/types";

export const MAX_DEATH_ENEMIES = DEATH_LIMITS.enemies;
export const MAX_DEATH_EFFECTS = DEATH_LIMITS.effects;
export const DEATH_WAVE_NOTICE_MS = 850;
export const DEATH_BOSS_INTRO_MS = 1200;
export const DEATH_BOSS_MAX_PHASE = 3;

const EPSILON = 1e-9;
const TIME_QUANTUM = 1e-6;
const PROGRESS_QUANTUM = 1e-12;
const MAX_SAFE_COUNTER = DEATH_LIMITS.counter;
const ACTIVE_PHASES: readonly DeathPhase[] = ["combat", "boss"];
const PAUSABLE_PHASES: readonly DeathPhase[] = ["briefing", "combat", "boss", "wave", "upgrade"];

const finite = (value: number, fallback = 0): number => Number.isFinite(value) ? value : fallback;
const positive = (value: number, fallback = 0): number => Math.max(0, finite(value, fallback));
const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, finite(value, low)));
const integer = (value: number, low: number, high: number): number => Math.trunc(clamp(value, low, high));
const counter = (value: number): number => Math.min(MAX_SAFE_COUNTER, Math.max(0, Math.floor(positive(value))));
const boundedScore = (value: number): number => Math.min(DEATH_LIMITS.score, Math.max(0, Math.floor(positive(value))));
const quantize = (value: number, quantum: number): number => Math.round(value / quantum) * quantum;
const addTime = (value: number, delta: number): number => Math.min(Number.MAX_VALUE, quantize(positive(value) + positive(delta), TIME_QUANTUM));

function canonicalDay(value: string | Date | undefined): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) return dailySeed(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isFinite(parsed.getTime()) && dailySeed(parsed) === value) return value;
  }
  return dailySeed(new Date(0));
}

/** The canonical UTC seed shared by every Type Before Death daily player. */
export function dailyChallengeSeed(day: string | Date = new Date()): string {
  const normalized = canonicalDay(day);
  return dailySeedFor("type-before-death", new Date(`${normalized}T00:00:00.000Z`));
}

export function getDailyChallenge(day: string | Date = new Date()): DeathDailyChallenge {
  const normalizedDay = canonicalDay(day);
  const seed = dailyChallengeSeed(normalizedDay);
  return {
    day: normalizedDay,
    seed,
    mission: hashSeed(`${seed}:mission`) % DEATH_MISSIONS.length,
    difficulty: "normal",
  };
}

/** Alias used by controllers that name the game rather than its abbreviated id. */
export const getTypeBeforeDeathDailyChallenge = getDailyChallenge;
export const typeBeforeDeathDailySeed = dailyChallengeSeed;

export function startDailyDeath(day: string | Date = new Date(), runId?: string): DeathState {
  return startDeath({ mode: "daily", day, ...(runId ? { runId } : {}) });
}

function freshUpgrades(): DeathState["upgrades"] {
  return {
    "hollow-point": 0,
    longshot: 0,
    quickload: 0,
    coolant: 0,
    reinforcement: 0,
    "field-medic": 0,
    capacitor: 0,
    precision: 0,
    salvager: 0,
  };
}

export function createDeathState(): DeathState {
  return {
    phase: "menu",
    pausedFrom: null,
    mode: "campaign",
    difficulty: "normal",
    mission: 0,
    wave: 0,
    seed: "type-before-death",
    runId: "",
    dailyDay: null,
    weapon: "pistol",
    survivor: "soldier",
    health: 100,
    maxHealth: 100,
    barricade: 100,
    maxBarricade: 100,
    score: 0,
    combo: 0,
    bestCombo: 0,
    correctKeys: 0,
    incorrectKeys: 0,
    outputChars: 0,
    wordsCompleted: 0,
    cleanWords: 0,
    cleared: 0,
    missed: 0,
    damageDealt: 0,
    damageTaken: 0,
    wavesCleared: 0,
    overdrives: 0,
    jams: 0,
    elapsedMs: 0,
    sceneMs: 0,
    phaseTimeMs: 0,
    targetId: null,
    enemies: [],
    boss: null,
    effects: [],
    heat: 0,
    jamMs: 0,
    energy: 0,
    overdriveMs: 0,
    spawnMs: 0,
    spawned: 0,
    resolved: 0,
    waveKills: 0,
    nextId: 1,
    nextEffectId: 1,
    upgrades: freshUpgrades(),
    upgradeChoices: [],
    outcome: null,
    resultReason: null,
    message: "Choose a mission and hold the barricade.",
  };
}

function copyState(state: DeathState): DeathState {
  return {
    ...state,
    enemies: state.enemies.slice(0, MAX_DEATH_ENEMIES).map((enemy) => ({ ...enemy })),
    boss: state.boss ? { ...state.boss } : null,
    effects: state.effects.slice(-MAX_DEATH_EFFECTS).map((effect) => ({ ...effect })),
    upgradeChoices: [...state.upgradeChoices],
    upgrades: { ...state.upgrades },
  };
}

function missionFor(state: DeathState) {
  return DEATH_MISSIONS[integer(state.mission, 0, DEATH_MISSIONS.length - 1)];
}

function difficultyFor(state: DeathState) {
  return DEATH_DIFFICULTIES[state.difficulty];
}

function weaponFor(state: DeathState) {
  return DEATH_WEAPON_REGISTRY[state.weapon];
}

function survivorFor(state: DeathState) {
  return DEATH_SURVIVOR_REGISTRY[state.survivor];
}

function enterPhase(state: DeathState, phase: DeathPhase, message: string): void {
  state.phase = phase;
  state.phaseTimeMs = 0;
  state.message = message;
}

function addEffect(state: DeathState, kind: DeathEffect["kind"], lane: number, progress: number, enemy?: DeathEnemy, amount?: number): void {
  const effect: DeathEffect = {
    id: state.nextEffectId++,
    kind,
    at: state.sceneMs,
    lane: integer(lane, 0, 4),
    progress: clamp(progress, 0, 1),
    ...(enemy ? { enemyId: enemy.id, enemyKind: enemy.kind } : {}),
    ...(amount != null ? { amount: finite(amount) } : {}),
  };
  state.effects.push(effect);
  if (state.effects.length > MAX_DEATH_EFFECTS) state.effects.splice(0, state.effects.length - MAX_DEATH_EFFECTS);
}

function advanceClocks(state: DeathState, deltaMs: number, active: boolean): void {
  const delta = positive(deltaMs);
  state.sceneMs = addTime(state.sceneMs, delta);
  state.phaseTimeMs = addTime(state.phaseTimeMs, delta);
  if (active) state.elapsedMs = Math.min(DEATH_LIMITS.runMs, addTime(state.elapsedMs, delta));
  state.effects = state.effects.filter((effect) => state.sceneMs - effect.at <= 1200);
}

function wordPool(tier: DeathWordTier): readonly string[] {
  return DEATH_WORDS[tier];
}

function chooseWord(state: DeathState, tier: DeathWordTier, label: string, previous = ""): string {
  const pool = wordPool(tier);
  const occupied = new Set(state.enemies.filter((enemy) => enemy.word !== previous).map((enemy) => enemy.word[0]));
  const shuffled = createRng(`${state.seed}:word:${state.wave}:${label}`).shuffle(pool);
  return shuffled.find((word) => !occupied.has(word[0]) && word !== previous) ?? shuffled.find((word) => word !== previous) ?? pool[0];
}

function speedFor(state: DeathState, enemy: DeathEnemy): number {
  const definition = DEATH_ENEMIES[enemy.kind];
  let multiplier = definition.speed;
  if (enemy.kind === "runner" && enemy.progress >= 0.5) multiplier *= 1.45;
  if (enemy.kind === "swarm") {
    const pack = state.enemies.filter((candidate) => candidate.kind === "swarm").length;
    multiplier *= 1 + Math.min(3, Math.max(0, pack - 1)) * 0.08;
  }
  if (enemy.kind === "elite" && enemy.hp <= enemy.maxHp * 0.5) multiplier *= 1.35;
  if (state.overdriveMs > 0) multiplier *= 0.82;
  return multiplier / Math.max(1, enemy.travelMs);
}

function wordForKind(kind: Exclude<DeathEnemyKind, "boss">): DeathWordTier {
  return DEATH_ENEMIES[kind].tier;
}

function waveQuota(state: DeathState): number {
  return 4 + state.wave * 2 + Math.min(state.mission, 3);
}

export function deathWaveQuota(state: DeathState): number {
  return waveQuota(state);
}

function spawnInterval(state: DeathState): number {
  const mission = missionFor(state);
  const pressure = 1 + Math.max(0, state.wave - 1) * 0.11 + state.mission * 0.025;
  return mission.approachMs * 0.15 * difficultyFor(state).spawn / pressure;
}

function spawnEnemy(state: DeathState): void {
  if (state.enemies.length >= MAX_DEATH_ENEMIES || state.spawned >= waveQuota(state)) return;
  const mission = missionFor(state);
  const rng = createRng(`${state.seed}:spawn:${state.mission}:${state.wave}:${state.spawned}`);
  const available = mission.enemies.length > 0 ? mission.enemies : ["walker"] as const;
  const kind = rng.pick(available);
  const definition = DEATH_ENEMIES[kind];
  const id = state.nextId++;
  const tier = wordForKind(kind);
  const word = chooseWord(state, tier, `spawn:${state.spawned}`);
  const waveScale = 1 + Math.max(0, state.wave - 1) * 0.12 + state.mission * 0.025;
  const eliteScale = kind === "elite" ? 1.1 : 1;
  const maxHp = Math.max(1, definition.hp * difficultyFor(state).hp * waveScale * eliteScale);
  const travelMs = mission.approachMs * difficultyFor(state).travel / waveScale;
  const visible = kind !== "stalker";
  const enemy: DeathEnemy = {
    id,
    kind,
    lane: rng.int(0, 4),
    lateral: Math.round(rng.range(-100, 100)) / 100,
    progress: 0,
    travelMs,
    hp: maxHp,
    maxHp,
    word,
    tier,
    typed: 0,
    highWater: 0,
    wordSerial: 0,
    wordMistakes: 0,
    visible,
    bornAt: state.sceneMs,
    lastHitAt: -1,
    attackMs: DEATH_SPIT_MS,
    regenMs: 0,
  };
  state.enemies.push(enemy);
  state.spawned = counter(state.spawned + 1);
  state.spawnMs = spawnInterval(state);
}

function bossChargeLimit(state: DeathState, phase: 1 | 2 | 3): number {
  return (12000 - (phase - 1) * 2600 - state.mission * 180) * (state.difficulty === "easy" ? 1.2 : state.difficulty === "hard" ? 0.78 : 1);
}

function createBoss(state: DeathState): DeathBoss {
  const definition = DEATH_ENEMIES.boss;
  const maxHp = definition.hp * difficultyFor(state).hp * (1 + state.mission * 0.1);
  const boss: DeathBoss = {
    id: state.nextId++,
    kind: "boss",
    name: missionFor(state).bossName,
    bossPhase: 1,
    lane: 2,
    lateral: 0,
    progress: 0,
    travelMs: Number.MAX_SAFE_INTEGER,
    hp: maxHp,
    maxHp,
    word: chooseWord(state, "long", "boss:1"),
    tier: "long",
    typed: 0,
    highWater: 0,
    wordSerial: 0,
    wordMistakes: 0,
    visible: true,
    bornAt: state.sceneMs,
    lastHitAt: -1,
    attackMs: 0,
    regenMs: 0,
    chargeMs: 0,
    chargeLimitMs: bossChargeLimit(state, 1),
    wordsThisCharge: 0,
    attacks: 0,
  };
  return boss;
}

function prepareBoss(state: DeathState): void {
  state.boss = createBoss(state);
  state.targetId = state.boss.id;
  state.spawnMs = Number.MAX_SAFE_INTEGER;
  state.enemies = [];
  enterPhase(state, "boss", `${state.boss.name} enters phase one. Type the sentence before the charged strike.`);
}

function drawUpgradeChoices(state: DeathState): DeathUpgradeId[] {
  const available = DEATH_UPGRADES.filter((upgrade) => state.upgrades[upgrade.id] < upgrade.maxRank);
  if (available.length <= 3) return available.map((upgrade) => upgrade.id);
  return createRng(`${state.seed}:upgrade:${state.wave}:${state.wavesCleared}`).sample(available, 3).map((upgrade) => upgrade.id);
}

function enterUpgrade(state: DeathState): void {
  state.upgradeChoices = drawUpgradeChoices(state);
  if (state.upgradeChoices.length === 0) {
    beginNextWave(state);
    return;
  }
  enterPhase(state, "upgrade", "Choose one field upgrade before the next wave.");
  addEffect(state, "upgrade", 2, 0.5);
}

function beginNextWave(state: DeathState): void {
  state.waveKills = 0;
  state.spawned = 0;
  state.resolved = 0;
  state.spawnMs = 0;
  state.targetId = null;
  state.upgradeChoices = [];
  if (state.mode !== "endless" && state.wavesCleared >= missionFor(state).waves) {
    prepareBoss(state);
    return;
  }
  if (state.mode === "endless" && state.wave > 1 && state.wave % 5 === 0) {
    prepareBoss(state);
    return;
  }
  enterPhase(state, "wave", `Wave ${state.wave} incoming. The next line is forming.`);
}

function enterCombat(state: DeathState): void {
  enterPhase(state, "combat", `Wave ${state.wave}: type a visible first letter to lock a target.`);
  state.spawnMs = 0;
  settleCombat(state);
}

function completeWave(state: DeathState): void {
  state.wavesCleared = counter(state.wavesCleared + 1);
  state.barricade = clamp(state.barricade + 10, 0, state.maxBarricade);
  addEffect(state, "wave", 2, 0.5);
  if (state.mode !== "endless" && state.wavesCleared >= missionFor(state).waves) {
    state.upgradeChoices = [];
    enterPhase(state, "wave", "The final wave is clear. The commander is breaking through.");
  } else {
    state.wave += 1;
    enterUpgrade(state);
  }
}

function setResults(state: DeathState, outcome: "victory" | "defeat", reason: DeathState["resultReason"]): void {
  state.health = clamp(state.health, 0, state.maxHealth);
  state.barricade = clamp(state.barricade, 0, state.maxBarricade);
  state.outcome = outcome;
  state.resultReason = reason;
  state.targetId = null;
  enterPhase(state, "results", outcome === "victory" ? "The commander is down. Dawn survives." : "The barricade has fallen. Type again and hold the line.");
}

function takeDamage(state: DeathState, amount: number, lane: number, progress: number, kind: DeathEffect["kind"] = "breach"): void {
  const damage = Math.max(0, Math.round(amount * difficultyFor(state).damage));
  if (damage <= 0 || state.phase === "results") return;
  const barricadeDamage = Math.min(state.barricade, damage);
  state.barricade = clamp(state.barricade - barricadeDamage, 0, state.maxBarricade);
  const healthDamage = damage - barricadeDamage;
  state.health = clamp(state.health - healthDamage, 0, state.maxHealth);
  state.damageTaken = counter(state.damageTaken + damage);
  state.combo = 0;
  addEffect(state, kind, lane, progress, undefined, damage);
  state.message = healthDamage > 0 ? "The barricade is broken. Protect your remaining health." : "The barricade absorbed the hit.";
  if (state.health <= 0) setResults(state, "defeat", "health-depleted");
}

function enemyDamageOnBreach(state: DeathState, enemy: DeathEnemy): number {
  const definition = DEATH_ENEMIES[enemy.kind];
  if (enemy.kind === "bomber") return definition.damage * 1.35;
  if (enemy.kind === "stalker") return definition.damage * 1.15;
  return definition.damage;
}

function removeEnemy(state: DeathState, enemy: DeathEnemy, killed: boolean): void {
  state.enemies = state.enemies.filter((candidate) => candidate.id !== enemy.id);
  if (state.targetId === enemy.id) state.targetId = null;
  state.resolved = counter(state.resolved + 1);
  if (killed) {
    state.cleared = counter(state.cleared + 1);
    state.waveKills = counter(state.waveKills + 1);
    state.barricade = clamp(state.barricade + state.upgrades.salvager * 2, 0, state.maxBarricade);
    addEffect(state, "kill", enemy.lane, enemy.progress, enemy);
  } else {
    state.missed = counter(state.missed + 1);
  }
}

function settleEnemyEvents(state: DeathState): void {
  for (const enemy of [...state.enemies].sort((a, b) => a.id - b.id)) {
    if (!state.enemies.some((candidate) => candidate.id === enemy.id)) continue;
    if (enemy.kind === "stalker" && !enemy.visible && enemy.progress >= 0.3 - EPSILON) {
      enemy.visible = true;
      state.message = "A stalker emerged from the mist. Lock it before it reaches the line.";
    }
    if (enemy.kind === "spitter" && enemy.progress >= 0.62 - EPSILON && enemy.attackMs <= EPSILON) {
      takeDamage(state, DEATH_ENEMIES.spitter.damage * 0.65, enemy.lane, enemy.progress, "acid");
      if (state.phase === "results") return;
      enemy.attackMs = DEATH_SPIT_MS;
      addEffect(state, "acid", enemy.lane, enemy.progress, enemy);
    }
    if (enemy.kind === "mutant" && enemy.regenMs >= 3000 - EPSILON && enemy.hp > 0) {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + 9);
      enemy.regenMs = 0;
    }
    if (enemy.kind === "bomber" && enemy.progress >= 0.76 - EPSILON) {
      takeDamage(state, enemyDamageOnBreach(state, enemy), enemy.lane, enemy.progress, "explosion");
      removeEnemy(state, enemy, false);
      if (state.phase === "results") return;
      continue;
    }
    if (enemy.progress >= 1 - EPSILON) {
      takeDamage(state, enemyDamageOnBreach(state, enemy), enemy.lane, enemy.progress);
      removeEnemy(state, enemy, false);
      if (state.phase === "results") return;
    }
  }
}

function settleCombat(state: DeathState): void {
  if (state.phase !== "combat") return;
  settleEnemyEvents(state);
  if (state.phase !== "combat") return;
  if (state.spawned >= waveQuota(state) && state.enemies.length === 0) {
    completeWave(state);
    return;
  }
  if (state.spawnMs <= EPSILON && state.spawned < waveQuota(state) && state.enemies.length < MAX_DEATH_ENEMIES) spawnEnemy(state);
}

function nextCombatEvent(state: DeathState, remaining: number): number {
  let next = Math.min(remaining, Math.max(0, DEATH_LIMITS.runMs - state.elapsedMs));
  if (state.spawned < waveQuota(state) && state.enemies.length < MAX_DEATH_ENEMIES) next = Math.min(next, Math.max(0, state.spawnMs));
  for (const enemy of state.enemies) {
    const rate = speedFor(state, enemy);
    if (rate > EPSILON) {
      const boundary = enemy.kind === "bomber" ? 0.76 : 1;
      next = Math.min(next, Math.max(0, boundary - enemy.progress) / rate);
      if (enemy.kind === "runner" && enemy.progress < 0.5 - EPSILON) next = Math.min(next, Math.max(0, 0.5 - enemy.progress) / rate);
      if (enemy.kind === "stalker" && !enemy.visible) next = Math.min(next, Math.max(0, 0.3 - enemy.progress) / rate);
      if (enemy.kind === "spitter" && enemy.progress < 0.62 - EPSILON) next = Math.min(next, Math.max(0, 0.62 - enemy.progress) / rate);
      if (enemy.kind === "spitter" && enemy.progress >= 0.62 - EPSILON) next = Math.min(next, Math.max(0, enemy.attackMs));
    }
    if (enemy.kind === "mutant") next = Math.min(next, Math.max(0, 3000 - enemy.regenMs));
  }
  return Math.max(0, next);
}

function advanceCombat(state: DeathState, deltaMs: number): void {
  const delta = positive(deltaMs);
  for (const enemy of state.enemies) {
    const beforeProgress = enemy.progress;
    const rate = speedFor(state, enemy);
    const afterProgress = clamp(beforeProgress + rate * delta, 0, 1);
    enemy.progress = quantize(afterProgress, PROGRESS_QUANTUM);
    if (enemy.kind === "stalker" && enemy.progress >= 0.3 - EPSILON) enemy.visible = true;
    if (enemy.kind === "spitter" && enemy.progress >= 0.62 - EPSILON) {
      const crossedAt = beforeProgress >= 0.62 - EPSILON || rate <= EPSILON ? 0 : (0.62 - beforeProgress) / rate;
      enemy.attackMs = quantize(Math.max(0, enemy.attackMs - Math.max(0, delta - crossedAt)), TIME_QUANTUM);
    }
    if (enemy.kind === "mutant") {
      const eligibleAt = enemy.lastHitAt + 3000;
      const activeRegenMs = Math.max(0, state.sceneMs + delta - Math.max(state.sceneMs, eligibleAt));
      enemy.regenMs = quantize(Math.min(3000, enemy.regenMs + activeRegenMs), TIME_QUANTUM);
    }
  }
  state.spawnMs = quantize(Math.max(0, state.spawnMs - delta), TIME_QUANTUM);
  coolHeat(state, delta);
  advanceClocks(state, delta, true);
}

function coolHeat(state: DeathState, deltaMs: number): void {
  const rank = state.upgrades.coolant;
  state.heat = quantize(clamp(state.heat - deltaMs / 1000 * (10 + rank * 4), 0, 100), TIME_QUANTUM);
  state.jamMs = quantize(Math.max(0, state.jamMs - deltaMs), TIME_QUANTUM);
  state.overdriveMs = quantize(Math.max(0, state.overdriveMs - deltaMs), TIME_QUANTUM);
}

function bossTakeAttack(state: DeathState): void {
  if (!state.boss || state.phase !== "boss") return;
  const boss = state.boss;
  boss.chargeMs = 0;
  boss.attacks = counter(boss.attacks + 1);
  boss.wordsThisCharge = 0;
  takeDamage(state, DEATH_ENEMIES.boss.damage + boss.bossPhase * 5, 2, 0.8, "hurt");
  if (state.outcome !== "defeat") state.message = `${boss.name} released a charged strike. Keep typing; the prefix is safe.`;
}

function nextBossEvent(state: DeathState, remaining: number): number {
  if (!state.boss) return remaining;
  return Math.min(remaining, Math.max(0, DEATH_LIMITS.runMs - state.elapsedMs), Math.max(0, state.boss.chargeLimitMs - state.boss.chargeMs));
}

function advanceBoss(state: DeathState, deltaMs: number): void {
  const delta = positive(deltaMs);
  if (!state.boss) return;
  state.boss.chargeMs = quantize(state.boss.chargeMs + delta, TIME_QUANTUM);
  coolHeat(state, delta);
  advanceClocks(state, delta, true);
}

function bossThreshold(state: DeathState, boss: DeathBoss): 1 | 2 | 3 {
  if (boss.hp <= boss.maxHp / 3) return 3;
  if (boss.hp <= boss.maxHp * 2 / 3) return 2;
  return 1;
}

function setBossPhaseIfNeeded(state: DeathState): void {
  const boss = state.boss;
  if (!boss || state.phase !== "boss") return;
  const nextPhase = bossThreshold(state, boss);
  if (nextPhase === boss.bossPhase) return;
  boss.bossPhase = nextPhase;
  boss.word = chooseWord(state, nextPhase === 3 ? "extreme" : "long", `boss:${nextPhase}:${boss.wordSerial}`);
  boss.tier = nextPhase === 3 ? "extreme" : "long";
  boss.typed = 0;
  boss.highWater = 0;
  boss.wordMistakes = 0;
  boss.wordSerial += 1;
  boss.chargeMs = 0;
  boss.chargeLimitMs = bossChargeLimit(state, nextPhase);
  addEffect(state, "boss-phase", 2, 0.5, boss);
  state.message = `${boss.name} shifts into phase ${nextPhase}. The charge is faster now.`;
}

function completeBossWord(state: DeathState, boss: DeathBoss): void {
  const length = boss.word.length;
  const clean = boss.wordMistakes === 0;
  const damage = wordDamage(state, boss, length, clean);
  boss.hp = Math.max(0, boss.hp - damage);
  state.damageDealt = counter(state.damageDealt + Math.round(damage));
  state.wordsCompleted = counter(state.wordsCompleted + 1);
  if (clean) state.cleanWords = counter(state.cleanWords + 1);
  state.combo = counter(state.combo + 1);
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.score = boundedScore(state.score + scoreForCompletion(state, boss, length, clean));
  boss.wordsThisCharge = counter(boss.wordsThisCharge + 1);
  boss.word = chooseWord(state, boss.bossPhase === 3 ? "extreme" : "long", `boss:${boss.bossPhase}:${boss.wordSerial + 1}`, boss.word);
  boss.wordSerial += 1;
  boss.typed = 0;
  boss.highWater = 0;
  boss.wordMistakes = 0;
  boss.chargeMs = Math.max(0, boss.chargeMs - 1200);
  gainEnergy(state, clean ? 13 : 8);
  addEffect(state, "hit", 2, 0.5, boss, damage);
  setBossPhaseIfNeeded(state);
  if (boss.hp <= EPSILON) {
    boss.hp = 0;
    state.cleared = counter(state.cleared + 1);
    state.score = boundedScore(state.score + DEATH_ENEMIES.boss.reward * difficultyFor(state).score);
    if (state.mode === "endless") {
      state.boss = null;
      state.wave += 1;
      state.wavesCleared = counter(state.wavesCleared + 1);
      enterUpgrade(state);
      state.message = "Commander down. The horde is still coming. Choose a field upgrade.";
    } else {
      setResults(state, "victory", "boss-defeated");
    }
  }
}

function wordDamage(state: DeathState, enemy: DeathEnemy, length: number, clean: boolean): number {
  const definition = DEATH_ENEMIES[enemy.kind];
  const lengthFactor = 0.8 + Math.min(length, 16) * 0.1;
  const base = 12 * length * lengthFactor;
  const weapon = weaponFor(state);
  const shortBonus = length <= 4 ? (1 + state.upgrades.quickload * 0.2) * weapon.shortWord : 1;
  const longBonus = length >= 7 ? (1 + state.upgrades.longshot * 0.2) * weapon.longWord : 1;
  const cleanBonus = clean ? (1 + state.upgrades.precision * 0.1) * weapon.cleanWord : 1;
  const weaponBonus = 1 + state.upgrades["hollow-point"] * 0.12;
  const overdriveBonus = state.overdriveMs > 0 ? 1.5 : 1;
  return base * weapon.damage * survivorFor(state).damage * shortBonus * longBonus * cleanBonus * weaponBonus * overdriveBonus * (1 - definition.armor);
}

/** Pure damage projection for HUD previews, balance tools and focused tests. */
export function calculateDeathWordDamage(state: DeathState, enemy: DeathEnemy, length = enemy.word.length, clean = enemy.wordMistakes === 0): number {
  return Math.max(0, wordDamage(state, enemy, integer(length, 1, DEATH_LIMITS.wordLength), clean));
}

function scoreForCompletion(state: DeathState, enemy: DeathEnemy, length: number, clean: boolean): number {
  const definition = DEATH_ENEMIES[enemy.kind];
  const comboMultiplier = 1 + Math.min(20, Math.max(0, state.combo - 1)) * 0.05;
  const overdriveMultiplier = state.overdriveMs > 0 ? 2 : 1;
  const cleanMultiplier = clean ? 1.1 : 1;
  return definition.reward * Math.max(1, length / 4) * comboMultiplier * overdriveMultiplier * cleanMultiplier * weaponFor(state).damage * difficultyFor(state).score;
}

function gainEnergy(state: DeathState, amount: number): void {
  if (state.overdriveMs > 0) return;
  state.energy = clamp(state.energy + amount * weaponFor(state).energy * survivorFor(state).energy + state.upgrades.capacitor * (amount > 8 ? 2 : 0), 0, 100);
  if (state.energy >= 100) activateDeathOverdriveInPlace(state);
}

function heatForKey(state: DeathState, wrong: boolean): void {
  const amount = (wrong ? Math.max(2, 10 - state.upgrades.coolant * 3) : 1) * weaponFor(state).heat;
  state.heat = clamp(state.heat + amount * (state.overdriveMs > 0 ? 0.65 : 1), 0, 100);
  if (state.heat < 100 || state.jamMs > 0) return;
  state.jamMs = DEATH_JAM_MS;
  state.jams = counter(state.jams + 1);
  state.combo = 0;
  addEffect(state, "jam", 2, 0.5);
  state.message = "Weapon jammed from heat. Coolant is bleeding the lock open.";
}

function activateDeathOverdriveInPlace(state: DeathState): void {
  state.energy = 0;
  state.overdriveMs = DEATH_OVERDRIVE_MS + state.upgrades.capacitor * 1200;
  state.overdrives = counter(state.overdrives + 1);
  addEffect(state, "overdrive", 2, 0.5);
  state.message = "OVERDRIVE: the barricade systems are synchronized. Damage and score doubled.";
}

export function activateDeathOverdrive(state: DeathState): DeathState {
  if (!ACTIVE_PHASES.includes(state.phase) || state.energy < 100 || state.overdriveMs > 0) return state;
  const next = copyState(state);
  activateDeathOverdriveInPlace(next);
  return next;
}

function mistake(state: DeathState, expected: string | undefined): void {
  state.incorrectKeys = counter(state.incorrectKeys + 1);
  state.combo = 0;
  heatForKey(state, true);
  state.message = expected ? `Wrong key. Next character: ${expected === " " ? "space" : expected}.` : "Wrong key. Lock a visible target with its first letter.";
}

function correctUniquePrefix(state: DeathState, enemy: DeathEnemy): void {
  if (enemy.typed <= enemy.highWater) return;
  enemy.highWater = enemy.typed;
  state.outputChars = counter(state.outputChars + 1);
}

function completeEnemyWord(state: DeathState, enemy: DeathEnemy): void {
  const length = enemy.word.length;
  const clean = enemy.wordMistakes === 0;
  const damage = wordDamage(state, enemy, length, clean);
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.lastHitAt = state.sceneMs;
  enemy.regenMs = 0;
  state.damageDealt = counter(state.damageDealt + Math.round(damage));
  state.wordsCompleted = counter(state.wordsCompleted + 1);
  if (clean) state.cleanWords = counter(state.cleanWords + 1);
  state.combo = counter(state.combo + 1);
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.score = boundedScore(state.score + scoreForCompletion(state, enemy, length, clean));
  gainEnergy(state, clean ? 13 : 8);
  addEffect(state, "hit", enemy.lane, enemy.progress, enemy, damage);
  if (enemy.hp <= EPSILON) {
    removeEnemy(state, enemy, true);
    return;
  }
  const previous = enemy.word;
  enemy.wordSerial = counter(enemy.wordSerial + 1);
  enemy.word = chooseWord(state, enemy.tier, `${enemy.id}:${enemy.wordSerial}`, previous);
  enemy.typed = 0;
  enemy.highWater = 0;
  enemy.wordMistakes = 0;
  state.message = `${DEATH_ENEMIES[enemy.kind].name} absorbed the hit. Keep its lock and finish the next word.`;
}

function normalizeKey(key: string): string | null {
  if (key.toLowerCase() === "backspace") return "Backspace";
  if (key.length !== 1) return null;
  return key.toLowerCase();
}

function findLockedEnemy(state: DeathState): DeathEnemy | undefined {
  return state.enemies.find((enemy) => enemy.id === state.targetId && enemy.visible);
}

function selectEnemy(state: DeathState, key: string): DeathEnemy | undefined {
  const locked = findLockedEnemy(state);
  if (locked) return locked;
  const matches = state.enemies.filter((enemy) => enemy.visible && enemy.word[0] === key);
  return matches.sort((a, b) => b.progress - a.progress || a.id - b.id)[0];
}

function typeCombatKey(state: DeathState, key: string): void {
  if (state.jamMs > EPSILON) {
    state.message = "Weapon jammed. Wait for the heat to clear.";
    return;
  }
  const enemy = key === "Backspace" ? findLockedEnemy(state) : selectEnemy(state, key);
  if (!enemy) {
    if (key === "Backspace") {
      state.message = "No target prefix to retreat.";
      return;
    }
    mistake(state, undefined);
    return;
  }
  state.targetId = enemy.id;
  if (key === "Backspace") {
    enemy.typed = Math.max(0, enemy.typed - 1);
    state.message = enemy.typed === 0 ? "Target lock held. Type its first letter to continue." : "Prefix retreated; unique progress remains protected.";
    return;
  }
  const expected = enemy.word[enemy.typed];
  if (key !== expected) {
    enemy.wordMistakes = counter(enemy.wordMistakes + 1);
    mistake(state, expected);
    return;
  }
  state.correctKeys = counter(state.correctKeys + 1);
  enemy.typed += 1;
  enemy.lastHitAt = state.sceneMs;
  heatForKey(state, false);
  addEffect(state, "shot", enemy.lane, enemy.progress, enemy);
  correctUniquePrefix(state, enemy);
  if (enemy.typed < enemy.word.length) return;
  completeEnemyWord(state, enemy);
  settleCombat(state);
}

function typeBossKey(state: DeathState, key: string): void {
  if (state.jamMs > EPSILON || !state.boss) {
    if (state.jamMs > EPSILON) state.message = "Weapon jammed. Wait for the heat to clear.";
    return;
  }
  const boss = state.boss;
  state.targetId = boss.id;
  if (key === "Backspace") {
    boss.typed = Math.max(0, boss.typed - 1);
    return;
  }
  const expected = boss.word[boss.typed];
  if (key !== expected) {
    boss.wordMistakes = counter(boss.wordMistakes + 1);
    mistake(state, expected);
    return;
  }
  state.correctKeys = counter(state.correctKeys + 1);
  boss.typed += 1;
  boss.lastHitAt = state.sceneMs;
  heatForKey(state, false);
  addEffect(state, "shot", boss.lane, 0.5, boss);
  correctUniquePrefix(state, boss);
  if (boss.typed === boss.word.length) completeBossWord(state, boss);
}

export function startDeath(options: DeathStartOptions = {}): DeathState {
  const state = createDeathState();
  const mode: DeathMode = options.mode === "daily" || options.daily ? "daily" : options.mode === "endless" ? "endless" : "campaign";
  const daily = mode === "daily" ? getDailyChallenge(options.day) : null;
  const mission = daily?.mission ?? integer(options.mission ?? 0, 0, DEATH_MISSIONS.length - 1);
  const difficulty: DeathDifficulty = daily ? "normal" : options.difficulty === "easy" || options.difficulty === "hard" ? options.difficulty : "normal";
  const seed = daily?.seed ?? (typeof options.seed === "string" && options.seed.length > 0 ? options.seed : `campaign:${mission}`);
  state.mode = mode;
  state.mission = mission;
  state.difficulty = difficulty;
  state.seed = seed;
  state.runId = typeof options.runId === "string" && options.runId.length > 0 ? options.runId : `${mode}:${seed}:${mission}`;
  state.dailyDay = daily?.day ?? null;
  state.weapon = daily ? "pistol" : options.weapon && Object.hasOwn(DEATH_WEAPON_REGISTRY, options.weapon) ? options.weapon : "pistol";
  state.survivor = daily ? "soldier" : options.survivor && Object.hasOwn(DEATH_SURVIVOR_REGISTRY, options.survivor) ? options.survivor : "soldier";
  const survivor = survivorFor(state);
  state.maxHealth = Math.max(1, state.maxHealth + survivor.maxHealth);
  state.health = state.maxHealth;
  state.maxBarricade = Math.max(1, state.maxBarricade + survivor.maxBarricade);
  state.barricade = state.maxBarricade;
  state.wave = 1;
  state.phase = "briefing";
  state.message = missionFor(state).briefing;
  state.spawnMs = 0;
  return state;
}

/** Alias that reads naturally beside `createDeathState` in a React hook. */
export const startTypeBeforeDeath = startDeath;
export const createTypeBeforeDeathState = createDeathState;

function tickBriefing(state: DeathState, remaining: number): number {
  const step = Math.min(remaining, Math.max(0, DEATH_BRIEFING_MS - state.phaseTimeMs));
  advanceClocks(state, step, false);
  if (state.phaseTimeMs >= DEATH_BRIEFING_MS - EPSILON) enterCombat(state);
  return step;
}

function tickWave(state: DeathState, remaining: number): number {
  const step = Math.min(remaining, Math.max(0, DEATH_WAVE_NOTICE_MS - state.phaseTimeMs));
  advanceClocks(state, step, false);
  if (state.phaseTimeMs >= DEATH_WAVE_NOTICE_MS - EPSILON) {
    if (state.mode !== "endless" && state.wavesCleared >= missionFor(state).waves) prepareBoss(state);
    else enterCombat(state);
  }
  return step;
}

/** Event-driven, pure integration. A single large tick equals its segmented form. */
export function tickDeath(state: DeathState, deltaMs: number): DeathState {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0 || state.phase === "menu" || state.phase === "paused" || state.phase === "results") return state;
  if (state.phase === "upgrade") {
    if (state.upgradeChoices.length > 0) return state;
    const next = copyState(state);
    beginNextWave(next);
    return next;
  }
  const next = copyState(state);
  let remaining = deltaMs;
  let guard = 0;
  while (remaining > EPSILON && guard++ < 10_000) {
    if (ACTIVE_PHASES.includes(next.phase) && next.elapsedMs >= DEATH_LIMITS.runMs) {
      next.elapsedMs = DEATH_LIMITS.runMs;
      setResults(next, "defeat", "time-limit");
      break;
    }
    if (next.phase === "briefing") {
      const step = tickBriefing(next, remaining);
      remaining -= step;
      continue;
    }
    if (next.phase === "wave") {
      const step = tickWave(next, remaining);
      remaining -= step;
      continue;
    }
    if (next.phase === "combat") {
      settleCombat(next);
      if (next.phase !== "combat") continue;
      const step = nextCombatEvent(next, remaining);
      if (step <= EPSILON) {
        settleCombat(next);
        if (next.phase === "combat" && next.spawnMs <= EPSILON) next.spawnMs = spawnInterval(next);
        continue;
      }
      advanceCombat(next, step);
      remaining -= step;
      if (next.elapsedMs >= DEATH_LIMITS.runMs) {
        next.elapsedMs = DEATH_LIMITS.runMs;
        setResults(next, "defeat", "time-limit");
        break;
      }
      settleCombat(next);
      continue;
    }
    if (next.phase === "boss") {
      if (!next.boss) {
        prepareBoss(next);
        continue;
      }
      const step = nextBossEvent(next, remaining);
      if (step <= EPSILON) {
        bossTakeAttack(next);
        if (next.phase === "boss" && next.boss) next.boss.chargeMs = 0;
        continue;
      }
      advanceBoss(next, step);
      remaining -= step;
      if (next.elapsedMs >= DEATH_LIMITS.runMs) {
        next.elapsedMs = DEATH_LIMITS.runMs;
        setResults(next, "defeat", "time-limit");
        break;
      }
      if (next.boss && next.boss.chargeMs >= next.boss.chargeLimitMs - EPSILON) bossTakeAttack(next);
      continue;
    }
    remaining = 0;
  }
  return next;
}

/** Advance a wave notice or enter combat immediately after an upgrade choice. */
export function startDeathWave(state: DeathState): DeathState {
  if (state.phase !== "wave") return state;
  const next = copyState(state);
  if (next.mode !== "endless" && next.wavesCleared >= missionFor(next).waves) prepareBoss(next);
  else enterCombat(next);
  return next;
}

export const startTypeBeforeDeathWave = startDeathWave;

export function chooseDeathUpgrade(state: DeathState, id: DeathUpgradeId): DeathState {
  if (state.phase !== "upgrade" || !state.upgradeChoices.includes(id)) return state;
  const definition = DEATH_UPGRADE_REGISTRY[id];
  if (state.upgrades[id] >= definition.maxRank) return state;
  const next = copyState(state);
  next.upgrades[id] += 1;
  next.upgradeChoices = [];
  if (id === "reinforcement") {
    next.maxBarricade = clamp(next.maxBarricade + 20, 0, 1000);
    next.barricade = clamp(next.barricade + 40, 0, next.maxBarricade);
  } else if (id === "field-medic") {
    next.maxHealth = clamp(next.maxHealth + 10, 1, 1000);
    next.health = clamp(next.health + 35, 0, next.maxHealth);
  }
  addEffect(next, "upgrade", 2, 0.5);
  beginNextWave(next);
  return next;
}

export const chooseTypeBeforeDeathUpgrade = chooseDeathUpgrade;

export function pauseDeath(state: DeathState): DeathState {
  if (!PAUSABLE_PHASES.includes(state.phase)) return state;
  return { ...state, pausedFrom: state.phase, phase: "paused" };
}

export function resumeDeath(state: DeathState): DeathState {
  if (state.phase !== "paused") return state;
  const phase = state.pausedFrom && PAUSABLE_PHASES.includes(state.pausedFrom) ? state.pausedFrom : "menu";
  return { ...state, phase, pausedFrom: null };
}

export const pauseTypeBeforeDeath = pauseDeath;
export const resumeTypeBeforeDeath = resumeDeath;

export function abandonDeath(state: DeathState): DeathState {
  if (state.phase === "menu" || state.phase === "results") return state;
  const next = copyState(state);
  next.outcome = "abandoned";
  next.resultReason = "abandoned";
  next.targetId = null;
  enterPhase(next, "results", "Run ended. The line can be rebuilt from the menu.");
  return next;
}

export const abandonTypeBeforeDeath = abandonDeath;

export function typeDeathKey(state: DeathState, rawKey: string): DeathState {
  if (typeof rawKey !== "string" || !ACTIVE_PHASES.includes(state.phase)) return state;
  const key = normalizeKey(rawKey);
  if (!key) return state;
  const next = copyState(state);
  if (next.phase === "combat") typeCombatKey(next, key);
  else typeBossKey(next, key);
  return next;
}

export const typeBeforeDeathKey = typeDeathKey;
export const tickTypeBeforeDeath = tickDeath;
export const activateTypeBeforeDeathOverdrive = activateDeathOverdrive;

export function deathStats(state: DeathState): DeathStats {
  const correct = counter(state.correctKeys);
  const incorrect = counter(state.incorrectKeys);
  const outputChars = counter(state.outputChars);
  const elapsedMs = clamp(state.elapsedMs, 0, DEATH_LIMITS.runMs);
  return {
    wpm: clamp(calculateNetWpm(outputChars, elapsedMs), 0, DEATH_LIMITS.wpm),
    accuracy: clamp(calculateAccuracy(correct, incorrect), 0, 100),
    score: boundedScore(state.score),
    cleared: counter(state.cleared),
    missed: counter(state.missed),
    bestCombo: counter(state.bestCombo),
    survivedMs: elapsedMs,
    correctKeys: correct,
    incorrectKeys: incorrect,
    outputChars,
    wordsCompleted: counter(state.wordsCompleted),
    cleanWords: counter(state.cleanWords),
    damageDealt: counter(state.damageDealt),
    damageTaken: counter(state.damageTaken),
    wavesCleared: counter(state.wavesCleared),
    overdrives: counter(state.overdrives),
    jams: counter(state.jams),
  };
}

export const getDeathStats = deathStats;
export const getTypeBeforeDeathStats = deathStats;
export const typeBeforeDeathStats = deathStats;

export function deathRunStats(state: DeathState): DeathRunStats {
  return {
    ...deathStats(state),
    variant: `${state.mode}:${state.difficulty}:mission-${state.mission}:${state.weapon}:${state.survivor}${state.dailyDay ? `:${state.dailyDay}` : ""}`,
    outcome: state.outcome,
    mission: state.mission,
    wave: state.wave,
  };
}

export const getDeathRunStats = deathRunStats;

export function calculateDeathScore(state: DeathState): number {
  return boundedScore(state.score);
}

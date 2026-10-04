import type { Rng } from "@/lib/rng/seeded-rng";
import type { Enemy, SurvivorState } from "@/lib/games/survivor/use-survivor";
import { UPGRADES } from "@/lib/games/survivor/content";

export function xpForLevel(level: number): number {
  return Math.round(12 + level * 8 + level * level * 1.5);
}

export function decaySurvivorEnemies(enemies: Enemy[], ms: number): Enemy[] {
  return enemies.map((e) => ({ ...e, hitFlash: Math.max(0, e.hitFlash - ms) }))
    .filter((e) => e.hp > 0 || e.hitFlash > 0);
}

export type StrikeEvent = {
  kind: "kill" | "strike";
  enemy: Enemy;
  damage: number;
  crit: boolean;
};

/** One strike resolves every lethal damage edge exactly once, including arcs. */
export function strikeSurvivor(prev: SurvivorState, uid: number, rng: Rng) {
  const events: StrikeEvent[] = [];
  const target = prev.enemies.find((e) => e.uid === uid && e.hp > 0);
  if (prev.phase !== "playing" || !target) return { state: prev, events, levelsGained: 0 };
  const s = { ...prev, enemies: prev.enemies.map((e) => ({ ...e })) };
  const len = target.word.length;
  let damage = 6 + len * 2;
  if (s.upgrades.includes("short-fuse") && len <= 4) damage *= 2.1;
  if (s.upgrades.includes("heavy-hand") && len >= 8) damage *= 1.9;
  if (s.upgrades.includes("momentum")) damage *= 1 + Math.min(1, s.combo * 0.04);
  damage += s.upgrades.filter((u) => u === "scholar").length * s.level * 1.5;
  let critChance = 0.05;
  if (s.upgrades.includes("keen-edge")) critChance += 0.2;
  if (s.upgrades.includes("perfectionist") && s.wordFlawless) critChance += 0.25;
  const crit = rng.chance(critChance);
  if (crit) damage *= 2.2;
  damage = Math.round(damage);
  const applied = target.guard > 0 ? Math.round(damage * 0.25) : damage;
  const updated = s.enemies.find((e) => e.uid === uid)!;
  updated.guard = Math.max(0, updated.guard - 1);
  updated.typed = 0;

  s.combo += 1;
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  if (s.wordFlawless) s.perfectWords += 1;
  s.wordFlawless = true;
  s.typed = "";
  s.lockedUid = null;

  const deaths: StrikeEvent[] = [];
  const hit = (enemy: Enemy, amount: number, critical = false) => {
    if (enemy.hp <= 0) return;
    enemy.hp = Math.max(0, enemy.hp - amount);
    enemy.hitFlash = 220;
    if (enemy.hp === 0) deaths.push({ kind: "kill", enemy, damage: amount, crit: critical });
  };
  hit(updated, applied, crit);
  if (updated.hp === 0 && s.upgrades.includes("detonate") && len >= 7) {
    for (const enemy of s.enemies) {
      if (enemy.uid !== uid) hit(enemy, Math.round(applied * 0.4));
    }
  }
  if (updated.hp > 0) {
    s.score += 2;
    events.push({ kind: "strike", enemy: updated, damage: applied, crit });
  }
  // A queued enemy is already at zero HP and cannot be queued by another hit.
  for (let i = 0; i < deaths.length; i++) {
    const death = deaths[i];
    s.kills += 1;
    s.score += 10 + death.enemy.word.length * 3 + s.combo;
    s.xp += death.enemy.type.xp;
    if (s.upgrades.includes("bloodletting")) s.hp = Math.min(s.maxHp, s.hp + 2);
    events.push(death);
    if (s.upgrades.includes("chain") && s.kills % 3 === 0) {
      const other = s.enemies.find((e) => e.hp > 0);
      if (other) hit(other, Math.round(death.damage * 0.5));
    }
  }

  let levelsGained = 0;
  while (s.xp >= s.xpToNext) {
    s.xp -= s.xpToNext;
    s.level += 1;
    s.xpToNext = xpForLevel(s.level);
    levelsGained += 1;
  }
  if (levelsGained > 0) {
    const pool = UPGRADES.filter((u) => !s.upgrades.includes(u.id) || u.stacking);
    s.offer = rng.sample(pool.map((u) => u.id), 3);
    s.phase = "draft";
    s.pendingLevelUps = levelsGained - 1;
  }
  return { state: s, events, levelsGained };
}

/** Mistakes/corrections stay attached to the attempt until a word completes. */
export function typeSurvivorWord(prev: SurvivorState, value: string) {
  if (prev.phase !== "playing") return { state: prev, strikeUid: null, miss: false };
  const raw = value.toLowerCase();
  const trimmed = raw.trim();
  const wordFlawless = prev.wordFlawless && raw.startsWith(prev.typed) && raw.length >= prev.typed.length;
  if (raw === "") return {
    state: { ...prev, typed: "", lockedUid: null, wordFlawless,
      enemies: prev.enemies.map((e) => ({ ...e, typed: 0 })) },
    strikeUid: null, miss: false,
  };
  const candidates = prev.enemies.filter((e) => e.hp > 0 &&
    (e.word.startsWith(raw) || (trimmed.length > 0 && e.word.startsWith(trimmed))));
  if (!candidates.length) return {
    state: { ...prev, typed: "", lockedUid: null, combo: 0, wordFlawless: false,
      enemies: prev.enemies.map((e) => ({ ...e, typed: 0 })) },
    strikeUid: null, miss: true,
  };
  const locked = candidates.find((e) => e.uid === prev.lockedUid) ??
    candidates.reduce((a, b) => b.progress > a.progress ? b : a);
  const matchLen = locked.word.startsWith(raw) ? raw.length : trimmed.length;
  const exact = locked.word === raw || locked.word === trimmed;
  return {
    state: { ...prev, typed: raw, lockedUid: locked.uid, wordFlawless,
      enemies: prev.enemies.map((e) => ({ ...e, typed: e.uid === locked.uid ? matchLen : 0 })) },
    strikeUid: exact ? locked.uid : null, miss: false,
  };
}

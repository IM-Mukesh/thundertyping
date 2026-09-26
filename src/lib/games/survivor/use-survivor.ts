"use client";

/**
 * Typing Survivor's engine.
 *
 * Enemies stream in from every side carrying a word; typing it strikes them.
 * Longer words hit harder, so the pressure is a constant choice between
 * clearing the cheap swarm and committing to the thing that will actually kill
 * you.
 *
 * Depth comes from the upgrade draft rather than the shooting. Take short-word
 * upgrades and you become a machine gun that cannot break a brute; take
 * long-word ones and every strike is an execution until six fast enemies
 * arrive at once. No draft is correct, and the wave you happen to face pushes
 * you toward different ones.
 *
 * Driven by setInterval, not requestAnimationFrame: rAF stops firing in a
 * hidden tab, which would freeze a wave mid-run. Enemy positions are stored as
 * fractions of the arena so nothing has to know pixels.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRng, type Rng } from "@/lib/rng/seeded-rng";
import { createWordPicker } from "@/lib/games/survivor/words";
import {
  ENEMY_TYPES,
  UPGRADES,
  CHARACTERS,
  bossForWave,
  type EnemyType,
  type UpgradeDef,
} from "@/lib/games/survivor/content";

export const TICK_MS = 50;
const WAVE_MS = 30_000;

export type Phase = "select" | "playing" | "draft" | "over" | "won";

export interface Enemy {
  uid: number;
  type: EnemyType;
  word: string;
  typed: number;
  hp: number;
  maxHp: number;
  /** 0 = edge of arena, 1 = reached the player. */
  progress: number;
  angle: number;
  hitFlash: number;
  /** Shielders block until struck from the correct side; simplified to a gate. */
  guard: number;
}

export interface SurvivorState {
  phase: Phase;
  characterId: string;
  hp: number;
  maxHp: number;
  wave: number;
  waveMs: number;
  elapsedMs: number;
  enemies: Enemy[];
  typed: string;
  lockedUid: number | null;
  xp: number;
  xpToNext: number;
  level: number;
  upgrades: string[];
  offer: string[];
  /** Extra level-ups earned by a single XP gain crossing more than one threshold, each still owed its own draft. */
  pendingLevelUps: number;
  score: number;
  kills: number;
  combo: number;
  bestCombo: number;
  perfectWords: number;
  banner: string | null;
}

export interface SurvivorCallbacks {
  onKill?: (enemy: Enemy, damage: number, crit: boolean) => void;
  onHit?: (amount: number) => void;
  onLevel?: (level: number) => void;
  onPhase?: (phase: Phase) => void;
  onMiss?: () => void;
  onStrike?: (enemy: Enemy, damage: number, crit: boolean) => void;
}

function xpForLevel(level: number): number {
  return Math.round(12 + level * 8 + level * level * 1.5);
}

export function useSurvivor(seed?: string, cb: SurvivorCallbacks = {}) {
  const seedRef = useRef(seed ?? `${Date.now()}`);
  const rngRef = useRef<Rng>(createRng(seedRef.current));
  const uidRef = useRef(1);
  const cbRef = useRef(cb);
  cbRef.current = cb;

  const [paused, setPaused] = useState(false);
  const [state, setState] = useState<SurvivorState>(() => initial());

  function initial(): SurvivorState {
    return {
      phase: "select",
      characterId: CHARACTERS[0].id,
      hp: 100,
      maxHp: 100,
      wave: 1,
      waveMs: 0,
      elapsedMs: 0,
      enemies: [],
      typed: "",
      lockedUid: null,
      xp: 0,
      xpToNext: xpForLevel(1),
      level: 1,
      upgrades: [],
      offer: [],
      pendingLevelUps: 0,
      score: 0,
      kills: 0,
      combo: 0,
      bestCombo: 0,
      perfectWords: 0,
      banner: null,
    };
  }

  /** Upgrade lookup, so effect checks read as `has("chain")`. */
  const has = useCallback(
    (id: string) => state.upgrades.includes(id),
    [state.upgrades],
  );

  const spawn = useCallback(
    (s: SurvivorState, type: EnemyType, rng: Rng): Enemy => {
      const taken = new Set(s.enemies.map((e) => e.word));
      const pick = createWordPicker(() => rng.next(), taken);
      const word = pick(type.minLen, type.maxLen);
      const hp = Math.round(type.hp * (1 + (s.wave - 1) * 0.3));
      return {
        uid: uidRef.current++,
        type,
        word,
        typed: 0,
        hp,
        maxHp: hp,
        progress: 0,
        angle: rng.next() * Math.PI * 2,
        hitFlash: 0,
        guard: type.id === "bulwark" ? 2 : 0,
      };
    },
    [],
  );

  const start = useCallback((characterId: string, runSeed?: string) => {
    const sd = runSeed ?? `${Date.now()}`;
    seedRef.current = sd;
    rngRef.current = createRng(sd);
    uidRef.current = 1;
    const char = CHARACTERS.find((c) => c.id === characterId) ?? CHARACTERS[0];
    setState({
      ...initial(),
      phase: "playing",
      characterId,
      hp: char.maxHp,
      maxHp: char.maxHp,
      upgrades: char.startUpgrade ? [char.startUpgrade] : [],
    });
    cbRef.current.onPhase?.("playing");
  }, []);

  /** Main tick: spawning, movement, contact damage, wave rollover. */
  useEffect(() => {
    if (paused || state.phase !== "playing") return;

    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.phase !== "playing") return prev;
        const s: SurvivorState = { ...prev };
        const rng = rngRef.current;
        s.elapsedMs += TICK_MS;
        s.waveMs += TICK_MS;
        if (s.banner && s.waveMs % 3000 < TICK_MS) s.banner = null;

        // --- spawning -------------------------------------------------
        // Density rises with the wave; a boss wave stops the stream so the
        // fight is about the boss rather than the noise around it.
        const isBossWave = s.wave % 5 === 0;
        const hasBoss = s.enemies.some((e) => e.type.kind === "boss" && e.hp > 0);
        if (isBossWave && !hasBoss && s.waveMs < TICK_MS * 2) {
          const boss = bossForWave(s.wave);
          s.enemies = [...s.enemies, spawn(s, boss, rng)];
          s.banner = boss.telegraph ?? `${boss.name} arrives`;
        } else if (!isBossWave) {
          const perSecond = 0.6 + s.wave * 0.28;
          if (rng.next() < (perSecond * TICK_MS) / 1000) {
            const pool = ENEMY_TYPES.filter(
              (t) => t.kind === "minion" && s.wave >= t.fromWave,
            );
            const elite =
              s.wave >= 3 && rng.chance(0.12)
                ? ENEMY_TYPES.filter((t) => t.kind === "elite")
                : null;
            const type = rng.pick(elite ?? pool);
            if (s.enemies.filter((e) => e.hp > 0).length < 14) {
              s.enemies = [...s.enemies, spawn(s, type, rng)];
            }
          }
        }

        // --- movement + contact ---------------------------------------
        let incoming = 0;
        s.enemies = s.enemies.map((e) => {
          if (e.hp <= 0) return e;
          const next = { ...e, hitFlash: Math.max(0, e.hitFlash - TICK_MS) };
          const speed = (e.type.speed / 1000) * TICK_MS;
          next.progress += speed;
          if (next.progress >= 1) {
            next.progress = 0;
            incoming += e.type.damage;
          }
          return next;
        });

        if (incoming > 0) {
          const reduce = s.upgrades.includes("bulwark-training") ? 0.75 : 1;
          const dealt = Math.max(1, Math.round(incoming * reduce));
          s.hp = Math.max(0, s.hp - dealt);
          s.combo = 0;
          cbRef.current.onHit?.(dealt);
        }

        if (s.hp <= 0) {
          s.phase = "over";
          cbRef.current.onPhase?.("over");
          return s;
        }

        // --- wave rollover --------------------------------------------
        // Re-checked here (not the `hasBoss` computed above, before this
        // wave's boss may have just spawned) so a boss wave can roll over
        // the instant its boss actually dies, rather than waiting out the
        // full WAVE_MS regardless -- previously a fast boss kill left the
        // player standing in an empty arena for up to ~26 idle seconds.
        const bossStillAlive = isBossWave && s.enemies.some((e) => e.type.kind === "boss" && e.hp > 0);
        if (!bossStillAlive && (s.waveMs >= WAVE_MS || isBossWave)) {
          s.wave += 1;
          s.waveMs = 0;
          s.banner = `Wave ${s.wave}`;
          if (s.wave > 15) {
            s.phase = "won";
            cbRef.current.onPhase?.("won");
          }
        }

        // drop corpses once their flash has finished
        s.enemies = s.enemies.filter((e) => e.hp > 0 || e.hitFlash > 0);
        return s;
      });
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [paused, state.phase, spawn]);

  /** Resolve a completed word into a strike. */
  const strike = useCallback((uid: number) => {
    setState((prev) => {
      if (prev.phase !== "playing") return prev;
      const s: SurvivorState = { ...prev };
      const rng = rngRef.current;
      const idx = s.enemies.findIndex((e) => e.uid === uid);
      if (idx < 0) return prev;
      const target = s.enemies[idx];
      const len = target.word.length;

      // Build damage from the draft. This is where a run's identity lives:
      // the same word is worth wildly different amounts under different picks.
      let damage = 6 + len * 2;
      if (s.upgrades.includes("short-fuse") && len <= 4) damage *= 2.1;
      if (s.upgrades.includes("heavy-hand") && len >= 8) damage *= 1.9;
      if (s.upgrades.includes("momentum")) damage *= 1 + Math.min(1, s.combo * 0.04);
      // Scholar is marked `stacking: true` (re-offered after being taken),
      // but this only checked whether it was owned at all -- a second or
      // third pick gave no additional benefit, silently wasting the draft.
      // Count how many copies are actually owned.
      const scholarCount = s.upgrades.filter((u) => u === "scholar").length;
      if (scholarCount > 0) damage += scholarCount * s.level * 1.5;

      let critChance = 0.05;
      if (s.upgrades.includes("keen-edge")) critChance += 0.2;
      if (s.upgrades.includes("perfectionist") && target.typed === len) critChance += 0.25;
      const crit = rng.chance(critChance);
      if (crit) damage *= 2.2;

      damage = Math.round(damage);

      // Guarded enemies eat the first strikes outright, so a shielder cannot
      // be deleted by one lucky long word.
      let applied = damage;
      let guard = target.guard;
      if (guard > 0) {
        guard -= 1;
        applied = Math.round(damage * 0.25);
      }

      const killedNow = target.hp - applied <= 0;
      const updated: Enemy = {
        ...target,
        hp: Math.max(0, target.hp - applied),
        guard,
        typed: 0,
        hitFlash: 220,
      };
      s.enemies = s.enemies.map((e, i) => (i === idx ? updated : e));

      // Word Explosion: a long word kills splash the swarm around them.
      if (killedNow && s.upgrades.includes("detonate") && len >= 7) {
        const blast = Math.round(applied * 0.4);
        s.enemies = s.enemies.map((e) =>
          e.uid !== uid && e.hp > 0
            ? { ...e, hp: Math.max(0, e.hp - blast), hitFlash: 180 }
            : e,
        );
      }

      if (killedNow) {
        s.kills += 1;
        s.combo += 1;
        s.bestCombo = Math.max(s.bestCombo, s.combo);
        s.score += 10 + len * 3 + s.combo;
        s.xp += target.type.xp;
        if (s.upgrades.includes("bloodletting")) {
          s.hp = Math.min(s.maxHp, s.hp + 2);
        }
        // Chain Lightning: "every third kill arcs" -- previously checked on
        // every strike (not gated on a kill at all) and against the
        // pre-increment kill count, so once the counter landed on 2-mod-3 it
        // stayed there and every non-lethal hit on a multi-hit target
        // splashed, not just one hit per three kills.
        if (s.upgrades.includes("chain") && s.kills % 3 === 0) {
          const other = s.enemies.find((e) => e.uid !== uid && e.hp > 0);
          if (other) {
            const arc = Math.round(applied * 0.5);
            s.enemies = s.enemies.map((e) =>
              e.uid === other.uid ? { ...e, hp: Math.max(0, e.hp - arc), hitFlash: 200 } : e,
            );
          }
        }
        cbRef.current.onKill?.(updated, damage, crit);
      } else {
        s.combo += 1;
        s.score += 2;
        cbRef.current.onStrike?.(updated, damage, crit);
      }

      s.typed = "";
      s.lockedUid = null;

      // level up -> draft. A single large XP gain (an early elite/boss kill
      // while already close to xpToNext) can cross more than one threshold
      // at once -- previously only one level-up was ever applied per strike
      // (an `if`, not a loop), so the extra level(s) earned were simply
      // never granted at all: xp only ever carried over toward the *next*
      // single level, and the surplus level(s) needed another kill's worth
      // of XP to re-trigger, one at a time, rather than being owed
      // immediately. Cascade properly, but still only show one draft at a
      // time -- takeUpgrade below pops the next one off pendingLevelUps
      // once the current pick is made, so multiple levels earned in one
      // strike each get their own pick instead of being collapsed into one.
      let levelsGained = 0;
      while (s.xp >= s.xpToNext) {
        s.xp -= s.xpToNext;
        s.level += 1;
        s.xpToNext = xpForLevel(s.level);
        levelsGained += 1;
      }
      if (levelsGained > 0) {
        const owned = new Set(s.upgrades);
        const pool = UPGRADES.filter((u) => !owned.has(u.id) || u.stacking);
        s.offer = rng.sample(pool.map((u) => u.id), 3);
        s.phase = "draft";
        s.pendingLevelUps = levelsGained - 1;
        cbRef.current.onLevel?.(s.level);
        cbRef.current.onPhase?.("draft");
      }

      return s;
    });
  }, []);

  /**
   * Typing targets by prefix across every enemy at once, then locks on.
   *
   * Locking matters: without it, typing "car" when both "car" and "cargo" are
   * on screen would be ambiguous, and the player would never know which one
   * they were killing.
   */
  const setTyped = useCallback(
    (value: string) => {
      setState((prev) => {
        if (prev.phase !== "playing") return prev;
        const raw = value.toLowerCase();
        const trimmed = raw.trim();
        if (raw === "") return { ...prev, typed: "", lockedUid: null };

        const candidates = prev.enemies.filter(
          (e) =>
            e.hp > 0 &&
            (e.word.startsWith(raw) || (trimmed.length > 0 && e.word.startsWith(trimmed))),
        );
        if (candidates.length === 0) {
          cbRef.current.onMiss?.();
          return { ...prev, typed: "", lockedUid: null, combo: 0 };
        }

        // Prefer the enemy already locked, then the closest to the player.
        const locked =
          candidates.find((e) => e.uid === prev.lockedUid) ??
          candidates.reduce((a, b) => (b.progress > a.progress ? b : a));

        if (locked.word === raw || (trimmed.length > 0 && locked.word === trimmed)) {
          queueMicrotask(() => strike(locked.uid));
          return {
            ...prev,
            typed: "",
            lockedUid: null,
            enemies: prev.enemies.map((e) =>
              e.uid === locked.uid ? { ...e, typed: locked.word.length } : e,
            ),
          };
        }

        const matchLen = locked.word.startsWith(raw) ? raw.length : trimmed.length;
        return {
          ...prev,
          typed: raw,
          lockedUid: locked.uid,
          enemies: prev.enemies.map((e) =>
            e.uid === locked.uid ? { ...e, typed: matchLen } : { ...e, typed: 0 },
          ),
        };
      });
    },
    [strike],
  );

  const takeUpgrade = useCallback((id: string) => {
    setState((prev) => {
      const s: SurvivorState = { ...prev, offer: [] };
      s.upgrades = [...s.upgrades, id];
      const def = UPGRADES.find((u) => u.id === id);
      if (def?.id === "iron-skin") {
        s.maxHp += 20;
        s.hp += 20;
      }
      s.banner = def ? def.name : null;

      if (s.pendingLevelUps > 0) {
        // Another level-up from the same earlier XP gain is still owed its
        // own draft -- offer it immediately rather than dropping back into
        // play, so it isn't silently skipped.
        const rng = rngRef.current;
        const owned = new Set(s.upgrades);
        const pool = UPGRADES.filter((u) => !owned.has(u.id) || u.stacking);
        s.offer = rng.sample(pool.map((u) => u.id), 3);
        s.pendingLevelUps -= 1;
        s.phase = "draft";
        cbRef.current.onPhase?.("draft");
      } else {
        s.phase = "playing";
        cbRef.current.onPhase?.("playing");
      }
      return s;
    });
  }, []);

  const reset = useCallback(() => setState(initial()), []);

  const derived = useMemo(
    () => ({
      alive: state.enemies.filter((e) => e.hp > 0),
      upgradeDefs: state.upgrades
        .map((id) => UPGRADES.find((u) => u.id === id))
        .filter((u): u is UpgradeDef => Boolean(u)),
      offerDefs: state.offer
        .map((id) => UPGRADES.find((u) => u.id === id))
        .filter((u): u is UpgradeDef => Boolean(u)),
      seed: seedRef.current,
    }),
    [state],
  );

  return {
    state,
    ...derived,
    paused,
    setPaused,
    start,
    setTyped,
    takeUpgrade,
    reset,
    has,
  };
}

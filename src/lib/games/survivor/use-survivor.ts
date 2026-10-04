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
 * Fixed simulation steps while visible and unpaused. Active run time uses a
 * monotonic clock independently of those steps; hiding the tab pauses input
 * and simulation until the player explicitly resumes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameSession } from "@/lib/games/cards/use-game-session";
import { decaySurvivorEnemies, strikeSurvivor, typeSurvivorWord, xpForLevel } from "@/lib/games/survivor/transitions";
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
  wordFlawless: boolean;
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

export function useSurvivor(seed?: string, cb: SurvivorCallbacks = {}) {
  const [runSeed, setRunSeed] = useState(seed ?? "");
  const rngRef = useRef<Rng>(createRng(seed ?? ""));
  const uidRef = useRef(1);
  const cbRef = useRef(cb);
  useEffect(() => { cbRef.current = cb; }, [cb]);

  const { state, update, replace, paused, setPaused } = useGameSession(initial, "playing");

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
      wordFlawless: true,
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
    setRunSeed(sd);
    rngRef.current = createRng(sd);
    uidRef.current = 1;
    const char = CHARACTERS.find((c) => c.id === characterId) ?? CHARACTERS[0];
    replace({
      ...initial(),
      phase: "playing",
      characterId,
      hp: char.maxHp,
      maxHp: char.maxHp,
      upgrades: char.startUpgrade ? [char.startUpgrade] : [],
    });
    cbRef.current.onPhase?.("playing");
  }, [replace]);

  /** Main tick: spawning, movement, contact damage, wave rollover. */
  useEffect(() => {
    if (paused || state.phase !== "playing") return;

    const id = window.setInterval(() => {
      update((prev) => {
        if (prev.phase !== "playing") return prev;
        const s: SurvivorState = { ...prev };
        const rng = rngRef.current;
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
        s.enemies = decaySurvivorEnemies(s.enemies, TICK_MS).map((e) => {
          if (e.hp <= 0) return e;
          const next = { ...e };
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
  }, [paused, state.phase, spawn, update]);

  /**
   * Typing targets by prefix across every enemy at once, then locks on.
   *
   * Locking matters: without it, typing "car" when both "car" and "cargo" are
   * on screen would be ambiguous, and the player would never know which one
   * they were killing.
   */
  const setTyped = useCallback(
    (value: string) => {
      update((prev) => {
        const typed = typeSurvivorWord(prev, value);
        if (typed.miss) cbRef.current.onMiss?.();
        if (typed.strikeUid === null) return typed.state;
        const result = strikeSurvivor(typed.state, typed.strikeUid, rngRef.current);
        for (const event of result.events) {
          if (event.kind === "kill") cbRef.current.onKill?.(event.enemy, event.damage, event.crit);
          else cbRef.current.onStrike?.(event.enemy, event.damage, event.crit);
        }
        if (result.levelsGained > 0) {
          cbRef.current.onLevel?.(result.state.level);
          cbRef.current.onPhase?.("draft");
        }
        return result.state;
      });
    },
    [update],
  );

  const takeUpgrade = useCallback((id: string) => {
    update((prev) => {
      if (prev.phase !== "draft" || !prev.offer.includes(id)) return prev;
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
  }, [update]);

  const reset = useCallback(() => replace(initial()), [replace]);

  const derived = useMemo(
    () => ({
      alive: state.enemies.filter((e) => e.hp > 0),
      upgradeDefs: state.upgrades
        .map((id) => UPGRADES.find((u) => u.id === id))
        .filter((u): u is UpgradeDef => Boolean(u)),
      offerDefs: state.offer
        .map((id) => UPGRADES.find((u) => u.id === id))
        .filter((u): u is UpgradeDef => Boolean(u)),
      seed: runSeed,
    }),
    [state, runSeed],
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

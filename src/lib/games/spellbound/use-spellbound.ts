"use client";

/**
 * Spellbound's engine.
 *
 * The one rule everything else follows: **word length is cast time**. A spell's
 * power scales with the letters you have to type for it, so every moment of
 * combat is a wager — commit to eleven letters and eat the hit that lands
 * halfway through, or chip safely with four and stay ahead of the wind-up.
 *
 * Driven by setInterval rather than requestAnimationFrame. rAF stops firing
 * when the tab or pane is hidden, which silently freezes a run mid-fight; this
 * project has already shipped that bug once. A fixed 50ms tick keeps running,
 * makes pausing a one-line guard, and is far more than precise enough for
 * wind-up timers measured in hundreds of milliseconds.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRng, type Rng } from "@/lib/rng/seeded-rng";
import {
  BOSSES,
  CHARACTERS,
  ELITES,
  EVENTS,
  MINIONS,
  RELICS,
  SPELLS,
  VOID_RULES,
  bandWords,
  bossForFloor,
  characterById,
  relicById,
  type EnemyDef,
  type EventDef,
  type RelicDef,
  type SpellDef,
  type VoidRule,
} from "@/lib/games/spellbound/content";

export const TICK_MS = 50;
const SLOTS = 4;
const ROOMS_PER_FLOOR = 6;
const FINAL_FLOOR = 4;

export type Phase =
  | "select"
  | "map"
  | "combat"
  | "reward"
  | "shop"
  | "event"
  | "victory"
  | "defeat";

export type RoomKind = "combat" | "elite" | "treasure" | "shop" | "event" | "boss";

export interface RoomNode {
  index: number;
  kind: RoomKind;
  done: boolean;
}

export interface SpellSlot {
  spellId: string;
  word: string;
  /** Remaining lockout in ms; 0 means typeable. */
  cooldown: number;
  /** Set while the Word Eater is corrupting this slot. */
  corrupted: boolean;
  /** Sealed by the Archivist: unusable until this counts down. */
  sealed: number;
}

export interface EnemyState {
  uid: number;
  def: EnemyDef;
  hp: number;
  maxHp: number;
  /** Counts down to 0, then the enemy strikes and it resets. */
  windup: number;
  /** Frozen enemies do not advance their wind-up. */
  frozen: number;
  hitFlash: number;
}

export interface FloatingEvent {
  id: number;
  kind: "damage" | "heal" | "crit" | "block" | "info";
  text: string;
  /** 0-1 across the board, for placement. */
  at: number;
}

export interface SpellboundState {
  phase: Phase;
  characterId: string;
  floor: number;
  room: number;
  map: RoomNode[];
  roomKind: RoomKind;

  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  shield: number;
  gold: number;

  relics: string[];
  spells: string[];
  slots: SpellSlot[];
  typed: string;

  enemies: EnemyState[];
  events: FloatingEvent[];

  score: number;
  combo: number;
  bestCombo: number;
  castCount: number;
  elapsedMs: number;

  /** Reward/shop/event payloads, whichever the current phase needs. */
  offer: { spells: string[]; relics: string[] };
  event: EventDef | null;
  voidRule: VoidRule | null;
  /** Floor cleared without taking damage, for the flawless achievement. */
  cleanFloor: boolean;
  message: string | null;
  /** Banner text for a mechanic that just fired, e.g. a Void King rule change. */
  telegraph: string | null;
  /** Last spell cast, for Twin Catalyst and the Mirror Mage. */
  lastSpellId: string | null;
  /** Consecutive casts of lastSpellId. */
  repeatCount: number;
  /** Ms remaining on Quicken's +60% spell damage buff, 0 when inactive. */
  quickenMs: number;
  /** Ms remaining on Hex's +50%-damage mark, 0 when inactive. */
  hexMs: number;
  /** Which enemy Hex marked -- only meaningful while hexMs > 0. */
  hexTargetUid: number | null;
}

export interface CastResult {
  spell: SpellDef;
  damage: number;
  crit: boolean;
  killed: string[];
}

interface Internal {
  rng: Rng;
  uid: number;
  eventId: number;
  mirrorLast: SpellDef | null;
}

// `avoid` is the set of words already sitting in other equipped slots. Two
// slots sharing an identical word used to be possible (two spells in the
// same band rolling the same word independently) -- when that happened,
// typing it could only ever resolve to the lower-index slot, so the other
// spell was silently uncastable by that word until it rerolled on its own.
function pickWord(rng: Rng, spell: SpellDef, avoid: ReadonlySet<string> = new Set()): string {
  const pool = bandWords(spell.band);
  for (let attempt = 0; attempt < 6; attempt++) {
    const word = rng.pick(pool);
    if (!avoid.has(word)) return word;
  }
  // The band's pool is too small to avoid a collision after several tries
  // (rather than loop indefinitely) -- accept one.
  return rng.pick(pool);
}

function makeSlot(rng: Rng, spellId: string, avoid?: ReadonlySet<string>): SpellSlot {
  return {
    spellId,
    word: pickWord(rng, SPELLS[spellId], avoid),
    cooldown: 0,
    corrupted: false,
    sealed: 0,
  };
}

/**
 * Puts a newly bought/learned/rewarded spell into an actual castable slot.
 *
 * Every acquisition path used to only push onto `s.spells` (the "known"
 * list) without ever touching `s.slots` -- gold spent in the shop, and
 * spells learned from events, had zero gameplay effect, since only
 * `s.slots` is ever read by `cast()`. The one path that did touch a slot
 * always overwrote the same fixed index, discarding whatever was equipped
 * there. This rotates the target slot by how many distinct spells are known
 * (`nextSpells.length`), so acquisitions spread across all `SLOTS` slots
 * over a run instead of piling onto one.
 */
function assignSpellToSlot(rng: Rng, slots: SpellSlot[], nextSpells: string[], spellId: string): SpellSlot[] {
  const slotIndex = (nextSpells.length - 1) % slots.length;
  const avoid = new Set(slots.filter((_, i) => i !== slotIndex).map((slot) => slot.word));
  return slots.map((slot, i) => (i === slotIndex ? makeSlot(rng, spellId, avoid) : slot));
}

function buildMap(rng: Rng, floor: number): RoomNode[] {
  const rooms: RoomNode[] = [];
  // A fixed spine with randomised middle: the player always ends a floor on a
  // boss and always gets one shop, so a run cannot be starved of upgrades by
  // bad luck, but the path between is never the same twice.
  //
  // Later floors trade a plain fight for a second elite. That raises difficulty
  // by changing what you face rather than by inflating numbers -- an elite
  // brings a mechanic, where a bigger health bar only makes the same fight
  // longer.
  const filler: RoomKind[] =
    floor >= 3
      ? ["elite", "combat", "event", "treasure", "elite"]
      : ["combat", "combat", "event", "treasure", "elite"];
  const shuffled = rng.shuffle(filler);
  // 6 rooms total: 1 fixed opening combat + this many shuffled filler rooms
  // + 1 fixed shop + 1 fixed boss. Previously this used all 5 filler items
  // (pushing the room count to 7 before a shop was even inserted) and then
  // sliced back down to ROOMS_PER_FLOOR -- which always cut off whatever was
  // pushed last, and boss was always pushed last. Every floor's map
  // therefore never contained a boss room, and the run "won" on clearing the
  // final filler room. Take only as many filler rooms as actually fit.
  const fillerCount = ROOMS_PER_FLOOR - 3;
  rooms.push({ index: 0, kind: "combat", done: false });
  for (const kind of shuffled.slice(0, fillerCount)) {
    rooms.push({ index: 0, kind, done: false });
  }
  // Shop lands in the middle of the filler run, not immediately after the
  // opening fight or immediately before the boss.
  const shopAt = Math.min(rooms.length, 1 + Math.floor(fillerCount / 2));
  rooms.splice(shopAt, 0, { index: 0, kind: "shop", done: false });
  rooms.push({ index: 0, kind: "boss", done: false });
  return rooms.map((r, i) => ({ ...r, index: i }));
}

function enemyFrom(def: EnemyDef, floor: number, uid: number): EnemyState {
  // Health scales per floor; damage deliberately does not scale as steeply,
  // because a fight that kills you faster is not the same as a harder fight --
  // it just removes the chance to make interesting choices.
  const hp = Math.round(def.hp * (1 + (floor - 1) * 0.45));
  return {
    uid,
    def,
    hp,
    maxHp: hp,
    windup: def.windupMs,
    frozen: 0,
    hitFlash: 0,
  };
}

function spawnFor(rng: Rng, kind: RoomKind, floor: number, uidFrom: number): EnemyState[] {
  if (kind === "boss") return [enemyFrom(bossForFloor(floor), floor, uidFrom)];
  if (kind === "elite") {
    return [enemyFrom(rng.pick(ELITES), floor, uidFrom)];
  }
  const count = Math.min(4, 1 + Math.floor(floor / 2) + (rng.chance(0.5) ? 1 : 0));
  return Array.from({ length: count }, (_, i) =>
    enemyFrom(rng.pick(MINIONS), floor, uidFrom + i),
  );
}

export interface SpellboundCallbacks {
  onCast?: (result: CastResult) => void;
  onPlayerHit?: (amount: number) => void;
  onEnemyKilled?: (enemy: EnemyState) => void;
  onPhase?: (phase: Phase) => void;
  onMiss?: () => void;
}

export function useSpellbound(seed?: string, cb: SpellboundCallbacks = {}) {
  const seedRef = useRef(seed ?? `${Date.now()}`);
  const internal = useRef<Internal>({
    rng: createRng(seedRef.current),
    uid: 1,
    eventId: 1,
    mirrorLast: null,
  });

  const cbRef = useRef(cb);
  cbRef.current = cb;

  const [state, setState] = useState<SpellboundState>(() => initial());
  const [paused, setPaused] = useState(false);

  function initial(): SpellboundState {
    return {
      phase: "select",
      characterId: CHARACTERS[0].id,
      floor: 1,
      room: 0,
      map: [],
      roomKind: "combat",
      hp: 0,
      maxHp: 0,
      mana: 0,
      maxMana: 0,
      shield: 0,
      gold: 0,
      relics: [],
      spells: [],
      slots: [],
      typed: "",
      enemies: [],
      events: [],
      score: 0,
      combo: 0,
      bestCombo: 0,
      castCount: 0,
      elapsedMs: 0,
      offer: { spells: [], relics: [] },
      event: null,
      voidRule: null,
      cleanFloor: true,
      message: null,
      telegraph: null,
      lastSpellId: null,
      repeatCount: 0,
      quickenMs: 0,
      hexMs: 0,
      hexTargetUid: null,
    };
  }

  const hasRelic = useCallback(
    (id: string) => state.relics.includes(id),
    [state.relics],
  );

  const pushEvent = useCallback(
    (s: SpellboundState, kind: FloatingEvent["kind"], text: string, at: number) => {
      const id = internal.current.eventId++;
      s.events = [...s.events.slice(-14), { id, kind, text, at }];
    },
    [],
  );

  /** Begin a run with the chosen character. */
  const start = useCallback(
    (characterId: string, runSeed?: string) => {
      const s = runSeed ?? `${Date.now()}`;
      seedRef.current = s;
      internal.current = {
        rng: createRng(s),
        uid: 1,
        eventId: 1,
        mirrorLast: null,
      };
      const rng = internal.current.rng;
      const char = characterById(characterId);
      const spells = [char.startSpell, "spark"];
      const map = buildMap(rng, 1);

      setState({
        ...initial(),
        phase: "combat",
        characterId,
        floor: 1,
        room: 0,
        map,
        roomKind: map[0].kind,
        hp: char.maxHp,
        maxHp: char.maxHp,
        mana: char.maxMana,
        maxMana: char.maxMana,
        gold: 40,
        relics: [],
        spells,
        slots: (() => {
          const initialSlots: SpellSlot[] = [];
          for (let i = 0; i < SLOTS; i++) {
            const avoid = new Set(initialSlots.map((slot) => slot.word));
            initialSlots.push(makeSlot(rng, spells[i % spells.length], avoid));
          }
          return initialSlots;
        })(),
        enemies: spawnFor(rng, map[0].kind, 1, internal.current.uid),
      });
      internal.current.uid += 8;
      cbRef.current.onPhase?.("combat");
    },
    [],
  );

  /** Advance one room; decides the next phase from the room kind. */
  const enterRoom = useCallback((s: SpellboundState): SpellboundState => {
    const rng = internal.current.rng;
    const next = s.room + 1;

    if (next >= s.map.length) {
      if (s.floor >= FINAL_FLOOR) {
        return { ...s, phase: "victory" };
      }
      const floor = s.floor + 1;
      const map = buildMap(rng, floor);
      return {
        ...s,
        floor,
        room: 0,
        map,
        roomKind: map[0].kind,
        phase: "combat",
        cleanFloor: true,
        enemies: spawnFor(rng, map[0].kind, floor, internal.current.uid),
        typed: "",
      };
    }

    const kind = s.map[next].kind;
    const base: SpellboundState = {
      ...s,
      room: next,
      roomKind: kind,
      typed: "",
      map: s.map.map((r, i) => (i === s.room ? { ...r, done: true } : r)),
    };

    if (kind === "shop") {
      return {
        ...base,
        phase: "shop",
        offer: {
          spells: rng.sample(Object.keys(SPELLS), 3),
          relics: rng.sample(RELICS.map((r) => r.id), 2),
        },
      };
    }
    if (kind === "event") {
      return { ...base, phase: "event", event: rng.pick(EVENTS) };
    }
    if (kind === "treasure") {
      return {
        ...base,
        phase: "reward",
        offer: { spells: [], relics: rng.sample(RELICS.map((r) => r.id), 3) },
      };
    }
    return {
      ...base,
      phase: "combat",
      enemies: spawnFor(rng, kind, s.floor, internal.current.uid),
    };
  }, []);

  /** The main tick. Everything time-based lives here. */
  useEffect(() => {
    if (paused) return;
    if (state.phase !== "combat") return;

    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.phase !== "combat") return prev;
        const s: SpellboundState = { ...prev };
        const char = characterById(s.characterId);
        s.elapsedMs += TICK_MS;
        // Banners are transient: hold one for ~2.5s, then clear, so a stale
        // rule change cannot sit over the board for the rest of the fight.
        if (s.telegraph && s.elapsedMs % 2500 < TICK_MS) s.telegraph = null;

        // Quicken/Hex durations count down like any other timed effect.
        if (s.quickenMs > 0) s.quickenMs = Math.max(0, s.quickenMs - TICK_MS);
        if (s.hexMs > 0) {
          s.hexMs = Math.max(0, s.hexMs - TICK_MS);
          if (s.hexMs === 0) s.hexTargetUid = null;
        }

        // mana regen, modified by relics -- the Void King's "silence" rule
        // stops it outright (telegraphed and picked, but never actually
        // applied anywhere until now).
        const regenMult = s.relics.includes("mana-engine") ? 1.6 : 1;
        if (s.voidRule !== "silence") {
          s.mana = Math.min(s.maxMana, s.mana + char.regen * (TICK_MS / 1000) * regenMult);
        }

        // cooldowns and seals
        s.slots = s.slots.map((slot) => {
          if (slot.cooldown <= 0 && slot.sealed <= 0) return slot;
          return {
            ...slot,
            cooldown: Math.max(0, slot.cooldown - TICK_MS),
            sealed: Math.max(0, slot.sealed - TICK_MS),
          };
        });

        // Warden's Knot stops shield bleeding away between hits.
        if (s.shield > 0 && !s.relics.includes("wardens-knot")) {
          s.shield = Math.max(0, s.shield - TICK_MS / 1000);
        }

        // enemies
        let incoming = 0;
        const hasteMult = s.voidRule === "haste" ? 1.5 : 1;
        s.enemies = s.enemies.map((e) => {
          if (e.hp <= 0) return e;
          const next = { ...e, hitFlash: Math.max(0, e.hitFlash - TICK_MS) };
          if (next.frozen > 0) {
            next.frozen = Math.max(0, next.frozen - TICK_MS);
            return next;
          }
          next.windup -= TICK_MS * hasteMult;
          if (next.windup <= 0) {
            next.windup = next.def.windupMs;
            incoming += next.def.damage;
          }
          return next;
        });

        if (incoming > 0) {
          const absorbed = Math.min(s.shield, incoming);
          s.shield -= absorbed;
          const afterShield = incoming - absorbed;
          // Sleight's cost: the Rogue Mage trades durability for burst.
          // Iron Will's cost: "never interrupted" costs +15% damage taken --
          // there's no interrupt mechanic in the game to make that upside
          // meaningful, but the downside is real and was previously never
          // applied at all, making the relic strictly beneficial.
          let takeMult = s.characterId === "rogue-mage" ? 1.25 : 1;
          if (s.relics.includes("iron-will")) takeMult *= 1.15;
          const through = Math.round(afterShield * takeMult);
          if (through > 0) {
            s.hp = Math.max(0, s.hp - through);
            s.combo = 0;
            s.cleanFloor = false;
            pushEvent(s, "damage", `-${through}`, 0.5);
            cbRef.current.onPlayerHit?.(through);
          } else {
            pushEvent(s, "block", "blocked", 0.5);
          }
        }

        if (s.hp <= 0) {
          s.phase = "defeat";
          cbRef.current.onPhase?.("defeat");
          return s;
        }

        // --- boss mechanics -------------------------------------------
        const rngTick = internal.current.rng;
        const living = s.enemies.filter((e) => e.hp > 0);
        const fired = (period: number) => s.elapsedMs % period < TICK_MS;

        // Word Eater scrambles a slot's word until it is cast.
        if (living.some((e) => e.def.mechanic === "word-eater") && fired(3000)) {
          const i = rngTick.int(0, s.slots.length - 1);
          s.slots = s.slots.map((slot, j) =>
            j === i
              ? { ...slot, corrupted: true, word: pickWord(rngTick, SPELLS[slot.spellId]) }
              : slot,
          );
          s.typed = "";
          s.telegraph = "A word is eaten";
        }

        // The Archivist seals a spell outright for eight seconds.
        if (living.some((e) => e.def.mechanic === "seal") && fired(7000)) {
          const open = s.slots
            .map((sl, i) => ({ sl, i }))
            .filter(({ sl }) => sl.sealed <= 0);
          if (open.length > 1) {
            const target = rngTick.pick(open).i;
            s.slots = s.slots.map((sl, j) =>
              j === target ? { ...sl, sealed: 8000 } : sl,
            );
            s.typed = "";
            s.telegraph = "A spell is sealed";
          }
        }

        // Mirror Mage throws your own last spell back at you, so repeating
        // the same one is punished and varying is rewarded.
        if (living.some((e) => e.def.mechanic === "mirror") && fired(5000)) {
          const copied = s.lastSpellId ? SPELLS[s.lastSpellId] : null;
          if (copied && copied.type !== "heal" && copied.type !== "shield") {
            const bite = Math.round(copied.base + copied.perLetter * 6);
            const absorbed = Math.min(s.shield, bite);
            s.shield -= absorbed;
            s.hp = Math.max(0, s.hp - (bite - absorbed));
            pushEvent(s, "damage", `mirrored ${bite}`, 0.65);
            s.telegraph = `Mirrored: ${copied.name}`;
          }
        }

        // Void King rewrites one rule of combat on a timer.
        if (living.some((e) => e.def.mechanic === "void-king") && fired(12000)) {
          const rule = rngTick.pick(VOID_RULES);
          s.voidRule = rule.id;
          s.telegraph = `${rule.name}: ${rule.text}`;
        }

        // Elites that mend the room keep their allies standing.
        if (living.some((e) => e.def.mechanic === "mend-allies") && fired(4000)) {
          s.enemies = s.enemies.map((e) =>
            e.hp > 0 && e.def.mechanic !== "mend-allies"
              ? { ...e, hp: Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.06)) }
              : e,
          );
          s.telegraph = "The room is mended";
        }

        return s;
      });
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [paused, state.phase, pushEvent]);

  /** Resolve a completed word into an actual cast. */
  const cast = useCallback(
    (slotIndex: number) => {
      setState((prev) => {
        if (prev.phase !== "combat") return prev;
        const s: SpellboundState = { ...prev };
        const slot = s.slots[slotIndex];
        if (!slot || slot.cooldown > 0 || slot.sealed > 0) return prev;

        const spell = SPELLS[slot.spellId];
        const costCheck = s.relics.includes("silent-sigil")
          ? spell.mana * 0.65
          : spell.mana;
        if (s.mana < costCheck) {
          pushEvent(s, "info", "no mana", 0.5);
          return s;
        }

        const rng = internal.current.rng;
        const len = slot.word.length;
        const manaCost = s.relics.includes("silent-sigil")
          ? spell.mana * 0.65
          : spell.mana;
        s.mana -= manaCost;
        // The Void King's "drain" rule: telegraphed and picked, but never
        // actually applied anywhere until now.
        if (s.voidRule === "drain") s.hp = Math.max(0, s.hp - 3);
        s.castCount += 1;

        // Relics and passives that change the maths rather than nudging a stat.
        let power = spell.base + spell.perLetter * len;
        if (s.relics.includes("heavy-tome") && len >= 8) power *= 1.5;
        // Capped at +60%, matching "up to +60%" in its own description --
        // previously uncapped and based on raw combo count rather than a
        // percentage, so a long clean streak (fully player-controlled, not
        // hard to sustain) could dwarf a spell's own base power.
        if (s.relics.includes("scholar")) power *= 1 + Math.min(0.6, s.combo * 0.02);
        // Quicken: +60% spell damage while active.
        if (s.quickenMs > 0) power *= 1.6;
        if (s.relics.includes("cursed-quill")) power *= 1.45;

        // Sleight: short words hit far harder, at the cost of taking more.
        if (s.characterId === "rogue-mage" && len <= 5) power *= 1.7;

        // Twin Catalyst rewards committing to one spell twice running.
        const repeat = s.lastSpellId === slot.spellId ? s.repeatCount + 1 : 1;
        if (s.relics.includes("twin") && repeat >= 2) power *= 1.8;

        // Overflow converts mana held above 80% into damage, spent on the cast.
        if (s.relics.includes("overflow")) {
          const pctOver = (s.mana / Math.max(1, s.maxMana)) * 100 - 80;
          if (pctOver > 0) power *= 1 + pctOver / 100;
        }

        let critChance = 0.05 + (spell.crit ?? 0);
        if (s.relics.includes("prism")) critChance += 0.15;
        // Silent Sigil trades crits away entirely for cheaper casting.
        const canCrit = !s.relics.includes("silent-sigil");
        const crit = canCrit && rng.chance(critChance);
        if (crit) power *= 2;
        if (s.voidRule === "inversion") power *= 0.75;

        const damage = Math.round(power);
        const killed: string[] = [];

        if (spell.type === "heal") {
          s.hp = Math.min(s.maxHp, s.hp + damage);
          pushEvent(s, "heal", `+${damage}`, 0.5);
        } else if (spell.type === "shield") {
          s.shield += damage;
          pushEvent(s, "info", `shield ${damage}`, 0.5);
        } else if (spell.type === "buff") {
          // Quicken: previously fell through to the damage branch below with
          // base/perLetter both 0, dealing a flat 1 damage instead of
          // buffing anything.
          s.quickenMs = spell.durationMs ?? 0;
          pushEvent(s, "info", "damage +60%", 0.5);
        } else if (spell.type === "debuff") {
          // Hex: same previous bug as Quicken -- marks the frontmost living
          // enemy instead of dealing 1 damage nowhere useful.
          const target = s.enemies.find((e) => e.hp > 0);
          if (target) {
            s.hexTargetUid = target.uid;
            s.hexMs = spell.durationMs ?? 0;
            pushEvent(s, "info", "marked", 0.5);
          }
        } else {
          const alive = s.enemies.filter((e) => e.hp > 0);
          const targets =
            spell.type === "aoe"
              ? alive
              : alive.slice(0, Math.max(1, spell.targets ?? 1));
          // Chain Sigil splashes onto one enemy the spell did not target.
          const splashTo =
            s.relics.includes("chain-sigil") && spell.type === "damage"
              ? alive.find((e) => !targets.some((t) => t.uid === e.uid))
              : undefined;

          s.enemies = s.enemies.map((e) => {
            const isTarget = targets.some((t) => t.uid === e.uid);
            const isSplash = splashTo?.uid === e.uid;
            if ((!isTarget && !isSplash) || e.hp <= 0) return e;

            let dealt = Math.max(
              1,
              (isSplash ? damage * 0.35 : damage) - (e.def.armor ?? 0),
            );
            // Hex: the marked enemy takes +50% damage from anything, not
            // just the debuff cast that marked it.
            if (s.hexTargetUid === e.uid && s.hexMs > 0) dealt *= 1.5;
            if (
              spell.type === "execute" &&
              e.hp / e.maxHp <= (spell.threshold ?? 0.25)
            ) {
              dealt = Math.round(dealt * (spell.executeMult ?? 3));
            }
            // Oblivion: the Void Mage finishes anything already nearly dead,
            // whatever the spell was.
            if (s.characterId === "void-mage" && e.hp / e.maxHp <= 0.18) {
              dealt = e.hp;
            }
            const hp = Math.max(0, e.hp - Math.round(dealt));
            if (hp === 0 && e.hp > 0) killed.push(e.def.name);
            return { ...e, hp, hitFlash: 220 };
          });

          // The Cipher reflects a quarter of what it takes.
          const reflector = targets.find((t) => t.def.mechanic === "reflect");
          if (reflector) {
            const back = Math.round(damage * 0.25);
            const absorbed = Math.min(s.shield, back);
            s.shield -= absorbed;
            s.hp = Math.max(0, s.hp - (back - absorbed));
            pushEvent(s, "damage", `reflect ${back}`, 0.7);
          }
          pushEvent(s, crit ? "crit" : "damage", `${damage}`, 0.35);

          // Vampiric Ink is described as "killing an enemy restores 10% of
          // max health" -- previously applied as 12% lifesteal on *all*
          // damage dealt, gated on nothing.
          if (spell.lifesteal) {
            s.hp = Math.min(s.maxHp, s.hp + Math.round(damage * spell.lifesteal));
          } else if (s.relics.includes("vampiric") && killed.length > 0) {
            s.hp = Math.min(s.maxHp, s.hp + Math.round(s.maxHp * 0.1));
          }
          if (crit && s.relics.includes("bloodstone")) {
            s.hp = Math.min(s.maxHp, s.hp + 4);
          }
        }

        // Warded: every completed cast builds shield, to a cap.
        if (s.characterId === "battlemage") {
          const cap = s.relics.includes("wardens-knot") ? 60 : 30;
          s.shield = Math.min(cap, s.shield + 4);
        }

        // Dilation: a long word buys real time against every wind-up.
        if (s.characterId === "chronomancer") {
          const stall = len * 80;
          s.enemies = s.enemies.map((e) =>
            e.hp > 0 ? { ...e, windup: e.windup + stall } : e,
          );
        }

        // Fractured Hourglass stalls the whole room every fifth cast.
        if (s.relics.includes("hourglass") && s.castCount % 5 === 0) {
          s.enemies = s.enemies.map((e) =>
            e.hp > 0 ? { ...e, windup: e.windup + 1500 } : e,
          );
          pushEvent(s, "info", "time fractures", 0.5);
        }

        s.lastSpellId = slot.spellId;
        s.repeatCount = repeat;
        s.combo += 1;
        s.bestCombo = Math.max(s.bestCombo, s.combo);
        s.score += damage + s.combo * 2;

        // fresh word + cooldown, shortened by the Quickened relic
        const cd = s.relics.includes("quickened") && len <= 5
          ? spell.cooldownMs * 0.6
          : spell.cooldownMs;
        const otherWords = new Set(s.slots.filter((_, i) => i !== slotIndex).map((sl) => sl.word));
        s.slots = s.slots.map((sl, i) =>
          i === slotIndex
            ? { ...sl, word: pickWord(rng, spell, otherWords), cooldown: cd, corrupted: false }
            : sl,
        );
        s.typed = "";

        // Echo relic: a second, free cast at reduced power. Only for spells
        // that actually dealt damage -- previously excluded only "heal", so
        // a shield/buff/debuff cast (0 direct damage) could still "echo"
        // using that spell's base/perLetter numbers as free damage, and the
        // echo hit skipped enemy armor entirely.
        const echoEligible = spell.type === "damage" || spell.type === "aoe" || spell.type === "execute";
        if (s.relics.includes("echo") && rng.chance(0.2) && echoEligible) {
          const target = s.enemies.find((e) => e.hp > 0);
          if (target) {
            const echo = Math.max(1, Math.round(damage * 0.5) - (target.def.armor ?? 0));
            s.enemies = s.enemies.map((e) =>
              e.uid === target.uid ? { ...e, hp: Math.max(0, e.hp - echo) } : e,
            );
            pushEvent(s, "info", `echo ${echo}`, 0.6);
          }
        }

        internal.current.mirrorLast = spell;
        cbRef.current.onCast?.({ spell, damage, crit, killed });
        for (const e of s.enemies) {
          if (e.hp === 0 && killed.includes(e.def.name)) cbRef.current.onEnemyKilled?.(e);
        }

        // room cleared?
        if (s.enemies.every((e) => e.hp <= 0)) {
          s.gold += 18 + s.floor * 6;
          const wasBoss = s.roomKind === "boss";
          s.phase = "reward";
          s.offer = {
            spells: rng.sample(Object.keys(SPELLS), 3),
            relics: wasBoss ? rng.sample(RELICS.map((r) => r.id), 3) : [],
          };
          cbRef.current.onPhase?.("reward");
        }

        return s;
      });
    },
    [pushEvent],
  );

  /** Feed the typing buffer. Matches against every unlocked slot at once. */
  const setTyped = useCallback(
    (value: string) => {
      setState((prev) => {
        if (prev.phase !== "combat") return prev;
        const lower = value.toLowerCase();
        const match = prev.slots.findIndex(
          (sl) => sl.cooldown <= 0 && sl.sealed <= 0 && sl.word === lower,
        );
        if (match >= 0) {
          // defer the cast so this setState stays pure
          queueMicrotask(() => cast(match));
          return { ...prev, typed: "" };
        }
        const viable = prev.slots.some(
          (sl) => sl.cooldown <= 0 && sl.sealed <= 0 && sl.word.startsWith(lower),
        );
        // Arcane Focus: the Apprentice is paid for keeping the streak alive.
        if (
          viable &&
          prev.characterId === "apprentice" &&
          lower.length > prev.typed.length
        ) {
          return {
            ...prev,
            typed: lower,
            mana: Math.min(prev.maxMana, prev.mana + 0.5),
          };
        }
        if (!viable && lower.length > 0) {
          cbRef.current.onMiss?.();
          return { ...prev, typed: "", combo: 0 };
        }
        return { ...prev, typed: lower };
      });
    },
    [cast],
  );

  const takeReward = useCallback(
    (kind: "spell" | "relic" | "skip", id?: string) => {
      setState((prev) => {
        let s: SpellboundState = { ...prev };
        const rng = internal.current.rng;
        if (kind === "spell" && id) {
          s.spells = [...new Set([...s.spells, id])];
          s.slots = assignSpellToSlot(rng, s.slots, s.spells, id);
        } else if (kind === "relic" && id) {
          s.relics = [...s.relics, id];
          const relic = relicById(id);
          if (relic?.id === "iron-will") {
            s.maxHp += 20;
            s.hp += 20;
          }
          if (relic?.id === "cursed-quill") {
            s.maxHp = Math.max(20, s.maxHp - 15);
            s.hp = Math.min(s.hp, s.maxHp);
          }
          // "Mana regen +60%. Max health -10." -- the regen upside was
          // already applied every tick; the downside was never applied
          // anywhere, making a "cursed" relic pure upside.
          if (relic?.id === "mana-engine") {
            s.maxHp = Math.max(20, s.maxHp - 10);
            s.hp = Math.min(s.hp, s.maxHp);
          }
        }
        s = enterRoom(s);
        cbRef.current.onPhase?.(s.phase);
        return s;
      });
    },
    [enterRoom],
  );

  const chooseEvent = useCallback(
    (optionIndex: number) => {
      setState((prev) => {
        let s: SpellboundState = { ...prev };
        const rng = internal.current.rng;
        const opt = s.event?.options[optionIndex];
        if (opt) {
          const e = opt.effect;
          if (e.kind === "hp") s.hp = Math.max(1, Math.min(s.maxHp, s.hp + e.amount));
          else if (e.kind === "fullHeal") s.hp = s.maxHp;
          else if (e.kind === "gold") s.gold = Math.max(0, s.gold + e.amount);
          else if (e.kind === "shield") s.shield += e.amount;
          else if (e.kind === "maxMana") s.maxMana += e.amount;
          else if (e.kind === "relic") s.relics = [...s.relics, rng.pick(RELICS).id];
          else if (e.kind === "spell") {
            const pick = rng.pick(Object.keys(SPELLS));
            s.spells = [...new Set([...s.spells, pick])];
            s.slots = assignSpellToSlot(rng, s.slots, s.spells, pick);
          } else if (e.kind === "gamble") {
            if (rng.chance(0.5)) s.gold += 60;
            else s.hp = Math.max(1, s.hp - 12);
          }
        }
        s.event = null;
        s = enterRoom(s);
        cbRef.current.onPhase?.(s.phase);
        return s;
      });
    },
    [enterRoom],
  );

  const buy = useCallback((kind: "spell" | "relic", id: string, price: number) => {
    setState((prev) => {
      if (prev.gold < price) return prev;
      const s: SpellboundState = { ...prev, gold: prev.gold - price };
      if (kind === "spell") {
        s.spells = [...new Set([...s.spells, id])];
        s.slots = assignSpellToSlot(internal.current.rng, s.slots, s.spells, id);
      } else {
        s.relics = [...s.relics, id];
      }
      s.offer = {
        spells: s.offer.spells.filter((x) => x !== id),
        relics: s.offer.relics.filter((x) => x !== id),
      };
      return s;
    });
  }, []);

  const leaveShop = useCallback(() => {
    setState((prev) => {
      const s = enterRoom(prev);
      cbRef.current.onPhase?.(s.phase);
      return s;
    });
  }, [enterRoom]);

  const reset = useCallback(() => setState(initial()), []);

  const derived = useMemo(() => {
    const char = state.phase === "select" ? null : characterById(state.characterId);
    return {
      character: char,
      aliveEnemies: state.enemies.filter((e) => e.hp > 0),
      relicDefs: state.relics
        .map((id) => relicById(id))
        .filter((r): r is RelicDef => Boolean(r)),
      isBossRoom: state.roomKind === "boss",
      seed: seedRef.current,
    };
  }, [state]);

  return {
    state,
    ...derived,
    paused,
    setPaused,
    start,
    setTyped,
    takeReward,
    chooseEvent,
    buy,
    leaveShop,
    reset,
    hasRelic,
  };
}

export { CHARACTERS, SPELLS, RELICS, VOID_RULES, BOSSES, MINIONS, ELITES };

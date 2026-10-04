/**
 * Card Battle — the shared vocabulary.
 *
 * This model is pure data and pure functions. No module in this folder
 * holds mutable module-level run state. The engine serializes commands outside
 * React state updaters; each run owns its seeded generator and instance IDs.
 * Extracted combat transitions receive their generator explicitly, making
 * snapshots and seeded decisions directly testable.
 */

import { createRng, hashSeed, type Rng } from "@/lib/rng/seeded-rng";

/* ------------------------------------------------------------------ status */

/**
 * Statuses are the whole combo system. Each one is deliberately weak alone:
 * Blight is slow, Crescendo does nothing until an attack spends it, Exposure
 * multiplies damage you still have to deal yourself.
 */
export type StatusKey =
  | "blight"
  | "encore"
  | "poise"
  | "exposure"
  | "hush"
  | "crescendo"
  | "ward";

export type Statuses = Record<StatusKey, number>;

export interface StatusMeta {
  key: StatusKey;
  name: string;
  /** Never colour alone: every status carries a glyph and a readable name. */
  glyph: string;
  good: boolean;
  description: string;
}

export const STATUS_META: Record<StatusKey, StatusMeta> = {
  blight: {
    key: "blight",
    name: "Blight",
    glyph: "☣",
    good: false,
    description: "At the end of its turn the bearer loses this much health, then Blight drops by 1.",
  },
  encore: {
    key: "encore",
    name: "Encore",
    glyph: "↑",
    good: true,
    description: "Every attack hit deals this much extra damage. Does not wear off.",
  },
  poise: {
    key: "poise",
    name: "Poise",
    glyph: "◆",
    good: true,
    description: "Every block you gain is increased by this much. Does not wear off.",
  },
  exposure: {
    key: "exposure",
    name: "Exposure",
    glyph: "◎",
    good: false,
    description: "The bearer takes 50% more attack damage. Drops by 1 at the end of its turn.",
  },
  hush: {
    key: "hush",
    name: "Hush",
    glyph: "✕",
    good: false,
    description: "The bearer deals 25% less attack damage. Drops by 1 at the end of its turn.",
  },
  crescendo: {
    key: "crescendo",
    name: "Crescendo",
    glyph: "✦",
    good: true,
    description: "Your next attack deals 30% more per stack, then all stacks are spent.",
  },
  ward: {
    key: "ward",
    name: "Ward",
    glyph: "✷",
    good: true,
    description: "Whenever you are hit, the attacker takes this much damage.",
  },
};

export const STATUS_ORDER: StatusKey[] = [
  "blight",
  "encore",
  "poise",
  "crescendo",
  "ward",
  "exposure",
  "hush",
];

export function emptyStatuses(): Statuses {
  return {
    blight: 0,
    encore: 0,
    poise: 0,
    exposure: 0,
    hush: 0,
    crescendo: 0,
    ward: 0,
  };
}

/* -------------------------------------------------------------------- card */

export type CardType =
  | "attack"
  | "defence"
  | "healing"
  | "poison"
  | "buff"
  | "debuff"
  | "draw"
  | "energy"
  | "combo"
  | "summon"
  | "special";

export const CARD_TYPE_ORDER: CardType[] = [
  "attack",
  "defence",
  "healing",
  "poison",
  "buff",
  "debuff",
  "draw",
  "energy",
  "combo",
  "summon",
  "special",
];

export type Rarity = "starter" | "common" | "uncommon" | "rare";

/** Where a dynamic number comes from. This is what makes payoff cards work. */
export type ScaleSource =
  | "blight"
  | "block"
  | "cardsPlayed"
  | "handSize"
  | "crescendo"
  | "intentDamage";

export interface Scale {
  per: ScaleSource;
  mult: number;
}

export interface SummonSpec {
  sprite: "effigy" | "puppet" | "chorister" | "understudy";
  name: string;
  atk: number;
  block: number;
  draw: number;
  turns: number;
  count: number;
}

export type Op =
  | { k: "damage"; amount: number; hits?: number; all?: boolean; pierce?: boolean; scale?: Scale }
  | { k: "block"; amount: number; scale?: Scale }
  | { k: "heal"; amount: number }
  | { k: "loseHp"; amount: number }
  | {
      k: "status";
      target: "enemy" | "allEnemies" | "self";
      status: StatusKey;
      amount: number;
      scale?: Scale;
    }
  | { k: "cleanse"; status: StatusKey }
  | { k: "draw"; amount: number }
  | { k: "energy"; amount: number }
  | { k: "doubleBlight" }
  | { k: "burstBlight" }
  | { k: "summon"; spec: SummonSpec }
  | { k: "exhaustHand"; blockPer: number }
  | { k: "mirrorIntent"; mult: number }
  | { k: "reprise"; count: number }
  | { k: "replayLast" }
  | { k: "nextCardFree" }
  | { k: "sporesPerCard"; amount: number }
  | { k: "ritesEncore"; amount: number }
  | { k: "vigil"; amount: number }
  | { k: "retainBlock" }
  | { k: "discardRandom"; amount: number }
  | { k: "ifCardsPlayed"; atLeast: number; then: Op[] };

export interface CardFace {
  /** Rules text as the player reads it. Kept in sync with `ops` by hand. */
  text: string;
  ops: Op[];
  cost: number;
  exhaust?: boolean;
}

export interface CardDef {
  id: string;
  name: string;
  /** The word you type to play it. Unique across the whole pool. */
  word: string;
  type: CardType;
  rarity: Rarity;
  base: CardFace;
  upgraded: CardFace;
  /**
   * Set when a card reads Crescendo itself, so the generic "spend Crescendo on
   * your first attack" multiplier does not also apply and double-count it.
   */
  spendsCrescendo?: boolean;
  /** Needs a focused enemy to do anything. */
  targeted?: boolean;
}

/** A physical card in a deck: which card it is, and whether it is upgraded. */
export interface CardInstance {
  uid: string;
  id: string;
  upgraded: boolean;
}

export function faceOf(def: CardDef, upgraded: boolean): CardFace {
  return upgraded ? def.upgraded : def.base;
}

/* ------------------------------------------------------------------ minion */

export interface Minion {
  uid: string;
  sprite: SummonSpec["sprite"];
  name: string;
  atk: number;
  block: number;
  draw: number;
  turns: number;
}

/* ------------------------------------------------------------------ intent */

export type IntentKind = "attack" | "attack-status" | "block" | "buff" | "debuff" | "special";

export interface Intent {
  key: string;
  label: string;
  kind: IntentKind;
  damage?: number;
  hits?: number;
  block?: number;
  /** Applied to the player unless `selfStatus` is set. */
  status?: { key: StatusKey; amount: number };
  selfStatus?: { key: StatusKey; amount: number };
  /** Boss hooks, resolved by name in the engine. */
  special?: string;
  description: string;
}

/* ------------------------------------------------------------------ events */

export type FxKind =
  | "card"
  | "hit"
  | "crit"
  | "block"
  | "heal"
  | "blight"
  | "buff"
  | "debuff"
  | "draw"
  | "summon"
  | "death"
  | "player-hit"
  | "relic"
  | "boss"
  | "energy"
  | "shuffle"
  | "win"
  | "lose";

export interface FxEvent {
  id: number;
  kind: FxKind;
  target: "player" | "enemy";
  enemyIndex?: number;
  amount?: number;
  text?: string;
}

/* --------------------------------------------------------------------- rng */

/**
 * A fresh generator per decision, derived from the run seed plus a counter
 * held in run state. The reducer therefore never mutates anything a caller can
 * observe, and React's development double-invoke produces the same result
 * twice instead of quietly advancing the sequence.
 */
export function rngAt(seed: string, tick: number, label: string): Rng {
  return createRng(hashSeed(`${seed}#${label}#${tick}`));
}

export function shortId(seed: string, n: number): string {
  return `${seed.slice(0, 4)}${n.toString(36)}`;
}

export type { Rng };

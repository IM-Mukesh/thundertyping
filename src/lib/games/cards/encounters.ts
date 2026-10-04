/**
 * Enemies and the run's encounter order.
 *
 * Every enemy telegraphs what it will do next, because a turn-based game where
 * you cannot see the incoming hit is just a guess. Bosses use a fixed pattern
 * rather than random intents so their fight can actually be learned and played
 * around — the Crimson Choir's build-up is the whole fight, and it only reads
 * as a build-up if it happens in order.
 */

import type { Intent } from "@/lib/games/cards/model";

const ART = "/games/card-battle";

export interface EnemyDef {
  id: string;
  name: string;
  art: string;
  hp: number;
  kind: "minion" | "elite" | "boss";
  intents: Intent[];
  /** Indices into `intents`, cycled by turn. Bosses use this; minions do not. */
  pattern?: number[];
  blurb: string;
}

export const ENEMIES: Record<string, EnemyDef> = {
  cutpurse: {
    id: "cutpurse",
    name: "Cutpurse",
    art: `${ART}/enemy-cutpurse.webp`,
    hp: 28,
    kind: "minion",
    blurb: "Quick and cheap. Punishes a slow opening.",
    intents: [
      { key: "slash", label: "Slash", kind: "attack", damage: 7, description: "Attacks for 7." },
      { key: "flurry", label: "Flurry", kind: "attack", damage: 3, hits: 3, description: "Attacks for 3, three times." },
      { key: "duck", label: "Duck", kind: "block", block: 6, description: "Gains 6 block." },
    ],
  },
  brawler: {
    id: "brawler",
    name: "Brawler",
    art: `${ART}/enemy-brawler.webp`,
    hp: 46,
    kind: "minion",
    blurb: "Slow, heavy, and entirely honest about it.",
    intents: [
      { key: "haymaker", label: "Haymaker", kind: "attack", damage: 13, description: "Attacks for 13." },
      { key: "brace", label: "Brace", kind: "block", block: 9, description: "Gains 9 block." },
    ],
  },
  poisoner: {
    id: "poisoner",
    name: "Poisoner",
    art: `${ART}/enemy-poisoner.webp`,
    hp: 34,
    kind: "minion",
    blurb: "Stacks Blight on you and waits.",
    intents: [
      {
        key: "dose",
        label: "Dose",
        kind: "attack-status",
        damage: 4,
        status: { key: "blight", amount: 3 },
        description: "Attacks for 4 and applies 3 Blight.",
      },
      { key: "cackle", label: "Cackle", kind: "debuff", status: { key: "hush", amount: 2 }, description: "Applies 2 Hush." },
    ],
  },
  zealot: {
    id: "zealot",
    name: "Zealot",
    art: `${ART}/enemy-zealot.webp`,
    hp: 40,
    kind: "minion",
    blurb: "Rings the bell, then hits harder.",
    intents: [
      { key: "toll", label: "Toll the Bell", kind: "buff", selfStatus: { key: "encore", amount: 2 }, description: "Gains 2 Encore." },
      { key: "smite", label: "Smite", kind: "attack", damage: 10, description: "Attacks for 10." },
    ],
  },
  usher: {
    id: "usher",
    name: "Usher",
    art: `${ART}/enemy-usher.webp`,
    hp: 52,
    kind: "elite",
    blurb: "Silences you, then takes its time.",
    intents: [
      { key: "hushnow", label: "Hush Now", kind: "debuff", status: { key: "hush", amount: 3 }, description: "Applies 3 Hush." },
      { key: "escort", label: "Escort Out", kind: "attack", damage: 15, description: "Attacks for 15." },
      { key: "stand", label: "Stand Firm", kind: "block", block: 12, description: "Gains 12 block." },
    ],
  },
  marionette: {
    id: "marionette",
    name: "Marionette",
    art: `${ART}/enemy-marionette.webp`,
    hp: 60,
    kind: "elite",
    blurb: "Exposes you, then strikes the opening.",
    intents: [
      { key: "tangle", label: "Tangle", kind: "debuff", status: { key: "exposure", amount: 3 }, description: "Applies 3 Exposure." },
      { key: "jerk", label: "Jerk the Strings", kind: "attack", damage: 8, hits: 2, description: "Attacks for 8, twice." },
    ],
  },

  // ------------------------------------------------------------------ bosses
  ringmaster: {
    id: "ringmaster",
    name: "The Ringmaster",
    art: `${ART}/boss-ringmaster.webp`,
    hp: 150,
    kind: "boss",
    blurb: "Builds to a flourish. The pattern is the fight — read it and survive the third beat.",
    pattern: [0, 1, 2, 3],
    intents: [
      { key: "bow", label: "Take a Bow", kind: "block", block: 14, description: "Gains 14 block." },
      { key: "crack", label: "Crack the Whip", kind: "attack", damage: 11, description: "Attacks for 11." },
      { key: "build", label: "Build the Act", kind: "buff", selfStatus: { key: "encore", amount: 4 }, description: "Gains 4 Encore — the next hit will hurt." },
      { key: "flourish", label: "Grand Flourish", kind: "attack", damage: 16, hits: 2, description: "Attacks for 16, twice." },
    ],
  },
  collector: {
    id: "collector",
    name: "The Collector",
    art: `${ART}/boss-collector.webp`,
    hp: 185,
    kind: "boss",
    blurb: "Takes what you brought. Expect to lose cards from your hand.",
    pattern: [0, 1, 0, 2],
    intents: [
      { key: "appraise", label: "Appraise", kind: "attack", damage: 12, description: "Attacks for 12." },
      { key: "confiscate", label: "Confiscate", kind: "special", damage: 6, status: { key: "hush", amount: 2 }, special: "discard", description: "Attacks for 6, applies 2 Hush and discards one random card from your next hand." },
      { key: "hoard", label: "Hoard", kind: "block", block: 18, description: "Gains 18 block." },
    ],
  },
  choir: {
    id: "choir",
    name: "The Crimson Choir",
    art: `${ART}/boss-crimson-choir.webp`,
    hp: 220,
    kind: "boss",
    blurb: "Sings in four parts. The fourth is the one that kills you.",
    pattern: [0, 1, 2, 3],
    intents: [
      { key: "first", label: "First Voice", kind: "attack", damage: 8, description: "Attacks for 8." },
      { key: "second", label: "Second Voice", kind: "attack-status", damage: 8, status: { key: "exposure", amount: 2 }, description: "Attacks for 8 and applies 2 Exposure." },
      { key: "third", label: "Third Voice", kind: "buff", selfStatus: { key: "encore", amount: 5 }, description: "Gains 5 Encore. Block now or pay later." },
      { key: "crescendo", label: "Crescendo", kind: "attack", damage: 14, hits: 3, description: "Attacks for 14, three times." },
    ],
  },
};

export interface Encounter {
  floor: number;
  kind: "combat" | "elite" | "boss";
  enemies: EnemyDef[];
  background: string;
}

const BG = {
  stage: `${ART}/bg-stage.webp`,
  foyer: `${ART}/bg-foyer.webp`,
  catacomb: `${ART}/bg-catacomb.webp`,
  boxes: `${ART}/bg-boxes.webp`,
};

/**
 * A fixed run: nine encounters ending on the Crimson Choir.
 *
 * Fixed rather than procedural on purpose. The deck is where this game's
 * variety lives, and a learnable encounter order means a loss is legible —
 * you know which fight beat you and what you would draft differently.
 */
export const ENCOUNTERS: readonly Encounter[] = [
  { floor: 1, kind: "combat", enemies: [ENEMIES.cutpurse], background: BG.foyer },
  { floor: 1, kind: "combat", enemies: [ENEMIES.cutpurse, ENEMIES.poisoner], background: BG.foyer },
  { floor: 1, kind: "elite", enemies: [ENEMIES.usher], background: BG.boxes },
  { floor: 1, kind: "boss", enemies: [ENEMIES.ringmaster], background: BG.stage },

  { floor: 2, kind: "combat", enemies: [ENEMIES.brawler, ENEMIES.zealot], background: BG.catacomb },
  { floor: 2, kind: "elite", enemies: [ENEMIES.marionette], background: BG.catacomb },
  { floor: 2, kind: "boss", enemies: [ENEMIES.collector], background: BG.boxes },

  { floor: 3, kind: "combat", enemies: [ENEMIES.zealot, ENEMIES.poisoner, ENEMIES.cutpurse], background: BG.stage },
  { floor: 3, kind: "boss", enemies: [ENEMIES.choir], background: BG.stage },
];

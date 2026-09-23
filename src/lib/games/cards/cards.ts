/**
 * The card pool.
 *
 * Built so that individually weak cards win together. Blight does very little
 * on its own; Redouble does literally nothing on its own; played in sequence
 * against an enemy about to act, they end the fight. A deck that commits to one
 * archetype and cuts everything else should beat a pile of individually strong
 * cards -- though today the reward screen only ever adds a card or skips
 * (`takeReward(cardId: string | null)` in use-card-battle.ts); there's no way
 * to actually cut one from the deck yet, despite what an earlier version of
 * this comment claimed.
 *
 * Archetypes: Blight (damage over time), Poise (block into damage), Crescendo
 * (burst setup), Encore (many small hits), Summon (the troupe), Hush/Exposure
 * (control).
 *
 * The vocabulary is this project's own. Nothing here borrows another game's
 * card names, terminology or numbers.
 */

import type { CardDef } from "@/lib/games/cards/model";

export const CARDS: readonly CardDef[] = [
  // ---------------------------------------------------------------- starters
  {
    id: "flourish",
    name: "Flourish",
    word: "flourish",
    type: "attack",
    rarity: "starter",
    targeted: true,
    base: { text: "Deal 6 damage.", cost: 1, ops: [{ k: "damage", amount: 6 }] },
    upgraded: { text: "Deal 9 damage.", cost: 1, ops: [{ k: "damage", amount: 9 }] },
  },
  {
    id: "guard",
    name: "Guard",
    word: "guard",
    type: "defence",
    rarity: "starter",
    base: { text: "Gain 5 block.", cost: 1, ops: [{ k: "block", amount: 5 }] },
    upgraded: { text: "Gain 8 block.", cost: 1, ops: [{ k: "block", amount: 8 }] },
  },
  {
    id: "jab",
    name: "Jab",
    word: "jab",
    type: "attack",
    rarity: "starter",
    targeted: true,
    base: { text: "Deal 3 damage twice.", cost: 1, ops: [{ k: "damage", amount: 3, hits: 2 }] },
    upgraded: { text: "Deal 4 damage twice.", cost: 1, ops: [{ k: "damage", amount: 4, hits: 2 }] },
  },

  // ------------------------------------------------------------------ blight
  {
    id: "wither",
    name: "Wither",
    word: "wither",
    type: "poison",
    rarity: "common",
    targeted: true,
    base: { text: "Apply 4 Blight.", cost: 1, ops: [{ k: "status", target: "enemy", status: "blight", amount: 4 }] },
    upgraded: { text: "Apply 6 Blight.", cost: 1, ops: [{ k: "status", target: "enemy", status: "blight", amount: 6 }] },
  },
  {
    id: "miasma",
    name: "Miasma",
    word: "miasma",
    type: "poison",
    rarity: "uncommon",
    base: { text: "Apply 3 Blight to all enemies.", cost: 2, ops: [{ k: "status", target: "allEnemies", status: "blight", amount: 3 }] },
    upgraded: { text: "Apply 5 Blight to all enemies.", cost: 2, ops: [{ k: "status", target: "allEnemies", status: "blight", amount: 5 }] },
  },
  {
    id: "redouble",
    name: "Redouble",
    word: "redouble",
    type: "combo",
    rarity: "rare",
    targeted: true,
    // Worthless alone, decisive after Wither into Miasma. The whole point.
    base: { text: "Double the target's Blight.", cost: 1, ops: [{ k: "doubleBlight" }] },
    upgraded: { text: "Double the target's Blight. Draw a card.", cost: 1, ops: [{ k: "doubleBlight" }, { k: "draw", amount: 1 }] },
  },
  {
    id: "rupture",
    name: "Rupture",
    word: "rupture",
    type: "combo",
    rarity: "rare",
    targeted: true,
    base: { text: "Deal damage equal to the target's Blight, then clear it.", cost: 2, ops: [{ k: "burstBlight" }] },
    // Previously ran burstBlight twice -- the first call already deals
    // damage equal to Blight *and* zeroes it, so the second call always saw
    // 0 and did nothing; upgraded and base Rupture dealt identical damage.
    // Doubling the stack before bursting it deals genuinely double damage,
    // reusing the same doubleBlight op Redouble already uses above.
    upgraded: { text: "Deal double the target's Blight, then clear it.", cost: 2, ops: [{ k: "doubleBlight" }, { k: "burstBlight" }] },
  },
  {
    id: "spores",
    name: "Creeping Spores",
    word: "spores",
    type: "poison",
    rarity: "uncommon",
    base: { text: "Apply 1 Blight to all enemies for each card played this turn.", cost: 1, ops: [{ k: "sporesPerCard", amount: 1 }] },
    upgraded: { text: "Apply 2 Blight to all enemies for each card played this turn.", cost: 1, ops: [{ k: "sporesPerCard", amount: 2 }] },
  },

  // ------------------------------------------------------------------- poise
  {
    id: "brace",
    name: "Brace",
    word: "brace",
    type: "defence",
    rarity: "common",
    base: { text: "Gain 8 block.", cost: 1, ops: [{ k: "block", amount: 8 }] },
    upgraded: { text: "Gain 11 block.", cost: 1, ops: [{ k: "block", amount: 11 }] },
  },
  {
    id: "composure",
    name: "Composure",
    word: "composure",
    type: "buff",
    rarity: "uncommon",
    base: { text: "Gain 2 Poise.", cost: 1, ops: [{ k: "status", target: "self", status: "poise", amount: 2 }] },
    upgraded: { text: "Gain 3 Poise.", cost: 1, ops: [{ k: "status", target: "self", status: "poise", amount: 3 }] },
  },
  {
    id: "riposte",
    name: "Riposte",
    word: "riposte",
    type: "combo",
    rarity: "uncommon",
    targeted: true,
    base: { text: "Deal damage equal to your block.", cost: 2, ops: [{ k: "damage", amount: 0, scale: { per: "block", mult: 1 } }] },
    upgraded: { text: "Deal damage equal to 1.5x your block.", cost: 2, ops: [{ k: "damage", amount: 0, scale: { per: "block", mult: 1.5 } }] },
  },
  {
    id: "vigil",
    name: "Vigil",
    word: "vigil",
    type: "defence",
    rarity: "rare",
    base: { text: "Gain 6 block. Your block is not lost at end of turn.", cost: 2, ops: [{ k: "block", amount: 6 }, { k: "retainBlock" }] },
    upgraded: { text: "Gain 10 block. Your block is not lost at end of turn.", cost: 2, ops: [{ k: "block", amount: 10 }, { k: "retainBlock" }] },
  },
  {
    id: "thorns",
    name: "Iron Thorns",
    word: "thorns",
    type: "buff",
    rarity: "uncommon",
    base: { text: "Gain 3 Ward.", cost: 1, ops: [{ k: "status", target: "self", status: "ward", amount: 3 }] },
    upgraded: { text: "Gain 5 Ward.", cost: 1, ops: [{ k: "status", target: "self", status: "ward", amount: 5 }] },
  },

  // --------------------------------------------------------------- crescendo
  {
    id: "wind",
    name: "Wind Up",
    word: "windup",
    type: "buff",
    rarity: "common",
    spendsCrescendo: false,
    base: { text: "Gain 2 Crescendo.", cost: 0, ops: [{ k: "status", target: "self", status: "crescendo", amount: 2 }] },
    upgraded: { text: "Gain 3 Crescendo.", cost: 0, ops: [{ k: "status", target: "self", status: "crescendo", amount: 3 }] },
  },
  {
    id: "crescendo-strike",
    name: "Crescendo",
    word: "crescendo",
    type: "attack",
    rarity: "rare",
    targeted: true,
    spendsCrescendo: true,
    base: { text: "Deal 10 damage. Spends all Crescendo for 30% more each.", cost: 2, ops: [{ k: "damage", amount: 10 }] },
    upgraded: { text: "Deal 15 damage. Spends all Crescendo for 30% more each.", cost: 2, ops: [{ k: "damage", amount: 15 }] },
  },
  {
    id: "overture",
    name: "Overture",
    word: "overture",
    type: "attack",
    rarity: "uncommon",
    targeted: true,
    base: { text: "Deal 14 damage. Costs 1 less if you played 3 cards this turn.", cost: 2, ops: [{ k: "damage", amount: 14 }] },
    upgraded: { text: "Deal 19 damage. Costs 1 less if you played 3 cards this turn.", cost: 2, ops: [{ k: "damage", amount: 19 }] },
  },
  {
    id: "finale",
    name: "Finale",
    word: "finale",
    type: "attack",
    rarity: "rare",
    targeted: true,
    base: { text: "Deal 8 damage. If you played 4 cards this turn, deal 24 instead.", cost: 2, ops: [{ k: "damage", amount: 8 }, { k: "ifCardsPlayed", atLeast: 4, then: [{ k: "damage", amount: 16 }] }] },
    upgraded: { text: "Deal 12 damage. If you played 4 cards this turn, deal 34 instead.", cost: 2, ops: [{ k: "damage", amount: 12 }, { k: "ifCardsPlayed", atLeast: 4, then: [{ k: "damage", amount: 22 }] }] },
  },

  // ------------------------------------------------------------------ encore
  {
    id: "encore-card",
    name: "Encore",
    word: "encore",
    type: "buff",
    rarity: "uncommon",
    base: { text: "Gain 2 Encore.", cost: 1, ops: [{ k: "status", target: "self", status: "encore", amount: 2 }] },
    upgraded: { text: "Gain 3 Encore.", cost: 1, ops: [{ k: "status", target: "self", status: "encore", amount: 3 }] },
  },
  {
    id: "flurry",
    name: "Flurry",
    word: "flurry",
    type: "attack",
    rarity: "common",
    targeted: true,
    base: { text: "Deal 2 damage four times.", cost: 1, ops: [{ k: "damage", amount: 2, hits: 4 }] },
    upgraded: { text: "Deal 3 damage four times.", cost: 1, ops: [{ k: "damage", amount: 3, hits: 4 }] },
  },
  {
    id: "cascade",
    name: "Cascade",
    word: "cascade",
    type: "attack",
    rarity: "uncommon",
    targeted: true,
    base: { text: "Deal 2 damage six times.", cost: 2, ops: [{ k: "damage", amount: 2, hits: 6 }] },
    upgraded: { text: "Deal 3 damage six times.", cost: 2, ops: [{ k: "damage", amount: 3, hits: 6 }] },
  },
  {
    id: "reprise",
    name: "Reprise",
    word: "reprise",
    type: "combo",
    rarity: "rare",
    base: { text: "Replay the last card you played this turn.", cost: 1, ops: [{ k: "replayLast" }] },
    upgraded: { text: "Replay the last card you played this turn. Costs 0.", cost: 0, ops: [{ k: "replayLast" }] },
  },

  // ------------------------------------------------------------------ control
  {
    id: "silence",
    name: "Silence",
    word: "silence",
    type: "debuff",
    rarity: "common",
    targeted: true,
    base: { text: "Apply 2 Hush.", cost: 1, ops: [{ k: "status", target: "enemy", status: "hush", amount: 2 }] },
    upgraded: { text: "Apply 3 Hush.", cost: 1, ops: [{ k: "status", target: "enemy", status: "hush", amount: 3 }] },
  },
  {
    id: "unmask",
    name: "Unmask",
    word: "unmask",
    type: "debuff",
    rarity: "common",
    targeted: true,
    base: { text: "Apply 2 Exposure.", cost: 1, ops: [{ k: "status", target: "enemy", status: "exposure", amount: 2 }] },
    upgraded: { text: "Apply 3 Exposure.", cost: 1, ops: [{ k: "status", target: "enemy", status: "exposure", amount: 3 }] },
  },
  {
    id: "stagefright",
    name: "Stage Fright",
    word: "stagefright",
    type: "debuff",
    rarity: "uncommon",
    base: { text: "Apply 2 Hush and 2 Exposure to all enemies.", cost: 2, ops: [{ k: "status", target: "allEnemies", status: "hush", amount: 2 }, { k: "status", target: "allEnemies", status: "exposure", amount: 2 }] },
    upgraded: { text: "Apply 3 Hush and 3 Exposure to all enemies.", cost: 2, ops: [{ k: "status", target: "allEnemies", status: "hush", amount: 3 }, { k: "status", target: "allEnemies", status: "exposure", amount: 3 }] },
  },
  {
    id: "mirror",
    name: "Mirror Act",
    word: "mirror",
    type: "special",
    rarity: "rare",
    targeted: true,
    base: { text: "Deal damage equal to the target's intended attack.", cost: 2, ops: [{ k: "mirrorIntent", mult: 1 }] },
    upgraded: { text: "Deal 1.5x the target's intended attack.", cost: 2, ops: [{ k: "mirrorIntent", mult: 1.5 }] },
  },

  // ------------------------------------------------------------------ summon
  {
    id: "understudy",
    name: "Understudy",
    word: "understudy",
    type: "summon",
    rarity: "uncommon",
    base: { text: "Summon an Understudy: attacks for 4 each turn, 3 turns.", cost: 1, ops: [{ k: "summon", spec: { sprite: "understudy", name: "Understudy", atk: 4, block: 0, draw: 0, turns: 3, count: 1 } }] },
    upgraded: { text: "Summon an Understudy: attacks for 6 each turn, 4 turns.", cost: 1, ops: [{ k: "summon", spec: { sprite: "understudy", name: "Understudy", atk: 6, block: 0, draw: 0, turns: 4, count: 1 } }] },
  },
  {
    id: "stagehand",
    name: "Stagehand",
    word: "stagehand",
    type: "summon",
    rarity: "uncommon",
    base: { text: "Summon a Stagehand: grants 4 block each turn, 3 turns.", cost: 1, ops: [{ k: "summon", spec: { sprite: "puppet", name: "Stagehand", atk: 0, block: 4, draw: 0, turns: 3, count: 1 } }] },
    upgraded: { text: "Summon a Stagehand: grants 6 block each turn, 4 turns.", cost: 1, ops: [{ k: "summon", spec: { sprite: "puppet", name: "Stagehand", atk: 0, block: 6, draw: 0, turns: 4, count: 1 } }] },
  },
  {
    id: "prompter",
    name: "Prompter",
    word: "prompter",
    type: "summon",
    rarity: "rare",
    base: { text: "Summon a Prompter: draws you a card each turn, 3 turns.", cost: 2, ops: [{ k: "summon", spec: { sprite: "chorister", name: "Prompter", atk: 0, block: 0, draw: 1, turns: 3, count: 1 } }] },
    upgraded: { text: "Summon a Prompter: draws you a card each turn, 5 turns.", cost: 2, ops: [{ k: "summon", spec: { sprite: "chorister", name: "Prompter", atk: 0, block: 0, draw: 1, turns: 5, count: 1 } }] },
  },

  // -------------------------------------------------------- draw and economy
  {
    id: "rehearse",
    name: "Rehearse",
    word: "rehearse",
    type: "draw",
    rarity: "common",
    base: { text: "Draw 2 cards.", cost: 1, ops: [{ k: "draw", amount: 2 }] },
    upgraded: { text: "Draw 3 cards.", cost: 1, ops: [{ k: "draw", amount: 3 }] },
  },
  {
    id: "cue",
    name: "Cue",
    word: "cue",
    type: "draw",
    rarity: "common",
    base: { text: "Draw a card. Costs 0.", cost: 0, ops: [{ k: "draw", amount: 1 }] },
    upgraded: { text: "Draw 2 cards. Costs 0.", cost: 0, ops: [{ k: "draw", amount: 2 }] },
  },
  {
    id: "adrenaline",
    name: "Adrenaline",
    word: "adrenaline",
    type: "energy",
    rarity: "rare",
    base: { text: "Gain 2 energy. Draw a card.", cost: 0, exhaust: true, ops: [{ k: "energy", amount: 2 }, { k: "draw", amount: 1 }] },
    upgraded: { text: "Gain 3 energy. Draw 2 cards.", cost: 0, exhaust: true, ops: [{ k: "energy", amount: 3 }, { k: "draw", amount: 2 }] },
  },
  {
    id: "openingnight",
    name: "Opening Night",
    word: "openingnight",
    type: "energy",
    rarity: "uncommon",
    base: { text: "Your next card costs 0.", cost: 0, ops: [{ k: "nextCardFree" }] },
    upgraded: { text: "Your next card costs 0. Draw a card.", cost: 0, ops: [{ k: "nextCardFree" }, { k: "draw", amount: 1 }] },
  },

  // ---------------------------------------------------------------- healing
  {
    id: "salve",
    name: "Salve",
    word: "salve",
    type: "healing",
    rarity: "common",
    base: { text: "Heal 6.", cost: 1, exhaust: true, ops: [{ k: "heal", amount: 6 }] },
    upgraded: { text: "Heal 10.", cost: 1, exhaust: true, ops: [{ k: "heal", amount: 10 }] },
  },
  {
    id: "curtaincall",
    name: "Curtain Call",
    word: "curtaincall",
    type: "healing",
    rarity: "rare",
    base: { text: "Exhaust your hand. Gain 4 block for each card exhausted.", cost: 1, ops: [{ k: "exhaustHand", blockPer: 4 }] },
    upgraded: { text: "Exhaust your hand. Gain 6 block for each card exhausted.", cost: 1, ops: [{ k: "exhaustHand", blockPer: 6 }] },
  },
  {
    id: "bloodprice",
    name: "Blood Price",
    word: "bloodprice",
    type: "special",
    rarity: "uncommon",
    targeted: true,
    base: { text: "Lose 4 health. Deal 18 damage.", cost: 1, ops: [{ k: "loseHp", amount: 4 }, { k: "damage", amount: 18 }] },
    upgraded: { text: "Lose 3 health. Deal 25 damage.", cost: 1, ops: [{ k: "loseHp", amount: 3 }, { k: "damage", amount: 25 }] },
  },
  {
    id: "purge",
    name: "Purge",
    word: "purge",
    type: "special",
    rarity: "common",
    base: { text: "Remove all Hush from yourself. Gain 4 block.", cost: 0, ops: [{ k: "cleanse", status: "hush" }, { k: "block", amount: 4 }] },
    upgraded: { text: "Remove all Hush from yourself. Gain 8 block.", cost: 0, ops: [{ k: "cleanse", status: "hush" }, { k: "block", amount: 8 }] },
  },
  {
    id: "cleave",
    name: "Cleave",
    word: "cleave",
    type: "attack",
    rarity: "common",
    base: { text: "Deal 7 damage to all enemies.", cost: 1, ops: [{ k: "damage", amount: 7, all: true }] },
    upgraded: { text: "Deal 11 damage to all enemies.", cost: 1, ops: [{ k: "damage", amount: 11, all: true }] },
  },
  {
    id: "pierce",
    name: "Pierce",
    word: "pierce",
    type: "attack",
    rarity: "uncommon",
    targeted: true,
    base: { text: "Deal 9 damage, ignoring block.", cost: 1, ops: [{ k: "damage", amount: 9, pierce: true }] },
    upgraded: { text: "Deal 13 damage, ignoring block.", cost: 1, ops: [{ k: "damage", amount: 13, pierce: true }] },
  },
  {
    id: "encorerite",
    name: "Ovation",
    word: "ovation",
    type: "buff",
    rarity: "rare",
    base: { text: "Gain 1 Encore and 1 Poise.", cost: 1, ops: [{ k: "status", target: "self", status: "encore", amount: 1 }, { k: "status", target: "self", status: "poise", amount: 1 }] },
    upgraded: { text: "Gain 2 Encore and 2 Poise.", cost: 1, ops: [{ k: "status", target: "self", status: "encore", amount: 2 }, { k: "status", target: "self", status: "poise", amount: 2 }] },
  },
];

export const CARDS_BY_ID: Record<string, CardDef> = Object.fromEntries(
  CARDS.map((c) => [c.id, c]),
);

/** Cards that can turn up as a reward. Starters are excluded. */
export const REWARD_POOL = CARDS.filter((c) => c.rarity !== "starter");

export interface DeckArchetype {
  id: string;
  name: string;
  blurb: string;
  cards: string[];
}

/**
 * Starting decks. Each is deliberately narrow: a player should feel the
 * archetype from the first fight and then choose whether to commit to it or
 * pivot with rewards.
 */
export const STARTER_DECKS: readonly DeckArchetype[] = [
  {
    id: "gambler",
    name: "Gambler",
    blurb: "Tempo and burst. Build Crescendo, then spend it all at once.",
    cards: [
      "flourish", "flourish", "flourish", "flourish",
      "guard", "guard", "guard",
      "jab", "jab",
      "wind",
    ],
  },
  {
    id: "alchemist",
    name: "Alchemist",
    blurb: "Blight. Stack it, double it, then rupture for everything at once.",
    cards: [
      "flourish", "flourish", "flourish",
      "guard", "guard", "guard",
      "wither", "wither",
      "jab",
      "rehearse",
    ],
  },
  {
    id: "inquisitor",
    name: "Inquisitor",
    blurb: "Poise and retaliation. Turn your block into their problem.",
    cards: [
      "flourish", "flourish", "flourish",
      "guard", "guard", "guard", "guard",
      "brace",
      "composure",
      "jab",
    ],
  },
];

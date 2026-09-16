/**
 * Typing Survivor's content: characters, enemies and the upgrade pool.
 *
 * The upgrades are the game. Each one is written to change what *kind* of
 * typing wins, not to add a percent to a number — a run that drafted Short
 * Fuse wants completely different play from one that drafted Heavy Hand, and
 * neither is correct. Anything that would read as "+5% damage" is deliberately
 * absent.
 */

export type EnemyKind = "minion" | "elite" | "boss";

export interface EnemyType {
  id: string;
  name: string;
  kind: EnemyKind;
  art: string;
  hp: number;
  /** Fraction of the approach crossed per second. */
  speed: number;
  damage: number;
  xp: number;
  /** Word length band this enemy carries. */
  minLen: number;
  maxLen: number;
  /** First wave it can appear on. */
  fromWave: number;
  telegraph?: string;
}

const ART = "/games/typing-survivor";

export const ENEMY_TYPES: readonly EnemyType[] = [
  {
    id: "swarmling",
    name: "Swarmling",
    kind: "minion",
    art: `${ART}/enemy-swarmling.webp`,
    hp: 10,
    speed: 0.075,
    damage: 4,
    xp: 3,
    minLen: 3,
    maxLen: 4,
    fromWave: 1,
  },
  {
    id: "stalker",
    name: "Stalker",
    kind: "minion",
    art: `${ART}/enemy-stalker.webp`,
    hp: 14,
    // The fastest thing in the game, and it carries a short word so it can
    // actually be answered in time.
    speed: 0.155,
    damage: 6,
    xp: 6,
    minLen: 3,
    maxLen: 5,
    fromWave: 2,
  },
  {
    id: "slinger",
    name: "Slinger",
    kind: "minion",
    art: `${ART}/enemy-slinger.webp`,
    hp: 16,
    speed: 0.055,
    damage: 8,
    xp: 7,
    minLen: 5,
    maxLen: 7,
    fromWave: 2,
  },
  {
    id: "brute",
    name: "Brute",
    kind: "minion",
    art: `${ART}/enemy-brute.webp`,
    hp: 46,
    speed: 0.04,
    damage: 14,
    xp: 12,
    minLen: 7,
    maxLen: 9,
    fromWave: 3,
  },
  {
    id: "bloater",
    name: "Bloater",
    kind: "minion",
    art: `${ART}/enemy-bloater.webp`,
    hp: 22,
    speed: 0.05,
    damage: 18,
    xp: 10,
    minLen: 6,
    maxLen: 8,
    fromWave: 4,
  },
  {
    id: "bulwark",
    name: "Bulwark",
    kind: "minion",
    art: `${ART}/enemy-bulwark.webp`,
    hp: 30,
    speed: 0.035,
    damage: 10,
    xp: 14,
    minLen: 6,
    maxLen: 9,
    fromWave: 4,
    telegraph: "Guarded — the first strikes barely land",
  },
  {
    id: "warchief",
    name: "Warchief",
    kind: "elite",
    art: `${ART}/elite-warchief.webp`,
    hp: 90,
    speed: 0.05,
    damage: 20,
    xp: 30,
    minLen: 8,
    maxLen: 11,
    fromWave: 3,
  },
  {
    id: "hexer",
    name: "Hexer",
    kind: "elite",
    art: `${ART}/elite-hexer.webp`,
    hp: 70,
    speed: 0.065,
    damage: 16,
    xp: 28,
    minLen: 7,
    maxLen: 10,
    fromWave: 3,
  },
  {
    id: "siegebeast",
    name: "Siege Beast",
    kind: "boss",
    art: `${ART}/boss-siegebeast.webp`,
    hp: 320,
    speed: 0.028,
    damage: 26,
    xp: 90,
    minLen: 9,
    maxLen: 12,
    fromWave: 5,
    telegraph: "The Siege Beast arrives — long words only",
  },
  {
    id: "plaguemother",
    name: "Plague Mother",
    kind: "boss",
    art: `${ART}/boss-plaguemother.webp`,
    hp: 420,
    speed: 0.022,
    damage: 30,
    xp: 130,
    minLen: 8,
    maxLen: 11,
    fromWave: 10,
    telegraph: "The Plague Mother arrives — she keeps birthing",
  },
  {
    id: "ashen-knight",
    name: "Ashen Knight",
    kind: "boss",
    art: `${ART}/boss-ashen-knight.webp`,
    hp: 560,
    speed: 0.03,
    damage: 36,
    xp: 200,
    minLen: 10,
    maxLen: 13,
    fromWave: 15,
    telegraph: "The Ashen Knight arrives — no mistakes",
  },
];

export function bossForWave(wave: number): EnemyType {
  const bosses = ENEMY_TYPES.filter((t) => t.kind === "boss");
  if (wave >= 15) return bosses[2];
  if (wave >= 10) return bosses[1];
  return bosses[0];
}

export interface CharacterDef {
  id: string;
  name: string;
  art: string;
  maxHp: number;
  /** Upgrade granted at the start, which sets the run's initial flavour. */
  startUpgrade: string | null;
  identity: string;
  blurb: string;
}

export const CHARACTERS: readonly CharacterDef[] = [
  {
    id: "warden",
    name: "Warden",
    art: `${ART}/char-warden.webp`,
    maxHp: 140,
    startUpgrade: "bulwark-training",
    identity: "Takes a beating",
    blurb: "The most forgiving start. Extra health and reduced contact damage, so mistakes cost less while you learn a wave.",
  },
  {
    id: "ranger",
    name: "Ranger",
    art: `${ART}/char-ranger.webp`,
    maxHp: 90,
    startUpgrade: "keen-edge",
    identity: "Crits often",
    blurb: "Fragile, but every strike can spike. Rewards accuracy over raw pace, and pairs naturally with the perfectionist line.",
  },
  {
    id: "pyromancer",
    name: "Pyromancer",
    art: `${ART}/char-pyromancer.webp`,
    maxHp: 100,
    startUpgrade: "detonate",
    identity: "Clears crowds",
    blurb: "Long words kill in a blast radius. Weak against single tough enemies, devastating against a packed screen.",
  },
  {
    id: "duelist",
    name: "Duelist",
    art: `${ART}/char-duelist.webp`,
    maxHp: 100,
    startUpgrade: "momentum",
    identity: "Never stops",
    blurb: "Damage climbs while the combo holds and collapses the moment you miss. The purest speed build in the game.",
  },
];

export interface UpgradeDef {
  id: string;
  name: string;
  /** What it changes, in the player's terms. Never a bare percentage. */
  effect: string;
  /** Which build it pushes you toward, shown as a tag on the draft card. */
  archetype: "Speed" | "Power" | "Accuracy" | "Combo" | "Crowd" | "Survival";
  /** Whether it can be offered again once owned. */
  stacking?: boolean;
}

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: "short-fuse",
    name: "Short Fuse",
    effect: "Words of 4 letters or fewer deal more than double damage.",
    archetype: "Speed",
  },
  {
    id: "heavy-hand",
    name: "Heavy Hand",
    effect: "Words of 8 letters or more hit almost twice as hard.",
    archetype: "Power",
  },
  {
    id: "momentum",
    name: "Momentum",
    effect: "Damage climbs with your combo, up to double. A miss resets it.",
    archetype: "Combo",
  },
  {
    id: "keen-edge",
    name: "Keen Edge",
    effect: "Every strike has a much higher chance to critical.",
    archetype: "Accuracy",
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    effect: "A word typed with no correction is far more likely to crit.",
    archetype: "Accuracy",
  },
  {
    id: "chain",
    name: "Chain Lightning",
    effect: "Every third kill arcs half its damage into another enemy.",
    archetype: "Crowd",
  },
  {
    id: "detonate",
    name: "Word Explosion",
    effect: "Killing with a 7+ letter word explodes, damaging everything else.",
    archetype: "Crowd",
  },
  {
    id: "bloodletting",
    name: "Bloodletting",
    effect: "Every kill restores a little health.",
    archetype: "Survival",
  },
  {
    id: "iron-skin",
    name: "Iron Skin",
    effect: "Raises your maximum health, and heals you for the difference.",
    archetype: "Survival",
    stacking: true,
  },
  {
    id: "bulwark-training",
    name: "Bulwark Training",
    effect: "Enemies that reach you deal a quarter less damage.",
    archetype: "Survival",
  },
  {
    id: "scholar",
    name: "Scholar",
    effect: "Every strike gains damage equal to your level.",
    archetype: "Power",
    stacking: true,
  },
];

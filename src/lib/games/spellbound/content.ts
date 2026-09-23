/**
 * Spellbound — static content: words, characters, spells, relics, enemies,
 * bosses and events.
 *
 * Data only. Everything here is frozen at module scope and never mutated, so
 * it is safe to sit behind the `next/dynamic` boundary (the duplication that
 * bit `test-status-store.ts` only matters for *mutable* module state).
 *
 * The numbers are the game. They live next to the reducer that reads them
 * rather than in `game-types.ts`, which by design only holds what every game
 * shares.
 */

/* ------------------------------------------------------------------ words */

/**
 * The spell vocabulary. Deliberately thematic rather than the shared
 * `english-1k` list: that list is ~360 very common words and skews short, so a
 * "long word = slow, powerful" mechanic built on it would have almost nothing
 * to draw on above eight letters, and a nuke called "important" reads as a
 * bug. Everything here is plain lowercase a–z, which is what the typing path
 * accepts.
 */
const ARCANE_WORDS: readonly string[] = [
  // 3–5
  "arc", "orb", "hex", "urn", "vow", "ash", "sin", "rune", "ward", "bolt",
  "tome", "rite", "pact", "veil", "wisp", "mote", "pyre", "rift", "bane",
  "omen", "gale", "husk", "idol", "lore", "oath", "sear", "brew", "cusp",
  "dire", "flux", "hymn", "jinx", "kiln", "mist", "node", "wane", "zeal",
  "aura", "char", "dusk", "echo", "fang", "myth", "salt", "scar", "moon",
  "star", "void", "sigil", "glyph", "ember", "quill", "thorn", "spell",
  "charm", "curse", "blade", "flame", "frost", "shade", "storm", "chant",
  "crypt", "ghoul", "grave", "haunt", "magic", "mimic", "wrath", "drake",
  "ether", "fable", "stone", "shard", "cloak", "ravel", "sever", "waned",
  // 6–8
  "arcane", "cipher", "scroll", "wraith", "shadow", "spirit", "temple",
  "banish", "candle", "cinder", "cosmos", "dagger", "damned", "decree",
  "divine", "dragon", "effigy", "embers", "entomb", "fabled", "frozen",
  "hallow", "hunger", "infuse", "invoke", "legend", "marrow", "mirror",
  "mortal", "oracle", "pillar", "plague", "potion", "prayer", "relics",
  "throne", "unmake", "vessel", "wither", "zenith", "anthem", "cavern",
  "harrow", "sorrow", "tunnel", "whisper", "chalice", "phantom", "lantern",
  "obelisk", "warlock", "crimson", "eclipse", "essence", "fortune", "impulse",
  "kindled", "macabre", "mystery", "shatter", "solemnly", "alchemy", "ossuary",
  "grimoire", "sorcerer", "ancients", "banshees", "covenant", "darkened",
  "entropic", "ethereal", "forsaken", "gauntlet", "hallowed", "infernal",
  "invoking", "lodestar", "midnight", "nocturne", "oblivion", "phantasm",
  "revenant", "sanctify", "scorched", "shackled", "spectral", "starfall",
  "talisman", "tempered", "twilight", "venerate", "withered", "moonrise",
  // 9+
  "apparition", "arcanists", "banishment", "cataclysm", "ceremonial",
  "channeling", "conjuration", "corruption", "crystalline", "desolation",
  "devouring", "divination", "enchanted", "enchantment", "evanescent",
  "everlasting", "grimoires", "illuminate", "immolation", "incantation",
  "invocation", "labyrinth", "maelstrom", "malevolent", "necromancy",
  "nightfall", "obliterate", "ossuaries", "pandemonium", "parchments",
  "pestilence", "petrified", "phantasmal", "primordial", "purgatory",
  "quicksilver", "reckoning", "resonance", "revelation", "sanctuary",
  "scintilla", "shattering", "sorcerous", "spellbound", "starlight",
  "summoning", "sundering", "talismans", "thaumaturgy", "transmute",
  "unraveling", "vanquished", "vengeance", "whispering", "witchcraft",
];

export type WordBand = "short" | "medium" | "long";

const BANDS: Record<WordBand, readonly string[]> = {
  short: ARCANE_WORDS.filter((w) => w.length <= 5),
  medium: ARCANE_WORDS.filter((w) => w.length >= 6 && w.length <= 8),
  long: ARCANE_WORDS.filter((w) => w.length >= 9),
};

export function bandWords(band: WordBand): readonly string[] {
  return BANDS[band];
}

/** One band harder, for the Cursed Quill relic and late-floor pressure. */
export function harderBand(band: WordBand): WordBand {
  return band === "short" ? "medium" : "long";
}

/* --------------------------------------------------------------- spells */

export type SpellType =
  | "damage"
  | "aoe"
  | "heal"
  | "shield"
  | "buff"
  | "debuff"
  | "execute";

export interface SpellDef {
  id: string;
  name: string;
  type: SpellType;
  band: WordBand;
  /** Mana spent on completion. */
  mana: number;
  /** Slot lockout after casting, before its next word becomes typeable. */
  cooldownMs: number;
  /** Effect size = base + perLetter * word length. Length is the whole point. */
  base: number;
  perLetter: number;
  /** Extra crit chance, additive with the run-wide base. */
  crit?: number;
  /** Targets hit, for `damage` spells that arc. */
  targets?: number;
  /** Fraction of damage returned as health. */
  lifesteal?: number;
  /** `execute`: multiplier applied at or below `threshold` of max health. */
  threshold?: number;
  executeMult?: number;
  /** `buff`/`debuff` duration. */
  durationMs?: number;
  /** Player-facing one-liner. Shown on the spell card and in shops. */
  desc: string;
}

export const SPELLS: Record<string, SpellDef> = {
  cantrip: {
    id: "cantrip",
    name: "Cantrip",
    type: "damage",
    band: "short",
    mana: 0,
    cooldownMs: 700,
    base: 3,
    perLetter: 1.6,
    desc: "Free, feeble, always there. Your fallback when mana runs dry.",
  },
  spark: {
    id: "spark",
    name: "Spark",
    type: "damage",
    band: "short",
    mana: 6,
    cooldownMs: 650,
    base: 5,
    perLetter: 2.4,
    desc: "Quick bolt. Cheap enough to hold a rhythm with.",
  },
  pierce: {
    id: "pierce",
    name: "Pierce",
    type: "damage",
    band: "medium",
    mana: 11,
    cooldownMs: 1100,
    base: 6,
    perLetter: 3.1,
    crit: 0.16,
    desc: "Slower, sharper, and crits far more often.",
  },
  chain: {
    id: "chain",
    name: "Chain Bolt",
    type: "damage",
    band: "medium",
    mana: 14,
    cooldownMs: 1500,
    base: 5,
    perLetter: 2.2,
    targets: 3,
    desc: "Arcs to three enemies for full damage each.",
  },
  siphon: {
    id: "siphon",
    name: "Siphon",
    type: "damage",
    band: "medium",
    mana: 13,
    cooldownMs: 1900,
    base: 5,
    perLetter: 2.5,
    lifesteal: 0.5,
    desc: "Returns half the damage dealt as health.",
  },
  cleave: {
    id: "cleave",
    name: "Cleave",
    type: "aoe",
    band: "short",
    mana: 12,
    cooldownMs: 1600,
    base: 4,
    perLetter: 2,
    desc: "Hits everything, but short words keep it small.",
  },
  nova: {
    id: "nova",
    name: "Nova",
    type: "aoe",
    band: "long",
    mana: 26,
    cooldownMs: 3600,
    base: 10,
    perLetter: 3.2,
    desc: "A long, dangerous cast that clears a whole room.",
  },
  mend: {
    id: "mend",
    name: "Mend",
    type: "heal",
    band: "short",
    mana: 10,
    cooldownMs: 3000,
    base: 6,
    perLetter: 2.2,
    desc: "A small, fast patch. Costs you a turn of damage.",
  },
  rewind: {
    id: "rewind",
    name: "Rewind",
    type: "heal",
    band: "medium",
    mana: 16,
    cooldownMs: 5000,
    base: 9,
    perLetter: 2.8,
    desc: "Substantial healing, if you can afford the seconds.",
  },
  ward: {
    id: "ward",
    name: "Ward",
    type: "shield",
    band: "short",
    mana: 8,
    cooldownMs: 3800,
    base: 6,
    perLetter: 2.4,
    desc: "Shield absorbs damage and prevents interruption.",
  },
  bastion: {
    id: "bastion",
    name: "Bastion",
    type: "shield",
    band: "long",
    mana: 20,
    cooldownMs: 7000,
    base: 10,
    perLetter: 3,
    desc: "A wall of shield — worth the exposure before a boss swing.",
  },
  quicken: {
    id: "quicken",
    name: "Quicken",
    type: "buff",
    band: "short",
    mana: 12,
    cooldownMs: 8000,
    base: 0,
    perLetter: 0,
    durationMs: 8000,
    desc: "+60% spell damage for 8 seconds.",
  },
  hex: {
    id: "hex",
    name: "Hex",
    type: "debuff",
    band: "medium",
    mana: 10,
    cooldownMs: 5000,
    base: 0,
    perLetter: 0,
    durationMs: 7000,
    desc: "Marked enemy takes +50% damage for 7 seconds.",
  },
  devour: {
    id: "devour",
    name: "Devour",
    type: "execute",
    band: "medium",
    mana: 17,
    cooldownMs: 3800,
    base: 4,
    perLetter: 1.8,
    threshold: 0.35,
    executeMult: 4,
    desc: "Quadruple damage to an enemy under 35% health.",
  },
  banish: {
    id: "banish",
    name: "Banish",
    type: "execute",
    band: "long",
    mana: 28,
    cooldownMs: 8500,
    base: 8,
    perLetter: 2,
    threshold: 0.45,
    executeMult: 5,
    desc: "Five times damage under 45% health. A finisher.",
  },
  ember: {
    id: "ember",
    name: "Ember",
    type: "damage",
    band: "short",
    mana: 7,
    cooldownMs: 800,
    base: 4,
    perLetter: 2.2,
    crit: 0.08,
    desc: "Spark's hotter cousin — slightly better odds of a crit.",
  },
};

export const SPELL_IDS: readonly string[] = Object.keys(SPELLS);

/** Spells that can show up as loot or shop stock. `cantrip` never does. */
export const OFFERABLE_SPELLS: readonly string[] = SPELL_IDS.filter(
  (id) => id !== "cantrip",
);

/* ----------------------------------------------------------- characters */

export interface CharacterDef {
  id: string;
  name: string;
  art: string;
  maxHp: number;
  maxMana: number;
  /** Mana per second. */
  regen: number;
  startSpell: string;
  passiveName: string;
  passive: string;
  blurb: string;
  /** Unlock id in the player profile, or null for always available. */
  unlock: string | null;
  unlockHint: string;
}

export const CHARACTERS: readonly CharacterDef[] = [
  {
    id: "apprentice",
    name: "Apprentice",
    art: "/games/spellbound/char-apprentice.webp",
    maxHp: 60,
    maxMana: 100,
    regen: 9,
    startSpell: "spark",
    passiveName: "Arcane Focus",
    passive: "Every correct keystroke restores 0.5 mana.",
    blurb: "Balanced, forgiving, and rewarded for typing cleanly.",
    unlock: null,
    unlockHint: "",
  },
  {
    id: "battlemage",
    name: "Battlemage",
    art: "/games/spellbound/char-battlemage.webp",
    maxHp: 90,
    maxMana: 70,
    regen: 6,
    startSpell: "cleave",
    passiveName: "Warded",
    passive: "Every completed cast grants 4 shield (up to 30).",
    blurb: "Tough and mana-poor. Casting often is your armour.",
    unlock: null,
    unlockHint: "",
  },
  {
    id: "rogue-mage",
    name: "Rogue Mage",
    art: "/games/spellbound/char-rogue-mage.webp",
    maxHp: 45,
    maxMana: 95,
    regen: 11,
    startSpell: "pierce",
    passiveName: "Sleight",
    passive: "Words of 5 letters or fewer deal +70%. You take +25% damage.",
    blurb: "Glass. Wins fights in the first eight seconds or not at all.",
    unlock: "spellbound:rogue-mage",
    unlockHint: "Reach floor 2.",
  },
  {
    id: "chronomancer",
    name: "Chronomancer",
    art: "/games/spellbound/char-chronomancer.webp",
    maxHp: 55,
    maxMana: 110,
    regen: 8,
    startSpell: "rewind",
    passiveName: "Dilation",
    passive: "Completing a cast stalls every enemy wind-up by 0.08s per letter.",
    blurb: "Inverts the core risk: long words buy you time instead of costing it.",
    unlock: "spellbound:chronomancer",
    unlockHint: "Defeat any boss.",
  },
  {
    id: "void-mage",
    name: "Void Mage",
    art: "/games/spellbound/char-void-mage.webp",
    maxHp: 50,
    maxMana: 100,
    regen: 7,
    startSpell: "devour",
    passiveName: "Oblivion",
    passive: "Any spell outright kills an enemy at or below 18% health.",
    blurb: "Every chip is a potential execute. Finish things.",
    unlock: "spellbound:void-mage",
    unlockHint: "Win a run.",
  },
];

export function characterById(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

/* --------------------------------------------------------------- relics */

export interface RelicDef {
  id: string;
  name: string;
  /** What it changes, in the player's terms. Never "+1% stats". */
  effect: string;
  /** Shown in the relic tray as a one-or-two character sigil. */
  sigil: string;
  /** Downsides are real; the tray marks these so a choice is a real choice. */
  cursed?: boolean;
  price: number;
}

export const RELICS: readonly RelicDef[] = [
  {
    id: "quickened",
    name: "Quickened Rune",
    effect: "Spells of 5 letters or fewer cool down 40% faster.",
    sigil: "QR",
    price: 60,
  },
  {
    id: "heavy-tome",
    name: "Heavy Tome",
    effect: "Words of 8 letters or more deal +50% damage.",
    sigil: "HT",
    price: 65,
  },
  {
    id: "echo",
    name: "Echo Shard",
    effect: "20% chance a completed spell casts a second time.",
    sigil: "ES",
    price: 75,
  },
  {
    id: "bloodstone",
    name: "Bloodstone",
    effect: "Critical hits heal you for 30% of the damage dealt.",
    sigil: "BS",
    price: 60,
  },
  {
    id: "mana-engine",
    name: "Mana Engine",
    effect: "Mana regen +60%. Max health -10.",
    sigil: "ME",
    cursed: true,
    price: 55,
  },
  {
    id: "hourglass",
    name: "Fractured Hourglass",
    effect: "Every 5th cast stalls all enemy wind-ups by 1.5 seconds.",
    sigil: "FH",
    price: 65,
  },
  {
    id: "chain-sigil",
    name: "Chain Sigil",
    effect: "Single-target damage splashes 35% onto one other enemy.",
    sigil: "CS",
    price: 60,
  },
  {
    id: "scholar",
    name: "Scholar's Mark",
    effect: "Each correct keystroke adds +2% to your next cast, up to +60%.",
    sigil: "SM",
    price: 70,
  },
  {
    id: "iron-will",
    name: "Iron Will",
    effect: "You can never be interrupted. You take +15% damage.",
    sigil: "IW",
    cursed: true,
    price: 55,
  },
  {
    id: "vampiric",
    name: "Vampiric Ink",
    effect: "Killing an enemy restores 10% of your maximum health.",
    sigil: "VI",
    price: 70,
  },
  {
    id: "prism",
    name: "Prism Lens",
    effect: "Crit chance +18%, and crits deal 2.4x instead of 2x.",
    sigil: "PL",
    price: 70,
  },
  {
    id: "cursed-quill",
    name: "Cursed Quill",
    effect: "Every spell draws from one band longer. All damage +45%.",
    sigil: "CQ",
    cursed: true,
    price: 65,
  },
  {
    id: "overflow",
    name: "Overflow",
    effect: "Mana above 80% adds +1% damage per point, spent on the cast.",
    sigil: "OF",
    price: 60,
  },
  {
    id: "silent-sigil",
    name: "Silent Sigil",
    effect: "Spells cost 35% less mana. You can no longer crit.",
    sigil: "SS",
    cursed: true,
    price: 55,
  },
  {
    id: "twin",
    name: "Twin Catalyst",
    effect: "Casting the same spell twice in a row deals +80% on the second.",
    sigil: "TC",
    price: 65,
  },
  {
    id: "wardens-knot",
    name: "Warden's Knot",
    effect: "Shield never decays, caps at 60, and carries between rooms.",
    sigil: "WK",
    price: 60,
  },
];

export function relicById(id: string): RelicDef | undefined {
  return RELICS.find((r) => r.id === id);
}

/* -------------------------------------------------------------- enemies */

export type EnemyKind = "minion" | "elite" | "boss";

export interface EnemyDef {
  id: string;
  name: string;
  kind: EnemyKind;
  art: string;
  hp: number;
  damage: number;
  /** Milliseconds to charge one attack. */
  windupMs: number;
  /** Flat reduction applied to every incoming hit. */
  armor?: number;
  /** Boss/elite behaviour tag the reducer switches on. */
  mechanic?:
    | "golem"
    | "word-eater"
    | "mirror"
    | "void-king"
    | "seal"
    | "reflect"
    | "mend-allies";
  /** Player-facing description of the mechanic; shown when it spawns. */
  telegraph?: string;
}

export const MINIONS: readonly EnemyDef[] = [
  {
    id: "inkwraith",
    name: "Inkwraith",
    kind: "minion",
    art: "/games/spellbound/enemy-inkwraith.webp",
    hp: 34,
    damage: 5,
    windupMs: 3000,
  },
  {
    id: "scribe",
    name: "Mad Scribe",
    kind: "minion",
    art: "/games/spellbound/enemy-scribe.webp",
    hp: 26,
    damage: 10,
    windupMs: 4600,
  },
  {
    id: "sentinel",
    name: "Sentinel",
    kind: "minion",
    art: "/games/spellbound/enemy-sentinel.webp",
    hp: 58,
    damage: 7,
    windupMs: 4200,
    armor: 3,
    telegraph: "Armoured — flat 3 off every hit, so tiny spells barely scratch it.",
  },
  {
    id: "grimoire",
    name: "Living Grimoire",
    kind: "minion",
    art: "/games/spellbound/enemy-grimoire.webp",
    hp: 30,
    damage: 3,
    windupMs: 3600,
    mechanic: "mend-allies",
    telegraph: "Heals its allies instead of striking you. Kill it first.",
  },
];

export const ELITES: readonly EnemyDef[] = [
  {
    id: "archivist",
    name: "The Archivist",
    kind: "elite",
    art: "/games/spellbound/elite-archivist.webp",
    hp: 92,
    damage: 9,
    windupMs: 4200,
    mechanic: "seal",
    telegraph: "Seals one of your spells for 8 seconds each time it acts.",
  },
  {
    id: "cipher",
    name: "The Cipher",
    kind: "elite",
    art: "/games/spellbound/elite-cipher.webp",
    hp: 84,
    damage: 8,
    windupMs: 3800,
    mechanic: "reflect",
    telegraph: "Reflects 25% of the damage it takes back at you.",
  },
];

export const BOSSES: readonly EnemyDef[] = [
  {
    id: "iron-golem",
    name: "Iron Golem",
    kind: "boss",
    art: "/games/spellbound/boss-iron-golem.webp",
    hp: 230,
    damage: 26,
    windupMs: 5600,
    armor: 6,
    mechanic: "golem",
    telegraph:
      "Slow and enormous. Armour 6 blunts small spells — long words are the only real answer.",
  },
  {
    id: "word-eater",
    name: "Word Eater",
    kind: "boss",
    art: "/games/spellbound/boss-word-eater.webp",
    hp: 300,
    damage: 12,
    windupMs: 3000,
    mechanic: "word-eater",
    telegraph:
      "Corrupts one of your spells every few seconds — its word is scrambled until you cast it.",
  },
  {
    id: "mirror-mage",
    name: "Mirror Mage",
    kind: "boss",
    art: "/games/spellbound/boss-mirror-mage.webp",
    hp: 340,
    damage: 8,
    windupMs: 3400,
    mechanic: "mirror",
    telegraph:
      "Copies your last spell and casts it back at you. Vary what you cast.",
  },
  {
    id: "void-king",
    name: "Void King",
    kind: "boss",
    art: "/games/spellbound/boss-void-king.webp",
    hp: 420,
    damage: 15,
    windupMs: 3600,
    mechanic: "void-king",
    telegraph:
      "Rewrites one rule of combat every 12 seconds. Read the banner before you type.",
  },
];

/** The four bosses in floor order. */
export function bossForFloor(floor: number): EnemyDef {
  return BOSSES[Math.min(BOSSES.length - 1, Math.max(0, floor - 1))];
}

/** The rules the Void King rotates through. */
export type VoidRule = "silence" | "inversion" | "haste" | "drain";

export const VOID_RULES: readonly { id: VoidRule; name: string; text: string }[] = [
  { id: "silence", name: "Silence", text: "Mana no longer regenerates." },
  {
    id: "inversion",
    name: "Inversion",
    text: "Words of 5 letters or fewer deal double. Longer words deal half.",
  },
  { id: "haste", name: "Haste", text: "Enemy wind-ups run 45% faster." },
  { id: "drain", name: "Drain", text: "Every cast costs 3 health." },
];

/* --------------------------------------------------------------- events */

export interface EventOptionDef {
  label: string;
  detail: string;
  effect:
    | { kind: "relic" }
    | { kind: "hp"; amount: number }
    | { kind: "maxMana"; amount: number }
    | { kind: "gold"; amount: number }
    | { kind: "spell" }
    | { kind: "shield"; amount: number }
    | { kind: "gamble" }
    | { kind: "fullHeal" };
}

export interface EventDef {
  id: string;
  title: string;
  body: string;
  options: readonly EventOptionDef[];
}

export const EVENTS: readonly EventDef[] = [
  {
    id: "obelisk",
    title: "A Cracked Obelisk",
    body: "It hums at a pitch you feel in your teeth. Something is stored inside, and the crack is wide enough to reach through.",
    options: [
      { label: "Reach in", detail: "Gain a relic. Lose 9 health.", effect: { kind: "relic" } },
      { label: "Study it", detail: "+15 maximum mana.", effect: { kind: "maxMana", amount: 15 } },
      { label: "Take the offering", detail: "+35 gold.", effect: { kind: "gold", amount: 35 } },
    ],
  },
  {
    id: "familiar",
    title: "A Wounded Familiar",
    body: "Something small and ink-stained drags itself along the flagstones. It has not decided yet whether you are a threat.",
    options: [
      { label: "Bind it", detail: "Gain a relic.", effect: { kind: "relic" } },
      { label: "Heal it", detail: "Restore 22 health.", effect: { kind: "hp", amount: 22 } },
      { label: "Loot the nest", detail: "+40 gold.", effect: { kind: "gold", amount: 40 } },
    ],
  },
  {
    id: "page",
    title: "A Forbidden Page",
    body: "One page, torn from something much larger. The words on it rearrange whenever you stop reading them.",
    options: [
      { label: "Read it aloud", detail: "Learn a new spell.", effect: { kind: "spell" } },
      { label: "Burn it", detail: "Restore 28 health.", effect: { kind: "hp", amount: 28 } },
      { label: "Sell it later", detail: "+45 gold.", effect: { kind: "gold", amount: 45 } },
    ],
  },
  {
    id: "fountain",
    title: "The Still Fountain",
    body: "Black water, perfectly flat, reflecting a ceiling that is not the one above you.",
    options: [
      { label: "Drink deep", detail: "Restore all health.", effect: { kind: "fullHeal" } },
      { label: "Bottle it", detail: "Begin the next fight with 30 shield.", effect: { kind: "shield", amount: 30 } },
      { label: "Scry", detail: "+18 maximum mana.", effect: { kind: "maxMana", amount: 18 } },
    ],
  },
  {
    id: "coin",
    title: "The Gambler's Coin",
    body: "It has a face on both sides, and neither of them is yours.",
    options: [
      { label: "Flip it", detail: "Half the time +90 gold, half the time -16 health.", effect: { kind: "gamble" } },
      { label: "Pocket it", detail: "+20 gold.", effect: { kind: "gold", amount: 20 } },
      { label: "Melt it down", detail: "Gain a relic. Lose 14 health.", effect: { kind: "relic" } },
    ],
  },
];

/* ----------------------------------------------------------------- art */

export const ART = {
  hero: "/games/spellbound/hero.webp",
  select: "/games/spellbound/select.webp",
  map: "/games/spellbound/map.webp",
  victory: "/games/spellbound/victory.webp",
  defeat: "/games/spellbound/defeat.webp",
  bgDungeon: "/games/spellbound/bg-dungeon.webp",
  bgTreasure: "/games/spellbound/bg-treasure.webp",
  bgShop: "/games/spellbound/bg-shop.webp",
  bgEvent: "/games/spellbound/bg-event.webp",
} as const;

export const MUSIC = {
  menu: "/audio/music/spellbound-menu.opus",
  combat: "/audio/music/spellbound-combat.opus",
  boss: "/audio/music/spellbound-boss.opus",
  victory: "/audio/music/sting-victory.opus",
  defeat: "/audio/music/sting-defeat.opus",
} as const;

/* ---------------------------------------------------------- achievements */

export const ACHIEVEMENTS = {
  firstRun: "spellbound:first-run",
  firstBoss: "spellbound:first-boss",
  win: "spellbound:win",
  flawlessFloor: "spellbound:flawless-floor",
  hoarder: "spellbound:hoarder",
  longCast: "spellbound:long-cast",
} as const;

export const UNLOCKS = {
  rogueMage: "spellbound:rogue-mage",
  chronomancer: "spellbound:chronomancer",
  voidMage: "spellbound:void-mage",
} as const;

import type { DeathDifficulty, DeathEnemyDefinition, DeathEnemyKind, DeathMission, DeathSurvivorDefinition, DeathSurvivorId, DeathUpgradeDefinition, DeathUpgradeId, DeathWeaponDefinition, DeathWeaponId, DeathWordTier } from "@/lib/games/type-before-death/types";

export const DEATH_RULES_VERSION = "v1";
export const DEATH_LIMITS = {
  enemies: 10,
  effects: 48,
  lanes: 5,
  counter: 10_000_000,
  score: 2_000_000_000,
  runMs: 3_600_000,
  wpm: 350,
  wordLength: 24,
  receipts: 32,
  dailyBests: 14,
} as const;

export const DEATH_DIFFICULTIES: Readonly<Record<DeathDifficulty, { travel: number; spawn: number; damage: number; hp: number; score: number }>> = {
  easy: { travel: 1.3, spawn: 1.3, damage: 0.75, hp: 0.85, score: 0.9 },
  normal: { travel: 1, spawn: 1, damage: 1, hp: 1, score: 1 },
  hard: { travel: 0.84, spawn: 0.82, damage: 1.25, hp: 1.15, score: 1.2 },
};

export const DEATH_ENEMIES: Readonly<Record<DeathEnemyKind, DeathEnemyDefinition>> = {
  walker: { name: "Walker", description: "A steady approach; one short word usually stops it.", speed: 1, damage: 12, hp: 28, tier: "short", behavior: "advance", armor: 0, reward: 20, color: "#a3b18a" },
  runner: { name: "Runner", description: "Accelerates after crossing half the approach.", speed: 1.65, damage: 9, hp: 34, tier: "medium", behavior: "charge", armor: 0, reward: 30, color: "#fbbf24" },
  brute: { name: "Brute", description: "Slow armored pressure. Long words pierce its plating.", speed: 0.56, damage: 30, hp: 150, tier: "long", behavior: "armor", armor: 0.24, reward: 60, color: "#b45309" },
  spitter: { name: "Spitter", description: "Stops at range and repeatedly spits acid through part of the barricade.", speed: 0.78, damage: 11, hp: 65, tier: "medium", behavior: "ranged", armor: 0, reward: 45, color: "#a3e635" },
  bomber: { name: "Bomber", description: "Detonates before contact, dealing heavy barricade damage. Typing disarms it.", speed: 1.18, damage: 36, hp: 45, tier: "medium", behavior: "explode", armor: 0, reward: 50, color: "#fb7185" },
  stalker: { name: "Stalker", description: "Untargetable in the mist, then reveals itself and rushes the line.", speed: 1.05, damage: 18, hp: 54, tier: "medium", behavior: "ambush", armor: 0, reward: 50, color: "#c4b5fd" },
  swarm: { name: "Swarm", description: "Fragile short-word threats move faster with three or more packmates.", speed: 1.45, damage: 6, hp: 14, tier: "short", behavior: "pack", armor: 0, reward: 15, color: "#38bdf8" },
  mutant: { name: "Mutant", description: "Regenerates three health per second after three seconds without a completed hit.", speed: 0.83, damage: 23, hp: 135, tier: "long", behavior: "regenerate", armor: 0, reward: 65, color: "#2dd4bf" },
  elite: { name: "Elite", description: "Armored extreme words; enrages below half health.", speed: 1.12, damage: 27, hp: 240, tier: "extreme", behavior: "enrage", armor: 0.16, reward: 100, color: "#f97316" },
  boss: { name: "Commander", description: "Three health phases, charged strikes, minions and a two-word guard break.", speed: 0, damage: 25, hp: 700, tier: "long", behavior: "commander", armor: 0.08, reward: 350, color: "#ef4444" },
};

// At least 24 different initial letters per tier. With ten active targets,
// replacement words can always avoid ambiguous initials without retry loops.
export const DEATH_WORDS: Readonly<Record<DeathWordTier, readonly string[]>> = {
  short: ["ash", "bolt", "camp", "dust", "echo", "fuel", "gate", "hide", "iron", "jolt", "kite", "lamp", "mist", "nail", "oil", "push", "quit", "rush", "safe", "trap", "unit", "vent", "wall", "yell", "zone"],
  medium: ["alarm", "breach", "copper", "danger", "escape", "fallen", "gravel", "hazard", "impact", "jacket", "knives", "locked", "medic", "night", "outpost", "pistol", "quiver", "rescue", "signal", "target", "undead", "vision", "warden", "yellow", "zombie"],
  long: ["airborne", "barricade", "crossfire", "deadlock", "evacuate", "firestorm", "guardian", "headshot", "infection", "judgment", "keystone", "lockdown", "mutation", "nightfall", "overrun", "pressure", "quarantine", "recovery", "survivor", "terminal", "unbroken", "vanguard", "watchtower", "yearning", "zealotry"],
  extreme: ["annihilation", "battlefront", "containment", "destruction", "extermination", "fortification", "groundbreaker", "hallucination", "interception", "juggernaut", "kinetically", "liquefaction", "metamorphosis", "neutralization", "obliteration", "perseverance", "quarantined", "reinforcement", "stronghold", "transmission", "unrelenting", "vulnerability", "withstanding", "yellowhammer", "zombification"],
};

export const DEATH_MISSIONS: readonly DeathMission[] = [
  { id: 0, name: "Dead End", subtitle: "Hold the first street", briefing: "The evacuation truck is late. Keep the street barricade standing until the commander falls.", scenery: "street", palette: { sky: "#101824", fog: "#334155", ground: "#222b33", glow: "#f59e0b" }, enemies: ["walker", "runner", "swarm"], waves: 3, approachMs: 18000, bossName: "The Roadblock" },
  { id: 1, name: "Last Freight", subtitle: "Secure the supply depot", briefing: "Fuel and medicine wait behind the depot gates. Armored brutes and explosive carriers guard the shipment.", scenery: "depot", palette: { sky: "#171923", fog: "#48403a", ground: "#292524", glow: "#fb923c" }, enemies: ["walker", "runner", "brute", "bomber"], waves: 3, approachMs: 18500, bossName: "The Hauler" },
  { id: 2, name: "Emergency Ward", subtitle: "Extract the survivors", briefing: "The hospital lights are still on. Silence the acid spitters before their ranged attacks wear down your defense.", scenery: "hospital", palette: { sky: "#0f2021", fog: "#365954", ground: "#1f3330", glow: "#2dd4bf" }, enemies: ["walker", "spitter", "stalker", "mutant"], waves: 3, approachMs: 19000, bossName: "Patient Zero" },
  { id: 3, name: "Blackout Line", subtitle: "Clear the underground", briefing: "The metro tunnel is a route out of the city. Watch for hidden stalkers and packs moving through the mist.", scenery: "metro", palette: { sky: "#101020", fog: "#37304a", ground: "#272332", glow: "#a78bfa" }, enemies: ["runner", "stalker", "swarm", "spitter", "elite"], waves: 3, approachMs: 19500, bossName: "The Conductor" },
  { id: 4, name: "Burning Crossing", subtitle: "Defend the river bridge", briefing: "This bridge is the last crossing. Disarm bombers, break the elites and give the convoy time to escape.", scenery: "bridge", palette: { sky: "#271719", fog: "#583338", ground: "#32292c", glow: "#fb7185" }, enemies: ["runner", "brute", "bomber", "swarm", "elite"], waves: 3, approachMs: 20000, bossName: "The Gatekeeper" },
  { id: 5, name: "Origin Site", subtitle: "End the outbreak", briefing: "The source is inside the containment lab. Regenerating mutants and every remaining threat stand between you and dawn.", scenery: "lab", palette: { sky: "#101c24", fog: "#254651", ground: "#1d3038", glow: "#22d3ee" }, enemies: ["walker", "runner", "brute", "spitter", "bomber", "stalker", "swarm", "mutant", "elite"], waves: 3, approachMs: 20500, bossName: "The Origin" },
];

export const DEATH_UPGRADES: readonly DeathUpgradeDefinition[] = [
  { id: "hollow-point", name: "Hollow Point", description: "Completed words deal 12% more damage per rank.", maxRank: 3 },
  { id: "longshot", name: "Longshot", description: "Words of seven or more letters deal 20% more damage per rank.", maxRank: 3 },
  { id: "quickload", name: "Quickload", description: "Words of four or fewer letters deal 20% more damage per rank.", maxRank: 3 },
  { id: "coolant", name: "Coolant", description: "Cool four extra heat per second and gain three less mistake heat per rank.", maxRank: 3 },
  { id: "reinforcement", name: "Reinforcement", description: "Add 20 barricade capacity and repair 40 barricade per rank.", maxRank: 3 },
  { id: "field-medic", name: "Field Medic", description: "Add 10 maximum health and restore 35 health per rank.", maxRank: 3 },
  { id: "capacitor", name: "Capacitor", description: "Overdrive lasts 1.2 seconds longer; clean words earn two extra energy per rank.", maxRank: 3 },
  { id: "precision", name: "Precision", description: "Mistake-free completed words deal 10% more damage per rank.", maxRank: 3 },
  { id: "salvager", name: "Salvager", description: "Each typed kill repairs two barricade per rank.", maxRank: 3 },
];

export const DEATH_UPGRADE_REGISTRY: Readonly<Record<DeathUpgradeId, DeathUpgradeDefinition>> = Object.fromEntries(
  DEATH_UPGRADES.map((upgrade) => [upgrade.id, upgrade]),
) as Record<DeathUpgradeId, DeathUpgradeDefinition>;

export const DEATH_WEAPONS: Readonly<Record<DeathWeaponId, DeathWeaponDefinition>> = {
  pistol: { id: "pistol", name: "Pistol", description: "Balanced sidearm. Reliable heat and damage for learning the line.", damage: 1, heat: 1, shortWord: 1, longWord: 1, cleanWord: 1, energy: 1 },
  smg: { id: "smg", name: "SMG", description: "Short words fire faster and build pressure, but long words lose some stopping power.", damage: 0.88, heat: 0.74, shortWord: 1.28, longWord: 0.82, cleanWord: 1, energy: 1.1 },
  shotgun: { id: "shotgun", name: "Shotgun", description: "Heavy words hit brutally hard, at the cost of heat and a slower rhythm.", damage: 1.22, heat: 1.32, shortWord: 0.88, longWord: 1.34, cleanWord: 1, energy: 0.95 },
  sniper: { id: "sniper", name: "Sniper", description: "Clean long words become precision shots. Errors waste the weapon's advantage.", damage: 0.86, heat: 0.62, shortWord: 0.62, longWord: 1.55, cleanWord: 1.28, energy: 0.92 },
  plasma: { id: "plasma", name: "Plasma", description: "Late-game energy weapon. Strong baseline damage and explosive Overdrive conversion.", damage: 1.1, heat: 0.9, shortWord: 1, longWord: 1.12, cleanWord: 1.08, energy: 1.3 },
};

export const DEATH_SURVIVORS: Readonly<Record<DeathSurvivorId, DeathSurvivorDefinition>> = {
  soldier: { id: "soldier", name: "Soldier", description: "Balanced field training. The dependable first defender.", damage: 1, maxHealth: 0, maxBarricade: 0, energy: 1 },
  scout: { id: "scout", name: "Scout", description: "Reads movement early. More damage from a clean first lock.", damage: 1.08, maxHealth: -5, maxBarricade: 0, energy: 1.05 },
  engineer: { id: "engineer", name: "Engineer", description: "Reinforces the line before the first wave arrives.", damage: 0.96, maxHealth: 0, maxBarricade: 35, energy: 0.95 },
  medic: { id: "medic", name: "Medic", description: "Carries extra supplies and recovers from a breach more safely.", damage: 0.94, maxHealth: 20, maxBarricade: 0, energy: 1 },
  hacker: { id: "hacker", name: "Hacker", description: "Turns clean input into faster Overdrive charge.", damage: 0.98, maxHealth: -5, maxBarricade: 0, energy: 1.25 },
};

export const DEATH_WEAPON_REGISTRY = DEATH_WEAPONS;
export const DEATH_SURVIVOR_REGISTRY = DEATH_SURVIVORS;
export const DEATH_WEAPON_DEFINITIONS = DEATH_WEAPONS;
export const DEATH_SURVIVOR_DEFINITIONS = DEATH_SURVIVORS;

export const TYPE_BEFORE_DEATH_ENEMIES = DEATH_ENEMIES;
export const TYPE_BEFORE_DEATH_MISSIONS = DEATH_MISSIONS;
export const TYPE_BEFORE_DEATH_UPGRADES = DEATH_UPGRADES;
export const TYPE_BEFORE_DEATH_WEAPONS = DEATH_WEAPONS;
export const TYPE_BEFORE_DEATH_SURVIVORS = DEATH_SURVIVORS;
export const DEATH_ENEMY_DEFINITIONS = DEATH_ENEMIES;
export const DEATH_MISSION_REGISTRY = DEATH_MISSIONS;
export const DEATH_UPGRADE_DEFINITIONS = DEATH_UPGRADES;

export const DEATH_BRIEFING_MS = 1500;
export const DEATH_OVERDRIVE_MS = 6000;
export const DEATH_JAM_MS = 1800;
export const DEATH_SPIT_MS = 4200;

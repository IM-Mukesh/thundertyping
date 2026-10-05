import type { EnemyClass, WarEnemyDefinition, WarSpecialDefinition, WarStage } from "@/lib/games/rakshasa/types";

/** Original campaign text and procedural-art palettes; no external assets. */
export const ENEMY_DEFINITIONS: Record<EnemyClass, WarEnemyDefinition> = {
  "fallen-soldier": {
    name: "Fallen Soldier", description: "A steady marching swordsman. Complete one word to break the curse.",
    speed: 1, armor: 0, damage: 12, color: "#b4a397",
  },
  "zombie-warrior": {
    name: "Zombie Warrior", description: "A slow, relentless humanoid whose heavy strike punishes a breach.",
    speed: 0.78, armor: 0, damage: 18, color: "#79987a",
  },
  wraith: {
    name: "Wraith", description: "A spectral warrior that passes through shockwaves and burning embers.",
    speed: 1.17, armor: 0, damage: 13, color: "#9aaddd",
  },
  "possessed-human": {
    name: "Possessed Human", description: "A ragged fighter that breaks into a sprint halfway down the approach.",
    speed: 1.05, armor: 0, damage: 14, color: "#cb8da2",
  },
  "shadow-soldier": {
    name: "Shadow Soldier", description: "A dark duelist with a sudden final lunge and resistance to knockback.",
    speed: 1.22, armor: 0, damage: 15, color: "#82728e",
  },
  "burning-undead": {
    name: "Burning Undead", description: "A charred humanoid immune to ember; frost only partly quenches its advance.",
    speed: 1.12, armor: 0, damage: 20, color: "#ee925e",
  },
  "armored-revenant": {
    name: "Armored Revenant", description: "An iron-bound soldier. The first completed word strips armor and reveals a new word.",
    speed: 0.83, armor: 1, damage: 22, color: "#95a1b3",
  },
  "flying-wraith": {
    name: "Flying Wraith", description: "An airborne, spectral humanoid that avoids ground shockwaves but can be slowed by frost.",
    speed: 1.48, armor: 0, damage: 16, color: "#b9b7ed",
  },
  necromancer: {
    name: "Necromancer", description: "A robed spellcaster whose ranged curse reaches the hero before melee enemies can.",
    speed: 0.88, armor: 0, damage: 23, color: "#b58bd4",
  },
  "giant-revenant": {
    name: "Giant Revenant", description: "A towering humanoid with two armor layers, a slow march, and a crushing strike.",
    speed: 0.62, armor: 2, damage: 32, color: "#a89987",
  },
};

export const SPECIALS: readonly WarSpecialDefinition[] = [
  {
    id: "shockwave", name: "Heroic Shockwave", key: "1", cost: 35, unlockAt: 12,
    description: "Push back ground enemies and shatter up to two unarmored threats. Special kills award 12 points, no typing output.",
  },
  {
    id: "frost", name: "Frost Ward", key: "2", cost: 25, unlockAt: 35,
    description: "Slow approaches and boss charges for six seconds. Armor and boss sentences still require typing.",
  },
  {
    id: "ember", name: "Ember Arc", key: "3", cost: 50, unlockAt: 65,
    description: "Burn up to three unarmored corporeal enemies for 12 points each. Specters, burning undead, and bosses resist it.",
  },
];

export const WAR_STAGES: readonly WarStage[] = [
  {
    id: 0, name: "Abandoned Village", subtitle: "The first lantern", scenery: "village",
    intro: "Empty doorways watch the road. Raise your blade and bring the lost villagers home.",
    palette: { sky: "#171c30", fog: "#687286", ground: "#352d2c", glow: "#e0bc78" },
    enemies: ["fallen-soldier", "zombie-warrior", "possessed-human"], bossName: "The Hollow Watchman",
    sentences: [
      "a brave heart guards the village.",
      "let every silent doorway welcome the dawn.",
      "we hold this broken road until the last shadow falls.",
    ],
    finisher: "by this light the village lives again.",
  },
  {
    id: 1, name: "Haunted Forest", subtitle: "Whispers under the roots", scenery: "forest",
    intro: "The trees lean toward a voice without a face. Follow the fireflies beyond its reach.",
    palette: { sky: "#101e24", fog: "#446c62", ground: "#253b32", glow: "#9dd3b5" },
    enemies: ["zombie-warrior", "wraith", "possessed-human", "flying-wraith"], bossName: "The Rootbound Shade",
    sentences: [
      "these roots will shelter no fear.",
      "our steady footsteps wake the sleeping forest.",
      "through thorn and whisper we carry the living light.",
    ],
    finisher: "let the roots release their stolen souls.",
  },
  {
    id: 2, name: "Burning Kingdom", subtitle: "An oath among the embers", scenery: "kingdom",
    intro: "Ash drifts over the palace walls. A crown of fire commands the fallen guard.",
    palette: { sky: "#321923", fog: "#9c5b49", ground: "#433031", glow: "#ffa45b" },
    enemies: ["fallen-soldier", "burning-undead", "armored-revenant", "possessed-human"], bossName: "The Ashcrowned Regent",
    sentences: [
      "no crown can command the flame.",
      "we cross the embers with our promise unbroken.",
      "beneath this fallen throne a thousand hopes endure.",
    ],
    finisher: "the fire fades and hope claims the crown.",
  },
  {
    id: 3, name: "Great Battlefield", subtitle: "Stand where the banners fell", scenery: "battlefield",
    intro: "Broken standards mark the field. The old war rises, waiting for one final answer.",
    palette: { sky: "#252336", fog: "#837486", ground: "#443940", glow: "#edb38e" },
    enemies: ["fallen-soldier", "shadow-soldier", "armored-revenant", "giant-revenant"], bossName: "The Bannerless Marshal",
    sentences: [
      "our line will bend but not break.",
      "raise the fallen banners above this bitter field.",
      "every warrior beside us deserves a dawn beyond the war.",
    ],
    finisher: "let these weary blades find peace at last.",
  },
  {
    id: 4, name: "Cursed Castle", subtitle: "The oath behind the gate", scenery: "castle",
    intro: "Iron doors open without a hand. Beyond them, an ancient oath has learned to hate.",
    palette: { sky: "#1a1730", fog: "#696183", ground: "#343340", glow: "#c4a7ed" },
    enemies: ["wraith", "shadow-soldier", "armored-revenant", "necromancer"], bossName: "The Oathbroken Castellan",
    sentences: [
      "this gate will answer to the dawn.",
      "no broken oath can bind a heart that chooses hope.",
      "we climb these haunted stairs to free the names beneath the stone.",
    ],
    finisher: "the curse is broken and the gates stand open.",
  },
  {
    id: 5, name: "Dead City", subtitle: "A bell for the living", scenery: "city",
    intro: "No bell rings in the deserted square. Find its keeper before the streets forget the living.",
    palette: { sky: "#162b32", fog: "#55858b", ground: "#30434a", glow: "#89d5db" },
    enemies: ["zombie-warrior", "possessed-human", "flying-wraith", "necromancer", "giant-revenant"], bossName: "The Silent Bellkeeper",
    sentences: [
      "our voices will wake these streets.",
      "beneath the dust each doorway remembers a living name.",
      "let the bell call every wandering soul beyond the city's sorrow.",
    ],
    finisher: "ring for the living and release the dead.",
  },
  {
    id: 6, name: "Underworld", subtitle: "Across the river of names", scenery: "underworld",
    intro: "A dark river carries the echoes of the lost. The ferryman guards a passage made of fear.",
    palette: { sky: "#161127", fog: "#6e426f", ground: "#372b46", glow: "#dd97cf" },
    enemies: ["wraith", "burning-undead", "flying-wraith", "necromancer", "giant-revenant"], bossName: "The Veiled Ferryman",
    sentences: [
      "our light will cross the dark river.",
      "the lost are more than echoes for your empty throne.",
      "we name the stolen souls and guide them through the veil to morning.",
    ],
    finisher: "the river clears and every soul sails free.",
  },
  {
    id: 7, name: "Demon Kingdom / Final War", subtitle: "The last dawn", scenery: "demon",
    intro: "The shadow throne waits beyond the red horizon. Every road has led to this final stand.",
    palette: { sky: "#291020", fog: "#7e304b", ground: "#3d2537", glow: "#ff6f87" },
    enemies: ["shadow-soldier", "burning-undead", "armored-revenant", "flying-wraith", "necromancer", "giant-revenant"],
    bossName: "Varkesh, Lord of the Last Shadow",
    sentences: [
      "the final dawn belongs to the living.",
      "your throne of fear will fall before our unbroken will.",
      "from every village forest and fallen kingdom we rise together against the night.",
    ],
    finisher: "by courage and by light the last shadow ends.",
  },
];

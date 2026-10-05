// The shared contract every game satisfies: enough for the hub card, the route
// metadata, and the best-score badge to work without knowing anything about
// how the game actually plays.
//
// Mechanic-specific tuning does NOT belong here. Falling Words and Word Rain
// share one engine and keep their spawn/fall numbers in `use-falling-words.ts`;
// a game with a different mechanic keeps its own tuning in its own module.
// Putting every game's knobs in this one interface would make it a union of
// unrelated concerns that every game has to ignore most of.
//
// To add a game: add its id here, add a definition below, and register its
// component in `src/components/games/game-client.tsx`. Nothing else in the app needs to change —
// the hub, the /games/[gameId] route, the sitemap and the best-score badge all
// derive from GAME_LIST.

export type GameId =
  | "falling-words"
  | "word-rain"
  | "word-blaster"
  | "typing-grand-prix"
  | "boss-battle"
  | "combo-rush"
  | "spellbound"
  | "typing-survivor"
  | "ghost-racer"
  | "card-battle"
  | "fruit-fury"
  | "rakshasa-war";

export type GameStatus = "idle" | "running" | "paused" | "over";

export interface GameDefinition {
  id: GameId;
  name: string;
  tagline: string;
  /** Rules shown on the start card, in the order they matter to a new player. */
  rules: string[];
  /**
   * Genuinely game-specific prose for its route — what the mode actually
   * trains and how to play it well. Distinct per game on purpose: templated
   * pages that differ only by a swapped name are exactly the thin-content
   * pattern the SEO roadmap warns against.
   */
  about: string[];
  /**
   * Optional path to real cover artwork under /public (e.g.
   * "/games/falling-words.webp"). Left unset, the game falls back to the
   * drawn, theme-aware SVG in `game-cover-art.tsx` — which is the default
   * because it recolours per theme and costs nothing to load. Set this only
   * if the artwork is genuinely better, and check it against the Light theme
   * before committing.
   */
  coverImage?: string;
  /**
   * How many failures a run tolerates. Shown as hearts on the hub card and in
   * the HUD. A game with no life concept should use 1.
   */
  lives: number;
  /**
   * How the headline number is formatted wherever it's shown outside the game
   * itself (hub card, best-score badge): "time" renders as seconds survived,
   * "points" as a plain score. Games are free to display whatever they like
   * inside their own HUD.
   */
  scoreBy: "points" | "time" | "wpm";
  /**
   * Signature colour, taken from the game's own artwork. The game page
   * overrides `--accent` with this, so the board glow, grid, score and
   * controls all pick it up automatically — everything already reads that
   * variable.
   *
   * This exists because the site accent is a single colour across all five
   * themes, and a yellow HUD wrapped around cyan crystal art read as a clash
   * rather than a scheme. Scoping the override to the game page keeps the
   * rest of the site on the user's chosen theme.
   */
  accent: string;

  /**
   * Which filter tab the game appears under on the hub. One category per game
   * on purpose -- a game in three tabs makes the counts meaningless and the
   * filter useless.
   */
  category: "RPG" | "Action" | "Racing" | "Strategy" | "Arcade";
  /** Short descriptive labels on the hub card. Three at most; the card clips. */
  tags: string[];
  /** Human-readable run length, e.g. "5-15 min". Shown on the card. */
  duration: string;
  /**
   * How much a game rewards repeat play. Deliberately a judgement, not a
   * measured number: there is no telemetry behind it and inventing one would
   * be dishonest.
   */
  replayability: "Medium" | "High" | "Very High";
  /** One game carries the hub's featured slot. */
  featured?: boolean;
  /** Mark game as upcoming/in-development (cannot be played yet). */
  upcoming?: boolean;
  /** Longer pitch for the expanded hover card. */
  pitch?: string;
  /** Bullet features shown when the hub card expands. */
  highlights?: string[];
}

export const GAME_DEFINITIONS: Record<GameId, GameDefinition> = {
  "rakshasa-war": {
    id: "rakshasa-war",
    name: "TYPEBOUND: THE LAST DAWN",
    tagline: "TYPE. FIGHT. SURVIVE.",
    rules: [
      "Type an enemy's first letter to lock the most urgent matching target. Each correct character strikes; finish its word to defeat it or break its armor.",
      "Wrong keys break your combo. Backspace retreats through the target; Escape pauses, and Tab pauses before moving focus.",
      "Clear three waves and an elite, then type each boss sentence and its final execution. Defeat a commander to unlock the next battlefield.",
      "Unlock Shockwave, Frost and Ember by defeating enemies. Press 1, 2 or 3 to spend combat energy on an unlocked special.",
    ],
    about: [
      "TYPEBOUND: THE LAST DAWN is HeroTyping's dark-fantasy typing combat campaign. Defend eight battlefields against fallen soldiers, spectral humans and armored revenants. Correct letters animate your warrior's attacks; completed words and boss sentences decide the fight. Its lightweight 3D world uses original procedural humanoids, with a labelled tactical fallback when WebGL is unavailable.",
      "Choose a physical keyboard and begin with the safe tutorial. First-character targeting follows immediate danger, then stable spawn order, without mouse selection. Watch armor, ranged necromancers, flying wraiths and the boss charge telegraph. Clean word completions build score multipliers and replenish special-attack energy.",
      "Each battlefield has three waves, an elite and a three-phase sentence commander with a typed finisher. Progress and special unlocks are device-local and separated by account; completed scores use HeroTyping's existing save system. WPM counts unique correctly typed output over active combat time, excluding cinematics and pauses—not automatic special kills or repeated prefixes.",
    ],
    lives: 5,
    scoreBy: "points",
    accent: "#f0b86a",
    category: "Action",
    tags: ["3D Combat", "Campaign", "Keyboard"],
    duration: "3-6 min / stage",
    replayability: "Very High",
    featured: true,
    pitch: "Eight fallen kingdoms. Ten undead legions. Your keyboard is the weapon.",
    highlights: ["8 battlefields", "10 humanoid enemy classes", "Sentence bosses", "3 earned specials", "Procedural 3D", "Adaptive enemy pacing"],
  },
  "falling-words": {
    id: "falling-words",
    name: "Falling Words",
    tagline: "Clear the words before they hit the floor.",
    rules: [
      "Words fall from the top — type one to clear it.",
      "Freeze words slow time; Golden words grant bonus points; Danger words fall faster and reward a clean clear.",
      "Every word that reaches the floor costs a life. Three lives.",
      "Words cleared advance through 5 difficulty milestones; clean streaks multiply your score.",
    ],
    about: [
      "Falling Words trains the skill a plain typing test never really tests: choosing what to type next. On a normal test the next word is always the one directly after the cursor. Here several words are on screen at once, each at a different height, and part of playing well is reading the board and clearing the most urgent one first.",
      "Prioritize the lowest word, capture Freeze words to slow the board, and clear Golden words for bonus points. Red Danger words fall faster: clear them for a larger reward. Ignoring any word costs a life.",
      "Difficulty increases with words cleared through five milestones: Scout Warmup, Pressure Surge, Mixed Threats, Elite Swarm, and Overdrive Frenzy. These mark a continuous pace ramp rather than separate rule sets.",
    ],
    lives: 3,
    scoreBy: "points",
    // icy cyan, matching the crystal shards
    accent: "#5eead4",
    category: "Arcade",
    tags: ["Arcade", "Reflex", "Single Player"],
    duration: "1-3 min",
    replayability: "High",
    pitch:
      "Words fall, you clear them. Target prioritization under time pressure with freeze matrix powerups.",
    highlights: ["5 Difficulty milestones", "Freeze & Golden words", "Fast danger words", "Combo multipliers"],
  },
  "word-rain": {
    id: "word-rain",
    name: "Word Rain",
    tagline: "One life. How long can you survive the storm?",
    rules: [
      "Storm intensity accelerates through 5 weather phases from Mist to Gale Force and Hurricane.",
      "The threat gauge shows how close the nearest word is to the floor.",
      "You have a single life — one word reaching the floor ends the run.",
      "Your score is how long you survived the tempest.",
    ],
    about: [
      "Word Rain is the one-life survival counterpart to Falling Words. Five timed weather phases increase the pace, with thunder cues announcing each transition.",
      "Survive through Mist, Drizzle, Downpour, Gale Force, and Hurricane. The threat gauge follows the word closest to the floor; it measures immediate danger, not a forecast of future spawns.",
      "Because a single drop ends the run, the mode tests unbroken rhythm and mental stamina under sustained acoustic and visual pressure.",
    ],
    lives: 1,
    scoreBy: "time",
    // violet, matching the storm and lightning
    accent: "#a78bfa",
    category: "Arcade",
    tags: ["Arcade", "Hardcore", "Single Player"],
    duration: "1-3 min",
    replayability: "High",
    pitch:
      "One life. 5 weather phases from Mist to Hurricane. Survive the tempest.",
    highlights: ["5 Weather phases", "Nearest-threat gauge", "One life survival", "Thunder transition cues"],
  },
  "word-blaster": {
    id: "word-blaster",
    name: "Word Blaster",
    tagline: "Hold the line. Type to shoot them down.",
    rules: [
      "Enemies fly in from the right: fast Swarmers, armored Tanks, and EMP drones.",
      "Tanks have 2-word armored shields; EMP drones trigger lane-clearing shockwaves.",
      "Any enemy that breaches your base costs a life. Three lives.",
      "Consecutive clears build combo multipliers up to 2x.",
    ],
    about: [
      "Word Blaster is a tactical lane defense shooter. Your typing input aims and fires your defense turret at incoming hostiles.",
      "Prioritization is paramount: fast Swarmers must be eliminated before they slip through, heavy Tanks require breaking their shield before destroying the core, and EMP drones detonate a lane shockwave that clears nearby threats.",
      "Maintain your combo multiplier by avoiding errant keystrokes and keeping lanes clear.",
    ],
    lives: 3,
    scoreBy: "points",
    // electric cyan, matching the tracer fire
    accent: "#22d3ee",
    category: "Action",
    tags: ["Shooter", "Action", "Single Player"],
    duration: "2-4 min",
    replayability: "High",
    pitch:
      "Tactical lane shooter with Swarmers, Armored Tanks, and EMP shockwaves.",
    highlights: ["3 Enemy archetypes", "EMP lane detonations", "Armored shield tanks", "5-Lane defense"],
  },
  "typing-grand-prix": {
    id: "typing-grand-prix",
    name: "Typing Grand Prix",
    tagline: "Race three rivals over forty words.",
    rules: [
      "Type the stream one word at a time — space commits each word.",
      "Only correct characters move your car. Skipped characters leave the course incomplete (DNF).",
      "Three rivals hold roughly 35, 50 and 70 WPM. Beat the one you can.",
      "Complete the full distance to finish. Score Boost multiplies points, not car speed.",
    ],
    about: [
      "Typing Grand Prix turns your words per minute into something you can see moving. Every car on the track, yours included, covers the same fixed distance of forty words, and the rivals hold pace at roughly 35, 50 and 70 WPM — not arbitrary numbers, but the speeds that matter: 35 is a fluent hunt-and-peck pace, 50 is where a competent touch typist sits, and 70 is the threshold most people are actually trying to reach. Finishing ahead of a particular car is therefore a concrete, repeatable claim about your speed, in a way a bare number on a results screen never quite is.",
      "Correct each word before committing it with Space. Wrong letters are marked but do not block editing; committing them leaves missing distance that ends in DNF rather than a normal finish. Repeatedly erasing and retyping the same letters never increases scored output. Clean words build Score Boost, which increases points without moving the car for you.",
      "Each sprint draws forty words and three AI rivals around the same pace bands, so it is useful practice but not a standardized course comparison. Find a rival you can reliably beat while completing the entire text. Results separate earned word points from finish bonuses; a DNF keeps word points but earns no finish bonus.",
    ],
    // No life mechanic — a race ends at the flag, not at a failure, so this is
    // the "games with no lives use 1" case the field documents.
    lives: 1,
    scoreBy: "points",
    // hot magenta, matching the circuit neon
    accent: "#f472b6",
    category: "Racing",
    tags: ["Racing", "Arcade", "Single Player"],
    duration: "1-2 min",
    replayability: "Medium",
    pitch:
      "A flat-out sprint. The active word is pinned and the track never stops moving.",
    highlights: ["Pinned reading position", "Speed feedback", "Lap pacing", "Personal bests"],  },
  "boss-battle": {
    id: "boss-battle",
    name: "Boss Battle",
    tagline: "Out-type the boss before it out-damages you.",
    rules: [
      "Type the word to hit the boss — longer words do far more damage.",
      "It charges an attack on a timer; clear two words before the bar fills to block it.",
      "Every attack that lands costs a life. Three lives, and nothing heals them.",
      "Break its health past each threshold and it changes phase: shorter fuse, longer words.",
    ],
    about: [
      "Boss Battle is the only mode here that types against a deadline instead of against a clock. A normal typing test punishes a slow second by quietly lowering a number at the end; this one punishes it immediately, because the boss is charging an attack the whole time and the only thing that stops it is you finishing enough words before the bar fills. Two cleared words block the incoming hit, and every word you land in the same window is damage on top. That turns a typing run into a resource problem — time is the resource, and the fight is decided by how much of each window you convert into damage rather than spend recovering.",
      "The single most valuable habit is front-loading. Each cleared word fills one shield pip regardless of how long it was, so the fastest safe pattern is to clear your two words at the start of a charge window and treat the remaining seconds as risk-free damage time. Word length is where the scoring is decided: damage rises with the square of the length, so an eight-letter word is worth more than two four-letter ones and a long word appearing late in a window is good news, not a threat. Typos never cost a life directly, but they break the combo multiplier that stacks up to 1.6x, so the run that deals the most damage is almost never the frantic one — it is the one that holds a clean, slightly conservative rhythm and never has to retype a word.",
      "Phases are where runs are actually won and lost. Crossing 66% and 33% health shortens the charge and raises the minimum word length, and the final phase asks for roughly two five-to-eight letter words every four seconds — a sustained floor around 35 WPM with no mistakes. Two things make that survivable: the boss staggers for about a second after each phase break, which is free damage if you keep typing through the flash instead of watching it, and the victory bonus scales with the lives you have left, so protecting a life is usually worth more than the damage you would gain by gambling on one. If you lose here, the health percentage on the result card tells you exactly which phase beat you, and that is the pace worth practising at on the main typing test.",
    ],
    lives: 3,
    scoreBy: "points",
    // crimson, matching the boss glow
    accent: "#f87171",
    category: "RPG",
    tags: ["Boss Fight", "RPG", "Single Player"],
    duration: "3-6 min",
    replayability: "Medium",
    pitch:
      "One enemy, one long health bar, and your accuracy as the only weapon.",
    highlights: ["Single boss", "Phase changes", "Damage scaling", "Focus test"],  },
  "combo-rush": {
    id: "combo-rush",
    name: "Combo Rush",
    tagline: "The clock is always running out. Type it back.",
    rules: [
      "A short clock drains continuously. At zero the run ends.",
      "Every cleared word refunds time; longer words refund more.",
      "Build streaks to ascend 5 Rush Tiers (Warmup, Bronze, Silver, Gold, Hyper).",
      "One wrong letter resets your multiplier and Rush Tier. Space skips a word for 0.75 seconds.",
    ],
    about: [
      "Combo Rush is an adrenaline-fueled trading game: you trade typing accuracy for survival clock, and the drain accelerates as you progress.",
      "Climb through five streak milestones from Warmup to Hyper. Each clean word builds the same multiplier for points and time refunds, rising from 1x to a 1.6x cap. Later tier badges celebrate longer streaks rather than adding a hidden bonus.",
      "A wrong letter resets your combo and tier without directly subtracting time. The clock continues draining while you recover. Skipping with Space resets the combo and costs 0.75 seconds.",
    ],
    lives: 1,
    scoreBy: "points",
    // gold, matching the light rings
    accent: "#fbbf24",
    category: "Arcade",
    tags: ["Arcade", "Combo", "Single Player"],
    duration: "2-4 min",
    replayability: "High",
    pitch:
      "Ascend 5 Rush Tiers from Warmup to Hyper. The clock drains, your combo saves you.",
    highlights: ["5 Rush tiers", "Time refund mechanics", "Score attack frenzy", "Instant pace test"],
  },
  spellbound: {
    id: "spellbound",
    name: "Spellbound",
    tagline: "Words are spells. Choose which one to cast while the enemy acts.",
    rules: [
      "Several spells are on screen at once — type one to cast it.",
      "Word length is cast time: short words are fast and weak, long words slow and devastating.",
      "Enemies act while you type. Longer words expose you to more incoming attacks.",
      "Between floors, pick relics that change how your spells behave.",
    ],
    about: [
      "Spellbound is built on the one mapping typing games have always had available and rarely used: how long a word takes to type is how long a spell takes to cast. A four-letter jab lands almost immediately for very little damage. An eleven-letter nuke takes real seconds during which the enemy is still moving, still winding up, still able to punish you. Every moment of combat is a decision about whether you can afford the big word.",
      "That makes it a genuinely different skill from a typing test. Raw speed helps, but the player who wins is the one reading the board — tracking enemy wind-up timers, noticing that a heal is available but costs as much time as an attack, deciding to chip safely rather than gamble on a long cast. Accuracy matters more than in any other mode here, because a mistyped long word is time you will not get back.",
      "Runs are procedurally generated and last roughly ten minutes. Relics found along the way change the maths rather than nudging it: one makes short words cast faster, another makes long words hit harder, a third gives every spell a chance to fire twice. Two runs with different relics want genuinely different typing from you.",
    ],
    lives: 3,
    scoreBy: "points",
    accent: "#a855f7",
    category: "RPG",
    tags: ["Roguelite", "RPG", "Single Player"],
    duration: "5-15 min",
    replayability: "High",
    upcoming: true,
    pitch:
      "Cast spells, defeat enemies, collect relics and build your ultimate typing mage. Every run is unique.",
    highlights: ["5 unique characters", "16 spells", "16 relics", "Procedural floors", "4 boss fights", "Build variety"],  },
  "typing-survivor": {
    id: "typing-survivor",
    name: "Typing Survivor",
    tagline: "Fifteen waves. Build your typing weapon and defeat the final boss.",
    rules: [
      "Enemies stream in from all sides, each labelled with a word.",
      "Type an enemy's word to strike it. Longer words hit harder.",
      "Killing enemies earns XP; every level up offers a choice of upgrade.",
      "Survive long enough and a boss arrives.",
    ],
    about: [
      "Typing Survivor is the most immediately playable game here: there is no cast time to weigh and no deck to build, only a rising tide of enemies and your hands. What gives it depth is the upgrade draft. Every level up offers three choices, and the ones you take gradually turn your typing into a particular kind of weapon.",
      "Take the short-word upgrades and you become a machine gun, shredding the swarm but struggling against anything with real health. Take the long-word upgrades and each strike is an execution, which feels magnificent until six fast enemies arrive at once. Accuracy builds reward never making a mistake; combo builds reward never stopping. None of these is the correct answer, and the enemies you happen to face push you toward different ones.",
      "Combat trains sustained typing under pressure, with a pause for each upgrade draft and a manual pause whenever you need a break. Bosses arrive every fifth wave; defeating wave fifteen completes the campaign.",
    ],
    lives: 3,
    scoreBy: "points",
    accent: "#f97316",
    category: "Action",
    tags: ["Action", "Horde", "Single Player"],
    duration: "8-15 min",
    replayability: "Very High",
    pitch:
      "Survive fifteen waves, draft powerful upgrades, and defeat three bosses.",
    highlights: ["4 characters", "Upgrade drafts", "Six enemy types", "Elites and bosses", "Build variety", "Wave escalation"],  },
  "ghost-racer": {
    id: "ghost-racer",
    name: "Ghost Racer",
    tagline: "Race four neon rivals across a typing-powered night circuit.",
    rules: [
      "Choose Easy, Medium, Hard or Legend before the starting lights.",
      "Four deterministic rivals type the same course at fixed difficulty-based paces.",
      "Correct characters move your bike; mistakes must be corrected before the course advances.",
      "Keep typing after a rival finishes. Your final position is ranked across all five riders.",
    ],
    about: [
      "Ghost Racer turns a typing test into a five-bike night race. Four named rivals ride the same course with distinct colors, lanes and fixed replay pacing, so every overtake is readable in the world rather than hidden in a number.",
      "Easy, Medium, Hard and Legend are deliberately different fields, not manual speed sliders. The player’s distance remains honest strict-prefix typing, while a short typing lull makes the bike coast and lowers the live pace without granting free characters.",
      "Your fastest completed runs are retained in a bounded, account-scoped library for personal-best tracking. Signed-in summary results save to your account; replay samples remain local. You can finish even after every rival crosses first, and pause without counting that break in the final time.",
    ],
    lives: 1,
    scoreBy: "wpm",
    accent: "#22d3ee",
    category: "Racing",
    tags: ["Racing", "Competitive", "Single Player"],
    duration: "2-5 min",
    replayability: "High",
    pitch: "Choose your level, chase four rivals, and climb the night circuit one correct character at a time.",
    highlights: ["4 AI rivals", "Easy to Legend", "Chase-camera road", "Personal bests"],
  },
  "card-battle": {
    id: "card-battle",
    name: "Card Battle",
    tagline: "A deck of cards you play by typing their names.",
    rules: [
      "Each card has a word. Type it to play the card.",
      "Cards cost energy. Choose End turn when you are ready for enemy actions.",
      "Defeat an encounter to add a card, or skip to keep your deck focused.",
      "Cards combine — poison, then a multiplier, then an execute.",
    ],
    about: [
      "Card Battle is the most deliberate game in the set. Combat is turn-based, so there is no clock forcing your hand, and the interesting decision is which cards to play and in what order rather than how fast you can move. Typing is how you commit to a choice, which makes a misfire feel like a genuine mistake rather than lost milliseconds.",
      "Cards are strongest in combinations: build Blight, multiply it, then burst it; or prepare block before a heavy enemy turn. Add rewards that support your strategy and skip cards that dilute it. The current campaign supports adding or skipping rewards; card removal, upgrades and spending gold are not yet available.",
      "Because it is turn-based, this is the mode that rewards accuracy over speed more than any other. There is time to type each card name correctly, and no reward at all for typing it fast, so it is the gentlest entry point for a slower typist who wants the strategy without the pressure.",
    ],
    lives: 1,
    scoreBy: "points",
    accent: "#dc2626",
    category: "Strategy",
    tags: ["Strategy", "Deckbuilding", "Single Player"],
    duration: "10-25 min",
    replayability: "High",
    pitch:
      "Build your deck, type to play cards, defeat mighty foes and discover powerful combos.",
    highlights: ["3 starter decks", "39 cards", "Deck archetypes", "Card combos", "3 bosses", "Turn-based"],  },
  "fruit-fury": {
    id: "fruit-fury",
    name: "Fruit Fury",
    tagline: "Slice flying fruits with swift typing. Avoid the bombs.",
    rules: [
      "Fruits launch into the air carrying letters — type the matching key to slice them.",
      "Bombs also carry letters: typing a bomb letter detonates it and immediately ends the run.",
      "Three lives (❤️❤️❤️). Any fruit that slips past the bottom edge costs one life.",
      "Consecutive slices build combo multipliers; filling the meter activates 2X Fever Mode.",
    ],
    about: [
      "Fruit Fury turns rapid single-letter recognition into an exhilarating arcade slice-fest. Instead of reading sequential text in a line, fruits burst upward with authentic parabolic arcs, reaching a float apex before falling back down. Every fruit displays a high-contrast letter that requires instant reflex typing.",
      "The signature tension comes from bombs mixed into the fruit volleys. Bombs also display letters, transforming mechanical reflex into high-stakes decision making. A single mistype on a bomb immediately triggers detonation and ends the run, while ignoring it allows it to harmlessly fall off-screen.",
      "Clean, consecutive slices rapidly fill the Fever meter. When maxed out, 8 seconds of Fever Mode triggers with 2X score multipliers, rainbow visual bursts, energetic synth music, and a frenzy of bomb-free fruit showers.",
    ],
    lives: 3,
    scoreBy: "points",
    accent: "#f43f5e",
    category: "Arcade",
    tags: ["Arcade", "Reflex", "Action"],
    duration: "2-5 min",
    replayability: "Very High",
    pitch:
      "Slice launching fruit with lightning-fast typing reflexes. Chain combos, unleash Fever Mode, and steer clear of fatal bombs!",
    highlights: ["Parabolic physics arcs", "Fatal bomb defusal", "Fever Frenzy 2X Mode", "Golden & Frost Specials", "Combo multipliers", "Procedural dynamic audio"],
  },
};

export const GAME_LIST: GameDefinition[] = [
  GAME_DEFINITIONS["rakshasa-war"],
  GAME_DEFINITIONS["fruit-fury"],
  GAME_DEFINITIONS["falling-words"],
  GAME_DEFINITIONS["word-rain"],
  GAME_DEFINITIONS["word-blaster"],
  GAME_DEFINITIONS["typing-grand-prix"],
  GAME_DEFINITIONS["boss-battle"],
  GAME_DEFINITIONS["combo-rush"],
  GAME_DEFINITIONS["typing-survivor"],
  GAME_DEFINITIONS["ghost-racer"],
  GAME_DEFINITIONS["card-battle"],
  GAME_DEFINITIONS["spellbound"],
];

/**
 * Filtered list of games that are currently playable (non-upcoming).
 * Used for sitemap inclusion, featured fallback, and all-games achievement tracking.
 */
export const PLAYABLE_GAME_LIST: GameDefinition[] = GAME_LIST.filter(
  (game) => !game.upcoming,
);

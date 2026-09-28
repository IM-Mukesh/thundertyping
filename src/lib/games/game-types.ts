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
  | "fruit-fury";

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
  scoreBy: "points" | "time";
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
  "falling-words": {
    id: "falling-words",
    name: "Falling Words",
    tagline: "Clear the words before they hit the floor.",
    rules: [
      "Words fall from the top — type one to clear it.",
      "Freeze words slow time; Golden words grant bonus points; avoid Hazard words.",
      "Every word that reaches the floor costs a life. Three lives.",
      "Consecutive clears advance through 5 escalation phases and multiply your score.",
    ],
    about: [
      "Falling Words trains the skill a plain typing test never really tests: choosing what to type next. On a normal test the next word is always the one directly after the cursor. Here several words are on screen at once, each at a different height, and part of playing well is reading the board and clearing the most urgent one first.",
      "The practical tactic is to prioritize the lowest word, while tactically capturing Freeze words to slow the board down or Golden words to surge your score. Beware of red Hazard words that penalize mistakes.",
      "Difficulty ramps dynamically through five distinct escalation phases (Scout Warmup, Accelerating Stream, Multi-Lane Torrent, Overdrive Frenzy, and Matrix Meltdown) rather than linear clocks, rewarding clean reading over panicked mashing.",
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
    highlights: ["5 Escalation phases", "Freeze & Golden words", "Tactical hazard words", "Combo multipliers"],
  },
  "word-rain": {
    id: "word-rain",
    name: "Word Rain",
    tagline: "One life. How long can you survive the storm?",
    rules: [
      "Storm intensity accelerates through 5 weather phases from Mist to Gale Force and Hurricane.",
      "A real-time storm pressure gauge tracks impending downpour surges.",
      "You have a single life — one word reaching the floor ends the run.",
      "Your score is how long you survived the tempest.",
    ],
    about: [
      "Word Rain is the dedicated survival counterpart to Falling Words: one life, a torrential weather system, and atmospheric rain audio that deepens as the storm intensifies.",
      "Survive through Mist, Drizzle, Downpour, Gale Force, and the final Hurricane phase where words pour at peak velocity. The storm pressure gauge alerts you to impending surges so you can prepare your hands.",
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
    highlights: ["5 Weather phases", "Storm threat gauge", "One life survival", "Ambient rain audio"],
  },
  "word-blaster": {
    id: "word-blaster",
    name: "Word Blaster",
    tagline: "Hold the line. Type to shoot them down.",
    rules: [
      "Enemies fly in from the right: fast Swarmers, armored Tanks, and EMP drones.",
      "Tanks have 2-word armored shields; EMP drones trigger lane-clearing shockwaves.",
      "Any enemy that breaches your base costs a life. Three lives.",
      "Consecutive kills build combo multipliers up to 2.5x.",
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
      "Your car moves the moment you type; mistyped letters are marked but never block you.",
      "Three rivals hold roughly 35, 50 and 70 WPM. Beat the one you can.",
      "Forty words to the flag. Your score is your speed, your accuracy and where you finish.",
    ],
    about: [
      "Typing Grand Prix turns your words per minute into something you can see moving. Every car on the track, yours included, covers the same fixed distance of forty words, and the rivals hold pace at roughly 35, 50 and 70 WPM — not arbitrary numbers, but the speeds that matter: 35 is a fluent hunt-and-peck pace, 50 is where a competent touch typist sits, and 70 is the threshold most people are actually trying to reach. Finishing ahead of a particular car is therefore a concrete, repeatable claim about your speed, in a way a bare number on a results screen never quite is.",
      "The decision the race keeps asking you is whether to fix a mistake. Wrong characters are marked in red but do not stop you — space commits the word however it looks, and your car keeps moving. Backspacing does not drag the car backwards either; it simply costs you the time you spend doing it, which is the whole point. Accuracy multiplies your final score, but the placement bonus is worth far more than a few percentage points of accuracy, so the honest rule is positional: when a rival is within a car length, take the error and drive on; when your place is safely yours, go back and clean it up. Players who reflexively fix everything lose podium positions they had already earned.",
      "Because the distance is fixed and there is no difficulty ramp, this is a sprint rather than a survival test, and that makes it the most directly comparable of the three games — the same forty words, the same three rivals, run after run. Use it as a ladder: find the fastest car you can reliably beat, race that one until winning feels routine, then go after the next. It pairs naturally with the timed test, where you can confirm that the pace you just held for forty words is a pace you can hold for a full minute.",
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
      "One wrong letter resets your multiplier and drops your Rush Tier.",
    ],
    about: [
      "Combo Rush is an adrenaline-fueled trading game: you trade typing accuracy for survival clock, and the drain accelerates as you progress.",
      "Climb through 5 dynamic Rush Tiers from Warmup through Gold to Hyper Rush. Each tier unlocks exponential score multipliers and richer time refunds, rewarding sustained flawless typing rhythm.",
      "A single mistake breaks your combo chain, penalizing your clock and forcing you to rebuild your multiplier from base tier.",
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
      "Enemies act in real time. A long cast can be interrupted.",
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
    highlights: ["5 unique characters", "16 spells", "15 relics", "Procedural floors", "4 boss fights", "Endless replayability"],  },
  "typing-survivor": {
    id: "typing-survivor",
    name: "Typing Survivor",
    tagline: "Endless horde. Every enemy carries a word. Survive the waves.",
    rules: [
      "Enemies stream in from all sides, each labelled with a word.",
      "Type an enemy's word to strike it. Longer words hit harder.",
      "Killing enemies earns XP; every level up offers a choice of upgrade.",
      "Survive long enough and a boss arrives.",
    ],
    about: [
      "Typing Survivor is the most immediately playable game here: there is no cast time to weigh and no deck to build, only a rising tide of enemies and your hands. What gives it depth is the upgrade draft. Every level up offers three choices, and the ones you take gradually turn your typing into a particular kind of weapon.",
      "Take the short-word upgrades and you become a machine gun, shredding the swarm but struggling against anything with real health. Take the long-word upgrades and each strike is an execution, which feels magnificent until six fast enemies arrive at once. Accuracy builds reward never making a mistake; combo builds reward never stopping. None of these is the correct answer, and the enemies you happen to face push you toward different ones.",
      "Because the pressure is continuous rather than turn-based, this is the mode that most directly trains sustained typing under stress. There is no moment to reset your hands and no natural pause, which is exactly the condition a typing test never reproduces and real work often does.",
    ],
    lives: 3,
    scoreBy: "time",
    accent: "#f97316",
    category: "Action",
    tags: ["Action", "Horde", "Single Player"],
    duration: "10-30 min",
    replayability: "Very High",
    pitch:
      "Endless enemies. Powerful upgrades. How long can you survive?",
    highlights: ["4 characters", "Upgrade drafts", "Six enemy types", "Elites and bosses", "Build variety", "Wave escalation"],  },
  "ghost-racer": {
    id: "ghost-racer",
    name: "Ghost Racer",
    tagline: "Race the ghost of your own best run.",
    rules: [
      "You and a ghost type the same text, side by side.",
      "The ghost is your own real previous run on this text, replayed keystroke by keystroke.",
      "Beat it and that run becomes your new ghost to beat next time.",
      "A daily race gives you the same text every day, so yesterday's ghost is today's target.",
    ],
    about: [
      "Ghost Racer replays a real run rather than simulating an opponent -- specifically, your own. The ghost beside you is your actual keystrokes from a previous attempt at this exact text, with their actual timing: the half-second you hesitated on a hard word, the burst where you found your rhythm. Racing that feels nothing like racing a number, because it's uneven in the specific way a real run is uneven.",
      "The tactical layer is pacing. A ghost that starts fast isn't necessarily beating you -- it may be the run where you stumbled at the end. Learning to hold your own rhythm while a ghost pulls ahead, rather than panicking into a mistake, is the skill the mode trains, and it transfers directly to any timed test.",
      "Every run you finish against a text is saved, and beating your ghost replaces it -- so the bar keeps rising, one real run at a time, at your own pace. Everything stays on this device: there's no shared pool of other players' runs and no ranking, just your own history to race against.",
    ],
    lives: 1,
    scoreBy: "time",
    accent: "#22d3ee",
    category: "Racing",
    tags: ["Racing", "Competitive", "Single Player"],
    duration: "2-5 min",
    replayability: "High",
    pitch: "Race the ghost of your own best run. Beat it, and that becomes the new ghost to chase next.",
    highlights: ["Real recorded runs", "Daily race", "Personal bests", "Progressive ghosts"],
  },
  "card-battle": {
    id: "card-battle",
    name: "Card Battle",
    tagline: "A deck of cards you play by typing their names.",
    rules: [
      "Each card has a word. Type it to play the card.",
      "Cards cost energy; your turn ends when energy runs out.",
      "Defeat an enemy to add, upgrade or remove a card.",
      "Cards combine — poison, then a multiplier, then an execute.",
    ],
    about: [
      "Card Battle is the most deliberate game in the set. Combat is turn-based, so there is no clock forcing your hand, and the interesting decision is which cards to play and in what order rather than how fast you can move. Typing is how you commit to a choice, which makes a misfire feel like a genuine mistake rather than lost milliseconds.",
      "The depth comes from cards that are weak alone and strong together. A poison card does very little on its own. A multiplier card does nothing at all on its own. Played in sequence against an enemy that is about to take a turn, they win the fight. Building a deck means noticing those pairs and then deliberately removing the cards that dilute them — a deck that does one thing well beats a deck of individually strong cards.",
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
    highlights: ["3 characters", "40+ cards", "Deck archetypes", "Card combos", "3 bosses", "Turn-based"],  },
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
    featured: true,
    pitch:
      "Slice launching fruit with lightning-fast typing reflexes. Chain combos, unleash Fever Mode, and steer clear of fatal bombs!",
    highlights: ["Parabolic physics arcs", "Fatal bomb defusal", "Fever Frenzy 2X Mode", "Golden & Frost Specials", "Combo multipliers", "Procedural dynamic audio"],
  },
};

export const GAME_LIST: GameDefinition[] = [
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

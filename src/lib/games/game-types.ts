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
// component in `game-registry.ts`. Nothing else in the app needs to change —
// the hub, the /games/[gameId] route, the sitemap and the best-score badge all
// derive from GAME_LIST.

export type GameId = "falling-words" | "word-rain";

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
}

export const GAME_DEFINITIONS: Record<GameId, GameDefinition> = {
  "falling-words": {
    id: "falling-words",
    name: "Falling Words",
    tagline: "Clear the words before they hit the floor.",
    rules: [
      "Words fall from the top — type one to clear it.",
      "You do not need to press space; a word clears the moment it is complete.",
      "Every word that reaches the floor costs a life. Three lives.",
      "Consecutive clears build a combo that multiplies your score.",
    ],
    about: [
      "Falling Words trains the skill a plain typing test never really tests: choosing what to type next. On a normal test the next word is always the one directly after the cursor. Here several words are on screen at once, each at a different height, and part of playing well is reading the board and clearing the most urgent one first.",
      "The practical tactic is to always take the lowest word, even when a shorter one higher up looks tempting. A short word near the ceiling will still be there in three seconds; a long word near the floor will not. Players who clear greedily by length tend to lose lives in clusters, because they leave the hardest word for the moment they have the least time.",
      "Difficulty ramps with words cleared rather than with elapsed time, so the game tracks how well you are actually doing instead of punishing you for a slow start. Clearing words without a miss builds a combo multiplier that caps at double score, which means a clean run is worth far more than a frantic one.",
    ],
    lives: 3,
    scoreBy: "points",
  },
  "word-rain": {
    id: "word-rain",
    name: "Word Rain",
    tagline: "One life. How long can you last?",
    rules: [
      "Words fall faster and more often the longer you survive.",
      "You have a single life — one word reaching the floor ends the run.",
      "Your score is how long you stayed alive.",
      "Combos still build, and still multiply the words you clear.",
    ],
    about: [
      "Word Rain is the endurance counterpart to Falling Words: one life, a faster starting pace, and a ramp that keeps tightening for as long as you stay alive. Your score is simply how many seconds you lasted, which makes it a much blunter measure — there is no way to bank points early and coast.",
      "Because a single miss ends the run, the mode rewards consistency far more than peak speed. A typist who holds a steady, accurate rhythm will almost always outlast one who types in fast bursts and recovers from mistakes, since every mistyped character is time spent not clearing the word closest to the floor.",
      "It is also the best mode for finding your real ceiling. The pace increases until it beats you, so the second the board becomes unmanageable you have located the exact speed where your accuracy breaks down — which is the speed worth practising at on the main test.",
    ],
    lives: 1,
    scoreBy: "time",
  },
};

export const GAME_LIST: GameDefinition[] = [
  GAME_DEFINITIONS["falling-words"],
  GAME_DEFINITIONS["word-rain"],
];

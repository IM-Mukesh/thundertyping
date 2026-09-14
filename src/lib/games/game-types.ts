// Both launch games are the same core mechanic — words descend, you clear
// them by typing them — tuned differently, so they share one engine
// (`use-falling-words.ts`) and differ only by the numbers below. Adding a
// third variant should mean adding a definition here, not a second engine.

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
  /** Lives lost one per word that reaches the floor. */
  lives: number;
  /** Milliseconds between spawns at the start, and the floor it ramps toward. */
  initialSpawnMs: number;
  minSpawnMs: number;
  /** Milliseconds shaved off the spawn interval per cleared word. */
  spawnRampPerClear: number;
  /** Milliseconds a word takes to fall at the start, and the floor it ramps toward. */
  initialFallMs: number;
  minFallMs: number;
  /** Milliseconds shaved off the fall time per cleared word. */
  fallRampPerClear: number;
  /**
   * Which number headlines the HUD and the score board. "words" rewards
   * clearing volume; "time" rewards staying alive, which is why Word Rain
   * gets a single life — surviving is the whole point of the mode.
   */
  scoreBy: "words" | "time";
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
    initialSpawnMs: 1700,
    minSpawnMs: 620,
    spawnRampPerClear: 20,
    initialFallMs: 9000,
    minFallMs: 3600,
    fallRampPerClear: 58,
    scoreBy: "words",
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
    initialSpawnMs: 1250,
    minSpawnMs: 400,
    spawnRampPerClear: 15,
    initialFallMs: 7600,
    minFallMs: 2700,
    fallRampPerClear: 46,
    scoreBy: "time",
  },
};

export const GAME_LIST: GameDefinition[] = [
  GAME_DEFINITIONS["falling-words"],
  GAME_DEFINITIONS["word-rain"],
];

export interface FallingWord {
  id: number;
  text: string;
  /** 0 = just spawned at the ceiling, 1 = reached the floor. */
  progress: number;
  /** Milliseconds this particular word takes to fall, fixed at spawn. */
  fallMs: number;
  /** Horizontal lane index, so words don't overlap each other. */
  lane: number;
}

export interface GameState {
  status: GameStatus;
  definition: GameDefinition;
  words: FallingWord[];
  /** What the player has typed toward the currently targeted word. */
  typed: string;
  /** The word the current keystrokes are committed to, once one matches. */
  lockedId: number | null;
  lives: number;
  score: number;
  cleared: number;
  missed: number;
  combo: number;
  bestCombo: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  elapsedMs: number;
}

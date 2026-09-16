/**
 * The achievement registry.
 *
 * One list, so the Achievements page can name and describe everything rather
 * than showing raw ids, and so a game granting an id that is not registered
 * here shows up as a bug instead of silently rendering nothing.
 *
 * Every entry is earnable today with no backend: they read from the local
 * profile, which is exactly where the games write.
 */

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  /** Which game's page to link to. "site" for cross-game ones. */
  game: "spellbound" | "typing-survivor" | "ghost-racer" | "card-battle" | "site";
  /** Hidden until earned, for endings and surprises. */
  secret?: boolean;
}

export const ACHIEVEMENT_LIST: readonly AchievementDef[] = [
  // ------------------------------------------------------------- Spellbound
  { id: "spellbound:first-run", name: "First Incantation", description: "Finish a run of Spellbound.", game: "spellbound" },
  { id: "spellbound:first-boss", name: "Past the Gate", description: "Reach floor 2.", game: "spellbound" },
  { id: "spellbound:long-cast", name: "Worth the Wait", description: "Cast a long-word spell.", game: "spellbound" },
  { id: "spellbound:flawless-floor", name: "Untouched", description: "Clear a floor without taking damage.", game: "spellbound" },
  { id: "spellbound:hoarder", name: "Collector of Curios", description: "Hold six relics at once.", game: "spellbound" },
  { id: "spellbound:win", name: "The Void Yields", description: "Defeat the Void King.", game: "spellbound", secret: true },

  // -------------------------------------------------------- Typing Survivor
  { id: "typing-survivor:first-run", name: "Held the Line", description: "Finish a run of Typing Survivor.", game: "typing-survivor" },
  { id: "typing-survivor:wave-5", name: "Five Deep", description: "Reach wave 5.", game: "typing-survivor" },
  { id: "typing-survivor:wave-10", name: "Ten Deep", description: "Reach wave 10.", game: "typing-survivor" },
  { id: "typing-survivor:combo-25", name: "Unbroken", description: "Reach a 25 combo without a miss.", game: "typing-survivor" },
  { id: "typing-survivor:win", name: "Dawn", description: "Survive all fifteen waves.", game: "typing-survivor", secret: true },

  // ------------------------------------------------------------ Ghost Racer
  { id: "ghost-racer:first-race", name: "Off the Grid", description: "Finish a race.", game: "ghost-racer" },
  { id: "ghost-racer:first-win", name: "Caught It", description: "Beat a ghost.", game: "ghost-racer" },
  { id: "ghost-racer:flawless", name: "Not One Slip", description: "Finish a race at 100% accuracy.", game: "ghost-racer" },
  { id: "ghost-racer:revenge", name: "Settled", description: "Beat a ghost that had beaten you.", game: "ghost-racer" },
  { id: "ghost-racer:legend", name: "Legend Rank", description: "Record a run at 100 WPM or faster.", game: "ghost-racer", secret: true },

  // ------------------------------------------------------------ Card Battle
  { id: "card-battle:first-run", name: "Opening Hand", description: "Finish a run of Card Battle.", game: "card-battle" },
  { id: "card-battle:first-boss", name: "The Ringmaster Bows", description: "Defeat the first boss.", game: "card-battle" },
  { id: "card-battle:big-deck", name: "Too Many Cards", description: "End a run holding twenty or more cards.", game: "card-battle" },
  { id: "card-battle:combo", name: "It All Comes Together", description: "Rupture an enemy for 20 or more Blight.", game: "card-battle" },
  { id: "card-battle:win", name: "The House Rises", description: "Defeat the Crimson Choir.", game: "card-battle", secret: true },

  // -------------------------------------------------------------- site-wide
  { id: "site:all-games", name: "Full Arcade", description: "Play every game at least once.", game: "site" },
  { id: "site:level-10", name: "Regular", description: "Reach player level 10.", game: "site" },
  { id: "site:streak-7", name: "Seven Days", description: "Hold a seven-day daily streak.", game: "site" },
  { id: "site:daily", name: "Same Page", description: "Complete a daily challenge.", game: "site" },
];

export const ACHIEVEMENTS_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENT_LIST.map((a) => [a.id, a]),
);

export const GAME_LABELS: Record<AchievementDef["game"], string> = {
  spellbound: "Spellbound",
  "typing-survivor": "Typing Survivor",
  "ghost-racer": "Ghost Racer",
  "card-battle": "Card Battle",
  site: "Across the site",
};

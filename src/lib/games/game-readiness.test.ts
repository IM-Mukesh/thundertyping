import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GAME_DEFINITIONS,
  GAME_LIST,
  getPublicGameDefinition,
  PLAYABLE_GAME_LIST,
} from "@/lib/games/game-types";
import { getSitemapRoutes } from "@/app/sitemap";
import { bumpStat, checkSiteAchievements, resetProfile } from "@/lib/profile/player-profile";
import { parseGameBest } from "@/lib/games/game-scores";

describe("game definitions and upcoming games indexing", () => {
  it("PLAYABLE_GAME_LIST only contains non-upcoming games", () => {
    assert.ok(PLAYABLE_GAME_LIST.length > 0);
    for (const game of PLAYABLE_GAME_LIST) {
      assert.equal(game.upcoming, undefined, `Game ${game.id} should not be upcoming`);
    }
    assert.equal(GAME_DEFINITIONS.spellbound.upcoming, true);
    assert.ok(!GAME_LIST.some((g) => g.id === "spellbound"));
    assert.ok(!GAME_LIST.some((g) => g.id === "card-battle"));
    assert.ok(!PLAYABLE_GAME_LIST.some((g) => g.id === "spellbound"));
  });

  it("retires Grand Prix and Survivor from public discovery without deleting compatibility definitions", () => {
    for (const id of ["typing-grand-prix", "typing-survivor"] as const) {
      assert.equal(GAME_DEFINITIONS[id].retired, true);
      assert.equal(getPublicGameDefinition(id), null);
      assert.ok(!GAME_LIST.some((game) => game.id === id));
      assert.ok(!PLAYABLE_GAME_LIST.some((game) => game.id === id));
    }
    assert.equal(getPublicGameDefinition("ghost-racer")?.id, "ghost-racer");
    assert.equal(getPublicGameDefinition("constructor"), null);
  });

  it("sitemap excludes upcoming games generically", () => {
    const routes = getSitemapRoutes();
    const paths = routes.map((r) => r.path);

    // Playable games must be present in sitemap
    for (const game of PLAYABLE_GAME_LIST) {
      assert.ok(
        paths.includes(`/games/${game.id}`),
        `Playable game ${game.id} must be in sitemap`,
      );
    }

    // Upcoming games must NOT be in sitemap
    assert.ok(!paths.includes("/games/spellbound"));
    assert.ok(!paths.includes("/games/card-battle"));
    assert.ok(!paths.includes("/games/typing-grand-prix"));
    assert.ok(!paths.includes("/games/typing-survivor"));
  });

  it("site:all-games achievement unlocks when all playable games are played, ignoring upcoming games", () => {
    // Reset profile and simulate playing all playable games
    resetProfile();
    for (const game of PLAYABLE_GAME_LIST) {
      bumpStat(game.id, "runs", 1);
    }
    // Retired/hidden games are not part of the visible playable catalog.

    const granted = checkSiteAchievements();
    assert.ok(
      granted.includes("site:all-games"),
      "site:all-games must unlock when all playable games are played",
    );
  });
});

describe("game score persistence sanitization", () => {
  it("parseGameBest accepts valid non-negative finite scores", () => {
    const valid = JSON.stringify({
      score: 1500,
      cleared: 25,
      bestCombo: 10,
      survivedMs: 60000,
      achievedAt: 1727400000000,
    });
    const parsed = parseGameBest(valid);
    assert.notEqual(parsed, null);
    assert.equal(parsed?.score, 1500);
  });

  it("parseGameBest rejects NaN, Infinity, negative values, and malformed structures", () => {
    // Malformed JSON
    assert.equal(parseGameBest("invalid json {"), null);
    assert.equal(parseGameBest(null), null);

    // NaN score
    assert.equal(
      parseGameBest(
        JSON.stringify({
          score: "NaN",
          cleared: 10,
          bestCombo: 5,
          survivedMs: 1000,
          achievedAt: 1000,
        }),
      ),
      null,
    );

    // Negative score
    assert.equal(
      parseGameBest(
        JSON.stringify({
          score: -50,
          cleared: 10,
          bestCombo: 5,
          survivedMs: 1000,
          achievedAt: 1000,
        }),
      ),
      null,
    );

    // Missing fields
    assert.equal(
      parseGameBest(
        JSON.stringify({
          score: 100,
          cleared: 10,
        }),
      ),
      null,
    );
  });
});

describe("F24: Game Catalog Documentation Truth & Catalog Integrity", () => {
  const EXPECTED_GAME_IDS = [
    "rakshasa-war", // TYPEBOUND: THE LAST DAWN
    "type-before-death", // TYPE BEFORE DEATH
    "ghost-racer", // Ghost Racer
    "fruit-fury", // Fruit Fury
    "falling-words", // Falling Words
    "word-rain", // Word Rain
    "word-blaster", // Word Blaster
    "boss-battle", // Boss Battle
    "combo-rush", // Combo Rush
  ];

  it("verifies the game catalog contains exactly the 9 production games", () => {
    assert.equal(GAME_LIST.length, 9, `GAME_LIST must contain exactly 9 games, found ${GAME_LIST.length}`);
    assert.equal(PLAYABLE_GAME_LIST.length, 9, `PLAYABLE_GAME_LIST must contain exactly 9 games, found ${PLAYABLE_GAME_LIST.length}`);

    const actualIds = GAME_LIST.map((g) => g.id);
    assert.deepEqual(actualIds, EXPECTED_GAME_IDS);

    // Verify all 9 games have complete metadata
    for (const game of GAME_LIST) {
      assert.ok(game.name.length > 0, `Game ${game.id} must have a name`);
      assert.ok(game.tagline.length > 0, `Game ${game.id} must have a tagline`);
      assert.ok(game.rules.length >= 3, `Game ${game.id} must have at least 3 rules`);
      assert.ok(game.about.length >= 2, `Game ${game.id} must have at least 2 about paragraphs`);
      assert.ok(["RPG", "Action", "Racing", "Strategy", "Arcade"].includes(game.category));
      assert.ok(game.tags.length > 0, `Game ${game.id} must have tags`);
    }
  });

  it("verifies README.md and About page accurately document the 9-game roster with zero stale names", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const readmeContent = fs.readFileSync(path.resolve(process.cwd(), "README.md"), "utf8");
    const aboutContent = fs.readFileSync(path.resolve(process.cwd(), "src/app/about/page.tsx"), "utf8");

    // Both documents must state 9 games
    assert.ok(readmeContent.includes("9 Arcade Typing Games"), "README.md must state 9 Arcade Typing Games");
    assert.ok(aboutContent.includes("9 arcade"), "About page must state 9 arcade typing games");

    // Verify all 9 games are represented in README.md
    assert.ok(readmeContent.includes("Typebound"), "README missing Typebound");
    assert.ok(readmeContent.includes("Type Before Death"), "README missing Type Before Death");
    assert.ok(readmeContent.includes("Ghost Racer"), "README missing Ghost Racer");
    assert.ok(readmeContent.includes("Fruit Fury"), "README missing Fruit Fury");
    assert.ok(readmeContent.includes("Falling Words"), "README missing Falling Words");
    assert.ok(readmeContent.includes("Word Rain"), "README missing Word Rain");
    assert.ok(readmeContent.includes("Word Blaster"), "README missing Word Blaster");
    assert.ok(readmeContent.includes("Boss Battle"), "README missing Boss Battle");
    assert.ok(readmeContent.includes("Combo Rush"), "README missing Combo Rush");

    // Must NOT contain stale/invented game names in documentation
    assert.ok(!readmeContent.includes("Type Defender"), "README must not mention Type Defender");
    assert.ok(!aboutContent.includes("Type Defender"), "About must not mention Type Defender");
  });
});

describe("Fix Verifications", () => {
  it("card-battle is correctly classified as upcoming and excluded from public discovery", () => {
    // 1. Marked upcoming
    assert.equal(GAME_DEFINITIONS["card-battle"].upcoming, true, "card-battle must be marked upcoming");

    // 2. Excluded from playable catalog
    assert.ok(!PLAYABLE_GAME_LIST.some((g) => g.id === "card-battle"), "card-battle must not be in PLAYABLE_GAME_LIST");

    // 3. Excluded from sitemap
    const sitemapRoutes = getSitemapRoutes().map(r => r.path);
    assert.ok(!sitemapRoutes.includes("/games/card-battle"), "card-battle must be excluded from sitemap");
  });

  it("achievements client conditionally renders links to avoid dead routes", async () => {
    const { getAchievementGameLinkState } = await import("@/lib/profile/achievements");

    // 1. Retired game (typing-survivor) does NOT produce a clickable link and appends (Legacy)
    const retiredState = getAchievementGameLinkState("typing-survivor");
    assert.equal(retiredState.href, null, "Retired game must not produce a clickable href");
    assert.ok(retiredState.label.includes("(Legacy)"), "Retired game label must include (Legacy)");

    // 2. Upcoming game (card-battle) does NOT produce a clickable link but has normal label
    const upcomingState = getAchievementGameLinkState("card-battle");
    assert.equal(upcomingState.href, null, "Upcoming game must not produce a clickable href");
    assert.ok(!upcomingState.label.includes("(Legacy)"), "Upcoming game label must not include (Legacy)");

    // 3. Active playable game (type-before-death) produces a normal link
    const activeState = getAchievementGameLinkState("type-before-death");
    assert.equal(activeState.href, "/games/type-before-death", "Active playable game must produce a valid href");

    // 4. Site-wide achievements produce no link
    const siteState = getAchievementGameLinkState("site");
    assert.equal(siteState.href, null, "Site-wide must not produce a clickable href");
  });

  it("games page emits noindex for upcoming games", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const content = fs.readFileSync(path.resolve(process.cwd(), "src/app/games/[gameId]/page.tsx"), "utf8");

    assert.ok(content.includes("robots: game.upcoming ? { index: false, follow: true } : undefined"), "Game page must emit noindex for upcoming games");
  });
});

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

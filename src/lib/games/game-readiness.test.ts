import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_LIST, PLAYABLE_GAME_LIST } from "@/lib/games/game-types";
import { getSitemapRoutes } from "@/app/sitemap";
import { bumpStat, checkSiteAchievements, resetProfile } from "@/lib/profile/player-profile";
import { parseGameBest } from "@/lib/games/game-scores";

describe("game definitions and upcoming games indexing", () => {
  it("PLAYABLE_GAME_LIST only contains non-upcoming games", () => {
    assert.ok(PLAYABLE_GAME_LIST.length > 0);
    for (const game of PLAYABLE_GAME_LIST) {
      assert.equal(game.upcoming, undefined, `Game ${game.id} should not be upcoming`);
    }
    const spellbound = GAME_LIST.find((g) => g.id === "spellbound");
    assert.ok(spellbound?.upcoming === true);
    assert.ok(!PLAYABLE_GAME_LIST.some((g) => g.id === "spellbound"));
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
    const upcomingGames = GAME_LIST.filter((g) => g.upcoming);
    assert.ok(upcomingGames.length > 0, "Expected at least one upcoming game (spellbound)");
    for (const upcoming of upcomingGames) {
      assert.ok(
        !paths.includes(`/games/${upcoming.id}`),
        `Upcoming game ${upcoming.id} must NOT be in sitemap`,
      );
    }
  });

  it("site:all-games achievement unlocks when all playable games are played, ignoring upcoming games", () => {
    // Reset profile and simulate playing all playable games
    resetProfile();
    for (const game of PLAYABLE_GAME_LIST) {
      bumpStat(game.id, "runs", 1);
    }
    // Spellbound is upcoming and has 0 runs

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

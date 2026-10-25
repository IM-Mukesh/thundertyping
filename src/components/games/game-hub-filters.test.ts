import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_LIST, type GameDefinition } from "@/lib/games/game-types";
import { setGameSearchQuery, clearGameSearchQuery } from "@/lib/games/game-search-store";

describe("Game Catalogue Filtering & Search Engine", () => {
  it("matches games by title case-insensitively", () => {
    const q = "death";
    const matches = GAME_LIST.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.tagline.toLowerCase().includes(q) ||
      g.tags.some((t) => t.toLowerCase().includes(q)),
    );

    assert.ok(matches.length >= 1, "Should find Type Before Death");
    assert.equal(matches[0].id, "type-before-death");
  });

  it("matches games by tagline or description terms", () => {
    const q = "breaking"; // From Falling Words tagline "The sky is breaking. Hold the line one word at a time."
    const matches = GAME_LIST.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.tagline.toLowerCase().includes(q) ||
      g.tags.some((t) => t.toLowerCase().includes(q)),
    );

    assert.ok(matches.some((g) => g.id === "falling-words"));
  });

  it("matches games by tags (e.g., 'boss', 'rpg', 'defense')", () => {
    const q = "boss";
    const matches = GAME_LIST.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.tagline.toLowerCase().includes(q) ||
      g.tags.some((t) => t.toLowerCase().includes(q)),
    );

    assert.ok(matches.length >= 1, "Should find games tagged with boss");
  });

  it("composes search query and category filter simultaneously", () => {
    // Search for "racer" within "Racing" category
    const category = "Racing";
    const q = "ghost";
    const matches = GAME_LIST.filter((g) => {
      if (g.category !== category) return false;
      return (
        g.name.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    assert.equal(matches.length, 1);
    assert.equal(matches[0].id, "ghost-racer");

    // Search for "racer" within "RPG" category -> 0 matches
    const rpgMatches = GAME_LIST.filter((g) => {
      if (g.category !== "RPG") return false;
      return (
        g.name.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    assert.equal(rpgMatches.length, 0);
  });

  it("sorts games by name alphabetically", () => {
    const list = [...GAME_LIST];
    list.sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < list.length - 1; i++) {
      assert.ok(
        list[i].name.localeCompare(list[i + 1].name) <= 0,
        `Expected ${list[i].name} <= ${list[i + 1].name}`,
      );
    }
  });

  it("sorts games by shortest duration correctly", () => {
    const mins = (g: GameDefinition) => parseInt(g.duration, 10) || 99;
    const list = [...GAME_LIST];
    list.sort((a, b) => mins(a) - mins(b));

    for (let i = 0; i < list.length - 1; i++) {
      assert.ok(mins(list[i]) <= mins(list[i + 1]));
    }
  });

  it("clearing query restores the full category list", () => {
    clearGameSearchQuery();
    let q = "";
    let matches = GAME_LIST.filter((g) => !q || g.name.toLowerCase().includes(q));
    assert.equal(matches.length, GAME_LIST.length);

    setGameSearchQuery("nonexistentgamename123");
    q = "nonexistentgamename123";
    matches = GAME_LIST.filter((g) => !q || g.name.toLowerCase().includes(q));
    assert.equal(matches.length, 0);

    clearGameSearchQuery();
    q = "";
    matches = GAME_LIST.filter((g) => !q || g.name.toLowerCase().includes(q));
    assert.equal(matches.length, GAME_LIST.length);
  });
});

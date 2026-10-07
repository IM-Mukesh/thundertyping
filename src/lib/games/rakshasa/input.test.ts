import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { warInputKey } from "@/lib/games/rakshasa/input";
import { GAME_DEFINITIONS, GAME_LIST, PLAYABLE_GAME_LIST } from "@/lib/games/game-types";
import { getSitemapRoutes } from "@/app/sitemap";

const event = (key: string, overrides = {}) => ({ key, repeat: false, ctrlKey: false, metaKey: false, altKey: false, isComposing: false, ...overrides });
describe("Typebound: The Last Dawn phase-one registration and input boundary", () => {
  it("keeps the requested catalog order and hides retired games", () => {
    const ids = GAME_LIST.map((g) => g.id);
    assert.deepEqual(ids, [
      "rakshasa-war",
      "type-before-death",
      "ghost-racer",
      "fruit-fury",
      "falling-words",
      "word-rain",
      "word-blaster",
      "boss-battle",
      "combo-rush",
    ]);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(PLAYABLE_GAME_LIST.map((g) => g.id), ids);
    assert.equal(GAME_DEFINITIONS["rakshasa-war"].name, "TYPEBOUND: THE LAST DAWN");
    assert.equal(GAME_DEFINITIONS["rakshasa-war"].tagline, "TYPE. FIGHT. SURVIVE.");
    assert.ok(!ids.includes("spellbound"));
    assert.ok(!ids.includes("card-battle"));
    assert.ok(!ids.includes("typing-grand-prix"));
    assert.ok(!ids.includes("typing-survivor"));
    // Keep definitions/components available for old saved results and direct
    // compatibility lookups even though both games leave the visible catalog.
    assert.equal(GAME_DEFINITIONS.spellbound.upcoming, true);
    assert.equal(GAME_DEFINITIONS["card-battle"].name, "Card Battle");
    assert.equal(GAME_DEFINITIONS["typing-grand-prix"].retired, true);
    assert.equal(GAME_DEFINITIONS["typing-survivor"].retired, true);
    assert.ok(getSitemapRoutes().some((r) => r.path === "/games/rakshasa-war"));
  });
  it("accepts physical characters, sentences, specials and lifecycle keys", () => {
    for (const key of ["a", "A", " ", ".", "'", "1", "2", "3", "Backspace", "Escape", "Tab"]) assert.notEqual(warInputKey(event(key)), null);
    assert.equal(warInputKey(event("A")), "a");
  });
  it("does not score key repeats, shortcuts, IME or unsupported keys", () => {
    for (const modifier of ["repeat", "ctrlKey", "metaKey", "altKey", "isComposing"]) assert.equal(warInputKey(event("a", { [modifier]: true })), null);
    for (const key of ["Enter", "F5", "Dead", "Process", "ArrowUp", "😊"]) assert.equal(warInputKey(event(key)), null);
  });
});

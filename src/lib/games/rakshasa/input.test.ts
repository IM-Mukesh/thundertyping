import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { warInputKey } from "@/lib/games/rakshasa/input";
import { GAME_DEFINITIONS, GAME_LIST, PLAYABLE_GAME_LIST } from "@/lib/games/game-types";
import { getSitemapRoutes } from "@/app/sitemap";

const event = (key: string, overrides = {}) => ({ key, repeat: false, ctrlKey: false, metaKey: false, altKey: false, isComposing: false, ...overrides });
describe("Typebound: The Last Dawn phase-one registration and input boundary", () => {
  it("registers one game while preserving all eleven previous entries", () => {
    assert.equal(GAME_LIST.length, 12);
    assert.equal(new Set(GAME_LIST.map((g) => g.id)).size, 12);
    assert.equal(PLAYABLE_GAME_LIST.length, 11);
    assert.equal(GAME_DEFINITIONS["rakshasa-war"].name, "TYPEBOUND: THE LAST DAWN");
    assert.equal(GAME_DEFINITIONS["rakshasa-war"].tagline, "TYPE. FIGHT. SURVIVE.");
    assert.equal(GAME_DEFINITIONS.spellbound.upcoming, true);
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

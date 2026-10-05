import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { GAME_LIST } from "@/lib/games/game-types";

const previous = readFileSync("supabase/migrations/20261004010000_atomic_game_settlement.sql", "utf8");
const forward = readFileSync("supabase/migrations/20261005010000_register_rakshasa_war.sql", "utf8");
const functionText = (sql: string) => sql.match(/CREATE(?: OR REPLACE)? FUNCTION public\.settle_game_run\([\s\S]*?\$\$;/)?.[0];

describe("prepared Typebound settlement registration (static contract, not PostgreSQL execution)", () => {
  it("extends only the allowed ID, preserving the complete atomic settlement body", () => {
    const normalized = functionText(forward)?.replace("CREATE OR REPLACE", "CREATE").replace(", 'rakshasa-war'", "");
    assert.ok(normalized);
    assert.equal(normalized, functionText(previous));
    const list = forward.match(/p_game_id NOT IN \(([^)]+)\)/)?.[1] ?? "";
    for (const game of GAME_LIST) assert.ok(list.includes(`'${game.id}'`), game.id);
  });
  it("preserves server-only grants and adds no schema or data edits", () => {
    assert.match(forward, /REVOKE ALL ON FUNCTION[^;]+FROM PUBLIC, anon, authenticated;/);
    assert.match(forward, /GRANT EXECUTE ON FUNCTION[^;]+TO service_role;/);
    assert.ok(forward.trim().endsWith("COMMIT;"));
    assert.doesNotMatch(forward, /ALTER TABLE|DROP |DELETE |UPDATE public\./);
  });
});

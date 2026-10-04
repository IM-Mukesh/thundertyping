import assert from "node:assert/strict";
import { test } from "node:test";
import { createRng } from "@/lib/rng/seeded-rng";
import { RELICS, SPELLS, MINIONS } from "@/lib/games/spellbound/content";
import { acquireSpellboundRelic, availableSpellboundRelics, settleSpellboundCombat, settleSpellboundDeath } from "@/lib/games/spellbound/transitions";
import type { SpellboundState } from "@/lib/games/spellbound/use-spellbound";

function run(overrides: Partial<SpellboundState> = {}): SpellboundState {
  return {
    phase: "combat", characterId: "apprentice", floor: 1, room: 0, map: [], roomKind: "combat",
    hp: 60, maxHp: 60, mana: 100, maxMana: 100, shield: 0, gold: 40, relics: [], spells: ["spark"],
    slots: [], typed: "", enemies: [{ uid: 1, def: MINIONS[0], hp: 0, maxHp: 30, windup: 1000, frozen: 0, hitFlash: 0 }],
    events: [], score: 0, combo: 0, bestCombo: 0, castCount: 0, elapsedMs: 1234, combatMs: 1200,
    offer: { spells: [], relics: [] }, event: null, voidRule: null, cleanFloor: true, message: null,
    telegraph: null, lastSpellId: null, repeatCount: 0, quickenMs: 0, hexMs: 0, hexTargetUid: null,
    ...overrides,
  };
}

test("Iron Will, Cursed Quill and Mana Engine apply identical acquisition effects in all sources", () => {
  for (const [id, expected] of [["iron-will", 80], ["cursed-quill", 45], ["mana-engine", 50]] as const) {
    for (const phase of ["reward", "shop", "event"] as const) {
      const initial = run({ phase });
      const result = acquireSpellboundRelic(initial, id);
      assert.equal(result.maxHp, expected);
      assert.equal(result.hp, expected);
      assert.deepEqual(result.relics, [id]);
      assert.equal(initial.maxHp, 60);
      assert.equal(acquireSpellboundRelic(result, id), result, "duplicate cannot reapply or consume an acquisition");
    }
  }
});

test("relic offers exclude every owned binary relic and terminate with an empty pool", () => {
  const owned = ["iron-will", "echo", "scholar"];
  const available = availableSpellboundRelics(owned);
  assert.equal(available.some((id) => owned.includes(id)), false);
  const reward = settleSpellboundCombat(run({ roomKind: "boss", relics: owned }), createRng("relics"));
  assert.equal(reward.offer.relics.some((id) => owned.includes(id)), false);
  assert.deepEqual(availableSpellboundRelics(RELICS.map((r) => r.id)), []);
});

test("zero-health drain/reflection settlement defeats even after the last enemy dies", () => {
  for (const voidRule of [null, "drain"] as const) {
    const initial = run({ hp: 0, voidRule, roomKind: "boss" });
    const result = settleSpellboundCombat(initial, createRng("lethal"));
    assert.equal(result.phase, "defeat");
    assert.equal(result.gold, initial.gold);
    assert.deepEqual(result.offer, initial.offer);
    assert.equal(acquireSpellboundRelic(result, "iron-will"), result, "a reward cannot resurrect the player");
    assert.equal(settleSpellboundDeath({ ...initial, phase: "victory" }).phase, "defeat");
  }
});

test("living combat clears once; repeated settlement never rerolls or pays twice", () => {
  const result = settleSpellboundCombat(run(), createRng("clear"));
  assert.equal(result.phase, "reward");
  assert.equal(result.gold, 64);
  assert.equal(result.offer.spells.length, 3);
  assert.equal(settleSpellboundCombat(result, createRng("again")), result);
});

test("shipped descriptions match shielding and Iron Will's implemented tradeoff", () => {
  assert.equal(Object.values(SPELLS).some((s) => /interrupt/i.test(s.desc)), false);
  assert.equal(RELICS.some((r) => /interrupt/i.test(r.effect)), false);
  assert.match(RELICS.find((r) => r.id === "iron-will")!.effect, /20.*health.*15%/);
});

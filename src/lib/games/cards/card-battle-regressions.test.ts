import assert from "node:assert/strict";
import { test } from "node:test";
import { createRng } from "@/lib/rng/seeded-rng";
import { ENEMIES } from "@/lib/games/cards/encounters";
import { emptyStatuses, type Intent } from "@/lib/games/cards/model";
import { pickEnemyIntent, resolveCardEnemyTurn, settleCardCombat } from "@/lib/games/cards/transitions";
import type { CardBattleState, EnemyState } from "@/lib/games/cards/use-card-battle";

const wait: Intent = { key: "wait", label: "Wait", kind: "block", description: "Wait" };
function enemy(intent = wait): EnemyState {
  return { uid: "enemy", def: ENEMIES.brawler, hp: 100, maxHp: 100, block: 0,
    statuses: emptyStatuses(), intent, hitFlash: 0 };
}
function battle(overrides: Partial<CardBattleState> = {}): CardBattleState {
  return {
    phase: "combat", elapsedMs: 1234, deckId: "test", floor: 1, node: 0,
    hp: 70, maxHp: 70, block: 0, energy: 3, maxEnergy: 3, statuses: emptyStatuses(),
    retainBlock: false, nextFree: false, draw: Array.from({ length: 10 }, (_, i) =>
      ({ uid: `c${i}`, id: "strike", upgraded: false })),
    hand: [], discard: [], exhausted: [], deck: [], enemies: [enemy()], minions: [], focus: "enemy",
    typed: "", cardsPlayedThisTurn: 0, lastPlayedId: null, turn: 1, gold: 50, score: 0,
    offer: [], log: [], banner: null, ...overrides,
  };
}

test("enemy block survives its intent and expires only on its following action", () => {
  const before = battle({ enemies: [enemy(ENEMIES.brawler.intents[1])] });
  before.enemies[0].block = 30;
  const next = resolveCardEnemyTurn(before, createRng("block")).state;
  assert.equal(next.enemies[0].block, 9);
  assert.equal(before.enemies[0].block, 30, "input snapshot remains untouched");
  next.enemies[0].intent = wait;
  assert.equal(resolveCardEnemyTurn(next, createRng("block")).state.enemies[0].block, 0);
});

test("player Blight bypasses block, decays, and is fatal before enemies act", () => {
  const before = battle({ statuses: { ...emptyStatuses(), blight: 3 }, block: 40 });
  const result = resolveCardEnemyTurn(before, createRng("blight"));
  assert.equal(result.state.hp, 67);
  assert.equal(result.state.statuses.blight, 2);
  const lethal = resolveCardEnemyTurn({ ...before, hp: 3 }, createRng("blight"));
  assert.equal(lethal.state.phase, "defeat");
  assert.equal(lethal.state.turn, 1);
});

test("enemy Encore and player Exposure apply to every incoming hit before block", () => {
  const e = enemy({ ...wait, kind: "attack", damage: 10, hits: 2 });
  e.statuses.encore = 5;
  const result = resolveCardEnemyTurn(battle({ enemies: [e], block: 10,
    statuses: { ...emptyStatuses(), exposure: 3 } }), createRng("damage"));
  assert.equal(result.state.hp, 34); // round(15 * 1.5) twice, minus 10 block
  assert.equal(result.state.statuses.exposure, 2);
});

test("boss pattern progresses Bow → Crack → Build → Flourish without skipping", () => {
  const rng = createRng("boss");
  let s = battle({ hp: 1000, maxHp: 1000, enemies: [{ ...enemy(), def: ENEMIES.ringmaster,
    intent: pickEnemyIntent(ENEMIES.ringmaster, 0, rng) }] });
  const intents = [s.enemies[0].intent.key];
  for (let i = 0; i < 4; i++) {
    s = resolveCardEnemyTurn(s, rng).state;
    intents.push(s.enemies[0].intent.key);
  }
  assert.deepEqual(intents, ["bow", "crack", "build", "flourish", "bow"]);
});

test("Collector Confiscate removes one card from the new hand deterministically", () => {
  const before = battle({ enemies: [enemy(ENEMIES.collector.intents[1])] });
  const result = resolveCardEnemyTurn(before, createRng("confiscate")).state;
  assert.equal(result.hand.length, 4);
  assert.equal(result.discard.length, 1);
  assert.equal(result.hand.some((c) => c.uid === result.discard[0].uid), false);
  assert.deepEqual(result, resolveCardEnemyTurn(before, createRng("confiscate")).state);
});

test("direct, poison, minion and Ward clears receive the same single fight bonus", () => {
  const dead = { ...enemy(), hp: 0 };
  const direct = settleCardCombat(battle({ enemies: [dead] }), createRng("reward"));
  const minion = resolveCardEnemyTurn(battle({ enemies: [dead] }), createRng("reward")).state;
  const poisonEnemy = enemy();
  poisonEnemy.hp = 2;
  poisonEnemy.statuses.blight = 2;
  const poison = resolveCardEnemyTurn(battle({ enemies: [poisonEnemy] }), createRng("reward")).state;
  const wardEnemy = enemy({ ...wait, damage: 1, hits: 5 });
  wardEnemy.hp = 2;
  const ward = resolveCardEnemyTurn(battle({ enemies: [wardEnemy],
    statuses: { ...emptyStatuses(), ward: 2 } }), createRng("reward"));
  for (const result of [direct, minion, poison, ward.state]) {
    assert.equal(result.phase, "reward");
    assert.equal(result.score, 60);
    assert.equal(result.gold, 85);
    assert.deepEqual(result.offer, direct.offer);
    assert.equal(settleCardCombat(result, createRng("again")), result);
  }
  assert.equal(ward.events.filter((e) => e.kind === "kill").length, 1);
  assert.equal(ward.state.hp, 69, "dead attacker cannot continue a multihit");
});

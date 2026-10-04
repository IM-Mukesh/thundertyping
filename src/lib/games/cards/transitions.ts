import type { Rng } from "@/lib/rng/seeded-rng";
import type { CardBattleState } from "@/lib/games/cards/use-card-battle";
import type { EnemyDef } from "@/lib/games/cards/encounters";
import type { Intent } from "@/lib/games/cards/model";
import { REWARD_POOL } from "@/lib/games/cards/cards";

export type TurnEvent = { kind: "damage"; amount: number } | { kind: "kill" };

export function pickEnemyIntent(def: EnemyDef, index: number, rng: Rng): Intent {
  return def.pattern?.length
    ? def.intents[def.pattern[index % def.pattern.length]] ?? def.intents[0]
    : rng.pick(def.intents);
}

/** Mutates only the caller's new snapshot; piles are always replaced. */
export function drawCardHand(s: CardBattleState, count: number, rng: Rng) {
  for (let i = 0; i < count; i++) {
    if (s.draw.length === 0) {
      s.draw = rng.shuffle([...s.discard]);
      s.discard = [];
    }
    if (!s.draw.length) break;
    const [card, ...rest] = s.draw;
    s.draw = rest;
    s.hand = [...s.hand, card];
  }
}

/** Shared settlement for direct attacks, minions, Ward and Blight. Death wins ties. */
export function settleCardCombat(state: CardBattleState, rng: Rng): CardBattleState {
  if (state.phase !== "combat") return state;
  if (state.hp <= 0) return { ...state, phase: "defeat" };
  if (!state.enemies.length || state.enemies.some((e) => e.hp > 0)) return state;
  return {
    ...state,
    gold: state.gold + 25 + state.floor * 10,
    score: state.score + 60,
    phase: "reward",
    typed: "",
    offer: rng.sample(REWARD_POOL.map((c) => c.id), 3),
  };
}

/**
 * After player minions: player Blight, enemies (old block expires when each
 * starts acting), enemy Blight/status decay, settlement, then the next hand.
 * Confiscate discards one random card from that NEW hand, not the spent hand.
 * Fresh enemy block therefore protects against the entire next player turn.
 */
export function resolveCardEnemyTurn(prev: CardBattleState, rng: Rng) {
  const events: TurnEvent[] = [];
  if (prev.phase !== "combat") return { state: prev, events };
  let s: CardBattleState = {
    ...prev,
    statuses: { ...prev.statuses },
    enemies: prev.enemies.map((e) => ({ ...e, statuses: { ...e.statuses } })),
  };
  if (s.statuses.blight > 0) {
    const amount = s.statuses.blight;
    s.hp = Math.max(0, s.hp - amount);
    s.statuses.blight -= 1;
    events.push({ kind: "damage", amount });
  }
  s = settleCardCombat(s, rng);
  if (s.phase !== "combat") return { state: s, events };

  let discards = 0;
  for (const e of s.enemies) {
    if (e.hp <= 0 || s.hp <= 0) continue;
    e.block = 0;
    const it = e.intent;
    if (it.damage) {
      for (let h = 0; h < (it.hits ?? 1) && e.hp > 0 && s.hp > 0; h++) {
        let damage = it.damage + e.statuses.encore;
        if (s.statuses.exposure > 0) damage = Math.round(damage * 1.5);
        if (e.statuses.hush > 0) damage = Math.round(damage * 0.75);
        const absorbed = Math.min(s.block, damage);
        s.block -= absorbed;
        const through = damage - absorbed;
        if (through > 0) {
          s.hp = Math.max(0, s.hp - through);
          events.push({ kind: "damage", amount: through });
        }
        if (s.statuses.ward > 0) {
          e.hp = Math.max(0, e.hp - s.statuses.ward);
          e.hitFlash = 200;
          if (e.hp === 0) events.push({ kind: "kill" });
        }
      }
    }
    if (e.hp <= 0 || s.hp <= 0) continue;
    if (it.block) e.block += it.block + e.statuses.poise;
    if (it.status) s.statuses[it.status.key] += it.status.amount;
    if (it.selfStatus) e.statuses[it.selfStatus.key] += it.selfStatus.amount;
    if (it.special === "discard") discards += 1;
  }

  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    if (e.statuses.blight > 0) {
      e.hp = Math.max(0, e.hp - e.statuses.blight);
      e.statuses.blight -= 1;
      if (e.hp === 0) events.push({ kind: "kill" });
    }
    e.statuses.exposure = Math.max(0, e.statuses.exposure - 1);
    e.statuses.hush = Math.max(0, e.statuses.hush - 1);
  }
  s.statuses.exposure = Math.max(0, s.statuses.exposure - 1);
  s.statuses.hush = Math.max(0, s.statuses.hush - 1);
  s = settleCardCombat(s, rng);
  if (s.phase !== "combat") return { state: s, events };

  s.turn += 1;
  if (!s.retainBlock) s.block = 0;
  s.retainBlock = false;
  s.energy = s.maxEnergy;
  s.cardsPlayedThisTurn = 0;
  s.lastPlayedId = null;
  s.typed = "";
  s.enemies = s.enemies.map((e) => e.hp > 0
    ? { ...e, intent: pickEnemyIntent(e.def, s.turn - 1, rng), hitFlash: 0 }
    : e);
  if (!s.enemies.some((e) => e.uid === s.focus && e.hp > 0)) {
    s.focus = s.enemies.find((e) => e.hp > 0)?.uid ?? null;
  }
  drawCardHand(s, 5, rng);
  for (let i = 0; i < discards && s.hand.length; i++) {
    const index = rng.int(0, s.hand.length - 1);
    s.discard = [...s.discard, s.hand[index]];
    s.hand = s.hand.filter((_, j) => j !== index);
  }
  return { state: s, events };
}

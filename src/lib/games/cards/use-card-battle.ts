"use client";

/**
 * Card Battle's engine.
 *
 * Turn-based, so there is no clock forcing a decision — the interesting choice
 * is which cards and in what order, and typing is how you commit to one. That
 * makes it the mode where accuracy matters most and speed matters least, which
 * is deliberate: it is the way in for a slower typist who wants the strategy.
 *
 * Every op resolves through one `applyOp` switch. Adding a card means adding
 * data, not a new branch anywhere else.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRng, type Rng } from "@/lib/rng/seeded-rng";
import {
  emptyStatuses,
  faceOf,
  type CardDef,
  type CardInstance,
  type Intent,
  type Minion,
  type Op,
  type StatusKey,
  type Statuses,
} from "@/lib/games/cards/model";
import { CARDS_BY_ID, REWARD_POOL, STARTER_DECKS } from "@/lib/games/cards/cards";
import { ENCOUNTERS, type EnemyDef } from "@/lib/games/cards/encounters";

const HAND_SIZE = 5;
const BASE_ENERGY = 3;

export type Phase =
  | "select"
  | "combat"
  | "reward"
  | "map"
  | "shop"
  | "event"
  | "victory"
  | "defeat";

export interface EnemyState {
  uid: string;
  def: EnemyDef;
  hp: number;
  maxHp: number;
  block: number;
  statuses: Statuses;
  intent: Intent;
  hitFlash: number;
}

export interface CardBattleState {
  phase: Phase;
  deckId: string;
  floor: number;
  node: number;

  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  maxEnergy: number;
  statuses: Statuses;
  retainBlock: boolean;
  nextFree: boolean;

  draw: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  exhausted: CardInstance[];
  deck: CardInstance[];

  enemies: EnemyState[];
  minions: Minion[];
  focus: string | null;
  typed: string;

  cardsPlayedThisTurn: number;
  lastPlayedId: string | null;
  turn: number;
  gold: number;
  score: number;
  offer: string[];
  log: string[];
  banner: string | null;
}

export interface CardBattleCallbacks {
  onPlay?: (card: CardDef, upgraded: boolean) => void;
  onDamage?: (amount: number, toEnemy: boolean) => void;
  onKill?: () => void;
  onPhase?: (phase: Phase) => void;
  onMiss?: () => void;
}

let uidCounter = 1;
function instance(id: string, upgraded = false): CardInstance {
  return { uid: `c${uidCounter++}`, id: id, upgraded };
}

function clampStatuses(s: Statuses): Statuses {
  const out = { ...s };
  for (const k of Object.keys(out) as StatusKey[]) {
    out[k] = Math.max(0, Math.round(out[k]));
  }
  return out;
}

export function useCardBattle(seed?: string, cb: CardBattleCallbacks = {}) {
  const seedRef = useRef(seed ?? `${Date.now()}`);
  const rngRef = useRef<Rng>(createRng(seedRef.current));
  const cbRef = useRef(cb);
  cbRef.current = cb;

  const [state, setState] = useState<CardBattleState>(() => initial());

  function initial(): CardBattleState {
    return {
      phase: "select",
      deckId: STARTER_DECKS[0].id,
      floor: 1,
      node: 0,
      hp: 70,
      maxHp: 70,
      block: 0,
      energy: BASE_ENERGY,
      maxEnergy: BASE_ENERGY,
      statuses: emptyStatuses(),
      retainBlock: false,
      nextFree: false,
      draw: [],
      hand: [],
      discard: [],
      exhausted: [],
      deck: [],
      enemies: [],
      minions: [],
      focus: null,
      typed: "",
      cardsPlayedThisTurn: 0,
      lastPlayedId: null,
      turn: 1,
      gold: 0,
      score: 0,
      offer: [],
      log: [],
      banner: null,
    };
  }

  // ---------------------------------------------------------------- helpers
  const shuffleInto = useCallback((s: CardBattleState) => {
    const rng = rngRef.current;
    s.draw = rng.shuffle([...s.draw, ...s.discard]);
    s.discard = [];
  }, []);

  const drawCards = useCallback(
    (s: CardBattleState, n: number) => {
      for (let i = 0; i < n; i++) {
        if (s.draw.length === 0) shuffleInto(s);
        if (s.draw.length === 0) return; // genuinely out of cards
        const [card, ...rest] = s.draw;
        s.draw = rest;
        s.hand = [...s.hand, card];
      }
    },
    [shuffleInto],
  );

  const pickIntent = useCallback((def: EnemyDef, turn: number, rng: Rng): Intent => {
    // Fixed pattern first if the enemy has one, so a boss reads as deliberate
    // rather than random; otherwise weighted choice.
    if (def.pattern && def.pattern.length > 0) {
      return def.intents[def.pattern[turn % def.pattern.length]] ?? def.intents[0];
    }
    return rng.pick(def.intents);
  }, []);

  const startCombat = useCallback(
    (s: CardBattleState, enemies: EnemyDef[]) => {
      const rng = rngRef.current;
      s.enemies = enemies.map((def, i) => ({
        uid: `e${i}-${def.id}`,
        def,
        hp: def.hp,
        maxHp: def.hp,
        block: 0,
        statuses: emptyStatuses(),
        intent: pickIntent(def, 0, rng),
        hitFlash: 0,
      }));
      s.focus = s.enemies[0]?.uid ?? null;
      s.minions = [];
      s.turn = 1;
      s.block = 0;
      s.statuses = emptyStatuses();
      s.energy = s.maxEnergy;
      s.cardsPlayedThisTurn = 0;
      s.lastPlayedId = null;
      s.draw = rng.shuffle([...s.deck]);
      s.hand = [];
      s.discard = [];
      s.exhausted = [];
      drawCards(s, HAND_SIZE);
      s.phase = "combat";
    },
    [drawCards, pickIntent],
  );

  // ------------------------------------------------------------- op resolver
  const applyOp = useCallback(
    (s: CardBattleState, op: Op, targetUid: string | null): void => {
      const target = () => s.enemies.find((e) => e.uid === targetUid && e.hp > 0);

      const dealTo = (e: EnemyState, raw: number, pierce?: boolean) => {
        let amount = raw;
        // Encore adds to every hit; Exposure makes the target take more.
        amount += s.statuses.encore;
        if (e.statuses.exposure > 0) amount = Math.round(amount * 1.5);
        if (s.statuses.hush > 0) amount = Math.round(amount * 0.75);
        amount = Math.max(0, Math.round(amount));
        if (!pierce) {
          const absorbed = Math.min(e.block, amount);
          e.block -= absorbed;
          amount -= absorbed;
        }
        const before = e.hp;
        e.hp = Math.max(0, e.hp - amount);
        e.hitFlash = 220;
        if (amount > 0) cbRef.current.onDamage?.(amount, true);
        if (before > 0 && e.hp === 0) cbRef.current.onKill?.();
      };

      switch (op.k) {
        case "damage": {
          let amount = op.amount;
          if (op.scale) {
            const src =
              op.scale.per === "block"
                ? s.block
                : op.scale.per === "cardsPlayed"
                  ? s.cardsPlayedThisTurn
                  : op.scale.per === "handSize"
                    ? s.hand.length
                    : op.scale.per === "crescendo"
                      ? s.statuses.crescendo
                      : op.scale.per === "blight"
                        ? (target()?.statuses.blight ?? 0)
                        : op.scale.per === "intentDamage"
                          ? (target()?.intent.damage ?? 0)
                          : 0;
            amount += Math.round(src * op.scale.mult);
          }
          const hits = op.hits ?? 1;
          const victims = op.all ? s.enemies.filter((e) => e.hp > 0) : [target()].filter(Boolean);
          for (let h = 0; h < hits; h++) {
            for (const v of victims) if (v) dealTo(v, amount, op.pierce);
          }
          break;
        }
        case "block": {
          let amount = op.amount;
          if (op.scale && op.scale.per === "cardsPlayed") {
            amount += Math.round(s.cardsPlayedThisTurn * op.scale.mult);
          }
          // Poise increases every block gain -- this is the whole archetype.
          s.block += amount + s.statuses.poise;
          break;
        }
        case "heal":
          s.hp = Math.min(s.maxHp, s.hp + op.amount);
          break;
        case "loseHp":
          s.hp = Math.max(1, s.hp - op.amount);
          break;
        case "status": {
          if (op.target === "self") {
            s.statuses = clampStatuses({
              ...s.statuses,
              [op.status]: s.statuses[op.status] + op.amount,
            });
          } else if (op.target === "allEnemies") {
            s.enemies = s.enemies.map((e) =>
              e.hp > 0
                ? { ...e, statuses: clampStatuses({ ...e.statuses, [op.status]: e.statuses[op.status] + op.amount }) }
                : e,
            );
          } else {
            const t = target();
            if (t) t.statuses = clampStatuses({ ...t.statuses, [op.status]: t.statuses[op.status] + op.amount });
          }
          break;
        }
        case "cleanse":
          s.statuses = { ...s.statuses, [op.status]: 0 };
          break;
        case "draw":
          drawCards(s, op.amount);
          break;
        case "energy":
          s.energy += op.amount;
          break;
        case "doubleBlight": {
          const t = target();
          if (t) t.statuses = { ...t.statuses, blight: t.statuses.blight * 2 };
          break;
        }
        case "burstBlight": {
          const t = target();
          if (t) {
            const b = t.statuses.blight;
            if (b > 0) {
              dealTo(t, b, true);
              t.statuses = { ...t.statuses, blight: 0 };
            }
          }
          break;
        }
        case "sporesPerCard": {
          const add = op.amount * Math.max(1, s.cardsPlayedThisTurn);
          s.enemies = s.enemies.map((e) =>
            e.hp > 0 ? { ...e, statuses: { ...e.statuses, blight: e.statuses.blight + add } } : e,
          );
          break;
        }
        case "summon": {
          const spec = op.spec;
          for (let i = 0; i < spec.count; i++) {
            s.minions = [
              ...s.minions,
              {
                uid: `m${uidCounter++}`,
                sprite: spec.sprite,
                name: spec.name,
                atk: spec.atk,
                block: spec.block,
                draw: spec.draw,
                turns: spec.turns,
              },
            ];
          }
          break;
        }
        case "exhaustHand": {
          const n = s.hand.length;
          s.exhausted = [...s.exhausted, ...s.hand];
          s.hand = [];
          s.block += n * op.blockPer + s.statuses.poise;
          break;
        }
        case "mirrorIntent": {
          const t = target();
          if (t?.intent.damage) {
            dealTo(t, Math.round(t.intent.damage * op.mult));
          }
          break;
        }
        case "replayLast": {
          if (s.lastPlayedId) {
            const def = CARDS_BY_ID[s.lastPlayedId];
            if (def) {
              // Guard against a Reprise replaying a Reprise forever.
              const face = faceOf(def, false);
              if (def.id !== "reprise") {
                for (const inner of face.ops) applyOp(s, inner, targetUid);
              }
            }
          }
          break;
        }
        case "nextCardFree":
          s.nextFree = true;
          break;
        case "retainBlock":
          s.retainBlock = true;
          break;
        case "discardRandom": {
          const rng = rngRef.current;
          for (let i = 0; i < op.amount && s.hand.length > 0; i++) {
            const idx = rng.int(0, s.hand.length - 1);
            s.discard = [...s.discard, s.hand[idx]];
            s.hand = s.hand.filter((_, j) => j !== idx);
          }
          break;
        }
        case "ifCardsPlayed":
          if (s.cardsPlayedThisTurn >= op.atLeast) {
            for (const inner of op.then) applyOp(s, inner, targetUid);
          }
          break;
        case "reprise":
        case "ritesEncore":
        case "vigil":
          // Reserved ops from the model that no shipped card uses. Deliberately
          // inert rather than guessed at: a card whose text promises one thing
          // and does another is worse than one that does not exist.
          break;
      }
    },
    [drawCards],
  );

  // ------------------------------------------------------------- play a card
  const playCard = useCallback(
    (uid: string) => {
      setState((prev) => {
        if (prev.phase !== "combat") return prev;
        const s: CardBattleState = {
          ...prev,
          statuses: { ...prev.statuses },
          enemies: prev.enemies.map((e) => ({ ...e, statuses: { ...e.statuses } })),
        };
        const idx = s.hand.findIndex((c) => c.uid === uid);
        if (idx < 0) return prev;
        const inst = s.hand[idx];
        const def = CARDS_BY_ID[inst.id];
        if (!def) return prev;
        const face = faceOf(def, inst.upgraded);

        // Overture's discount is a property of the card, applied here so the
        // displayed cost and the charged cost cannot disagree.
        let cost = face.cost;
        if (def.id === "overture" && s.cardsPlayedThisTurn >= 3) cost = Math.max(0, cost - 1);
        if (s.nextFree) cost = 0;

        if (s.energy < cost) {
          s.banner = "Not enough energy";
          return s;
        }

        s.energy -= cost;
        if (s.nextFree) s.nextFree = false;
        s.hand = s.hand.filter((_, i) => i !== idx);

        // Crescendo is spent by the card that reads it, and only by that card.
        let crescendoMult = 1;
        if (def.spendsCrescendo && s.statuses.crescendo > 0) {
          crescendoMult = 1 + 0.3 * s.statuses.crescendo;
          s.statuses = { ...s.statuses, crescendo: 0 };
        }

        for (const op of face.ops) {
          const scaled: Op =
            crescendoMult !== 1 && op.k === "damage"
              ? { ...op, amount: Math.round(op.amount * crescendoMult) }
              : op;
          applyOp(s, scaled, s.focus);
        }

        if (face.exhaust) s.exhausted = [...s.exhausted, inst];
        else s.discard = [...s.discard, inst];

        s.cardsPlayedThisTurn += 1;
        s.lastPlayedId = def.id;
        s.typed = "";
        s.score += 5;
        cbRef.current.onPlay?.(def, inst.upgraded);

        // focus moves off a corpse so the next card has a live target
        if (!s.enemies.some((e) => e.uid === s.focus && e.hp > 0)) {
          s.focus = s.enemies.find((e) => e.hp > 0)?.uid ?? null;
        }

        if (s.enemies.every((e) => e.hp <= 0)) {
          s.gold += 25 + s.floor * 10;
          s.score += 60;
          s.phase = "reward";
          s.offer = rngRef.current.sample(REWARD_POOL.map((c) => c.id), 3);
          cbRef.current.onPhase?.("reward");
        }
        return s;
      });
    },
    [applyOp],
  );

  // ------------------------------------------------------------- end of turn
  const endTurn = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== "combat") return prev;
      const s: CardBattleState = {
        ...prev,
        statuses: { ...prev.statuses },
        enemies: prev.enemies.map((e) => ({ ...e, statuses: { ...e.statuses } })),
      };
      const rng = rngRef.current;

      // discard the hand
      s.discard = [...s.discard, ...s.hand];
      s.hand = [];

      // minions act, then age out
      for (const m of s.minions) {
        if (m.atk > 0) {
          const t = s.enemies.find((e) => e.hp > 0);
          if (t) applyOp(s, { k: "damage", amount: m.atk }, t.uid);
        }
        if (m.block > 0) s.block += m.block;
        if (m.draw > 0) drawCards(s, m.draw);
      }
      s.minions = s.minions.map((m) => ({ ...m, turns: m.turns - 1 })).filter((m) => m.turns > 0);

      // enemies act
      for (const e of s.enemies) {
        if (e.hp <= 0) continue;
        const it = e.intent;
        if (it.damage) {
          const hits = it.hits ?? 1;
          for (let h = 0; h < hits; h++) {
            let dmg = it.damage;
            if (e.statuses.hush > 0) dmg = Math.round(dmg * 0.75);
            const absorbed = Math.min(s.block, dmg);
            s.block -= absorbed;
            const through = dmg - absorbed;
            if (through > 0) {
              s.hp = Math.max(0, s.hp - through);
              cbRef.current.onDamage?.(through, false);
            }
            // Ward punishes the attacker on every hit that lands.
            if (s.statuses.ward > 0) {
              e.hp = Math.max(0, e.hp - s.statuses.ward);
              e.hitFlash = 200;
            }
          }
        }
        if (it.block) e.block += it.block;
        if (it.status) {
          s.statuses = clampStatuses({
            ...s.statuses,
            [it.status.key]: s.statuses[it.status.key] + it.status.amount,
          });
        }
        if (it.selfStatus) {
          e.statuses = clampStatuses({
            ...e.statuses,
            [it.selfStatus.key]: e.statuses[it.selfStatus.key] + it.selfStatus.amount,
          });
        }
      }

      // blight ticks on enemies, then decays
      for (const e of s.enemies) {
        if (e.hp <= 0) continue;
        if (e.statuses.blight > 0) {
          e.hp = Math.max(0, e.hp - e.statuses.blight);
          e.statuses = { ...e.statuses, blight: e.statuses.blight - 1 };
          if (e.hp === 0) cbRef.current.onKill?.();
        }
        // exposure and hush wear off
        e.statuses = clampStatuses({
          ...e.statuses,
          exposure: Math.max(0, e.statuses.exposure - 1),
          hush: Math.max(0, e.statuses.hush - 1),
        });
      }
      s.statuses = clampStatuses({
        ...s.statuses,
        exposure: Math.max(0, s.statuses.exposure - 1),
        hush: Math.max(0, s.statuses.hush - 1),
      });

      if (s.hp <= 0) {
        s.phase = "defeat";
        cbRef.current.onPhase?.("defeat");
        return s;
      }
      if (s.enemies.every((e) => e.hp <= 0)) {
        s.gold += 25 + s.floor * 10;
        s.phase = "reward";
        s.offer = rng.sample(REWARD_POOL.map((c) => c.id), 3);
        cbRef.current.onPhase?.("reward");
        return s;
      }

      // next turn
      s.turn += 1;
      if (!s.retainBlock) s.block = 0;
      s.retainBlock = false;
      s.energy = s.maxEnergy;
      s.cardsPlayedThisTurn = 0;
      s.lastPlayedId = null;
      s.enemies = s.enemies.map((e) =>
        e.hp > 0 ? { ...e, block: 0, intent: pickIntent(e.def, s.turn, rng), hitFlash: 0 } : e,
      );
      drawCards(s, HAND_SIZE);
      return s;
    });
  }, [applyOp, drawCards, pickIntent]);

  // -------------------------------------------------------------- typing in
  const setTyped = useCallback(
    (value: string) => {
      setState((prev) => {
        if (prev.phase !== "combat") return prev;
        const lower = value.toLowerCase().replace(/[^a-z]/g, "");
        if (lower === "") return { ...prev, typed: "" };

        const playable = prev.hand.filter((c) =>
          CARDS_BY_ID[c.id]?.word.startsWith(lower),
        );
        if (playable.length === 0) {
          cbRef.current.onMiss?.();
          return { ...prev, typed: "" };
        }
        const exact = playable.find((c) => CARDS_BY_ID[c.id].word === lower);
        if (exact) {
          queueMicrotask(() => playCard(exact.uid));
          return { ...prev, typed: "" };
        }
        return { ...prev, typed: lower };
      });
    },
    [playCard],
  );

  // ----------------------------------------------------------------- run flow
  const start = useCallback(
    (deckId: string, runSeed?: string) => {
      const sd = runSeed ?? `${Date.now()}`;
      seedRef.current = sd;
      rngRef.current = createRng(sd);
      const archetype = STARTER_DECKS.find((d) => d.id === deckId) ?? STARTER_DECKS[0];
      setState(() => {
        const s = initial();
        s.deckId = deckId;
        s.deck = archetype.cards.map((id) => instance(id));
        s.gold = 50;
        startCombat(s, ENCOUNTERS[0].enemies);
        return s;
      });
      cbRef.current.onPhase?.("combat");
    },
    [startCombat],
  );

  const takeReward = useCallback(
    (cardId: string | null) => {
      setState((prev) => {
        const s: CardBattleState = { ...prev };
        if (cardId) s.deck = [...s.deck, instance(cardId)];
        s.node += 1;
        if (s.node >= ENCOUNTERS.length) {
          s.phase = "victory";
          cbRef.current.onPhase?.("victory");
          return s;
        }
        s.floor = ENCOUNTERS[s.node].floor;
        s.hp = Math.min(s.maxHp, s.hp + 4); // a small breather between fights
        startCombat(s, ENCOUNTERS[s.node].enemies);
        cbRef.current.onPhase?.("combat");
        return s;
      });
    },
    [startCombat],
  );

  const setFocus = useCallback((uid: string) => {
    setState((prev) => ({ ...prev, focus: uid }));
  }, []);

  const reset = useCallback(() => setState(initial()), []);

  // clear the banner shortly after it appears
  useEffect(() => {
    if (!state.banner) return;
    const id = window.setTimeout(
      () => setState((s) => ({ ...s, banner: null })),
      1800,
    );
    return () => window.clearTimeout(id);
  }, [state.banner]);

  const derived = useMemo(() => {
    const handDefs = state.hand.map((c) => ({
      inst: c,
      def: CARDS_BY_ID[c.id],
      face: CARDS_BY_ID[c.id] ? faceOf(CARDS_BY_ID[c.id], c.upgraded) : null,
    }));
    return {
      handDefs,
      offerDefs: state.offer.map((id) => CARDS_BY_ID[id]).filter(Boolean),
      aliveEnemies: state.enemies.filter((e) => e.hp > 0),
      encounter: ENCOUNTERS[state.node],
      seed: seedRef.current,
    };
  }, [state]);

  return {
    state,
    ...derived,
    start,
    setTyped,
    playCard,
    endTurn,
    takeReward,
    setFocus,
    reset,
  };
}

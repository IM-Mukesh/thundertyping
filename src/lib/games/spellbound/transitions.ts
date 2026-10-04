import type { Rng } from "@/lib/rng/seeded-rng";
import type { SpellboundState } from "@/lib/games/spellbound/use-spellbound";
import { RELICS, SPELLS, relicById } from "@/lib/games/spellbound/content";

/** All existing relic effects are binary; owned relics cannot be rolled again. */
export function availableSpellboundRelics(owned: readonly string[]): string[] {
  return RELICS.filter((relic) => !owned.includes(relic.id)).map((relic) => relic.id);
}

/** The same acquisition transition is used by rewards, purchases and events. */
export function acquireSpellboundRelic(prev: SpellboundState, id: string): SpellboundState {
  if (!relicById(id) || prev.relics.includes(id) || prev.hp <= 0) return prev;
  const s = { ...prev, relics: [...prev.relics, id] };
  if (id === "iron-will") {
    s.maxHp += 20;
    s.hp += 20;
  } else if (id === "cursed-quill" || id === "mana-engine") {
    s.maxHp = Math.max(20, s.maxHp - (id === "cursed-quill" ? 15 : 10));
    s.hp = Math.min(s.hp, s.maxHp);
  }
  return s;
}

/** Terminal health is checked at each damaging boundary, before healing/rewards. */
export function settleSpellboundDeath(s: SpellboundState): SpellboundState {
  return s.hp <= 0 ? { ...s, hp: 0, phase: "defeat", typed: "" } : s;
}

export function settleSpellboundCombat(prev: SpellboundState, rng: Rng): SpellboundState {
  const s = settleSpellboundDeath(prev);
  if (s.phase !== "combat" || !s.enemies.length || s.enemies.some((e) => e.hp > 0)) return s;
  return {
    ...s,
    phase: "reward",
    gold: s.gold + 18 + s.floor * 6,
    offer: {
      spells: rng.sample(Object.keys(SPELLS), 3),
      relics: s.roomKind === "boss" ? rng.sample(availableSpellboundRelics(s.relics), 3) : [],
    },
  };
}

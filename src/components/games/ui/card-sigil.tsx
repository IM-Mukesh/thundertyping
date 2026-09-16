"use client";

/**
 * Procedural card art.
 *
 * Forty individual illustrations were rejected deliberately. They would have
 * weighed more than the rest of the site's artwork put together, and forty
 * independently generated images cannot hold a consistent style — this project
 * already proved that when one character came back three different ways across
 * three prompts.
 *
 * Instead each card gets a sigil composed from a small grammar: a rarity frame,
 * a rune ring, and a glyph for the card's type. That is uniform by construction,
 * costs a few hundred bytes, needs no network request, and inherits `--accent`
 * so it recolours per game and per theme for free.
 */

import type { CardType, Rarity } from "@/lib/games/cards/model";

const RARITY_RING: Record<Rarity, { stroke: string; dash?: string; width: number }> = {
  starter: { stroke: "var(--sub)", width: 1 },
  common: { stroke: "var(--sub)", width: 1.5 },
  uncommon: { stroke: "var(--accent)", width: 1.5 },
  rare: { stroke: "var(--accent)", width: 2.5, dash: "3 2" },
};

/**
 * One glyph per card type, drawn in a 24x24 box.
 *
 * Shapes are chosen to be distinguishable at 22px and by silhouette alone, so
 * the type reads without relying on colour.
 */
function Glyph({ type }: { type: CardType }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "attack":
      return <path d="M7 17 17 7M13 7h4v4" {...common} />;
    case "defence":
      return <path d="M12 5l6 2.5v4c0 3.4-2.4 6.3-6 7.5-3.6-1.2-6-4.1-6-7.5v-4L12 5z" {...common} />;
    case "healing":
      return <path d="M12 6v12M6 12h12" {...common} />;
    case "poison":
      return <path d="M12 5c3 3.5 5 6 5 8.5A5 5 0 0 1 7 13.5C7 11 9 8.5 12 5z" {...common} />;
    case "buff":
      return <path d="M12 18V6M8 10l4-4 4 4" {...common} />;
    case "debuff":
      return <path d="M12 6v12M8 14l4 4 4-4" {...common} />;
    case "draw":
      return <path d="M8 6h6l4 4v8H8zM14 6v4h4" {...common} />;
    case "energy":
      return <path d="M13 5l-5 8h4l-1 6 5-8h-4l1-6z" {...common} />;
    case "combo":
      return <path d="M7 12a3 3 0 0 1 3-3h4a3 3 0 0 1 0 6h-4a3 3 0 0 1-3-3zM10 9v6" {...common} />;
    case "summon":
      return <path d="M12 6l2.5 4.5L19 12l-4.5 1.5L12 18l-2.5-4.5L5 12l4.5-1.5L12 6z" {...common} />;
    case "special":
    default:
      return <circle cx="12" cy="12" r="5" {...common} />;
  }
}

export function CardSigil({
  type,
  rarity,
  size = 24,
}: {
  type: CardType;
  rarity: Rarity;
  size?: number;
}) {
  const ring = RARITY_RING[rarity];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={`${rarity} ${type} card`}
      className="shrink-0 text-accent"
    >
      <circle
        cx="12"
        cy="12"
        r="10.5"
        fill="none"
        stroke={ring.stroke}
        strokeWidth={ring.width}
        strokeDasharray={ring.dash}
        opacity={0.75}
      />
      <Glyph type={type} />
    </svg>
  );
}

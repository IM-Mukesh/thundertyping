import type { GameId } from "@/lib/games/game-types";

// Cover art is drawn rather than photographed. Every colour resolves from the
// active theme's CSS variables, so one asset reads correctly across all five
// themes, weighs nothing, and can animate — none of which a fixed raster file
// manages. If real artwork is ever commissioned or generated, set `coverImage`
// on the game's definition and it takes over without touching this file.

interface GameCoverArtProps {
  gameId: GameId;
  className?: string;
}

export function GameCoverArt({ gameId, className }: GameCoverArtProps) {
  return gameId === "falling-words" ? (
    <FallingWordsArt className={className} />
  ) : (
    <WordRainArt className={className} />
  );
}

/** Abstract word-blocks descending toward a floor line, with motion trails. */
function FallingWordsArt({ className }: { className?: string }) {
  const blocks = [
    { x: 26, y: 18, w: 46, trail: 22 },
    { x: 96, y: 52, w: 34, trail: 30 },
    { x: 150, y: 30, w: 52, trail: 18 },
    { x: 218, y: 74, w: 38, trail: 36 },
    { x: 66, y: 96, w: 40, trail: 42 },
  ];

  return (
    <svg
      viewBox="0 0 280 160"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="fw-trail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {blocks.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={b.y - b.trail}
            width={b.w}
            height={b.trail}
            fill="url(#fw-trail)"
            rx={3}
          />
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={9}
            rx={3}
            fill="var(--accent)"
            opacity={0.85 - i * 0.08}
          />
        </g>
      ))}

      {/* floor line the blocks are falling toward */}
      <line
        x1={0}
        x2={280}
        y1={132}
        y2={132}
        stroke="var(--error)"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        strokeDasharray="6 5"
      />
    </svg>
  );
}

/** Dense diagonal streaks over a horizon — an endless, accelerating downpour. */
function WordRainArt({ className }: { className?: string }) {
  const streaks = Array.from({ length: 22 }, (_, i) => ({
    x: (i * 13.5) % 290,
    y: (i * 29) % 120,
    len: 16 + ((i * 7) % 26),
    o: 0.18 + ((i * 11) % 60) / 140,
  }));

  return (
    <svg
      viewBox="0 0 280 160"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="wr-horizon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x={0} y={96} width={280} height={64} fill="url(#wr-horizon)" />

      {streaks.map((s, i) => (
        <line
          key={i}
          x1={s.x}
          y1={s.y}
          x2={s.x - 7}
          y2={s.y + s.len}
          stroke="var(--accent)"
          strokeOpacity={s.o}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      ))}

      <line
        x1={0}
        x2={280}
        y1={132}
        y2={132}
        stroke="var(--error)"
        strokeOpacity={0.6}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
    </svg>
  );
}

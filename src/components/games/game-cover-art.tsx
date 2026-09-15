import type { GameId } from "@/lib/games/game-types";

// Cover art is drawn rather than photographed. Every colour resolves from the
// active theme's CSS variables, so one asset reads correctly across all five
// themes, weighs nothing, and can animate — none of which a fixed raster file
// manages. If real artwork is generated later, drop it into public/games/ and
// game-art-assets.ts picks it up instead; see that file.
//
// These are built as actual scenes (perspective floor, horizon glow, depth
// layers) rather than flat patterns, because the earlier flat version read as
// faint texture and disappeared behind the card's content.

interface GameCoverArtProps {
  gameId: GameId;
  className?: string;
}

const VIEW_W = 400;
const VIEW_H = 220;
/** Where the floor's perspective lines converge. */
const HORIZON_Y = 92;

export function GameCoverArt({ gameId, className }: GameCoverArtProps) {
  return gameId === "falling-words" ? (
    <FallingWordsArt className={className} />
  ) : (
    <WordRainArt className={className} />
  );
}

/** Shared synthwave floor: lines converging to a vanishing point. */
function PerspectiveFloor({ idPrefix }: { idPrefix: string }) {
  // Verticals fan out from the vanishing point to well past both edges, so the
  // floor reads as continuing beyond the frame instead of stopping at it.
  const verticals = Array.from({ length: 15 }, (_, i) => -420 + i * 90);
  // Horizontals bunch up toward the horizon — squaring the ratio is what sells
  // the sense of distance.
  const horizontals = Array.from({ length: 9 }, (_, i) => {
    const t = (i + 1) / 9;
    return HORIZON_Y + (VIEW_H - HORIZON_Y) * t * t;
  });

  return (
    <g stroke={`url(#${idPrefix}-floorfade)`} strokeWidth={1}>
      {verticals.map((x, i) => (
        <line key={`v${i}`} x1={VIEW_W / 2} y1={HORIZON_Y} x2={x} y2={VIEW_H} />
      ))}
      {horizontals.map((y, i) => (
        <line key={`h${i}`} x1={0} y1={y} x2={VIEW_W} y2={y} />
      ))}
    </g>
  );
}

function FallingWordsArt({ className }: { className?: string }) {
  const p = "fw";
  // Varying size and opacity gives the blocks depth — nearer ones are larger,
  // brighter, and carry longer trails.
  const blocks = [
    { x: 58, y: 34, w: 54, h: 9, depth: 0.45, trail: 26 },
    { x: 148, y: 96, w: 70, h: 11, depth: 0.8, trail: 46 },
    { x: 262, y: 52, w: 46, h: 8, depth: 0.35, trail: 20 },
    { x: 316, y: 122, w: 58, h: 10, depth: 0.95, trail: 54 },
    { x: 96, y: 146, w: 64, h: 11, depth: 1, trail: 62 },
    { x: 214, y: 22, w: 38, h: 7, depth: 0.28, trail: 16 },
  ];

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--background)" />
          <stop offset="55%" stopColor="var(--sub-alt)" />
          <stop offset="100%" stopColor="var(--background)" />
        </linearGradient>
        <radialGradient id={`${p}-horizon`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-floorfade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="35%" stopColor="var(--accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`${p}-trail`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.6" />
        </linearGradient>
        <filter id={`${p}-bloom`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-sky)`} />
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-horizon)`} />
      <PerspectiveFloor idPrefix={p} />

      {/* bloom pass behind the blocks, so they glow rather than sit flat */}
      <g filter={`url(#${p}-bloom)`} opacity={0.75}>
        {blocks.map((b, i) => (
          <rect key={`g${i}`} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.h / 2} fill="var(--accent)" opacity={b.depth} />
        ))}
      </g>

      {blocks.map((b, i) => (
        <g key={i}>
          <rect x={b.x + b.w * 0.12} y={b.y - b.trail} width={b.w * 0.76} height={b.trail} fill={`url(#${p}-trail)`} opacity={b.depth * 0.8} />
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.h / 2} fill="var(--accent)" opacity={0.35 + b.depth * 0.65} />
        </g>
      ))}

      {/* the floor line a word must never reach */}
      <line x1={0} x2={VIEW_W} y1={196} y2={196} stroke="var(--error)" strokeOpacity={0.75} strokeWidth={2} strokeDasharray="10 7" />
      <rect x={0} y={196} width={VIEW_W} height={VIEW_H - 196} fill="var(--error)" opacity={0.1} />
    </svg>
  );
}

function WordRainArt({ className }: { className?: string }) {
  const p = "wr";
  // Three depth layers: distant rain is thin, faint and short; near rain is
  // thick, bright and long. That separation is what stops it reading as noise.
  const layers = [
    { count: 26, len: [10, 18], width: 0.9, opacity: [0.12, 0.24], skew: 4 },
    { count: 18, len: [22, 36], width: 1.5, opacity: [0.3, 0.5], skew: 7 },
    { count: 10, len: [40, 62], width: 2.4, opacity: [0.55, 0.85], skew: 11 },
  ];

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--background)" />
          <stop offset="60%" stopColor="var(--sub-alt)" />
          <stop offset="100%" stopColor="var(--background)" />
        </linearGradient>
        <radialGradient id={`${p}-horizon`} cx="50%" cy="88%" r="62%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-floorfade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="40%" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
        </linearGradient>
        <filter id={`${p}-bloom`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-sky)`} />
      <PerspectiveFloor idPrefix={p} />
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-horizon)`} />

      {layers.map((layer, li) => (
        <g key={li} filter={li === 2 ? `url(#${p}-bloom)` : undefined}>
          {Array.from({ length: layer.count }, (_, i) => {
            // Deterministic pseudo-scatter: keeps the render identical between
            // server and client without pulling in Math.random().
            const seed = (i * 97 + li * 41) % 400;
            const x = (seed * 7.3) % VIEW_W;
            const y = ((seed * 13.7) % (VIEW_H - 40)) - 10;
            const len = layer.len[0] + ((seed * 3) % (layer.len[1] - layer.len[0]));
            const op = layer.opacity[0] + ((seed % 10) / 10) * (layer.opacity[1] - layer.opacity[0]);
            return (
              <line
                key={i}
                x1={x}
                y1={y}
                x2={x - layer.skew}
                y2={y + len}
                stroke="var(--accent)"
                strokeOpacity={op}
                strokeWidth={layer.width}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      ))}

      <line x1={0} x2={VIEW_W} y1={198} y2={198} stroke="var(--error)" strokeOpacity={0.8} strokeWidth={2} strokeDasharray="6 6" />
      <rect x={0} y={198} width={VIEW_W} height={VIEW_H - 198} fill="var(--error)" opacity={0.12} />
    </svg>
  );
}

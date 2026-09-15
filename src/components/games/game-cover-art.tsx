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
  switch (gameId) {
    case "falling-words":
      return <FallingWordsArt className={className} />;
    case "word-rain":
      return <WordRainArt className={className} />;
    case "word-blaster":
      return <WordBlasterArt className={className} />;
    case "typing-grand-prix":
      return <GrandPrixArt className={className} />;
    case "boss-battle":
      return <BossBattleArt className={className} />;
    case "combo-rush":
      return <ComboRushArt className={className} />;
  }
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

/** Tracer fire converging on a base at the left — the shooter read. */
function WordBlasterArt({ className }: { className?: string }) {
  const p = "wb";
  const tracers = [
    { y: 58, from: 392, to: 96, w: 2.6, o: 0.9 },
    { y: 104, from: 358, to: 96, w: 2, o: 0.65 },
    { y: 150, from: 380, to: 96, w: 1.5, o: 0.42 },
    { y: 32, from: 300, to: 96, w: 1.2, o: 0.3 },
  ];
  const enemies = [
    { x: 300, y: 52, r: 9 },
    { x: 246, y: 98, r: 7 },
    { x: 344, y: 144, r: 8 },
    { x: 214, y: 26, r: 5 },
  ];

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--sub-alt)" />
          <stop offset="100%" stopColor="var(--background)" />
        </linearGradient>
        <radialGradient id={`${p}-muzzle`} cx="24%" cy="50%" r="34%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.75" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-floorfade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="40%" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
        </linearGradient>
        <filter id={`${p}-bloom`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-sky)`} />
      <PerspectiveFloor idPrefix={p} />
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-muzzle)`} />

      <g filter={`url(#${p}-bloom)`} opacity={0.85}>
        {tracers.map((t, i) => (
          <line key={i} x1={t.from} y1={t.y} x2={t.to} y2={t.y} stroke="var(--accent)" strokeOpacity={t.o} strokeWidth={t.w + 1.5} strokeLinecap="round" />
        ))}
      </g>
      {tracers.map((t, i) => (
        <line key={i} x1={t.from} y1={t.y} x2={t.to} y2={t.y} stroke="var(--accent)" strokeOpacity={t.o} strokeWidth={t.w} strokeLinecap="round" />
      ))}

      {enemies.map((e, i) => (
        <circle key={i} cx={e.x} cy={e.y} r={e.r} fill="var(--error)" opacity={0.55 + i * 0.08} />
      ))}

      {/* the turret holding the left edge */}
      <rect x={62} y={78} width={30} height={46} rx={5} fill="var(--accent)" opacity={0.9} />
      <rect x={88} y={94} width={22} height={9} rx={4} fill="var(--accent)" />
    </svg>
  );
}

/** Four lanes streaking toward a finish line — the racing read. */
function GrandPrixArt({ className }: { className?: string }) {
  const p = "gp";
  const lanes = [64, 100, 136, 172];
  const cars = [
    { lane: 0, x: 286, lead: true },
    { lane: 1, x: 232 },
    { lane: 2, x: 258 },
    { lane: 3, x: 196 },
  ];

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--background)" />
          <stop offset="45%" stopColor="var(--sub-alt)" />
          <stop offset="100%" stopColor="var(--background)" />
        </linearGradient>
        <linearGradient id={`${p}-streak`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`${p}-floorfade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.22" />
        </linearGradient>
        <filter id={`${p}-bloom`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-sky)`} />

      {/* lane dividers */}
      {lanes.map((y, i) => (
        <line key={`l${i}`} x1={0} x2={VIEW_W} y1={y + 18} y2={y + 18} stroke="var(--border)" strokeOpacity={0.6} strokeWidth={1} strokeDasharray="14 12" />
      ))}

      {/* speed streaks behind each car */}
      {cars.map((c, i) => (
        <rect key={`s${i}`} x={c.x - 150} y={lanes[c.lane] - 3} width={150} height={7} rx={3.5} fill={`url(#${p}-streak)`} opacity={c.lead ? 0.9 : 0.45} />
      ))}

      <g filter={`url(#${p}-bloom)`} opacity={0.7}>
        {cars.map((c, i) => (
          <rect key={`g${i}`} x={c.x} y={lanes[c.lane] - 6} width={30} height={13} rx={6} fill={c.lead ? "var(--accent)" : "var(--sub)"} />
        ))}
      </g>
      {cars.map((c, i) => (
        <rect key={i} x={c.x} y={lanes[c.lane] - 6} width={30} height={13} rx={6} fill={c.lead ? "var(--accent)" : "var(--sub)"} opacity={c.lead ? 1 : 0.85} />
      ))}

      {/* chequered finish line */}
      {Array.from({ length: 11 }, (_, r) =>
        Array.from({ length: 2 }, (_, c) => (
          <rect key={`${r}-${c}`} x={356 + c * 11} y={r * 20} width={11} height={20} fill={(r + c) % 2 === 0 ? "var(--foreground)" : "var(--background)"} opacity={0.85} />
        )),
      )}
    </svg>
  );
}

/** A looming silhouette over a drained health bar — the boss read. */
function BossBattleArt({ className }: { className?: string }) {
  const p = "bb";
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${p}-aura`} cx="50%" cy="42%" r="52%">
          <stop offset="0%" stopColor="var(--error)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--error)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--background)" />
          <stop offset="60%" stopColor="var(--sub-alt)" />
          <stop offset="100%" stopColor="var(--background)" />
        </linearGradient>
        <linearGradient id={`${p}-floorfade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--error)" stopOpacity="0" />
          <stop offset="45%" stopColor="var(--error)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--error)" stopOpacity="0.1" />
        </linearGradient>
        <filter id={`${p}-bloom`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-sky)`} />
      <PerspectiveFloor idPrefix={p} />
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-aura)`} />

      {/* hulking silhouette */}
      <g opacity={0.92}>
        <path d="M148 168 L162 78 L186 62 L214 62 L238 78 L252 168 Z" fill="var(--background)" stroke="var(--error)" strokeOpacity={0.75} strokeWidth={2} />
        <path d="M162 78 L146 40 L176 64 Z" fill="var(--background)" stroke="var(--error)" strokeOpacity={0.7} strokeWidth={2} />
        <path d="M238 78 L254 40 L224 64 Z" fill="var(--background)" stroke="var(--error)" strokeOpacity={0.7} strokeWidth={2} />
      </g>
      <g filter={`url(#${p}-bloom)`}>
        <circle cx={184} cy={92} r={6} fill="var(--error)" />
        <circle cx={216} cy={92} r={6} fill="var(--error)" />
      </g>
      <circle cx={184} cy={92} r={3.4} fill="var(--foreground)" />
      <circle cx={216} cy={92} r={3.4} fill="var(--foreground)" />

      {/* health bar, mostly spent */}
      <rect x={96} y={190} width={208} height={9} rx={4.5} fill="var(--sub-alt)" stroke="var(--border)" strokeWidth={1} />
      <rect x={96} y={190} width={74} height={9} rx={4.5} fill="var(--error)" opacity={0.95} />
    </svg>
  );
}

/** A nearly-drained timer ring with combo sparks — the time-attack read. */
function ComboRushArt({ className }: { className?: string }) {
  const p = "cr";
  const R = 46;
  const CX = 200;
  const CY = 104;
  const C = 2 * Math.PI * R;
  const sparks = [
    { x: 92, y: 54, r: 3.5, o: 0.8 },
    { x: 310, y: 62, r: 2.6, o: 0.6 },
    { x: 118, y: 156, r: 2.2, o: 0.5 },
    { x: 296, y: 150, r: 3.2, o: 0.7 },
    { x: 64, y: 108, r: 2, o: 0.42 },
    { x: 338, y: 110, r: 2.4, o: 0.5 },
  ];

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${p}-glow`} cx="50%" cy="48%" r="46%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--background)" />
          <stop offset="55%" stopColor="var(--sub-alt)" />
          <stop offset="100%" stopColor="var(--background)" />
        </linearGradient>
        <linearGradient id={`${p}-floorfade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
        </linearGradient>
        <filter id={`${p}-bloom`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-sky)`} />
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${p}-glow)`} />

      {/* track ring */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth={9} />
      {/* remaining time — deliberately low, the mode is always nearly over */}
      <g filter={`url(#${p}-bloom)`}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--error)" strokeWidth={9} strokeLinecap="round" strokeDasharray={`${C * 0.17} ${C}`} transform={`rotate(-90 ${CX} ${CY})`} />
      </g>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--error)" strokeWidth={9} strokeLinecap="round" strokeDasharray={`${C * 0.17} ${C}`} transform={`rotate(-90 ${CX} ${CY})`} />

      {/* combo sparks flying outward */}
      <g filter={`url(#${p}-bloom)`}>
        {sparks.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--accent)" opacity={s.o} />
        ))}
      </g>

      {/* multiplier chevrons */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${170 + i * 22} ${168} l10 -11 l-10 -11`} fill="none" stroke="var(--accent)" strokeOpacity={0.35 + i * 0.25} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

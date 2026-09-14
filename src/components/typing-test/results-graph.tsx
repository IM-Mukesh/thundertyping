"use client";

import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { WpmSample } from "@/lib/typing-engine/engine-types";
import { round } from "@/lib/typing-engine/stats";

interface ResultsGraphProps {
  samples: WpmSample[];
}

const WIDTH = 720;
const HEIGHT = 220;
const PADDING = { top: 12, right: 16, bottom: 24, left: 32 };

// Rounds a max value up to a "nice" axis ceiling (1/2/5/10 × a power of ten)
// so gridlines land on clean numbers instead of e.g. "73 wpm".
function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function ResultsGraph({ samples }: ResultsGraphProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plot = useMemo(() => {
    if (samples.length < 2) return null;

    const maxT = samples[samples.length - 1].t;
    const maxWpm = Math.max(...samples.map((s) => Math.max(s.wpm, s.rawWpm)), 1);
    const yMax = niceMax(maxWpm);
    const innerW = WIDTH - PADDING.left - PADDING.right;
    const innerH = HEIGHT - PADDING.top - PADDING.bottom;

    const x = (t: number) => PADDING.left + (maxT === 0 ? 0 : (t / maxT) * innerW);
    const y = (wpm: number) => PADDING.top + innerH - (wpm / yMax) * innerH;

    const toPath = (key: "wpm" | "rawWpm") =>
      samples.map((s, i) => `${i === 0 ? "M" : "L"}${x(s.t).toFixed(1)},${y(s[key]).toFixed(1)}`).join(" ");

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));
    const tickCount = Math.min(6, samples.length);
    const xTicks = Array.from({ length: tickCount }, (_, i) => {
      const t = tickCount === 1 ? 0 : (maxT / (tickCount - 1)) * i;
      return { t, seconds: Math.round(t / 1000) };
    });

    return { x, y, wpmPath: toPath("wpm"), rawPath: toPath("rawWpm"), innerW, innerH, yTicks, xTicks, maxT };
  }, [samples]);

  if (!plot) return null;

  const handleMove = (e: ReactPointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const targetT = ((relX - PADDING.left) / plot.innerW) * plot.maxT;

    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < samples.length; i++) {
      const dist = Math.abs(samples[i].t - targetT);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    }
    setHoverIndex(nearest);
  };

  const last = samples[samples.length - 1];
  const hovered = hoverIndex !== null ? samples[hoverIndex] : null;
  const active = hovered ?? last;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-center gap-5 text-xs text-sub">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-accent" aria-hidden="true" />
          wpm
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-sub" aria-hidden="true" />
          raw
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Words per minute over the test. Started around ${round(samples[0].wpm)}, ended at ${round(last.wpm)}.`}
      >
        {plot.yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={plot.y(tick)}
              y2={plot.y(tick)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text x={PADDING.left - 6} y={plot.y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--sub)">
              {tick}
            </text>
          </g>
        ))}
        {plot.xTicks.map(({ t, seconds }) => (
          <text key={t} x={plot.x(t)} y={HEIGHT - 6} textAnchor="middle" fontSize={10} fill="var(--sub)">
            {seconds}s
          </text>
        ))}

        <path d={plot.rawPath} fill="none" stroke="var(--sub)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={plot.wpmPath} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={plot.x(last.t)} cy={plot.y(last.rawWpm)} r={4} fill="var(--sub)" stroke="var(--background)" strokeWidth={2} />
        <circle cx={plot.x(last.t)} cy={plot.y(last.wpm)} r={4} fill="var(--accent)" stroke="var(--background)" strokeWidth={2} />

        {hovered && (
          <g>
            <line
              x1={plot.x(hovered.t)}
              x2={plot.x(hovered.t)}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <circle cx={plot.x(hovered.t)} cy={plot.y(hovered.rawWpm)} r={4} fill="var(--sub)" stroke="var(--background)" strokeWidth={2} />
            <circle cx={plot.x(hovered.t)} cy={plot.y(hovered.wpm)} r={4} fill="var(--accent)" stroke="var(--background)" strokeWidth={2} />
          </g>
        )}

        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={plot.innerW}
          height={plot.innerH}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      <div className="-mt-1 text-center font-mono text-xs text-sub" aria-hidden="true">
        {Math.round(active.t / 1000)}s — <span className="text-accent">{round(active.wpm)} wpm</span> · raw {round(active.rawWpm)}
      </div>
    </div>
  );
}

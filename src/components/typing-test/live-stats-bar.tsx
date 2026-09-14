import type { TestState } from "@/lib/typing-engine/engine-types";
import { calculateLiveWpm, round } from "@/lib/typing-engine/stats";

interface LiveStatsBarProps {
  state: TestState;
}

export function LiveStatsBar({ state }: LiveStatsBarProps) {
  const { config, elapsedMs, correctKeystrokes, activeWordIndex, words } = state;
  const liveWpm = round(calculateLiveWpm(correctKeystrokes, elapsedMs));

  const primary =
    config.mode === "time"
      ? Math.max(0, Math.ceil((config.timeDuration * 1000 - elapsedMs) / 1000))
      : `${Math.min(activeWordIndex + 1, words.length)}/${words.length}`;

  return (
    <div className="flex items-center justify-center gap-8 font-mono text-lg text-sub" aria-live="polite">
      <span className="text-accent">{primary}</span>
      <span>{liveWpm} wpm</span>
    </div>
  );
}

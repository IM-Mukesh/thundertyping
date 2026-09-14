"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Play, RotateCcw, Trophy, Zap } from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { LANE_COUNT, useFallingWords } from "@/lib/games/use-falling-words";
import { getGameBest, recordGameResult, type GameBest } from "@/lib/games/game-scores";
import { calculateAccuracy, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

const BOARD_HEIGHT = 420;
/** Keeps a word fully on-screen when it reaches the floor. */
const FLOOR_INSET = 44;

interface FallingWordsGameProps {
  definition: GameDefinition;
}

export function FallingWordsGame({ definition }: FallingWordsGameProps) {
  const { state, start, reset, resume, setTyped } = useFallingWords(definition);
  const inputRef = useRef<HTMLInputElement>(null);
  // Lazy initialiser rather than a mount effect: this component only ever
  // renders client-side (its wrapper is next/dynamic with ssr:false), so
  // localStorage is guaranteed available and there's no server/client pass to
  // reconcile. One game per route, so re-reading on `definition.id` changes
  // isn't a case that occurs.
  const [best, setBest] = useState<GameBest | null>(() => getGameBest(definition.id));
  const [isNewBest, setIsNewBest] = useState(false);

  // Keep focus on the capture input whenever a run is live, including after
  // clicking the board or dismissing an overlay.
  const focusInput = useCallback(() => inputRef.current?.focus(), []);
  useEffect(() => {
    if (state.status === "running") focusInput();
  }, [state.status, focusInput]);

  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.status !== "over") {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;

    const headline = definition.scoreBy === "time" ? Math.round(state.elapsedMs / 1000) : state.score;
    const { isNewBest: newBest, best: stored } = recordGameResult(definition.id, {
      score: headline,
      cleared: state.cleared,
      bestCombo: state.bestCombo,
      survivedMs: state.elapsedMs,
    });
    setIsNewBest(newBest);
    setBest(stored);
    // only settle the run once, on the transition into "over"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const handleStart = () => {
    setIsNewBest(false);
    start();
    focusInput();
  };

  const accuracy = round(calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes));
  const seconds = Math.round(state.elapsedMs / 1000);
  const headline = definition.scoreBy === "time" ? `${seconds}s` : state.score.toLocaleString();
  const headlineLabel = definition.scoreBy === "time" ? "survived" : "score";

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-sm">
        <div className="flex items-center gap-5">
          <Metric label={headlineLabel} value={headline} highlight />
          {definition.scoreBy === "time" ? (
            <Metric label="cleared" value={state.cleared} />
          ) : (
            <Metric label="cleared" value={state.cleared} />
          )}
          <Metric label="accuracy" value={`${accuracy}%`} />
        </div>
        <div className="flex items-center gap-4">
          {state.combo > 1 && (
            <span className="flex items-center gap-1 text-accent" aria-label={`Combo ${state.combo}`}>
              <Zap size={14} />
              {state.combo}x
            </span>
          )}
          <span
            className="flex items-center gap-1"
            aria-label={`${state.lives} ${state.lives === 1 ? "life" : "lives"} remaining`}
          >
            {Array.from({ length: definition.lives }, (_, i) => (
              <Heart
                key={i}
                size={15}
                className={i < state.lives ? "text-error" : "text-sub/30"}
                fill={i < state.lives ? "currentColor" : "none"}
              />
            ))}
          </span>
        </div>
      </div>

      <div
        onClick={focusInput}
        className="relative w-full overflow-hidden rounded-xl border border-border bg-sub-alt/30"
        style={{ height: BOARD_HEIGHT }}
      >
        {state.words.map((word) => {
          const isTarget = word.id === state.lockedId;
          const matched = isTarget ? state.typed.length : 0;
          return (
            <span
              key={word.id}
              className={cn(
                "absolute whitespace-nowrap font-mono text-lg transition-[top] ease-linear sm:text-xl",
                isTarget ? "text-foreground" : "text-sub",
              )}
              style={{
                // Matches the engine tick, so stepped position updates read as
                // continuous motion without running the loop at frame rate.
                transitionDuration: "50ms",
                top: word.progress * (BOARD_HEIGHT - FLOOR_INSET),
                left: `${(word.lane + 0.5) * (100 / LANE_COUNT)}%`,
                transform: "translateX(-50%)",
              }}
            >
              {matched > 0 && <span className="text-accent">{word.text.slice(0, matched)}</span>}
              {word.text.slice(matched)}
            </span>
          );
        })}

        {/* The floor line: a word crossing this is what costs a life. */}
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-error/40"
          style={{ top: BOARD_HEIGHT - FLOOR_INSET + 26 }}
          aria-hidden="true"
        />

        {state.status !== "running" && (
          <Overlay>
            {state.status === "idle" && (
              <StartCard definition={definition} best={best} onStart={handleStart} />
            )}
            {state.status === "paused" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-lg font-semibold text-foreground">Paused</p>
                <p className="max-w-xs text-sm text-sub">The run pauses when you switch tabs.</p>
                <ActionButton onClick={() => { resume(); focusInput(); }}>
                  <Play size={15} />
                  Resume
                </ActionButton>
              </div>
            )}
            {state.status === "over" && (
              <GameOverCard
                definition={definition}
                headline={headline}
                headlineLabel={headlineLabel}
                cleared={state.cleared}
                bestCombo={state.bestCombo}
                accuracy={accuracy}
                isNewBest={isNewBest}
                best={best}
                onRestart={() => { reset(); handleStart(); }}
              />
            )}
          </Overlay>
        )}

        <input
          ref={inputRef}
          value={state.typed}
          onChange={(e) => setTyped(e.target.value.toLowerCase())}
          onPaste={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            // Space never commits here — a word clears the instant it matches —
            // so swallow it rather than letting it scroll the page.
            if (e.key === " ") e.preventDefault();
            if (e.key === "Tab" && state.status === "over") {
              e.preventDefault();
              reset();
              handleStart();
            }
          }}
          disabled={state.status !== "running"}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={`${definition.name} typing input`}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          style={{ fontSize: 16 }}
        />
      </div>

      <p className="text-center font-mono text-xs text-sub" aria-live="polite">
        {state.status === "running"
          ? state.typed
            ? `typing: ${state.typed}`
            : "type any falling word"
          : " "}
      </p>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={cn("text-xl font-semibold", highlight ? "text-accent" : "text-foreground")}>{value}</span>
      <span className="text-xs uppercase tracking-wide text-sub">{label}</span>
    </span>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
      {children}
    </div>
  );
}

function ActionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
    >
      {children}
    </button>
  );
}

function StartCard({
  definition,
  best,
  onStart,
}: {
  definition: GameDefinition;
  best: GameBest | null;
  onStart: () => void;
}) {
  return (
    <div className="flex max-w-md flex-col items-center gap-4 text-center">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-foreground">{definition.name}</h2>
        <p className="text-sm text-sub">{definition.tagline}</p>
      </div>
      <ul className="flex flex-col gap-1.5 text-left text-xs text-sub">
        {definition.rules.map((rule) => (
          <li key={rule} className="flex gap-2">
            <span aria-hidden="true" className="text-accent">
              &bull;
            </span>
            {rule}
          </li>
        ))}
      </ul>
      {best && (
        <p className="flex items-center gap-1.5 text-xs text-sub">
          <Trophy size={13} className="text-accent" />
          Best: {definition.scoreBy === "time" ? `${best.score}s` : best.score.toLocaleString()}
        </p>
      )}
      <ActionButton onClick={onStart}>
        <Play size={15} />
        Start
      </ActionButton>
    </div>
  );
}

function GameOverCard({
  definition,
  headline,
  headlineLabel,
  cleared,
  bestCombo,
  accuracy,
  isNewBest,
  best,
  onRestart,
}: {
  definition: GameDefinition;
  headline: string;
  headlineLabel: string;
  cleared: number;
  bestCombo: number;
  accuracy: number;
  isNewBest: boolean;
  best: GameBest | null;
  onRestart: () => void;
}) {
  return (
    <div className="flex max-w-md flex-col items-center gap-4 text-center" role="status" aria-live="polite">
      <p className="text-sm uppercase tracking-wide text-sub">Run over</p>
      {isNewBest && (
        <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Trophy size={13} />
          New best
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-4xl font-semibold text-accent">{headline}</span>
        <span className="text-xs uppercase tracking-wide text-sub">{headlineLabel}</span>
      </div>
      <div className="flex flex-wrap justify-center gap-5 font-mono text-xs text-sub">
        <span>{cleared} cleared</span>
        <span>{bestCombo}x best combo</span>
        <span>{accuracy}% accuracy</span>
        {best && !isNewBest && (
          <span>
            best {definition.scoreBy === "time" ? `${best.score}s` : best.score.toLocaleString()}
          </span>
        )}
      </div>
      <ActionButton onClick={onRestart}>
        <RotateCcw size={15} />
        Play again
      </ActionButton>
    </div>
  );
}

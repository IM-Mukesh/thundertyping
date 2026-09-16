"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Bot, Crosshair, Flag, Gauge, Play, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import {
  LEAD_IN_BEAT_MS,
  OPPONENT_COUNT,
  RACE_WORD_COUNT,
  TICK_MS,
  livePosition,
  useTypingGrandPrix,
  type GrandPrixState,
} from "@/lib/games/use-typing-grand-prix";
import { getGameBest, recordGameResult, type GameBest } from "@/lib/games/game-scores";
import { playSound } from "@/lib/games/game-audio";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { calculateAccuracy, calculateLiveWpm, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

/** Player lane first, then one lane per opponent. */
const LANE_COUNT = OPPONENT_COUNT + 1;
const LANE_HEIGHT = 62;
const TRACK_PAD_Y = 12;
const BOARD_HEIGHT = LANE_COUNT * LANE_HEIGHT + TRACK_PAD_Y * 2;
const CAR_WIDTH = 46;
const CAR_HEIGHT = 22;
const FINISH_WIDTH = 14;
/** How many words of the stream stay visible ahead of the active one. */
const VISIBLE_WORDS = 9;

/**
 * Lane colours, player first. Every one resolves from the active theme, so the
 * field stays distinguishable in all five palettes — the fastest rival is the
 * error colour because it is the one that actually threatens your race.
 */
const LANE_COLOR = ["text-accent", "text-sub", "text-foreground/65", "text-error/85"];

const ORDINALS = ["1st", "2nd", "3rd", "4th"];

interface TypingGrandPrixGameProps {
  definition: GameDefinition;
}

export function TypingGrandPrixGame({ definition }: TypingGrandPrixGameProps) {
  const { state, start, resume, setTyped, commitWord } = useTypingGrandPrix(definition);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy initialiser rather than a mount effect: this component only renders
  // client-side (its wrapper is next/dynamic with ssr:false), so localStorage
  // is guaranteed available and there is no server pass to reconcile.
  const [best, setBest] = useState<GameBest | null>(() => getGameBest(definition.id));
  const [isNewBest, setIsNewBest] = useState(false);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const position = livePosition(state);

  // Audio is driven off state transitions rather than fired inline from
  // handlers, so every path that changes the race gets sound without each
  // call site remembering to play it.
  const prevRef = useRef({ correct: 0, incorrect: 0, wordIndex: 0, position: LANE_COUNT });
  useEffect(() => {
    const prev = prevRef.current;
    if (state.correctKeystrokes > prev.correct) playSound("key", soundEnabled);
    if (state.incorrectKeystrokes > prev.incorrect) playSound("typo", soundEnabled);
    if (state.wordIndex > prev.wordIndex) playSound("clear", soundEnabled);
    // Overtaking is the one event in this game worth a fanfare. Losing a place
    // gets nothing — a jeer every time a rival edges ahead would be relentless.
    if (state.status === "running" && position < prev.position) playSound("combo", soundEnabled);

    prevRef.current = {
      correct: state.correctKeystrokes,
      incorrect: state.incorrectKeystrokes,
      wordIndex: state.wordIndex,
      position,
    };
  }, [state, position, soundEnabled]);

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

    const { isNewBest: newBest, best: stored } = recordGameResult(definition.id, {
      score: state.score,
      cleared: state.wordIndex,
      // GameBest is shared across games and has no field for a placing. This
      // race has no combo mechanic, so the slot carries cars beaten instead —
      // the closest equivalent "how well did that go" number.
      bestCombo: OPPONENT_COUNT - ((state.place ?? LANE_COUNT) - 1),
      survivedMs: state.elapsedMs,
    });
    setIsNewBest(newBest);
    setBest(stored);
    playSound("over", soundEnabled);
    // settle the race once, on the transition into "over"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const handleStart = useCallback(() => {
    setIsNewBest(false);
    // Also the user gesture that unlocks the audio context, so the countdown
    // and the first keystroke of a race are already audible.
    playSound("start", soundEnabled);
    start();
    focusInput();
  }, [start, focusInput, soundEnabled]);

  const accuracy = round(
    calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes, state.missedChars),
  );
  const liveWpm = round(calculateLiveWpm(state.correctKeystrokes, state.elapsedMs));
  const finalWpm = round(calculateNetWpm(state.correctKeystrokes, state.elapsedMs));
  const isPlaying = state.status === "running";
  const inLeadIn = isPlaying && state.leadInMs > 0;
  const countdown = Math.max(1, Math.ceil(state.leadInMs / LEAD_IN_BEAT_MS));

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3" onClick={focusInput}>
      {/*
        In-play chrome is numbers and icons only — no word labels. Everything
        is still announced to screen readers through aria-label, so dropping
        the visible text costs nothing in accessibility.
      */}
      <div className="flex items-center justify-between gap-4 font-mono">
        <span
          className="flex items-baseline gap-1.5 text-3xl font-semibold tabular-nums text-accent arcade-glow sm:text-4xl"
          aria-label={`Live speed ${liveWpm} words per minute`}
        >
          <Gauge size={18} className="self-center text-accent/70" aria-hidden="true" />
          {liveWpm}
        </span>

        <div className="flex items-center gap-4 text-sm text-sub">
          <Stat
            icon={<Flag size={13} />}
            value={`${Math.min(state.wordIndex, RACE_WORD_COUNT)}/${RACE_WORD_COUNT}`}
            label={`${state.wordIndex} of ${RACE_WORD_COUNT} words typed`}
          />
          <Stat icon={<Crosshair size={13} />} value={`${accuracy}%`} label={`${accuracy} percent accuracy`} />
          <Stat
            icon={<Trophy size={13} />}
            value={position}
            label={`Position ${position} of ${LANE_COUNT}`}
          />

          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            title={soundEnabled ? "Mute sound" : "Unmute sound"}
            className="-m-2 flex min-h-11 min-w-11 items-center justify-center p-2 text-sub/60 transition-colors hover:text-foreground sm:m-0 sm:min-h-0 sm:min-w-0 sm:p-0"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-background arcade-edge arcade-scanlines"
        style={{ height: BOARD_HEIGHT }}
      >
        <div aria-hidden="true" className="absolute inset-0 arcade-haze" />

        <div className="absolute inset-x-3 sm:inset-x-4" style={{ top: TRACK_PAD_Y, bottom: TRACK_PAD_Y }}>
          {/* Checkered flag, the full height of the field so every lane shares it. */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 rounded-[3px]"
            style={{
              width: FINISH_WIDTH,
              backgroundImage:
                "repeating-conic-gradient(var(--foreground) 0% 25%, var(--sub-alt) 0% 50%)",
              backgroundSize: `${FINISH_WIDTH}px ${FINISH_WIDTH}px`,
              opacity: 0.85,
            }}
          />

          <Lane index={0} progress={state.playerProgress} isPlayer />
          {state.opponents.map((opponent) => (
            <Lane key={opponent.id} index={opponent.id + 1} progress={opponent.progress} />
          ))}
        </div>

        {inLeadIn && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/55 backdrop-blur-[2px]">
            <span
              className="font-mono text-7xl font-semibold tabular-nums text-accent arcade-glow"
              aria-label={`Starting in ${countdown}`}
            >
              {countdown}
            </span>
          </div>
        )}

        {!isPlaying && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
            {state.status === "idle" && (
              <StartCard definition={definition} best={best} onStart={handleStart} />
            )}
            {state.status === "paused" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="font-mono text-lg font-semibold uppercase tracking-[0.2em] text-foreground">
                  Paused
                </p>
                <ArcadeButton
                  onClick={() => {
                    resume();
                    focusInput();
                  }}
                >
                  <Play size={15} />
                  Resume
                </ArcadeButton>
              </div>
            )}
            {state.status === "over" && (
              <ResultCard
                place={state.place ?? LANE_COUNT}
                score={state.score}
                wpm={finalWpm}
                accuracy={accuracy}
                elapsedMs={state.elapsedMs}
                isNewBest={isNewBest}
                best={best}
                onRestart={handleStart}
              />
            )}
          </div>
        )}

        <input
          ref={inputRef}
          value={state.typed}
          onChange={(e) => {
            const value = e.target.value;
            // onKeyDown below normally swallows the space before it can reach
            // the value, so this branch is the fallback for input that arrives
            // without a keydown at all — IME commits and the "insert text"
            // path some mobile keyboards use. Generated words never contain a
            // space, so a space in the buffer can only ever mean "commit".
            if (value.includes(" ")) {
              setTyped(value.slice(0, value.indexOf(" ")));
              commitWord();
              return;
            }
            setTyped(value);
          }}
          onPaste={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === " ") {
              // Space commits the word, exactly like the main typing test, and
              // must never reach the input or scroll the page.
              e.preventDefault();
              commitWord();
            }
            if (e.key === "Tab" && state.status === "over") {
              e.preventDefault();
              handleStart();
            }
          }}
          disabled={!isPlaying}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={`${definition.name} typing input`}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          style={{ fontSize: 16 }}
        />
      </div>

      <WordStrip state={state} dimmed={!isPlaying || inLeadIn} />
    </div>
  );
}

/**
 * One lane and its car. The car is positioned by percentage inside a rail that
 * is inset from the right by exactly the car's width, so `left: 100%` puts the
 * car's nose on the flag with no pixel arithmetic and no measurement. The
 * transition duration matches the engine tick, which is what turns 20 stepped
 * updates a second into smooth motion without a rAF loop.
 */
function Lane({
  index,
  progress,
  isPlayer = false,
}: {
  index: number;
  progress: number;
  isPlayer?: boolean;
}) {
  return (
    <div
      className={cn("absolute inset-x-0", LANE_COLOR[index] ?? "text-sub")}
      style={{ top: index * LANE_HEIGHT, height: LANE_HEIGHT }}
    >
      {isPlayer && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-md"
          style={{ background: "color-mix(in srgb, var(--accent) 7%, transparent)" }}
        />
      )}
      {index > 0 && (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
      )}
      {/* Road marking down the middle of the lane. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, color-mix(in srgb, var(--sub) 55%, transparent) 0 16px, transparent 16px 34px)",
        }}
      />

      <div className="absolute inset-y-0 left-0" style={{ right: CAR_WIDTH }}>
        <div
          className="absolute transition-[left] ease-linear"
          style={{
            left: `${progress * 100}%`,
            top: (LANE_HEIGHT - CAR_HEIGHT) / 2,
            transitionDuration: `${TICK_MS}ms`,
          }}
        >
          <div
            aria-hidden="true"
            className="absolute right-full top-1/2 h-[3px] w-9 -translate-y-1/2 rounded-full opacity-40"
            style={{ background: "linear-gradient(to left, currentColor, transparent)" }}
          />
          <RaceCar />
        </div>
      </div>
    </div>
  );
}

/** Side-on car. Every fill is currentColor or a theme variable, so it recolours with the lane. */
function RaceCar() {
  return (
    <svg
      width={CAR_WIDTH}
      height={CAR_HEIGHT}
      viewBox="0 0 46 22"
      fill="none"
      aria-hidden="true"
      className="block"
    >
      <path
        d="M1 15.5 L5.5 10 L15 10 L20 3.5 L30.5 3.5 L35 10 L44.5 11.5 L44.5 15.5 Z"
        fill="currentColor"
      />
      <path d="M20.8 9.2 L23.6 5.6 L29.2 5.6 L32 9.2 Z" fill="var(--background)" opacity="0.6" />
      <circle cx="13" cy="16.5" r="4.4" fill="currentColor" />
      <circle cx="34" cy="16.5" r="4.4" fill="currentColor" />
      <circle cx="13" cy="16.5" r="1.7" fill="var(--background)" />
      <circle cx="34" cy="16.5" r="1.7" fill="var(--background)" />
    </svg>
  );
}

/**
 * The word stream. The active word is pinned to the left edge and the rest
 * flow away from it, so the eye has a fixed landing point every word — in a
 * race the reading position should never move, unlike the wrapped, scrolling
 * block the main test uses.
 */
function WordStrip({ state, dimmed }: { state: GrandPrixState; dimmed: boolean }) {
  const active = state.words[state.wordIndex];
  const upcoming = state.words.slice(state.wordIndex + 1, state.wordIndex + VISIBLE_WORDS);

  return (
    <div
      className={cn(
        "relative flex h-[58px] w-full items-center overflow-hidden rounded-xl border border-border bg-sub-alt px-4 transition-opacity",
        dimmed && "opacity-45",
      )}
    >
      <div
        className="flex items-baseline gap-3 whitespace-nowrap font-mono text-2xl leading-none"
        style={{
          maskImage: "linear-gradient(to right, black 72%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 72%, transparent 100%)",
        }}
      >
        {active !== undefined && <ActiveWord target={active} typed={state.typed} />}
        {upcoming.map((word, i) => (
          <span key={`${state.wordIndex}-${i}`} className="text-sub/70">
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

function ActiveWord({ target, typed }: { target: string; typed: string }) {
  const length = Math.max(target.length, typed.length);
  const nodes: ReactNode[] = [];

  for (let i = 0; i <= length; i++) {
    if (i === typed.length) {
      nodes.push(
        <span
          key="caret"
          aria-hidden="true"
          className="inline-block w-[2px] self-center bg-caret"
          style={{ height: "1.15em" }}
        />,
      );
    }
    if (i === length) break;

    // Wrong characters are marked but never block progress — the word commits
    // on space whatever state it is in, same as the main typing test.
    const isExtra = i >= target.length;
    const char = isExtra ? typed[i] : target[i];
    const className = isExtra
      ? "text-error/70"
      : i >= typed.length
        ? "text-sub"
        : typed[i] === target[i]
          ? "text-correct"
          : "text-error underline decoration-error decoration-2 underline-offset-4";

    nodes.push(
      <span key={i} className={cn("char-instant", className)}>
        {char}
      </span>,
    );
  }

  return <span className="inline-flex items-baseline">{nodes}</span>;
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <span className="flex items-center gap-1.5 tabular-nums" aria-label={label}>
      <span className="text-sub/60" aria-hidden="true">
        {icon}
      </span>
      {value}
    </span>
  );
}

function ArcadeButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold uppercase tracking-wider text-background transition-transform hover:scale-105"
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
    <div className="flex max-w-sm flex-col items-center gap-5 text-center">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground arcade-glow-soft">
          {definition.name}
        </h2>
        <p className="text-sm text-sub">{definition.tagline}</p>
      </div>

      <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-wider text-sub">
        <span className="flex items-center gap-1.5">
          <Flag size={12} />
          {RACE_WORD_COUNT}
        </span>
        <span className="flex items-center gap-1.5">
          <Bot size={12} />
          {OPPONENT_COUNT}
        </span>
        {best && (
          <span className="flex items-center gap-1.5 text-accent">
            <Trophy size={12} />
            {best.score.toLocaleString()}
          </span>
        )}
      </div>

      <ArcadeButton onClick={onStart}>
        <Play size={15} />
        Start
      </ArcadeButton>

      <p className="font-mono text-[11px] uppercase tracking-wider text-sub/70">
        Space commits each word
      </p>
    </div>
  );
}

function ResultCard({
  place,
  score,
  wpm,
  accuracy,
  elapsedMs,
  isNewBest,
  best,
  onRestart,
}: {
  place: number;
  score: number;
  wpm: number;
  accuracy: number;
  elapsedMs: number;
  isNewBest: boolean;
  best: GameBest | null;
  onRestart: () => void;
}) {
  const seconds = (elapsedMs / 1000).toFixed(1);
  const won = place === 1;

  return (
    <div
      className="flex max-w-sm flex-col items-center gap-3 text-center"
      role="status"
      aria-live="polite"
    >
      {isNewBest ? (
        <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-accent arcade-pulse">
          <Trophy size={12} />
          New best
        </span>
      ) : (
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-sub">Race over</span>
      )}

      {/* The placing is the headline — this is a race, not a score attack. */}
      <span
        className={cn(
          "font-mono text-6xl font-semibold tabular-nums",
          won ? "text-accent arcade-glow" : "text-foreground arcade-glow-soft",
        )}
        aria-label={`Finished ${ORDINALS[place - 1] ?? `${place}th`} of ${LANE_COUNT}`}
      >
        {ORDINALS[place - 1] ?? `${place}th`}
      </span>

      <span className="flex items-center gap-1.5 font-mono text-2xl font-semibold tabular-nums text-accent">
        <Trophy size={16} className="text-accent/70" aria-hidden="true" />
        {score.toLocaleString()}
      </span>

      <div className="flex items-center gap-5 font-mono text-xs tabular-nums text-sub">
        <span className="flex items-center gap-1.5" aria-label={`${wpm} words per minute`}>
          <Gauge size={12} className="text-sub/60" aria-hidden="true" />
          {wpm}
        </span>
        <span className="flex items-center gap-1.5" aria-label={`${accuracy} percent accuracy`}>
          <Crosshair size={12} className="text-sub/60" aria-hidden="true" />
          {accuracy}%
        </span>
        <span className="flex items-center gap-1.5" aria-label={`${seconds} seconds`}>
          <Flag size={12} className="text-sub/60" aria-hidden="true" />
          {seconds}s
        </span>
        {best && !isNewBest && (
          <span className="flex items-center gap-1.5 text-accent/80" aria-label={`Best ${best.score}`}>
            <Trophy size={12} aria-hidden="true" />
            {best.score.toLocaleString()}
          </span>
        )}
      </div>

      <ArcadeButton onClick={onRestart}>
        <RotateCcw size={15} />
        Race again
      </ArcadeButton>
    </div>
  );
}

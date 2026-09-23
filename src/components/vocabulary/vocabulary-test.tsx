"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Play, RotateCcw, Sparkles, Trophy, X } from "lucide-react";
import { useVocabularyTest } from "@/lib/vocabulary/use-vocabulary-test";
import { pickSessionWords, SESSION_WORD_COUNT } from "@/lib/vocabulary/vocabulary-content";
import { VOCAB_WORDS, type VocabDifficulty } from "@/lib/vocabulary/vocabulary-words";
import { parseVocabProgress, recordVocabSession, vocabProgressKey } from "@/lib/vocabulary/vocabulary-progress";
import { getStorageItem } from "@/lib/persistence/storage";
import { calculateAccuracy, calculateLiveWpm, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";

// A round only changes progress by finishing, which re-renders this
// component anyway (the reducer's status flips to "over") — nothing to
// subscribe to beyond that, same pattern as GameBestBadge.
const noopSubscribe = () => () => {};

const DIFFICULTY_LABEL: Record<VocabDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const NEXT_DIFFICULTY: Record<VocabDifficulty, VocabDifficulty | null> = {
  easy: "medium",
  medium: "hard",
  hard: null,
};

interface VocabularyTestProps {
  difficulty: VocabDifficulty;
}

export function VocabularyTest({ difficulty }: VocabularyTestProps) {
  const { state, start, setTyped } = useVocabularyTest();
  const inputRef = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<{ newlyMastered: number; isNewBest: boolean } | null>(null);
  const recordedRef = useRef(false);

  // Null on the server and on first client render (matching), then the real
  // stored value once React reconciles — see GameBestBadge for the same
  // pattern. Recording a session writes to storage synchronously and also
  // flips `outcome`, which re-renders this component and re-reads a fresh
  // snapshot, so this alone stays correct across "New round" clicks too.
  const rawProgress = useSyncExternalStore(
    noopSubscribe,
    () => getStorageItem(vocabProgressKey()),
    () => null,
  );
  const progress = useMemo(() => parseVocabProgress(rawProgress), [rawProgress]);

  const pool = VOCAB_WORDS[difficulty];
  const tierProgress = progress[difficulty];

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  const handleStart = useCallback(() => {
    const mastered = new Set(progress[difficulty].mastered);
    const words = pickSessionWords(difficulty, mastered);
    setOutcome(null);
    recordedRef.current = false;
    start(difficulty, words);
  }, [difficulty, progress, start]);

  useEffect(() => {
    if (state.status === "running") focusInput();
  }, [state.status, focusInput]);

  useEffect(() => {
    if (state.status !== "over" || recordedRef.current) return;
    recordedRef.current = true;

    const accuracy = round(calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes));
    const wpm = round(calculateNetWpm(state.correctKeystrokes, state.elapsedMs));
    const result = recordVocabSession(difficulty, state.results, wpm, accuracy);
    setOutcome({ newlyMastered: result.newlyMastered, isNewBest: result.isNewBest });
  }, [state.status, state.results, state.correctKeystrokes, state.incorrectKeystrokes, state.elapsedMs, difficulty]);

  const current = state.words[state.index];
  const isRunning = state.status === "running";
  const wpmLive = round(calculateLiveWpm(state.correctKeystrokes, state.elapsedMs));
  const accuracyLive = round(calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4" onClick={focusInput}>
      <div className="relative flex min-h-[24rem] flex-col justify-center overflow-hidden rounded-2xl border border-border bg-sub-alt/20 p-6 sm:p-10">
        {state.status === "idle" && (
          <IntroCard
            difficulty={difficulty}
            totalWords={pool.length}
            tierProgress={tierProgress}
            onStart={handleStart}
          />
        )}

        {isRunning && current && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex w-full max-w-sm flex-col items-center gap-2">
              <div className="flex w-full items-center justify-between font-mono text-[11px] uppercase tracking-wider text-sub">
                <span>
                  Word {state.index + 1} / {state.words.length}
                </span>
                <span className="flex items-center gap-3">
                  <span>{wpmLive} wpm</span>
                  <span>{accuracyLive}% acc</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-sub-alt">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-200"
                  style={{ width: `${(state.index / state.words.length) * 100}%` }}
                />
              </div>
            </div>

            <span className="rounded-full border border-accent/40 bg-accent/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              {current.pos}
            </span>
            <p className="max-w-md text-lg leading-relaxed text-foreground sm:text-xl">{current.definition}</p>

            <WordReveal target={current.word} typed={state.typed} />
          </div>
        )}

        {state.status === "over" && (
          <ResultsCard difficulty={difficulty} state={state} outcome={outcome} onRestart={handleStart} />
        )}

        <input
          ref={inputRef}
          value={state.typed}
          onChange={(e) => setTyped(e.target.value.toLowerCase())}
          onPaste={(e) => e.preventDefault()}
          disabled={!isRunning}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Type the word this definition describes"
          className={cn(
            "absolute inset-0 h-full w-full cursor-text opacity-0",
            !isRunning && "pointer-events-none",
          )}
          style={{ fontSize: 16 }}
        />
      </div>
    </div>
  );
}

function WordReveal({ target, typed }: { target: string; typed: string }) {
  const length = Math.max(target.length, typed.length);
  const nodes: ReactNode[] = [];

  for (let i = 0; i < length; i++) {
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

  return <div className="font-mono text-4xl font-bold tracking-wide sm:text-5xl">{nodes}</div>;
}

function IntroCard({
  difficulty,
  totalWords,
  tierProgress,
  onStart,
}: {
  difficulty: VocabDifficulty;
  totalWords: number;
  tierProgress: { mastered: string[]; bestWpm: number } | null;
  onStart: () => void;
}) {
  const masteredCount = tierProgress?.mastered.length ?? 0;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="rounded-full border border-accent/40 bg-accent/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
        {DIFFICULTY_LABEL[difficulty]}
      </span>
      <h2 className="font-display text-2xl font-black uppercase tracking-tight text-foreground">
        Vocabulary sprint
      </h2>
      <p className="max-w-sm text-sm leading-relaxed text-sub">
        A definition appears — type the word it describes. {SESSION_WORD_COUNT} words a round, words you haven&apos;t
        mastered yet come first.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-mono text-xs uppercase tracking-wider text-sub">
        <span>{totalWords} words in this tier</span>
        <span>{masteredCount} mastered</span>
        {tierProgress && tierProgress.bestWpm > 0 && <span className="text-accent">{tierProgress.bestWpm} best wpm</span>}
      </div>
      <button
        type="button"
        onClick={onStart}
        className="flex h-12 items-center gap-2 rounded-lg bg-accent px-8 font-display text-xs font-bold uppercase tracking-[0.16em] text-background transition-[filter] duration-200 hover:brightness-110"
      >
        <Play size={15} />
        Start
      </button>
    </div>
  );
}

function ResultsCard({
  difficulty,
  state,
  outcome,
  onRestart,
}: {
  difficulty: VocabDifficulty;
  state: { results: { word: string; correct: boolean }[]; correctKeystrokes: number; incorrectKeystrokes: number; elapsedMs: number };
  outcome: { newlyMastered: number; isNewBest: boolean } | null;
  onRestart: () => void;
}) {
  const accuracy = round(calculateAccuracy(state.correctKeystrokes, state.incorrectKeystrokes));
  const wpm = round(calculateNetWpm(state.correctKeystrokes, state.elapsedMs));
  const correctFirstTry = state.results.filter((r) => r.correct).length;
  const missed = state.results.filter((r) => !r.correct);
  const next = NEXT_DIFFICULTY[difficulty];

  return (
    <div className="flex flex-col items-center gap-4 text-center" role="status" aria-live="polite">
      {outcome?.isNewBest ? (
        <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-accent arcade-pulse">
          <Trophy size={12} />
          New best WPM
        </span>
      ) : (
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-sub">Round complete</span>
      )}

      <div className="flex items-center gap-6 font-mono text-sm text-sub">
        <Stat value={wpm} label="wpm" />
        <Stat value={`${accuracy}%`} label="accuracy" />
        <Stat value={`${correctFirstTry}/${state.results.length}`} label="first try" />
        {outcome && outcome.newlyMastered > 0 && <Stat value={`+${outcome.newlyMastered}`} label="mastered" />}
      </div>

      {missed.length > 0 && (
        <div className="flex w-full max-w-md flex-col gap-1.5 rounded-xl border border-border bg-background/50 p-4 text-left">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-sub">Review these</p>
          {missed.map((m) => (
            <div key={m.word} className="flex items-center gap-2 font-mono text-xs text-sub">
              <X size={12} className="shrink-0 text-error" />
              <span className="font-semibold text-foreground">{m.word}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="flex h-11 items-center gap-2 rounded-lg bg-accent px-6 font-display text-xs font-bold uppercase tracking-[0.16em] text-background transition-[filter] duration-200 hover:brightness-110"
        >
          <RotateCcw size={14} />
          New round
        </button>
        {next && (
          <Link
            href={`/vocabulary/${next}`}
            className="flex h-11 items-center gap-2 rounded-lg border border-border px-6 font-display text-xs uppercase tracking-[0.14em] text-sub transition-colors hover:border-accent hover:text-foreground"
          >
            <Sparkles size={13} />
            Try {DIFFICULTY_LABEL[next]}
            <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className="flex items-center gap-1 text-lg font-bold text-foreground">{value}</span>
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-sub">
        {label === "first try" && <Check size={10} className="text-correct" />}
        {label}
      </span>
    </span>
  );
}

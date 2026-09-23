"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import type { TestConfig } from "@/lib/typing-engine/engine-types";
import { useTypingEngine } from "@/lib/typing-engine/use-typing-engine";
import { calculateAccuracy, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { HiddenInput } from "@/components/typing-test/hidden-input";
import { WordStream } from "@/components/typing-test/word-stream";
import { VirtualKeyboard } from "@/components/lessons/virtual-keyboard";
import { buildDrillLine } from "@/lib/lessons/lesson-content";
import { getWeakKeys } from "@/lib/lessons/key-performance";
import { useKeyPerformanceStore, getKeyStats } from "@/lib/lessons/key-performance-store";
import { playSound } from "@/lib/games/game-audio";
import { useSettingsStore } from "@/lib/persistence/settings-store";

const PRACTICE_WORD_COUNT = 20;

function buildConfig(weakKeys: string[]): TestConfig {
  return {
    mode: "custom",
    timeDuration: 30,
    wordCount: 10,
    quoteLength: "short",
    vocabDifficulty: "easy",
    customText: buildDrillLine(weakKeys, PRACTICE_WORD_COUNT),
    punctuation: false,
    numbers: false,
  };
}

/**
 * Closes the loop from "here's your weakness" to "practice it" — reuses
 * buildDrillLine (already pure/tested) and the exact same engine/WordStream/
 * VirtualKeyboard as lesson-drill.tsx, just without sub-lesson stepping: one
 * run, retry regenerates, no unit to gate or record against (this isn't a
 * curriculum unit, so it doesn't touch lesson-progress-store or award XP).
 */
export function PracticeDrill() {
  const keys = useKeyPerformanceStore((s) => s.keys);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const recordKeyAttempt = useKeyPerformanceStore((s) => s.recordKeyAttempt);

  const weakKeys = useMemo(() => getWeakKeys(getKeyStats(keys)), [keys]);
  const [attempt, setAttempt] = useState(0);
  const [focusToken, setFocusToken] = useState(0);

  const config = useMemo(
    () => buildConfig(weakKeys),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attempt forces a fresh generated string on retry; weakKeys is read once per mount so a mid-drill store update can't yank the text out from under the user
    [attempt],
  );
  const engine = useTypingEngine(config);

  const lastAppliedConfigRef = useRef(config);
  const soundCountsRef = useRef({ correct: 0, incorrect: 0 });
  useEffect(() => {
    if (lastAppliedConfigRef.current === config) return;
    lastAppliedConfigRef.current = config;
    engine.applyConfig(config);
    soundCountsRef.current = { correct: 0, incorrect: 0 };
    setFocusToken((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    const prev = soundCountsRef.current;
    if (engine.state.correctKeystrokes > prev.correct) playSound("lesson-key", soundEnabled);
    if (engine.state.incorrectKeystrokes > prev.incorrect) playSound("lesson-typo", soundEnabled);
    soundCountsRef.current = { correct: engine.state.correctKeystrokes, incorrect: engine.state.incorrectKeystrokes };
  }, [engine.state.correctKeystrokes, engine.state.incorrectKeystrokes, soundEnabled]);

  const isFinished = engine.state.status === "finished";
  const recordedRef = useRef(false);
  useEffect(() => {
    if (!isFinished) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordKeyAttempt(engine.state.wordStates);
    playSound("lesson-clear", soundEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  const activeWord = engine.state.wordStates[engine.state.activeWordIndex];
  const nextKey = useMemo(() => {
    if (isFinished || !activeWord) return null;
    return activeWord.typed.length < activeWord.target.length ? activeWord.target[activeWord.typed.length] : " ";
  }, [isFinished, activeWord]);

  const wpm = round(calculateNetWpm(engine.state.correctKeystrokes, engine.state.elapsedMs));
  const accuracy = round(
    calculateAccuracy(engine.state.correctKeystrokes, engine.state.incorrectKeystrokes, engine.state.charTally.missed),
  );

  function retry() {
    setAttempt((a) => a + 1);
  }

  if (weakKeys.length === 0) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded-xl border border-border bg-sub-alt/30 p-10 text-center">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-foreground">Nothing to drill yet</p>
        <p className="max-w-sm text-sm text-sub">
          Keep practicing lessons — once a key shows a real pattern of trouble, a drill for it will appear here.
        </p>
        <Link
          href="/lessons"
          className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-background transition-[filter] hover:brightness-110"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to lessons
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-8">
      <div className="flex w-full items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wider text-sub">
        <Link href="/lessons" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
          <ArrowLeft size={13} aria-hidden="true" />
          Lessons
        </Link>
        <span className="whitespace-nowrap font-bold text-foreground">
          Weak key drill: {weakKeys.map((k) => (k === " " ? "space" : k)).join(", ")}
        </span>
      </div>

      {!isFinished && (
        <div className="relative w-full cursor-pointer" onClick={() => setFocusToken((t) => t + 1)}>
          <WordStream wordStates={engine.state.wordStates} activeWordIndex={engine.state.activeWordIndex} />
          <HiddenInput
            value={activeWord?.typed ?? ""}
            status={engine.state.status}
            onChange={engine.setTyped}
            onCommitWord={engine.commitWord}
            onRestart={retry}
            onEscape={() => {}}
            onFocusChange={() => {}}
            focusToken={focusToken}
          />
        </div>
      )}

      <VirtualKeyboard nextKey={nextKey} />

      {isFinished && (
        <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-border bg-sub-alt/30 p-6 text-center">
          <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-correct">
            <CheckCircle2 size={16} aria-hidden="true" />
            Drill complete
          </p>
          <div className="flex gap-8 font-mono text-sm text-sub">
            <span>
              <span className="text-lg text-foreground">{wpm}</span> wpm
            </span>
            <span>
              <span className="text-lg text-foreground">{accuracy}%</span> accuracy
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={retry}
              className="flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm text-sub transition-colors hover:border-accent hover:text-foreground"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Practice again
            </button>
            <Link
              href="/lessons"
              className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-background transition-[filter] hover:brightness-110"
            >
              Back to lessons
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

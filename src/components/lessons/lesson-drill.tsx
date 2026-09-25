"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Lock, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { TestConfig } from "@/lib/typing-engine/engine-types";
import { useTypingEngine } from "@/lib/typing-engine/use-typing-engine";
import { calculateAccuracy, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { HiddenInput } from "@/components/typing-test/hidden-input";
import { WordStream } from "@/components/typing-test/word-stream";
import { VirtualKeyboard } from "@/components/lessons/virtual-keyboard";
import { buildSubLessons, buildTextForContent, type SubLessonSpec } from "@/lib/lessons/lesson-content";
import { isLessonUnlocked, useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { LESSON_LIST, type LessonDefinition } from "@/lib/lessons/lesson-types";
import { getWeakKeys, tallyKeyAttempt } from "@/lib/lessons/key-performance";
import { useKeyPerformanceStore } from "@/lib/lessons/key-performance-store";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { playSound } from "@/lib/games/game-audio";
import { awardXp, bumpStat } from "@/lib/profile/player-profile";
import { cn } from "@/lib/utils/cn";

// Lessons deliberately do not go through the main TypingTest component --
// that component is wired to settings-store (mode/duration/punctuation
// pickers a lesson doesn't offer) and ResultsPanel (a full graph/breakdown
// tuned for a real test run, not a pass/fail drill). Instead this drives
// useTypingEngine directly in "custom" mode, reusing HiddenInput and
// WordStream exactly as-is, and runs it once per sub-lesson step rather than
// once per unit -- see buildSubLessons in lesson-content.ts for how one unit
// becomes several graduated steps.

function buildConfig(content: SubLessonSpec["content"]): TestConfig {
  return {
    mode: "custom",
    // Unused by "custom" mode but required by TestConfig's shape.
    timeDuration: 30,
    wordCount: 10,
    quoteLength: "short",
    vocabDifficulty: "easy",
    customText: buildTextForContent(content),
    punctuation: false,
    numbers: false,
  };
}

interface LessonDrillProps {
  definition: LessonDefinition;
}

export function LessonDrill({ definition }: LessonDrillProps) {
  const router = useRouter();
  const subLessons = useMemo(() => buildSubLessons(definition), [definition]);
  const recordAttempt = useLessonProgressStore((s) => s.recordAttempt);
  // zustand's persist rehydrates localStorage synchronously (it's a sync
  // Web Storage API), and LessonDrill only ever mounts client-side behind
  // next/dynamic(ssr:false) -- so by the time this reads the store, real
  // progress (if any) is already there, not a pre-hydration default.
  const existingProgress = useLessonProgressStore((s) => s.units[definition.id]);
  // The dashboard only *visually* disables a locked unit's card -- nothing
  // previously stopped someone from typing this route directly and playing
  // (and completing, and earning its achievements) a unit whose prerequisite
  // was never finished. Enforced here too now, not just on the card.
  const allUnits = useLessonProgressStore((s) => s.units);
  const unlocked = isLessonUnlocked(definition.id, allUnits);
  const recordKeyAttempt = useKeyPerformanceStore((s) => s.recordKeyAttempt);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const [sessionStep, setSessionStep] = useState<number>(() => {
    if (!existingProgress || existingProgress.completed) return 1;
    return Math.min(existingProgress.currentStep + 1, subLessons.length);
  });
  const [attempt, setAttempt] = useState(0);
  const [focusToken, setFocusToken] = useState(0);
  const [isFocused, setIsFocused] = useState(true);

  const stepSpec = subLessons[sessionStep - 1];

  // Regenerated on every retry so a step never replays the exact same string
  // twice in a row -- unlike the main test's custom mode, where the text is
  // the user's own and restarting should replay it verbatim.
  const config = useMemo(
    () => buildConfig(stepSpec.content),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attempt isn't read inside, it only forces a fresh generated string on retry
    [stepSpec, attempt],
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
    // engine.applyConfig is stable; config identity already captures every input that should retrigger this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Keystroke sound: fires off the same deltas the games use, via the same
  // lightweight synth module (game-audio.ts) -- no new audio system, just
  // lesson-tuned tone presets (fuller/louder than the games' own).
  useEffect(() => {
    const prev = soundCountsRef.current;
    if (engine.state.correctKeystrokes > prev.correct) playSound("lesson-key", soundEnabled);
    if (engine.state.incorrectKeystrokes > prev.incorrect) playSound("lesson-typo", soundEnabled);
    soundCountsRef.current = { correct: engine.state.correctKeystrokes, incorrect: engine.state.incorrectKeystrokes };
  }, [engine.state.correctKeystrokes, engine.state.incorrectKeystrokes, soundEnabled]);

  const isFinished = engine.state.status === "finished";

  const recordedRef = useRef(false);
  // Stale `result` from a previous step is harmless to leave in state between
  // runs: the panel below only renders when `isFinished && result`, and
  // `isFinished` goes false the instant a retry/continue resets the engine --
  // so there's nothing to visually clear, only the guard ref to reset.
  const [result, setResult] = useState<{ passed: boolean; unitCompleted: boolean } | null>(null);
  useEffect(() => {
    if (!isFinished) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;

    const wpm = calculateNetWpm(engine.state.correctKeystrokes, engine.state.elapsedMs);
    const accuracy = calculateAccuracy(
      engine.state.correctKeystrokes,
      engine.state.incorrectKeystrokes,
      engine.state.charTally.missed,
    );
    // Captured before recordAttempt mutates the store -- computeUnitProgressUpdate
    // returns unitCompleted:true on every passing re-run of a unit's last step
    // (including a deliberate Restart on an already-completed unit), so XP must
    // be gated on the completed->completed transition, not the returned flag
    // alone, or restarting a finished unit would farm infinite XP.
    const wasAlreadyCompleted = existingProgress?.completed ?? false;
    const outcome = recordAttempt(definition.id, {
      step: sessionStep,
      totalSteps: subLessons.length,
      accuracy,
      wpm,
      typedChars: engine.state.totalTyped,
      correctChars: engine.state.correctKeystrokes,
      incorrectChars: engine.state.incorrectKeystrokes,
      elapsedMs: engine.state.elapsedMs,
      minAccuracy: stepSpec.minAccuracy,
    });
    recordKeyAttempt(engine.state.wordStates);
    if (!wasAlreadyCompleted && outcome.unitCompleted) {
      bumpStat("lessons", "unitsCompleted");
      awardXp(50 + Math.round(wpm));
    }
    playSound(outcome.passed ? "lesson-clear" : "lesson-miss", soundEnabled);
    setResult(outcome);
    // intentionally narrow: only re-evaluate when the run transitions to "finished"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  const activeWord = engine.state.wordStates[engine.state.activeWordIndex];

  const nextKey = useMemo(() => {
    if (isFinished || !activeWord) return null;
    return activeWord.typed.length < activeWord.target.length
      ? activeWord.target[activeWord.typed.length]
      : " ";
  }, [isFinished, activeWord]);

  const wpm = round(calculateNetWpm(engine.state.correctKeystrokes, engine.state.elapsedMs));
  const accuracy = round(
    calculateAccuracy(engine.state.correctKeystrokes, engine.state.incorrectKeystrokes, engine.state.charTally.missed),
  );

  // Derived live from just this attempt's wordStates, no store round-trip --
  // a lower minAttempts than the global weak-key threshold since one run has
  // far fewer keystrokes per key to judge from.
  const attemptWeakKeys = useMemo(() => {
    if (!isFinished) return [];
    const stats = tallyKeyAttempt(engine.state.wordStates);
    return getWeakKeys(stats, { minAttempts: 3, accuracyThreshold: 90 });
  }, [isFinished, engine.state.wordStates]);

  const isLastStep = sessionStep >= subLessons.length;
  const currentIndex = LESSON_LIST.findIndex((l) => l.id === definition.id);
  const nextUnit = currentIndex >= 0 ? LESSON_LIST[currentIndex + 1] : undefined;
  const stepsCompleted = isFinished && result?.passed ? sessionStep : sessionStep - 1;
  const progressPct = Math.round((stepsCompleted / subLessons.length) * 100);

  function retryStep() {
    setAttempt((a) => a + 1);
  }

  function continueToNextStep() {
    setSessionStep((s) => Math.min(s + 1, subLessons.length));
    setAttempt((a) => a + 1);
  }

  // Enter advances past a passed result the same way clicking the primary
  // button would -- Continue mid-unit, the next unit's route once it's
  // complete, or the graduation CTA on the final unit. Only while a passed
  // result is actually showing: Enter does nothing mid-drill (the hidden
  // input isn't even mounted by then) or on a failed attempt, where the only
  // sensible action is a deliberate Retry click.
  useEffect(() => {
    if (!isFinished || !result?.passed) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (!result?.passed) return;
      if (!result.unitCompleted) {
        continueToNextStep();
      } else if (nextUnit) {
        router.push(`/lessons/${nextUnit.id}`);
      } else {
        router.push("/");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- continueToNextStep/router are stable enough here; re-binding on every result/nextUnit change is what keeps the handler's closure correct
  }, [isFinished, result, nextUnit, router]);

  // Every hook above still runs even when locked (Rules of Hooks) -- they
  // just sit inert, since nothing below ever mounts HiddenInput to feed them
  // real input. This is the actual enforcement: no typing surface renders
  // at all for a unit whose prerequisite isn't complete.
  if (!unlocked) {
    const previousUnit = currentIndex > 0 ? LESSON_LIST[currentIndex - 1] : undefined;
    return (
      <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded-xl border border-border bg-sub-alt/30 p-10 text-center">
        <Lock size={28} className="text-sub" aria-hidden="true" />
        <p className="font-display text-sm font-bold uppercase tracking-wide text-foreground">Unit locked</p>
        <p className="max-w-sm text-sm text-sub">
          {previousUnit
            ? `Complete "${previousUnit.name}" first to unlock this unit.`
            : "This unit isn't unlocked yet."}
        </p>
        <Link
          href="/lessons"
          className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-background transition-[filter] hover:brightness-110"
        >
          Back to all lessons
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-8">
      <div className="flex w-full items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wider text-sub">
        <span className="whitespace-nowrap font-bold text-foreground">
          Step {sessionStep} of {subLessons.length}
        </span>
        <div className="h-2 flex-1 max-w-48 overflow-hidden rounded-full border border-border bg-sub-alt">
          <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          title={soundEnabled ? "Mute sound" : "Unmute sound"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>

      {!isFinished && (
        <div className="relative w-full cursor-pointer" onClick={() => setFocusToken((t) => t + 1)}>
          <WordStream wordStates={engine.state.wordStates} activeWordIndex={engine.state.activeWordIndex} />
          <HiddenInput
            value={activeWord?.typed ?? ""}
            status={engine.state.status}
            onChange={engine.setTyped}
            onCommitWord={engine.commitWord}
            onRestart={retryStep}
            onEscape={() => {}}
            onFocusChange={setIsFocused}
            focusToken={focusToken}
          />
          {engine.state.status === "running" && !isFocused && (
            <div
              role="status"
              className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-[2px]"
            >
              <span className="font-display text-sm uppercase tracking-wider text-sub">
                Click or press a key to resume &mdash; the clock is still running
              </span>
            </div>
          )}
        </div>
      )}

      <VirtualKeyboard nextKey={nextKey} />

      {isFinished && result && (
        <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-border bg-sub-alt/30 p-6 text-center">
          <p
            className={cn(
              "flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide",
              result.passed ? "text-correct" : "text-error",
            )}
          >
            {result.passed && <CheckCircle2 size={16} aria-hidden="true" />}
            {result.passed
              ? result.unitCompleted
                ? "Unit complete"
                : `Step ${sessionStep} passed`
              : "Not quite — try again"}
          </p>

          <div className="flex gap-8 font-mono text-sm text-sub">
            <span>
              <span className="text-lg text-foreground">{wpm}</span> wpm
            </span>
            <span>
              <span className="text-lg text-foreground">{accuracy}%</span> accuracy
            </span>
            <span>
              <span className="text-lg text-foreground">{stepSpec.minAccuracy}%</span> required
            </span>
          </div>

          {attemptWeakKeys.length > 0 && (
            <Link
              href="/lessons/practice"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs text-sub transition-colors hover:border-accent hover:text-foreground"
            >
              Keys to review:{" "}
              <span className="font-mono font-bold text-foreground">
                {attemptWeakKeys.map((k) => (k === " " ? "space" : k)).join(", ")}
              </span>
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={retryStep}
              className="flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm text-sub transition-colors hover:border-accent hover:text-foreground"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Retry
            </button>

            {result.passed && !result.unitCompleted && (
              <button
                type="button"
                onClick={continueToNextStep}
                className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-background transition-[filter] hover:brightness-110"
              >
                Continue
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}

            {result.passed && result.unitCompleted && nextUnit && (
              <Link
                href={`/lessons/${nextUnit.id}`}
                className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-background transition-[filter] hover:brightness-110"
              >
                Next unit
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}

            {result.passed && result.unitCompleted && !nextUnit && (
              <>
                <Link
                  href="/"
                  className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-background transition-[filter] hover:brightness-110"
                >
                  Take the typing test
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link
                  href="/games"
                  className="flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm text-sub transition-colors hover:border-accent hover:text-foreground"
                >
                  Try a game
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {!isLastStep && !isFinished && (
        <p className="text-center text-xs text-sub">
          {subLessons.length - sessionStep} more step{subLessons.length - sessionStep === 1 ? "" : "s"} in this unit
        </p>
      )}
    </div>
  );
}

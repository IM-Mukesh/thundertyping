"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  HelpCircle,
  Lock,
  RotateCcw,
  Sparkles,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";
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
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";

function buildConfig(content: SubLessonSpec["content"]): TestConfig {
  return {
    mode: "custom",
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
  const existingProgress = useLessonProgressStore((s) => s.units[definition.id]);
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

  const stepSpec = subLessons[sessionStep - 1] ?? subLessons[0];

  const config = useMemo(
    () => buildConfig(stepSpec.content),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Keystroke sound effects
  useEffect(() => {
    const prev = soundCountsRef.current;
    if (engine.state.correctKeystrokes > prev.correct) playSound("lesson-key", soundEnabled);
    if (engine.state.incorrectKeystrokes > prev.incorrect) playSound("lesson-typo", soundEnabled);
    soundCountsRef.current = { correct: engine.state.correctKeystrokes, incorrect: engine.state.incorrectKeystrokes };
  }, [engine.state.correctKeystrokes, engine.state.incorrectKeystrokes, soundEnabled]);

  const isFinished = engine.state.status === "finished";

  const lessonStartedRef = useRef(false);
  useEffect(() => {
    if (engine.state.status === "running" && !lessonStartedRef.current) {
      lessonStartedRef.current = true;
      trackEvent("lesson_started", {
        lesson_id: definition.id,
        lesson_title: definition.name,
        lesson_number: definition.order,
        tier: definition.tier,
        stage: definition.stage,
      });
    }
  }, [engine.state.status, definition]);

  const recordedRef = useRef(false);
  const [result, setResult] = useState<{ passed: boolean; unitCompleted: boolean; xpAwarded: number } | null>(null);

  useEffect(() => {
    if (!isFinished) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;

    const netWpm = calculateNetWpm(engine.state.netWpmCharacters, engine.state.elapsedMs);
    const accuracy = calculateAccuracy(
      engine.state.correctKeystrokes,
      engine.state.incorrectKeystrokes,
      engine.state.charTally.missed,
    );

    const wasAlreadyCompleted = existingProgress?.completed ?? false;
    const outcome = recordAttempt(definition.id, {
      step: sessionStep,
      totalSteps: subLessons.length,
      accuracy,
      wpm: netWpm,
      typedChars: engine.state.totalTyped,
      correctChars: engine.state.correctKeystrokes,
      incorrectChars: engine.state.incorrectKeystrokes,
      elapsedMs: engine.state.elapsedMs,
      minAccuracy: stepSpec.minAccuracy,
    });
    recordKeyAttempt(engine.state.wordStates);

    let xpGained = 0;
    if (!wasAlreadyCompleted && outcome.unitCompleted) {
      bumpStat("lessons", "unitsCompleted");
      xpGained = 50 + Math.round(netWpm);
      awardXp(xpGained);
    }

    if (outcome.unitCompleted) {
      trackEvent("lesson_completed", {
        lesson_id: definition.id,
        lesson_title: definition.name,
        lesson_number: definition.order,
        tier: definition.tier,
        stage: definition.stage,
        wpm: Math.round(netWpm),
        accuracy: Math.round(accuracy),
        duration_ms: engine.state.elapsedMs,
        steps: subLessons.length,
      });
    }

    playSound(outcome.passed ? "lesson-clear" : "lesson-miss", soundEnabled);
    setResult({ ...outcome, xpAwarded: xpGained });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  const activeWord = engine.state.wordStates[engine.state.activeWordIndex];

  const nextKey = useMemo(() => {
    if (isFinished || !activeWord) return null;
    return activeWord.typed.length < activeWord.target.length
      ? activeWord.target[activeWord.typed.length]
      : " ";
  }, [isFinished, activeWord]);

  const wpm = round(calculateNetWpm(engine.state.netWpmCharacters, engine.state.elapsedMs));
  const accuracy = round(
    calculateAccuracy(engine.state.correctKeystrokes, engine.state.incorrectKeystrokes, engine.state.charTally.missed),
  );

  const attemptWeakKeys = useMemo(() => {
    if (!isFinished) return [];
    const stats = tallyKeyAttempt(engine.state.wordStates);
    return getWeakKeys(stats, { minAttempts: 3, accuracyThreshold: 90 });
  }, [isFinished, engine.state.wordStates]);

  const currentIndex = LESSON_LIST.findIndex((l) => l.id === definition.id);
  const nextUnit = currentIndex >= 0 ? LESSON_LIST[currentIndex + 1] : undefined;
  const previousUnit = currentIndex > 0 ? LESSON_LIST[currentIndex - 1] : undefined;
  const stepsCompleted = isFinished && result?.passed ? sessionStep : sessionStep - 1;
  const progressPct = Math.round((stepsCompleted / subLessons.length) * 100);

  function retryStep() {
    setAttempt((a) => a + 1);
  }

  function continueToNextStep() {
    setSessionStep((s) => Math.min(s + 1, subLessons.length));
    setAttempt((a) => a + 1);
  }

  // Keyboard shortcut Enter advances on passed step
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, result, nextUnit, router]);

  // Locked unit guard
  if (!unlocked) {
    return (
      <div className="theme-transition flex w-full max-w-2xl flex-col items-center gap-5 rounded-2xl border border-border bg-sub-alt/20 p-8 sm:p-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-sub-alt text-sub">
          <Lock size={24} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-foreground sm:text-xl">
            This lesson is locked
          </h2>
          <p className="max-w-md text-xs sm:text-sm leading-relaxed text-sub">
            {previousUnit
              ? `Complete "${previousUnit.name}" first to unlock this lesson and preserve natural progression.`
              : "Complete the previous lesson first to unlock this unit."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row pt-2">
          {previousUnit && (
            <Link
              href={`/lessons/${previousUnit.id}`}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110 shadow-md"
            >
              Go to {previousUnit.name}
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          )}
          <Link
            href="/lessons"
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-sub-alt/40 px-6 font-display text-xs font-semibold text-sub transition-colors hover:border-accent hover:text-foreground"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            Back to curriculum
          </Link>
        </div>
      </div>
    );
  }

  const isSyntheticEarlyDrill =
    definition.newKeys.length > 0 &&
    (stepSpec.phase === "warmup" || stepSpec.phase === "patterns");

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      {/* Step Progress & Controls Header */}
      <div className="flex w-full flex-col gap-2 rounded-xl border border-border/80 bg-sub-alt/20 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3 font-mono text-[11px] text-sub">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-foreground">
              Step {sessionStep} of {subLessons.length}
            </span>
            <span className="hidden sm:inline text-sub/60">&middot;</span>
            <span className="hidden sm:inline font-display text-[10px] uppercase font-bold text-accent">
              {stepSpec.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-sub">Min: {stepSpec.minAccuracy}% acc</span>
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
              title={soundEnabled ? "Mute sound" : "Unmute sound"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full border border-border/40 bg-sub-alt">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Pedagogical Objective / Step Notice */}
      {!isFinished && (
        <div className="flex w-full flex-col gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3.5 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-accent/20 text-accent font-display text-[10px] font-bold">
              🎯
            </span>
            <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
              {stepSpec.title}
            </span>
          </div>
          <p className="text-xs text-sub leading-relaxed">{stepSpec.objective}</p>

          {isSyntheticEarlyDrill && (
            <p className="mt-1 border-t border-accent/20 pt-1.5 text-[11px] text-sub/80 italic flex items-center gap-1.5">
              <HelpCircle size={12} className="shrink-0 text-accent" aria-hidden="true" />
              Finger Warm-up: This step intentionally uses short key combinations to build muscle memory before full English words become possible.
            </p>
          )}
        </div>
      )}

      {/* Typing Surface */}
      {!isFinished && (
        <div
          className="relative w-full cursor-pointer rounded-xl border border-border bg-sub-alt/10 p-4 transition-colors hover:border-accent/40"
          onClick={() => setFocusToken((t) => t + 1)}
        >
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
              className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-[2px]"
            >
              <span className="font-display text-xs uppercase tracking-wider text-sub">
                Click or press a key to resume &mdash; the clock is running
              </span>
            </div>
          )}
        </div>
      )}

      {/* Virtual Keyboard & Hand Guide */}
      <VirtualKeyboard nextKey={nextKey} />

      {/* Result & Feedback Screen */}
      {isFinished && result && (
        <div className="theme-transition flex w-full flex-col items-center gap-5 rounded-2xl border border-border bg-sub-alt/30 p-6 sm:p-8 text-center shadow-lg">
          {result.unitCompleted ? (
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent mb-1 animate-bounce">
                <Sparkles size={24} aria-hidden="true" />
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                Lesson Complete!
              </h2>
              <p className="text-xs sm:text-sm text-sub max-w-md">
                You&apos;ve cleared all {subLessons.length} steps in {definition.name}.
              </p>
              {result.xpAwarded > 0 && (
                <span className="mt-1 flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 font-display text-xs font-bold text-accent">
                  <Award size={14} aria-hidden="true" /> +{result.xpAwarded} XP Earned
                </span>
              )}
            </div>
          ) : result.passed ? (
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 font-display text-base font-bold uppercase tracking-wide text-correct">
                <CheckCircle2 size={18} aria-hidden="true" /> Step {sessionStep} Passed
              </div>
              <p className="text-xs text-sub">
                {subLessons.length - sessionStep} more step{subLessons.length - sessionStep === 1 ? "" : "s"} to complete this lesson.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="font-display text-base font-bold uppercase tracking-wide text-error">
                Needs Improvement &mdash; Try Again
              </div>
              <p className="text-xs text-sub max-w-sm">
                Aim for {stepSpec.minAccuracy}% accuracy to advance. Slow down slightly to let muscle memory take over.
              </p>
            </div>
          )}

          {/* Performance Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 rounded-xl border border-border/80 bg-background/50 px-6 py-4 font-mono text-sm text-sub">
            <div>
              <span className="font-display text-xl font-bold text-foreground">{wpm}</span>{" "}
              <span className="text-xs">WPM</span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <span
                className={cn(
                  "font-display text-xl font-bold",
                  accuracy >= stepSpec.minAccuracy ? "text-foreground" : "text-error",
                )}
              >
                {accuracy}%
              </span>{" "}
              <span className="text-xs">accuracy</span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <span className="font-display text-xl font-bold text-sub">{stepSpec.minAccuracy}%</span>{" "}
              <span className="text-xs">required</span>
            </div>
          </div>

          {/* Weak Keys Notice */}
          {attemptWeakKeys.length > 0 && (
            <Link
              href="/lessons/practice"
              className="flex items-center gap-2 rounded-xl border border-border bg-sub-alt/40 px-4 py-2.5 text-xs text-sub transition-colors hover:border-accent hover:text-foreground"
            >
              <Target size={13} className="text-accent" aria-hidden="true" />
              <span>
                Keys to review:{" "}
                <strong className="font-mono font-bold text-foreground">
                  {attemptWeakKeys.map((k) => (k === " " ? "space" : k.toUpperCase())).join(", ")}
                </strong>
              </span>
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={retryStep}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border px-5 text-xs font-bold uppercase tracking-wider text-sub transition-colors hover:border-accent hover:text-foreground"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Retry
            </button>

            {result.passed && !result.unitCompleted && (
              <button
                type="button"
                onClick={continueToNextStep}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-accent px-6 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110 shadow-md"
              >
                Continue (Enter)
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}

            {result.passed && result.unitCompleted && nextUnit && (
              <Link
                href={`/lessons/${nextUnit.id}`}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-accent px-6 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110 shadow-md"
              >
                Next Lesson: {nextUnit.name}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}

            {result.passed && result.unitCompleted && !nextUnit && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="flex min-h-[44px] items-center gap-2 rounded-xl bg-accent px-6 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110 shadow-md"
                >
                  Take the Typing Test
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link
                  href="/games"
                  className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border px-5 text-xs font-bold uppercase tracking-wider text-sub transition-colors hover:border-accent hover:text-foreground"
                >
                  Explore Games
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

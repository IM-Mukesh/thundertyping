"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Lock,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { TestConfig } from "@/lib/typing-engine/engine-types";
import { useTypingEngine } from "@/lib/typing-engine/use-typing-engine";
import { calculateAccuracy, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { HiddenInput } from "@/components/typing-test/hidden-input";
import { CapsLockIndicator } from "@/components/typing-test/caps-lock-indicator";
import { WordStream } from "@/components/typing-test/word-stream";
import { VirtualKeyboard } from "@/components/lessons/virtual-keyboard";
import { LessonCompletionModal } from "@/components/lessons/lesson-completion-modal";
import { buildSubLessons, buildTextForContent, type SubLessonSpec } from "@/lib/lessons/lesson-content";
import { isLessonUnlocked, useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { LESSON_LIST, type LessonDefinition } from "@/lib/lessons/lesson-types";
import { evaluateLessonStars } from "@/lib/lessons/star-system";
import { useKeyPerformanceStore } from "@/lib/lessons/key-performance-store";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { playSound } from "@/lib/games/game-audio";
import { awardXp, bumpStat } from "@/lib/profile/player-profile";
import { trackEvent } from "@/lib/analytics";

function buildConfig(content: SubLessonSpec["content"], seed?: number): TestConfig {
  return {
    mode: "custom",
    timeDuration: 30,
    wordCount: 10,
    quoteLength: "short",
    vocabDifficulty: "easy",
    wordDifficulty: "all",
    customText: buildTextForContent(content, seed),
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
  const [retryFocusKeys, setRetryFocusKeys] = useState<string[] | undefined>();
  const [focusToken, setFocusToken] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [lastPressedKey, setLastPressedKey] = useState<string | null>(null);
  const lastPressedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (lastPressedTimerRef.current) clearTimeout(lastPressedTimerRef.current);
    };
  }, []);

  const stepSpec = subLessons[sessionStep - 1] ?? subLessons[0];

  const effectiveContent = useMemo(() => {
    if (retryFocusKeys && retryFocusKeys.length > 0 && stepSpec.content.kind === "drill") {
      return {
        ...stepSpec.content,
        focusKeys: retryFocusKeys,
      };
    }
    return stepSpec.content;
  }, [stepSpec, retryFocusKeys]);

  const config = useMemo(
    () => buildConfig(effectiveContent, 100 + attempt * 37 + sessionStep * 13),
    [effectiveContent, attempt, sessionStep],
  );
  const engine = useTypingEngine(config);

  const lastAppliedConfigRef = useRef(config);
  const soundCountsRef = useRef({ correct: 0, incorrect: 0 });
  useEffect(() => {
    if (lastAppliedConfigRef.current === config) return;
    lastAppliedConfigRef.current = config;
    engine.applyConfig(config);
    soundCountsRef.current = { correct: 0, incorrect: 0 };
    if (lastPressedTimerRef.current) clearTimeout(lastPressedTimerRef.current);
    lastPressedTimerRef.current = null;
    setLastPressedKey(null);
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
  const [result, setResult] = useState<{
    passed: boolean;
    unitCompleted: boolean;
    xpAwarded: number;
    stars: 1 | 2 | 3 | 4 | 5;
    headline: string;
    feedback: string;
    mistakeSummary?: string;
    weaknessFeedback?: string;
    retryFocusKeys?: string[];
  } | null>(null);

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

    const keyOutcomes: Record<string, boolean[]> = {};
    for (const word of engine.state.wordStates) {
      for (let i = 0; i < word.target.length; i++) {
        const char = word.target[i].toLowerCase();
        if (!keyOutcomes[char]) keyOutcomes[char] = [];
        const isCorrect = i < word.typed.length && word.typed[i] === word.target[i];
        keyOutcomes[char].push(isCorrect);
      }
    }

    const starRating = evaluateLessonStars({
      accuracy,
      wpm: netWpm,
      minAccuracy: 60,
      stage: definition.stage,
      tier: definition.tier,
      errorCount: engine.state.incorrectKeystrokes,
      keyOutcomes,
      newKeys: definition.newKeys,
      stepNumber: sessionStep,
      totalSteps: subLessons.length,
    });

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
      minAccuracy: 60,
      stars: starRating.stars,
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

    setResult({
      passed: starRating.passed,
      unitCompleted: outcome.unitCompleted,
      xpAwarded: xpGained,
      stars: starRating.stars,
      headline: starRating.headline,
      feedback: starRating.feedback,
      mistakeSummary: starRating.mistakeSummary,
      weaknessFeedback: starRating.weaknessFeedback,
      retryFocusKeys: starRating.retryFocusKeys,
    });
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

  const currentIndex = LESSON_LIST.findIndex((l) => l.id === definition.id);
  const nextUnit = currentIndex >= 0 ? LESSON_LIST[currentIndex + 1] : undefined;
  const previousUnit = currentIndex > 0 ? LESSON_LIST[currentIndex - 1] : undefined;
  const stepsCompleted = isFinished && result?.passed ? sessionStep : sessionStep - 1;
  const progressPct = Math.round((stepsCompleted / subLessons.length) * 100);

  function handleContinue() {
    if (!result?.passed) return;
    if (!result.unitCompleted) {
      setSessionStep((s) => Math.min(s + 1, subLessons.length));
      setRetryFocusKeys(undefined);
      setAttempt((a) => a + 1);
      setResult(null);
    } else if (nextUnit) {
      router.push(`/lessons/${nextUnit.slug || nextUnit.id}`);
    } else {
      router.push("/lessons");
    }
  }

  function handleRetry() {
    if (result?.retryFocusKeys && result.retryFocusKeys.length > 0) {
      setRetryFocusKeys(result.retryFocusKeys);
    }
    setAttempt((a) => a + 1);
    setResult(null);
  }

  function handlePracticeLab() {
    if (result?.retryFocusKeys && result.retryFocusKeys.length > 0) {
      router.push(`/lessons/practice?mode=weak-keys&keys=${encodeURIComponent(result.retryFocusKeys.join(","))}`);
    } else {
      router.push("/lessons/practice");
    }
  }

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
              href={`/lessons/${previousUnit.slug || previousUnit.id}`}
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
    <div className="mx-auto flex min-h-0 w-full max-w-[1120px] flex-col items-stretch gap-2 px-2 sm:px-4 md:gap-2.5">
      {/* Compact lesson controls: progress and objective share one clear panel. */}
      <div className="flex w-full flex-col gap-2 rounded-xl border border-border/80 bg-sub-alt/20 px-3 py-2.5 sm:px-4">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-mono text-[11px] font-bold text-foreground">
              Step {sessionStep}/{subLessons.length}
            </span>
            <span className="truncate font-display text-[10px] font-bold uppercase tracking-wider text-accent">
              {stepSpec.title}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden text-[10px] text-sub min-[420px]:inline">60% to pass</span>
            <CapsLockIndicator className="shrink-0" />
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
              title={soundEnabled ? "Mute sound" : "Unmute sound"}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
          </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/70">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {!isFinished && (
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <p className="min-w-0 flex-1 text-[11px] leading-snug text-sub sm:text-xs">
              {stepSpec.objective}
            </p>
            {isSyntheticEarlyDrill && (
              <details className="shrink-0 text-[10px] text-sub/80">
                <summary className="flex cursor-pointer list-none items-center gap-1 py-0.5">
                  <HelpCircle size={11} className="shrink-0 text-accent" aria-hidden="true" />
                  Warm-up details
                </summary>
                <p className="max-w-sm pt-1 leading-snug">
                  This step intentionally uses short key combinations to build muscle memory before full English words become possible.
                </p>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Typing Surface */}
      {!isFinished && (
        <div
          className="relative w-full cursor-pointer rounded-xl border border-border bg-sub-alt/10 px-3 py-2.5 transition-colors hover:border-accent/40 sm:px-4 sm:py-3"
          onClick={() => setFocusToken((t) => t + 1)}
        >
          <WordStream wordStates={engine.displayWordStates} activeWordIndex={engine.state.activeWordIndex} />
          <HiddenInput
            value={activeWord?.typed ?? ""}
            status={engine.state.status}
            onChange={(value) => {
              const previousValue = activeWord?.typed ?? "";
              if (value.length > previousValue.length) {
                const addedText = value.slice(previousValue.length);
                const pressed = addedText.at(-1) ?? null;
                if (pressed !== null) {
                  setLastPressedKey(pressed);
                  if (lastPressedTimerRef.current) clearTimeout(lastPressedTimerRef.current);
                  lastPressedTimerRef.current = setTimeout(() => {
                    setLastPressedKey(null);
                    lastPressedTimerRef.current = null;
                  }, 155);
                }
              } else if (value.length < previousValue.length) {
                if (lastPressedTimerRef.current) clearTimeout(lastPressedTimerRef.current);
                lastPressedTimerRef.current = null;
                setLastPressedKey(null);
              }
              engine.setTyped(value);
            }}
            onCompositionPreview={engine.previewComposition}
            resetKey={engine.state.inputRevision}
            onCommitWord={engine.commitWord}
            onRestart={handleRetry}
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
      <VirtualKeyboard nextKey={nextKey} lastPressedKey={lastPressedKey} keyPressToken={engine.state.correctKeystrokes + engine.state.incorrectKeystrokes} />

      {/* Lesson Completion Modal Overlay */}
      {result && (
        <LessonCompletionModal
          open={isFinished && result !== null}
          stars={result.stars}
          passed={result.passed}
          wpm={wpm}
          accuracy={accuracy}
          minAccuracy={60}
          errors={engine.state.incorrectKeystrokes}
          timeMs={engine.state.elapsedMs}
          headline={result.headline}
          feedback={result.feedback}
          mistakeSummary={result.mistakeSummary}
          weaknessFeedback={result.weaknessFeedback}
          retryFocusKeys={result.retryFocusKeys}
          unitCompleted={result.unitCompleted}
          lessonTitle={definition.name}
          stepNumber={sessionStep}
          totalSteps={subLessons.length}
          nextUnitTitle={nextUnit?.name}
          isLastUnitInCurriculum={!nextUnit}
          xpAwarded={result.xpAwarded}
          onContinue={handleContinue}
          onRetry={handleRetry}
          onPracticeLab={handlePracticeLab}
          soundEnabled={soundEnabled}
        />
      )}
    </div>
  );
}

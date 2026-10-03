"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, SlidersHorizontal, Volume2, VolumeX, Wrench } from "lucide-react";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { useTypingEngine } from "@/lib/typing-engine/use-typing-engine";
import type { TestConfig } from "@/lib/typing-engine/engine-types";
import { getPersonalBest, paramForConfig, recordResult } from "@/lib/persistence/results-store";
import {
  calculateAccuracy,
  calculateNetWpm,
  calculateRawWpm,
} from "@/lib/typing-engine/stats";
import { computePaceCaretPosition } from "@/lib/typing-engine/pace-caret";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";
import { HiddenInput } from "@/components/typing-test/hidden-input";
import { WordStream } from "@/components/typing-test/word-stream";
import { LiveStatsBar } from "@/components/typing-test/live-stats-bar";
import { ResultsPanel } from "@/components/typing-test/results-panel";
import { TestConfigBar } from "@/components/typing-test/test-config-bar";
import { CustomTextModal } from "@/components/typing-test/custom-text-modal";
import { LanguageSelector } from "@/components/typing-test/language-selector";
import { MobileTestSettingsModal } from "@/components/typing-test/mobile-test-settings-modal";
import { listenForTestReset } from "@/lib/typing-engine/reset-bus";
import { setTestStatus } from "@/lib/typing-engine/test-status-store";
import { playSound } from "@/lib/games/game-audio";

export function TypingTest() {
  const mode = useSettingsStore((s) => s.mode);
  const timeDuration = useSettingsStore((s) => s.timeDuration);
  const wordCount = useSettingsStore((s) => s.wordCount);
  const quoteLength = useSettingsStore((s) => s.quoteLength);
  const vocabDifficulty = useSettingsStore((s) => s.vocabDifficulty);
  const wordDifficulty = useSettingsStore((s) => s.wordDifficulty);
  const punctuation = useSettingsStore((s) => s.punctuation);
  const numbers = useSettingsStore((s) => s.numbers);
  const paceCaretMode = useSettingsStore((s) => s.paceCaretMode);
  const paceCaretCustomWpm = useSettingsStore((s) => s.paceCaretCustomWpm);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const setMode = useSettingsStore((s) => s.setMode);

  const [customText, setCustomText] = useState("");
  const [isCustomModalOpen, setCustomModalOpen] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isMobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  // Diagnostic only -- never subtracted from the test duration. See
  // docs/typing-engine.md for why the clock deliberately keeps running.
  const focusLossCountRef = useRef(0);
  const prevKeystrokesRef = useRef({ correct: 0, incorrect: 0 });

  const modeBadge = useMemo(() => {
    if (mode === "time") return `${timeDuration}s`;
    if (mode === "words") return `${wordCount}w`;
    if (mode === "quote") return `quote · ${quoteLength}`;
    if (mode === "vocabulary") return `vocab · ${vocabDifficulty}`;
    if (mode === "custom") return "custom";
    return mode;
  }, [mode, timeDuration, wordCount, quoteLength, vocabDifficulty]);

  const config = useMemo<TestConfig>(
    () => ({
      mode,
      timeDuration,
      wordCount,
      quoteLength,
      customText,
      punctuation,
      numbers,
      vocabDifficulty,
      wordDifficulty,
    }),
    [
      mode,
      timeDuration,
      wordCount,
      quoteLength,
      customText,
      punctuation,
      numbers,
      vocabDifficulty,
      wordDifficulty,
    ],
  );

  const engine = useTypingEngine(config);

  // Resolved fresh on every status change (not memoized on config alone) so
  // a PB set by the attempt that just finished is what the very next attempt
  // races, instead of a stale number from before that run. getPersonalBest
  // is a synchronous local/cached-cloud read, cheap enough to not need its
  // own memoization.
  const paceCaretTargetWpm =
    paceCaretMode === "custom"
      ? paceCaretCustomWpm
      : paceCaretMode === "pb"
        ? (getPersonalBest(config.mode, paramForConfig(config), config.punctuation, config.numbers)?.wpm ?? null)
        : null;
  const paceCaretPosition = useMemo(
    () =>
      paceCaretTargetWpm !== null && engine.state.status === "running"
        ? computePaceCaretPosition(engine.state.words, engine.state.elapsedMs, paceCaretTargetWpm)
        : null,
    [paceCaretTargetWpm, engine.state.status, engine.state.words, engine.state.elapsedMs],
  );

  // Compares by reference (not a mount/unmount flag) so React Strict Mode's
  // dev-only double effect invocation can't defeat the "skip on mount" guard.
  const lastAppliedConfigRef = useRef(config);
  useEffect(() => {
    if (lastAppliedConfigRef.current === config) return;
    lastAppliedConfigRef.current = config;
    engine.applyConfig(config);
    setIsNewBest(false);
    // config identity changes whenever any setting above changes; engine.applyConfig is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    timeDuration,
    wordCount,
    quoteLength,
    customText,
    punctuation,
    numbers,
    vocabDifficulty,
    wordDifficulty,
  ]);

  // useLayoutEffect, not useEffect: this island's own idle-chrome hiding
  // happens synchronously during render (showIdleChrome below), but sibling
  // header/footer chrome reacts to this broadcast in their own effects. A
  // post-paint effect here left a one-frame window where this island had
  // already hidden/shown its own chrome but the header/footer hadn't caught
  // up yet -- a visible flash at test start/finish, a smaller instance of the
  // exact bug class test-status-store.ts's own comment describes shipping
  // before.
  useLayoutEffect(() => {
    setTestStatus(engine.state.status);
  }, [engine.state.status]);

  // Clears the signal when the whole test unmounts (e.g. navigating to
  // /about after finishing a test) so header/footer don't stay hidden on
  // pages that have no typing test at all. Mount-only, so its cleanup runs
  // at unmount rather than on every status change.
  useEffect(() => () => setTestStatus("idle"), []);

  const testStartedRef = useRef(false);
  useEffect(() => {
    if (engine.state.status === "running") {
      if (!testStartedRef.current) {
        testStartedRef.current = true;
        trackEvent("typing_test_started", {
          test_mode: config.mode,
          test_duration: config.mode === "time" ? config.timeDuration : undefined,
          word_count: config.mode === "words" ? config.wordCount : undefined,
          quote_length: config.mode === "quote" ? config.quoteLength : undefined,
          difficulty: config.mode === "vocabulary" ? config.vocabDifficulty : undefined,
          punctuation: config.punctuation,
          numbers: config.numbers,
        });
      }
    } else if (engine.state.status === "idle") {
      testStartedRef.current = false;
    }
  }, [engine.state.status, config]);

  const recordedRef = useRef(false);
  useEffect(() => {
    if (engine.state.status !== "finished") {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;

    // Unrounded on purpose: the personal-best comparison happens on these
    // values, and rounding first turns a real 65.6 -> 66.4 improvement into a
    // tie at 66. The results screen rounds them again for display.
    const wpm = calculateNetWpm(
      engine.state.netWpmCharacters,
      engine.state.elapsedMs,
    );
    const accuracy = calculateAccuracy(
      engine.state.correctKeystrokes,
      engine.state.incorrectKeystrokes,
      engine.state.charTally.missed,
    );
    const param = paramForConfig(config);
    const grossWpm = calculateRawWpm(
      engine.state.correctKeystrokes,
      engine.state.incorrectKeystrokes,
      engine.state.elapsedMs,
    );
    const { isNewBest: newBest } = recordResult(
      config.mode,
      param,
      config.punctuation,
      config.numbers,
      wpm,
      accuracy,
      {
        rawWpm: grossWpm,
        durationSec: Math.max(0.001, engine.state.elapsedMs / 1000),
        scoringChars: engine.state.netWpmCharacters,
        correctChars: engine.state.correctKeystrokes,
        incorrectChars: engine.state.incorrectKeystrokes,
        extraChars: engine.state.charTally.extra,
        missedChars: engine.state.charTally.missed,
      },
    );
    setIsNewBest(newBest);
    playSound(newBest ? "clear" : "lesson-clear", soundEnabled);
    trackEvent("typing_test_completed", {
      test_mode: config.mode,
      test_duration: config.mode === "time" ? config.timeDuration : undefined,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      gross_wpm: Math.round(grossWpm),
      correct_chars: engine.state.correctKeystrokes,
      incorrect_chars: engine.state.incorrectKeystrokes,
      duration_ms: engine.state.elapsedMs,
    });
    // intentionally narrow: only re-evaluate when the test transitions to "finished"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state.status]);

  useEffect(() => {
    if (engine.state.status !== "running") {
      prevKeystrokesRef.current = {
        correct: engine.state.correctKeystrokes,
        incorrect: engine.state.incorrectKeystrokes,
      };
      return;
    }
    const prev = prevKeystrokesRef.current;
    if (engine.state.correctKeystrokes > prev.correct) {
      playSound("lesson-key", soundEnabled);
    } else if (engine.state.incorrectKeystrokes > prev.incorrect) {
      playSound("lesson-typo", soundEnabled);
    }
    prevKeystrokesRef.current = {
      correct: engine.state.correctKeystrokes,
      incorrect: engine.state.incorrectKeystrokes,
    };
  }, [engine.state.correctKeystrokes, engine.state.incorrectKeystrokes, engine.state.status, soundEnabled]);

  const handleFocusChange = useCallback((focused: boolean) => {
    setIsFocused(focused);
    if (!focused) focusLossCountRef.current += 1;
  }, []);

  // A backgrounded tab throttles timers, but the engine measures elapsed time
  // from performance.now() deltas rather than counting ticks, so a late tick
  // still finalises at the correct duration. Recorded only for diagnostics.
  const visibilityChangesRef = useRef(0);
  useEffect(() => {
    const onVisibility = () => {
      visibilityChangesRef.current += 1;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handleRestart = useCallback(() => {
    engine.restart();
    setIsNewBest(false);
    setFocusToken((t) => t + 1);
    focusLossCountRef.current = 0;
    visibilityChangesRef.current = 0;
    // engine.restart itself is stable (useTypingEngine wraps it in its own
    // empty-deps useCallback) -- depending on the whole `engine` object
    // instead meant a new `handleRestart` identity every render, since
    // useTypingEngine returns a fresh object literal each time and `state`
    // changes every tick. That re-subscribed the reset-bus listener below
    // roughly 10x/second during a running test: not a leak (cleanup was
    // always correct), just unnecessary addEventListener/removeEventListener
    // churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.restart]);

  useEffect(() => listenForTestReset(handleRestart), [handleRestart]);

  const handleCustomTextSubmit = useCallback(
    (text: string) => {
      setCustomText(text);
      setMode("custom");
    },
    [setMode],
  );

  const activeWord = engine.state.wordStates[engine.state.activeWordIndex];

  const isRunning = engine.state.status === "running";
  // Config bar + mode settings are for setting up a test you haven't started
  // yet -- they used to also show on the results screen (status "finished"),
  // which put a full mode/duration switcher above the result you just earned.
  // Idle-only now; the results panel below has its own Restart / Practice
  // Weak Keys actions for "what next".
  const showIdleChrome = engine.state.status === "idle";

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:gap-5">
      {/* Both children share this grid cell and align to bottom (items-end)
          so the top of the word-stream below never shifts when the test starts. */}
      <div className="grid w-full items-end">
        {/* Idle-only Chrome (Config bar and mode settings). `inert` while
            hidden removes it from Tab order and the a11y tree entirely --
            `pointer-events-none`/`opacity-0` alone still let Shift+Tab reach
            it during a running test and silently reset the test by activating
            a mode/duration button underneath. */}
        <div
          inert={!showIdleChrome}
          className={cn(
            "[grid-area:1/1] w-full transition duration-200",
            showIdleChrome ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {/* Desktop Config Bar & Language Selector */}
          <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-2 w-full">
            <TestConfigBar onOpenCustomText={() => setCustomModalOpen(true)} />
            <LanguageSelector />
          </div>

          {/* Mobile Single "Test Settings" Button */}
          <div className="flex sm:hidden justify-center py-1">
            <button
              type="button"
              onClick={() => setMobileSettingsOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-border bg-sub-alt/40 px-3.5 py-2 font-mono text-xs text-sub transition-colors hover:border-accent hover:text-foreground active:scale-95"
            >
              <SlidersHorizontal size={14} className="text-accent" />
              <span className="font-display text-xs font-semibold uppercase tracking-wider text-foreground">
                Test Settings
              </span>
              <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                {modeBadge}
              </span>
            </button>
          </div>
        </div>

        {/* Live Timer during test: left-aligned timer, with mobile restart button on right */}
        <div
          className={cn(
            "[grid-area:1/1] w-full flex items-end justify-between pb-0.5 transition-opacity duration-200",
            isRunning ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <LiveStatsBar state={engine.state} />
          {/* Mobile-only restart button during running test */}
          <button
            type="button"
            onClick={handleRestart}
            aria-label="Restart test"
            className="flex sm:hidden h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-sub-alt/40 text-sub active:scale-95"
            title="Restart test"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {engine.state.status !== "finished" ? (
        <div className="flex w-full flex-col items-center gap-5 sm:gap-6">
          <div
            className="relative w-full cursor-pointer"
            onClick={() => setFocusToken((t) => t + 1)}
          >
            <WordStream
              wordStates={engine.state.wordStates}
              activeWordIndex={engine.state.activeWordIndex}
              paceCaretPosition={paceCaretPosition}
            />
            {engine.state.quoteSource && (
              <p className="mt-2 text-center text-xs text-sub">— {engine.state.quoteSource}</p>
            )}
            {mode === "custom" && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-accent">
                <Wrench size={13} />
                <span>Custom text active &middot; {engine.state.words.length} words</span>
              </div>
            )}
            <HiddenInput
              value={activeWord?.typed ?? ""}
              status={engine.state.status}
              disabled={isMobileSettingsOpen || isCustomModalOpen}
              onChange={engine.setTyped}
              onCommitWord={engine.commitWord}
              onRestart={handleRestart}
              onEscape={() => {}}
              onFocusChange={handleFocusChange}
              focusToken={focusToken}
            />

            {/*
              Typing into a blurred input is the one failure that corrupts a
              score silently: the clock keeps running while nothing is
              recorded, and the result just looks like a bad run.

              The clock is deliberately NOT paused. Pausing on blur would hand
              anyone an untimed thinking break, which is a scoring exploit. So
              the run stays honest and the state is simply made obvious and
              recoverable in one click or keystroke.
            */}
            {isRunning && !isFocused && (
              <div
                role="status"
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-[2px]"
              >
                <span className="font-display text-sm uppercase tracking-wider text-sub">
                  Click or press a key to resume &mdash; the clock is still running
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestart}
              aria-label="Restart test"
              title="Restart (Tab)"
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full text-sub transition-opacity duration-200 hover:bg-sub-alt hover:text-foreground sm:h-9 sm:w-9",
                isRunning ? "pointer-events-none opacity-0" : "opacity-100",
              )}
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Mute typing sound" : "Enable typing sound"}
              title={soundEnabled ? "Mute typing sound" : "Enable typing sound"}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full text-sub transition-opacity duration-200 hover:bg-sub-alt hover:text-foreground sm:h-9 sm:w-9",
                isRunning ? "pointer-events-none opacity-0" : "opacity-100",
              )}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      ) : (
        <ResultsPanel
          state={engine.state}
          isNewBest={isNewBest}
          onRestart={handleRestart}
        />
      )}

      <CustomTextModal
        open={isCustomModalOpen}
        initialValue={customText}
        onSubmit={handleCustomTextSubmit}
        onClose={() => {
          setCustomModalOpen(false);
          const isTouch =
            typeof window !== "undefined" &&
            window.matchMedia("(pointer: coarse)").matches;
          if (!isTouch) setFocusToken((t) => t + 1);
        }}
      />

      <MobileTestSettingsModal
        open={isMobileSettingsOpen}
        onClose={() => setMobileSettingsOpen(false)}
        onOpenCustomText={() => setCustomModalOpen(true)}
      />
    </div>
  );
}

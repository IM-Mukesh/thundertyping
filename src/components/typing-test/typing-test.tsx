"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { useTypingEngine } from "@/lib/typing-engine/use-typing-engine";
import type { TestConfig } from "@/lib/typing-engine/engine-types";
import { recordResult } from "@/lib/persistence/results-store";
import {
  calculateAccuracy,
  calculateNetWpm,
} from "@/lib/typing-engine/stats";
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

export function TypingTest() {
  const mode = useSettingsStore((s) => s.mode);
  const timeDuration = useSettingsStore((s) => s.timeDuration);
  const wordCount = useSettingsStore((s) => s.wordCount);
  const quoteLength = useSettingsStore((s) => s.quoteLength);
  const vocabDifficulty = useSettingsStore((s) => s.vocabDifficulty);
  const punctuation = useSettingsStore((s) => s.punctuation);
  const numbers = useSettingsStore((s) => s.numbers);
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
    ],
  );

  const engine = useTypingEngine(config);

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
  ]);

  useEffect(() => {
    setTestStatus(engine.state.status);
  }, [engine.state.status]);

  // Clears the signal when the whole test unmounts (e.g. navigating to
  // /about after finishing a test) so header/footer don't stay hidden on
  // pages that have no typing test at all. Mount-only, so its cleanup runs
  // at unmount rather than on every status change.
  useEffect(() => () => setTestStatus("idle"), []);

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
      engine.state.correctKeystrokes,
      engine.state.elapsedMs,
    );
    const accuracy = calculateAccuracy(
      engine.state.correctKeystrokes,
      engine.state.incorrectKeystrokes,
      engine.state.charTally.missed,
    );
    const param =
      config.mode === "time" ? config.timeDuration : config.wordCount;
    const { isNewBest: newBest } = recordResult(
      config.mode,
      param,
      config.punctuation,
      config.numbers,
      wpm,
      accuracy,
    );
    setIsNewBest(newBest);
    // intentionally narrow: only re-evaluate when the test transitions to "finished"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state.status]);

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
  const showIdleChrome = engine.state.status === "idle";

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:gap-5">
      {/* Both children share this grid cell and align to bottom (items-end)
          so the top of the word-stream below never shifts when the test starts. */}
      <div className="grid w-full items-end">
        {/* Idle Chrome */}
        <div
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

        {/* Live Timer during test: left-aligned, exactly ~20px above typing area */}
        <div
          className={cn(
            "[grid-area:1/1] w-full flex items-end justify-start pb-0.5 transition-opacity duration-200",
            isRunning ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <LiveStatsBar state={engine.state} />
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
            />
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
                className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-[2px]"
              >
                <span className="font-display text-sm uppercase tracking-wider text-sub">
                  Click or press a key to resume &mdash; the clock is still running
                </span>
              </div>
            )}
          </div>
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
        </div>
      ) : (
        <ResultsPanel
          state={engine.state}
          isNewBest={isNewBest}
          onRestart={handleRestart}
        />
      )}

      {engine.state.quoteSource && engine.state.status !== "finished" && (
        <p className="text-xs text-sub">— {engine.state.quoteSource}</p>
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

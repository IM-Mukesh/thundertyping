"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { useTypingEngine } from "@/lib/typing-engine/use-typing-engine";
import type { TestConfig } from "@/lib/typing-engine/engine-types";
import { recordResult } from "@/lib/persistence/results-store";
import { calculateAccuracy, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { cn } from "@/lib/utils/cn";
import { HiddenInput } from "@/components/typing-test/hidden-input";
import { WordStream } from "@/components/typing-test/word-stream";
import { LiveStatsBar } from "@/components/typing-test/live-stats-bar";
import { ResultsPanel } from "@/components/typing-test/results-panel";
import { TestConfigBar } from "@/components/typing-test/test-config-bar";
import { CustomTextModal } from "@/components/typing-test/custom-text-modal";
import { LanguageSelector } from "@/components/typing-test/language-selector";

export function TypingTest() {
  const mode = useSettingsStore((s) => s.mode);
  const timeDuration = useSettingsStore((s) => s.timeDuration);
  const wordCount = useSettingsStore((s) => s.wordCount);
  const quoteLength = useSettingsStore((s) => s.quoteLength);
  const punctuation = useSettingsStore((s) => s.punctuation);
  const numbers = useSettingsStore((s) => s.numbers);
  const setMode = useSettingsStore((s) => s.setMode);

  const [customText, setCustomText] = useState("");
  const [isCustomModalOpen, setCustomModalOpen] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  const config = useMemo<TestConfig>(
    () => ({ mode, timeDuration, wordCount, quoteLength, customText, punctuation, numbers }),
    [mode, timeDuration, wordCount, quoteLength, customText, punctuation, numbers],
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
    setFocusToken((t) => t + 1);
    // config identity changes whenever any setting above changes; engine.applyConfig is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeDuration, wordCount, quoteLength, customText, punctuation, numbers]);

  const recordedRef = useRef(false);
  useEffect(() => {
    if (engine.state.status !== "finished") {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;

    const wpm = round(calculateNetWpm(engine.state.correctKeystrokes, engine.state.elapsedMs));
    const accuracy = round(calculateAccuracy(engine.state.correctKeystrokes, engine.state.incorrectKeystrokes));
    const param = config.mode === "time" ? config.timeDuration : config.wordCount;
    const { isNewBest: newBest } = recordResult(config.mode, param, config.punctuation, config.numbers, wpm, accuracy);
    setIsNewBest(newBest);
    // intentionally narrow: only re-evaluate when the test transitions to "finished"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state.status]);

  const handleRestart = useCallback(() => {
    engine.restart();
    setIsNewBest(false);
    setFocusToken((t) => t + 1);
  }, [engine]);

  const handleCustomTextSubmit = useCallback(
    (text: string) => {
      setCustomText(text);
      setMode("custom");
    },
    [setMode],
  );

  const activeWord = engine.state.wordStates[engine.state.activeWordIndex];

  const isRunning = engine.state.status === "running";

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {/* Both children stay mounted and share this slot so its height never
          changes — only their opacity crossfades. This keeps the word-stream
          below permanently anchored instead of jumping when the config bar
          hides during a run (see PROGRESS.md for the bug this replaced). */}
      <div className="relative flex w-full items-center justify-center">
        <div className={cn("transition duration-200", isRunning ? "pointer-events-none opacity-0" : "opacity-100")}>
          <TestConfigBar onOpenCustomText={() => setCustomModalOpen(true)} />
        </div>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
            isRunning ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <LiveStatsBar state={engine.state} />
        </div>
      </div>

      <div className={cn("transition duration-200", isRunning ? "pointer-events-none opacity-0" : "opacity-100")}>
        <LanguageSelector />
      </div>

      {engine.state.status !== "finished" ? (
        <div className="flex w-full max-w-4xl flex-col items-center gap-6">
          <div className="relative w-full cursor-pointer" onClick={() => setFocusToken((t) => t + 1)}>
            <WordStream wordStates={engine.state.wordStates} activeWordIndex={engine.state.activeWordIndex} />
            <HiddenInput
              value={activeWord?.typed ?? ""}
              status={engine.state.status}
              onChange={engine.setTyped}
              onCommitWord={engine.commitWord}
              onRestart={handleRestart}
              onEscape={() => {}}
              focusToken={focusToken}
            />
          </div>
          <button
            type="button"
            onClick={handleRestart}
            aria-label="Restart test"
            title="Restart (Tab)"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-sub transition-opacity duration-200 hover:bg-sub-alt hover:text-foreground",
              isRunning ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      ) : (
        <ResultsPanel state={engine.state} isNewBest={isNewBest} onRestart={handleRestart} />
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
          setFocusToken((t) => t + 1);
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Hand,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import type { TestConfig } from "@/lib/typing-engine/engine-types";
import { useTypingEngine } from "@/lib/typing-engine/use-typing-engine";
import { calculateAccuracy, calculateConsistency, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { HiddenInput } from "@/components/typing-test/hidden-input";
import { WordStream } from "@/components/typing-test/word-stream";
import { VirtualKeyboard } from "@/components/lessons/virtual-keyboard";
import {
  generateAccuracyDrill,
  generateFingerIsolationDrill,
  generatePatternDrill,
  generateTransitionDrill,
  generateWeakKeyDrill,
} from "@/lib/lessons/content-generator";
import { fingerForKey, handForKey, isShiftRequired, shiftKeyFor, type FingerId } from "@/lib/lessons/keyboard-layout";
import { getWeakKeys } from "@/lib/lessons/key-performance";
import { useKeyPerformanceStore, getKeyStats } from "@/lib/lessons/key-performance-store";
import { playSound } from "@/lib/games/game-audio";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";

export type PracticeMode = "weak-keys" | "transitions" | "finger" | "accuracy" | "speed" | "coding";

const HIGH_FREQUENCY_TRANSITIONS = ["th", "he", "in", "er", "an", "re", "on", "at", "en", "nd", "st", "es", "ed", "te", "or"];

const FINGER_OPTIONS: { id: FingerId; label: string; keys: string[] }[] = [
  { id: "left-pinky", label: "Left Pinky (A, Q, Z)", keys: ["a", "q", "z"] },
  { id: "left-ring", label: "Left Ring (S, W, X)", keys: ["s", "w", "x"] },
  { id: "left-middle", label: "Left Middle (D, E, C)", keys: ["d", "e", "c"] },
  { id: "left-index", label: "Left Index (F, R, V, T, G, B)", keys: ["f", "r", "v", "t", "g", "b"] },
  { id: "right-index", label: "Right Index (J, U, M, H, Y, N)", keys: ["j", "u", "m", "h", "y", "n"] },
  { id: "right-middle", label: "Right Middle (K, I, ,)", keys: ["k", "i", ","] },
  { id: "right-ring", label: "Right Ring (L, O, .)", keys: ["l", "o", "."] },
  { id: "right-pinky", label: "Right Pinky (;, P, /)", keys: [";", "p", "/"] },
];

function buildPracticeText(
  mode: PracticeMode,
  options: {
    weakKeys: string[];
    selectedPairs: string[];
    selectedFinger: FingerId;
    seed: number;
  },
): string {
  const { weakKeys, selectedPairs, selectedFinger, seed } = options;
  const wordCount = 18;

  switch (mode) {
    case "weak-keys": {
      const activeKeys = weakKeys.length > 0 ? weakKeys : ["a", "s", "d", "f", "j", "k", "l", ";"];
      return generateWeakKeyDrill(activeKeys, [], wordCount, seed);
    }
    case "transitions": {
      const rawPairs = selectedPairs.length > 0 ? selectedPairs : HIGH_FREQUENCY_TRANSITIONS.slice(0, 5);
      const tuplePairs: [string, string][] = rawPairs.map((p) => [p[0], p[1] ?? ""] as [string, string]);
      return generateTransitionDrill(tuplePairs, [], wordCount, seed);
    }
    case "finger": {
      return generateFingerIsolationDrill(selectedFinger, [], wordCount, seed);
    }
    case "accuracy": {
      const allLetters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
      return generateAccuracyDrill(allLetters, wordCount, seed);
    }
    case "speed": {
      const balancedLetters = ["t", "h", "e", "a", "n", "d", "i", "s", "o", "r", "c", "l", "u", "m", "p"];
      return generatePatternDrill(balancedLetters, wordCount, seed);
    }
    case "coding": {
      const codingKeys = ["a", "s", "d", "f", "j", "k", "l", ";", "{", "}", "(", ")"];
      return generatePatternDrill(codingKeys, wordCount, seed);
    }
  }
}

function buildConfig(text: string): TestConfig {
  return {
    mode: "custom",
    timeDuration: 30,
    wordCount: 10,
    quoteLength: "short",
    vocabDifficulty: "easy",
    wordDifficulty: "all",
    customText: text,
    punctuation: false,
    numbers: false,
  };
}

export function PracticeDrill() {
  const searchParams = useSearchParams();
  const keys = useKeyPerformanceStore((s) => s.keys);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const recordKeyAttempt = useKeyPerformanceStore((s) => s.recordKeyAttempt);

  const initialMode = (searchParams.get("mode") as PracticeMode) || "weak-keys";
  const urlKeys = searchParams.get("keys") ? searchParams.get("keys")!.split(",").filter(Boolean) : [];
  const urlPairs = searchParams.get("pairs") ? searchParams.get("pairs")!.split(",").filter(Boolean) : [];
  const urlFinger = (searchParams.get("finger") as FingerId) || "left-pinky";

  const [mode, setMode] = useState<PracticeMode>(initialMode);
  const [selectedFinger, setSelectedFinger] = useState<FingerId>(urlFinger);
  const [selectedPairs] = useState<string[]>(urlPairs);
  const [customKeys] = useState<string[]>(urlKeys);
  const [attempt, setAttempt] = useState(0);
  const [focusToken, setFocusToken] = useState(0);
  const [isFocused, setIsFocused] = useState(true);

  const weakKeysFromStore = useMemo(() => getWeakKeys(getKeyStats(keys)), [keys]);
  const activeWeakKeys = useMemo(() => {
    if (customKeys.length > 0) return customKeys;
    if (weakKeysFromStore.length > 0) return weakKeysFromStore;
    return ["a", "s", "d", "f", "j", "k", "l", ";"];
  }, [customKeys, weakKeysFromStore]);

  const drillText = useMemo(() => {
    return buildPracticeText(mode, {
      weakKeys: activeWeakKeys,
      selectedPairs: selectedPairs.length > 0 ? selectedPairs : HIGH_FREQUENCY_TRANSITIONS.slice(0, 5),
      selectedFinger,
      seed: 42 + attempt * 31,
    });
  }, [mode, activeWeakKeys, selectedPairs, selectedFinger, attempt]);

  const config = useMemo(() => buildConfig(drillText), [drillText]);
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

  const practiceStartedRef = useRef(false);
  useEffect(() => {
    if (engine.state.status === "running") {
      if (!practiceStartedRef.current) {
        practiceStartedRef.current = true;
        trackEvent("practice_started", {
          practice_type: mode === "weak-keys" ? "weak_keys" : "general",
          target_keys_count: activeWeakKeys.length,
        });
      }
    } else if (engine.state.status === "idle") {
      practiceStartedRef.current = false;
    }
  }, [engine.state.status, mode, activeWeakKeys.length]);

  const wpm = round(calculateNetWpm(engine.state.netWpmCharacters, engine.state.elapsedMs));
  const accuracy = round(
    calculateAccuracy(engine.state.correctKeystrokes, engine.state.incorrectKeystrokes, engine.state.charTally.missed),
  );
  const consistency = round(calculateConsistency(engine.state.wpmSamples));

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

    trackEvent("practice_completed", {
      practice_type: mode === "weak-keys" ? "weak_keys" : "general",
      wpm,
      accuracy,
      duration_ms: engine.state.elapsedMs,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  const activeWord = engine.state.wordStates[engine.state.activeWordIndex];
  const nextKey = useMemo(() => {
    if (isFinished || !activeWord) return null;
    return activeWord.typed.length < activeWord.target.length ? activeWord.target[activeWord.typed.length] : " ";
  }, [isFinished, activeWord]);

  function handleRetry() {
    setAttempt((a) => a + 1);
  }

  // Keyboard shortcut Space / R to retry on finish
  useEffect(() => {
    if (!isFinished) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === " " || e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleRetry();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFinished]);

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      {/* Navigation & Mode Bar */}
      <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-[11px] text-sub">
        <Link href="/lessons" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
          <ArrowLeft size={13} aria-hidden="true" />
          Back to Curriculum
        </Link>
        <span className="font-display text-[10px] uppercase font-bold text-accent">
          HeroTyping Adaptive Training Lab
        </span>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex w-full flex-wrap items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-sub-alt/20 p-1.5 font-display text-xs font-bold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => { setMode("weak-keys"); setAttempt((a) => a + 1); }}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all",
            mode === "weak-keys"
              ? "bg-accent text-background shadow-sm"
              : "text-sub hover:text-foreground hover:bg-sub-alt/40",
          )}
        >
          <Target size={13} aria-hidden="true" />
          Weak Keys
        </button>
        <button
          type="button"
          onClick={() => { setMode("transitions"); setAttempt((a) => a + 1); }}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all",
            mode === "transitions"
              ? "bg-accent text-background shadow-sm"
              : "text-sub hover:text-foreground hover:bg-sub-alt/40",
          )}
        >
          <Sparkles size={13} aria-hidden="true" />
          Transitions
        </button>
        <button
          type="button"
          onClick={() => { setMode("finger"); setAttempt((a) => a + 1); }}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all",
            mode === "finger"
              ? "bg-accent text-background shadow-sm"
              : "text-sub hover:text-foreground hover:bg-sub-alt/40",
          )}
        >
          <Hand size={13} aria-hidden="true" />
          Finger Isolation
        </button>
        <button
          type="button"
          onClick={() => { setMode("accuracy"); setAttempt((a) => a + 1); }}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all",
            mode === "accuracy"
              ? "bg-accent text-background shadow-sm"
              : "text-sub hover:text-foreground hover:bg-sub-alt/40",
          )}
        >
          <CheckCircle2 size={13} aria-hidden="true" />
          Accuracy Focus
        </button>
        <button
          type="button"
          onClick={() => { setMode("speed"); setAttempt((a) => a + 1); }}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all",
            mode === "speed"
              ? "bg-accent text-background shadow-sm"
              : "text-sub hover:text-foreground hover:bg-sub-alt/40",
          )}
        >
          <Zap size={13} aria-hidden="true" />
          Speed Sprint
        </button>
      </div>

      {/* Mode Sub-configuration (e.g. Finger selection) */}
      {mode === "finger" && (
        <div className="flex w-full flex-wrap items-center justify-center gap-1 rounded-xl border border-border/60 bg-sub-alt/10 p-2 font-mono text-[11px]">
          {FINGER_OPTIONS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => { setSelectedFinger(f.id); setAttempt((a) => a + 1); }}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                selectedFinger === f.id
                  ? "bg-accent font-bold text-background"
                  : "text-sub hover:bg-sub-alt/40 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Target Summary Banner */}
      <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold">FOCUS:</span>
          {mode === "weak-keys" && (
            <span>
              Target Keys:{" "}
              <strong className="text-foreground">
                {activeWeakKeys.map((k) => (k === " " ? "SPACE" : k.toUpperCase())).join(", ")}
              </strong>
            </span>
          )}
          {mode === "transitions" && (
            <span>
              Key Digraphs:{" "}
              <strong className="text-foreground">
                {(selectedPairs.length > 0 ? selectedPairs : HIGH_FREQUENCY_TRANSITIONS.slice(0, 5)).map((p) => p.toUpperCase()).join(", ")}
              </strong>
            </span>
          )}
          {mode === "finger" && (
            <span>
              Isolated Finger:{" "}
              <strong className="text-foreground capitalize">{selectedFinger.replace("-", " ")}</strong>
            </span>
          )}
          {mode === "accuracy" && (
            <span>Targeting 98%+ precision across full keyboard alphabet</span>
          )}
          {mode === "speed" && (
            <span>High-frequency flow sequences for motor burst velocity</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="flex items-center gap-1 text-[11px] text-sub transition-colors hover:text-accent"
        >
          <RotateCcw size={11} aria-hidden="true" />
          Fresh variation
        </button>
      </div>

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
                Click to resume typing
              </span>
            </div>
          )}
        </div>
      )}

      {/* Live Tactile Guidance */}
      {!isFinished && nextKey && (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-border/60 bg-sub-alt/30 px-3.5 py-1 font-mono text-[11px] text-sub">
          <span>Key: <strong className="font-bold text-accent">{nextKey === " " ? "SPACE" : nextKey}</strong></span>
          <span>&middot;</span>
          <span>{handForKey(nextKey) === "left" ? "Left Hand" : handForKey(nextKey) === "right" ? "Right Hand" : "Thumb"}</span>
          {fingerForKey(nextKey) && (
            <>
              <span>&middot;</span>
              <span className="capitalize">{fingerForKey(nextKey)?.replace("-", " ")}</span>
            </>
          )}
          {isShiftRequired(nextKey) && (
            <>
              <span>&middot;</span>
              <span className="font-semibold text-accent">Hold {shiftKeyFor(nextKey) === "left-shift" ? "Left" : "Right"} Shift</span>
            </>
          )}
        </div>
      )}

      {/* Virtual Keyboard */}
      <VirtualKeyboard nextKey={nextKey} />

      {/* Results Debrief Screen */}
      {isFinished && (
        <div className="theme-transition flex w-full flex-col items-center gap-5 rounded-2xl border border-border bg-sub-alt/30 p-6 sm:p-8 text-center shadow-lg">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 font-display text-base font-bold uppercase tracking-wide text-correct">
              <CheckCircle2 size={18} aria-hidden="true" />
              Practice Round Complete
            </div>
            <p className="text-xs text-sub max-w-md">
              Muscle memory reinforced for {mode === "weak-keys" ? "targeted problem keys" : mode === "transitions" ? "letter transitions" : mode === "finger" ? "isolated finger dexterity" : mode}.
            </p>
          </div>

          {/* Performance Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 rounded-xl border border-border/80 bg-background/50 px-6 py-4 font-mono text-sm text-sub">
            <div>
              <span className="font-display text-xl font-bold text-foreground">{wpm}</span>{" "}
              <span className="text-xs">WPM</span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <span
                className={cn(
                  "font-display text-xl font-bold",
                  accuracy >= 92 ? "text-foreground" : "text-error",
                )}
              >
                {accuracy}%
              </span>{" "}
              <span className="text-xs">accuracy</span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <span className="font-display text-xl font-bold text-foreground">{consistency}%</span>{" "}
              <span className="text-xs">consistency</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRetry}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-accent px-6 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110 shadow-md"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Next Variation (Space/R)
            </button>
            <Link
              href="/lessons"
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border px-5 text-xs font-bold uppercase tracking-wider text-sub transition-colors hover:border-accent hover:text-foreground"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              Back to Curriculum
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

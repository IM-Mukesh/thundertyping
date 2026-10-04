"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  RotateCcw,
  X,
} from "lucide-react";
import { useTypingEngine } from "@/lib/typing-engine/use-typing-engine";
import { WordStream } from "@/components/typing-test/word-stream";
import { HiddenInput } from "@/components/typing-test/hidden-input";
import { calculateAccuracy, calculateConsistency, calculateNetWpm, calculateRawWpm } from "@/lib/typing-engine/stats";
import {
  evaluateComprehensivePlacement,
  PLACEMENT_DIAGNOSTIC_PASSAGE,
  type DetailedPlacementAnalysis,
  type StageRecommendationOption,
} from "@/lib/lessons/lesson-placement";
import { trackEvent } from "@/lib/analytics";
import type { TestConfig } from "@/lib/typing-engine/engine-types";
import { useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { cn } from "@/lib/utils/cn";

interface LessonPlacementModalProps {
  open: boolean;
  onClose: () => void;
}

function buildPlacementConfig(): TestConfig {
  return {
    mode: "custom",
    timeDuration: 60,
    wordCount: 25,
    quoteLength: "short",
    vocabDifficulty: "easy",
    wordDifficulty: "all",
    customText: PLACEMENT_DIAGNOSTIC_PASSAGE,
    punctuation: true,
    numbers: false,
  };
}

function PlacementDialogContent({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const config = useMemo(() => buildPlacementConfig(), []);
  const engine = useTypingEngine(config);
  const [focusToken, setFocusToken] = useState(0);
  const [isFocused, setIsFocused] = useState(true);

  const isFinished = engine.state.status === "finished";

  const analysis: DetailedPlacementAnalysis | null = useMemo(() => {
    if (!isFinished) return null;
    const wpm = calculateNetWpm(engine.state.netWpmCharacters, engine.state.elapsedMs);
    const rawWpm = calculateRawWpm(
      engine.state.correctKeystrokes,
      engine.state.incorrectKeystrokes,
      engine.state.elapsedMs,
    );
    const accuracy = calculateAccuracy(
      engine.state.correctKeystrokes,
      engine.state.incorrectKeystrokes,
      engine.state.charTally.missed,
    );
    const consistency = calculateConsistency(engine.state.wpmSamples);

    return evaluateComprehensivePlacement({
      wpm,
      rawWpm,
      accuracy,
      consistency,
      elapsedMs: engine.state.elapsedMs,
      wordStates: engine.state.wordStates,
    });
  }, [
    isFinished,
    engine.state.netWpmCharacters,
    engine.state.elapsedMs,
    engine.state.correctKeystrokes,
    engine.state.incorrectKeystrokes,
    engine.state.charTally.missed,
    engine.state.wpmSamples,
    engine.state.wordStates,
  ]);

  const placementStartedRef = useRef(false);
  useEffect(() => {
    if (engine.state.status === "running") {
      if (!placementStartedRef.current) {
        placementStartedRef.current = true;
        trackEvent("placement_started", {
          assessment_type: "typing_placement",
        });
      }
    } else if (engine.state.status === "idle") {
      placementStartedRef.current = false;
    }
  }, [engine.state.status]);

  const recordedRef = useRef(false);
  useEffect(() => {
    if (!analysis) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    trackEvent("placement_completed", {
      assessment_type: "typing_placement",
      wpm: analysis.metrics.wpm,
      accuracy: analysis.metrics.accuracy,
      suggested_lesson_id: analysis.recommendedStart.lessonId,
      suggested_stage: analysis.recommendedStart.stageName,
    });
  }, [analysis]);

  // Tab trapping & Escape handling
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!modal.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const activeWord = engine.state.wordStates[engine.state.activeWordIndex];

  function handleRetry() {
    engine.restart();
    setFocusToken((t) => t + 1);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative my-6 flex w-full max-w-2xl flex-col gap-5 rounded-2xl border border-border bg-background p-6 shadow-2xl sm:p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Compass size={17} aria-hidden="true" />
            </span>
            <div>
              <h2 id={titleId} className="font-display text-base font-bold uppercase tracking-tight text-foreground">
                Touch Typing Placement Assessment
              </h2>
              <p className="text-[11px] text-sub">
                Pedagogical evaluation across keyboard rows, transitions, and pacing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close placement assessment"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sub transition-colors hover:border-accent hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        {!analysis ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-sub sm:text-sm">
              Type the diagnostic sentence below at your regular, relaxed rhythm. Do not rush to maximize speed;
              the engine measures <strong>accuracy, finger returns, row coordination, and pacing consistency</strong>{" "}
              to recommend the ideal entry point.
            </p>

            <div
              className="relative w-full cursor-pointer rounded-xl border border-border bg-sub-alt/30 p-4 transition-colors hover:border-accent/40"
              onClick={() => setFocusToken((t) => t + 1)}
            >
              <WordStream wordStates={engine.displayWordStates} activeWordIndex={engine.state.activeWordIndex} />
              <HiddenInput
                value={activeWord?.typed ?? ""}
                status={engine.state.status}
                onChange={engine.setTyped}
                onCompositionPreview={engine.previewComposition}
                resetKey={engine.state.inputRevision}
                onCommitWord={engine.commitWord}
                onRestart={handleRetry}
                onEscape={onClose}
                onFocusChange={setIsFocused}
                focusToken={focusToken}
              />
              {engine.state.status === "running" && !isFocused && (
                <div
                  role="status"
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-[2px]"
                >
                  <span className="font-display text-xs uppercase tracking-wider text-sub">
                    Click to resume typing
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-sub">
              <span>Start typing to begin assessment</span>
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <RotateCcw size={12} aria-hidden="true" /> Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Header Result */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4">
              <div>
                <span className="flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-accent">
                  <CheckCircle2 size={13} aria-hidden="true" /> Assessment Complete &middot; {analysis.tier.toUpperCase()} TIER
                </span>
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-foreground sm:text-xl">
                  {analysis.headline}
                </h3>
                <p className="mt-1 text-xs text-sub leading-relaxed max-w-md">
                  {analysis.summary}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="flex shrink-0 items-center justify-around gap-4 rounded-xl border border-border/80 bg-background/80 px-4 py-2 font-mono text-center">
                <div>
                  <div className="font-display text-lg font-bold text-foreground">{analysis.metrics.wpm}</div>
                  <div className="text-[10px] text-sub">WPM</div>
                </div>
                <div className="h-6 w-px bg-border" />
                <div>
                  <div className="font-display text-lg font-bold text-foreground">{analysis.metrics.accuracy}%</div>
                  <div className="text-[10px] text-sub">ACC</div>
                </div>
                <div className="h-6 w-px bg-border" />
                <div>
                  <div className="font-display text-lg font-bold text-foreground">{analysis.metrics.consistency}%</div>
                  <div className="text-[10px] text-sub">CONSIST</div>
                </div>
              </div>
            </div>

            {/* Row Breakdown & Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
              <div className="rounded-xl border border-border bg-sub-alt/20 p-2.5 text-center">
                <div className="text-[10px] text-sub font-sans uppercase font-semibold">Home Row</div>
                <div className="text-sm font-bold text-foreground">{analysis.rowBreakdown.homeRowAcc}%</div>
              </div>
              <div className="rounded-xl border border-border bg-sub-alt/20 p-2.5 text-center">
                <div className="text-[10px] text-sub font-sans uppercase font-semibold">Top Row</div>
                <div className="text-sm font-bold text-foreground">{analysis.rowBreakdown.topRowAcc}%</div>
              </div>
              <div className="rounded-xl border border-border bg-sub-alt/20 p-2.5 text-center">
                <div className="text-[10px] text-sub font-sans uppercase font-semibold">Bottom Row</div>
                <div className="text-sm font-bold text-foreground">{analysis.rowBreakdown.bottomRowAcc}%</div>
              </div>
            </div>

            {/* Pedagogical Track Options */}
            <div className="flex flex-col gap-2.5">
              <span className="font-display text-[11px] font-bold uppercase tracking-wider text-sub">
                Choose your recommended path
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <PlacementOptionCard
                  option={analysis.recommendedStart}
                  recommended
                  onSelect={onClose}
                />
                <PlacementOptionCard
                  option={analysis.startFromBeginning}
                  recommended={false}
                  onSelect={onClose}
                />
                <PlacementOptionCard
                  option={analysis.challengeTrack}
                  recommended={false}
                  onSelect={onClose}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1.5 font-semibold text-sub transition-colors hover:text-foreground"
              >
                <RotateCcw size={12} aria-hidden="true" /> Re-take placement test
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-semibold text-sub hover:text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlacementOptionCard({
  option,
  recommended,
  onSelect,
}: {
  option: StageRecommendationOption;
  recommended: boolean;
  onSelect: () => void;
}) {
  return (
    <Link
      href={`/lessons/${option.lessonId}`}
      onClick={() => {
        useLessonProgressStore.getState().unlockUpToLesson(option.lessonId);
        onSelect();
      }}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all text-left",
        recommended
          ? "border-accent bg-accent/10 shadow-md hover:bg-accent/15"
          : "border-border bg-sub-alt/20 hover:border-accent/50 hover:bg-sub-alt/40",
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "font-display text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5",
              recommended
                ? "bg-accent text-background"
                : "bg-sub-alt text-sub",
            )}
          >
            {recommended ? "Recommended" : option.tier}
          </span>
          <span className="font-display text-[10px] uppercase text-sub">{option.stageName}</span>
        </div>

        <h4 className="font-display text-xs font-bold uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">
          {option.label}
        </h4>

        <p className="text-[11px] leading-relaxed text-sub">
          {option.description}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] font-bold text-accent">
        <span>Start: {option.lessonName}</span>
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  );
}

export function LessonPlacementModal({ open, onClose }: LessonPlacementModalProps) {
  if (!open) return null;
  return <PlacementDialogContent onClose={onClose} />;
}

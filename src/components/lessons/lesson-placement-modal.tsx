"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, RotateCcw, X, Zap } from "lucide-react";
import { useTypingEngine } from "@/lib/typing-engine/use-typing-engine";
import { WordStream } from "@/components/typing-test/word-stream";
import { HiddenInput } from "@/components/typing-test/hidden-input";
import { calculateAccuracy, calculateNetWpm } from "@/lib/typing-engine/stats";
import { evaluatePlacement } from "@/lib/lessons/lesson-placement";
import { trackEvent } from "@/lib/analytics";
import type { TestConfig } from "@/lib/typing-engine/engine-types";

interface LessonPlacementModalProps {
  open: boolean;
  onClose: () => void;
}

const PLACEMENT_TEXT = "the quick brown fox jumps over the lazy dog and types with speed and great accuracy";

function buildPlacementConfig(): TestConfig {
  return {
    mode: "custom",
    timeDuration: 30,
    wordCount: 10,
    quoteLength: "short",
    vocabDifficulty: "easy",
    customText: PLACEMENT_TEXT,
    punctuation: false,
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

  const recommendation = useMemo(() => {
    if (!isFinished) return null;
    const wpm = calculateNetWpm(engine.state.netWpmCharacters, engine.state.elapsedMs);
    const accuracy = calculateAccuracy(
      engine.state.correctKeystrokes,
      engine.state.incorrectKeystrokes,
      engine.state.charTally.missed,
    );
    return evaluatePlacement(wpm, accuracy);
  }, [
    isFinished,
    engine.state.netWpmCharacters,
    engine.state.elapsedMs,
    engine.state.correctKeystrokes,
    engine.state.incorrectKeystrokes,
    engine.state.charTally.missed,
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
    if (!recommendation) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    trackEvent("placement_completed", {
      assessment_type: "typing_placement",
      wpm: recommendation.metrics.wpm,
      accuracy: recommendation.metrics.accuracy,
      suggested_lesson_id: recommendation.suggestedLessonId,
      suggested_stage: recommendation.stageName,
    });
  }, [recommendation]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-xl flex-col gap-5 rounded-2xl border border-border bg-background p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Zap size={15} aria-hidden="true" />
            </span>
            <h2 id={titleId} className="font-display text-base font-bold uppercase tracking-tight text-foreground">
              Find your starting point
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close placement assessment"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sub hover:border-accent hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        {!recommendation ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-sub sm:text-sm">
              Type this short sample sentence at your natural pace. We&apos;ll measure your speed and accuracy to
              recommend where in the curriculum you&apos;ll get the most value.
            </p>

            <div
              className="relative w-full cursor-pointer rounded-xl border border-border bg-sub-alt/30 p-4"
              onClick={() => setFocusToken((t) => t + 1)}
            >
              <WordStream wordStates={engine.state.wordStates} activeWordIndex={engine.state.activeWordIndex} />
              <HiddenInput
                value={activeWord?.typed ?? ""}
                status={engine.state.status}
                onChange={engine.setTyped}
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
              <span>Start typing to begin test</span>
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <RotateCcw size={11} aria-hidden="true" /> Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 text-center">
            <div className="flex items-center justify-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-accent">
              <CheckCircle2 size={16} aria-hidden="true" /> Assessment complete
            </div>

            <div className="flex justify-center gap-8 rounded-xl border border-border bg-sub-alt/20 py-3 font-mono text-sm text-sub">
              <div>
                <span className="font-display text-xl font-bold text-foreground">{recommendation.metrics.wpm}</span>{" "}
                <span className="text-xs">WPM</span>
              </div>
              <div className="h-full w-px bg-border" />
              <div>
                <span className="font-display text-xl font-bold text-foreground">{recommendation.metrics.accuracy}%</span>{" "}
                <span className="text-xs">accuracy</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left rounded-xl border border-accent/40 bg-accent/5 p-4">
              <span className="font-display text-[10px] font-bold uppercase tracking-wider text-accent">
                Suggested starting point
              </span>
              <h3 className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
                {recommendation.headline}
              </h3>
              <p className="text-xs leading-relaxed text-sub">{recommendation.rationale}</p>
              <div className="mt-2 font-mono text-xs font-bold text-accent">
                Recommended: {recommendation.lessonName}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleRetry}
                className="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border px-4 text-xs font-semibold text-sub transition-colors hover:border-accent hover:text-foreground"
              >
                <RotateCcw size={13} aria-hidden="true" /> Try again
              </button>
              <Link
                href={`/lessons/${recommendation.suggestedLessonId}`}
                onClick={onClose}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-6 font-display text-xs font-bold uppercase tracking-wider text-background transition-[filter] hover:brightness-110"
              >
                Go to lesson
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LessonPlacementModal({ open, onClose }: LessonPlacementModalProps) {
  if (!open) return null;
  return <PlacementDialogContent onClose={onClose} />;
}

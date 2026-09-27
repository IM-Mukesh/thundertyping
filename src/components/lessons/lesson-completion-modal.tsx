"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, RotateCcw, Sparkles, Star, Target, Zap } from "lucide-react";
import { playSound, playStarSound } from "@/lib/games/game-audio";
import { cn } from "@/lib/utils/cn";

export interface LessonCompletionModalProps {
  open: boolean;
  stars: 1 | 2 | 3 | 4 | 5;
  passed: boolean;
  wpm: number;
  accuracy: number;
  minAccuracy?: number;
  errors: number;
  timeMs: number;
  headline: string;
  feedback: string;
  mistakeSummary?: string;
  weaknessFeedback?: string;
  retryFocusKeys?: string[];
  unitCompleted: boolean;
  lessonTitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  nextUnitTitle?: string;
  isLastUnitInCurriculum?: boolean;
  xpAwarded?: number;
  onContinue: () => void;
  onRetry: () => void;
  onPracticeLab?: () => void;
  soundEnabled: boolean;
}

export function LessonCompletionModal({
  open,
  stars,
  passed,
  wpm,
  accuracy,
  minAccuracy = 60,
  errors,
  timeMs,
  headline,
  feedback,
  mistakeSummary,
  weaknessFeedback,
  retryFocusKeys,
  unitCompleted,
  lessonTitle,
  stepNumber,
  totalSteps,
  nextUnitTitle,
  isLastUnitInCurriculum,
  xpAwarded,
  onContinue,
  onRetry,
  onPracticeLab,
  soundEnabled,
}: LessonCompletionModalProps) {
  const [animatedStars, setAnimatedStars] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  // Sequential star reveal animation with sound accompaniment
  useEffect(() => {
    if (!open) {
      return;
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        setAnimatedStars(stars);
      }, 0);
      return () => clearTimeout(timer);
    }

    let current = 0;
    // Begin star reveal after modal smoothly settles (220ms)
    const initialDelay = setTimeout(() => {
      const interval = setInterval(() => {
        current++;
        if (current <= stars) {
          setAnimatedStars(current);
          playStarSound(current, soundEnabled);
        }

        if (current >= stars) {
          clearInterval(interval);
          // Play final emotional resolution sound
          const resolutionDelay = setTimeout(() => {
            if (stars === 5) {
              playSound("lesson-perfect", soundEnabled);
            } else if (passed) {
              playSound("lesson-pass", soundEnabled);
            } else {
              playSound("lesson-retry", soundEnabled);
            }
          }, 140);
          return () => clearTimeout(resolutionDelay);
        }
      }, 190);

      return () => clearInterval(interval);
    }, 220);

    return () => {
      clearTimeout(initialDelay);
    };
  }, [open, stars, passed, soundEnabled]);

  // Focus primary button when opened
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        primaryButtonRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Keyboard navigation: Enter triggers primary action, Space / R triggers retry when failed
  useEffect(() => {
    if (!open || isNavigating) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        setIsNavigating(true);
        if (passed) {
          onContinue();
        } else {
          onRetry();
        }
      } else if (!passed && (e.key === " " || e.key.toLowerCase() === "r")) {
        e.preventDefault();
        setIsNavigating(true);
        onRetry();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, passed, isNavigating, onContinue, onRetry]);

  if (!open) return null;

  function handlePrimaryClick() {
    if (isNavigating) return;
    setIsNavigating(true);
    if (passed) {
      onContinue();
    } else {
      onRetry();
    }
  }

  function handleRetryClick() {
    if (isNavigating) return;
    setIsNavigating(true);
    onRetry();
  }

  const durationSec = Math.max(1, Math.round(timeMs / 1000));
  const roundedAccuracy = Math.round(accuracy);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-result-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative flex w-full max-w-md sm:max-w-lg flex-col items-center gap-4 sm:gap-6 rounded-3xl border border-border/80 bg-card p-5 sm:p-8 text-center shadow-2xl shadow-black/30 transition-all max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Subtle Ambient Radial Highlight */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-72 rounded-full blur-3xl opacity-20",
            passed ? "bg-accent" : "bg-error",
          )}
        />

        {/* 1. Header & Step Context Eyebrow */}
        <div className="flex w-full items-center justify-between border-b border-border/50 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2 text-left">
            <span
              className={cn(
                "flex h-2 w-2 rounded-full",
                passed ? "bg-accent animate-pulse" : "bg-error",
              )}
            />
            <span className="font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sub">
              {lessonTitle ? lessonTitle : "HeroTyping Academy"}
              {stepNumber && totalSteps ? ` · Step ${stepNumber} of ${totalSteps}` : ""}
            </span>
          </div>

          {passed ? (
            <span className="flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-accent shadow-sm">
              <Sparkles size={11} aria-hidden="true" />
              {unitCompleted ? "Unit Complete" : "Passed"}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full border border-error/40 bg-error/10 px-2.5 py-0.5 font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-error shadow-sm">
              <RotateCcw size={11} aria-hidden="true" />
              Needs Practice
            </span>
          )}
        </div>

        {/* 2. Dominant 3x Large Stars Display */}
        <div className="flex flex-col items-center gap-2 pt-1 sm:pt-2">
          {/* Star Group */}
          <div
            className="flex items-center justify-center gap-2 sm:gap-3.5"
            aria-label={`${stars} of 5 stars earned`}
          >
            {[1, 2, 3, 4, 5].map((s) => {
              const earned = s <= animatedStars;
              return (
                <div
                  key={s}
                  className={cn(
                    "relative flex items-center justify-center transition-all duration-300 transform",
                    earned
                      ? "scale-105 sm:scale-110 drop-shadow-[0_0_14px_rgba(var(--accent-rgb),0.55)]"
                      : "scale-95 opacity-40",
                  )}
                  aria-hidden="true"
                >
                  <Star
                    className={cn(
                      "w-10 h-10 sm:w-14 sm:h-14 transition-all duration-200",
                      earned
                        ? "fill-accent text-accent stroke-accent"
                        : "fill-sub-alt/40 text-sub/50 stroke-current stroke-[1.5]",
                    )}
                  />
                  {earned && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-accent/10 blur-sm -z-10"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Star Score Label */}
          <div className="font-display text-[11px] sm:text-xs font-bold uppercase tracking-widest text-sub mt-1">
            <span className="text-foreground">{stars}</span> of 5 Stars Earned
          </div>
        </div>

        {/* 3. Headline & Human-Centric Feedback */}
        <div className="flex flex-col gap-1.5 sm:gap-2 max-w-md">
          <h2
            id="lesson-result-title"
            className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground"
          >
            {headline}
          </h2>

          <p className="text-xs sm:text-sm text-sub leading-relaxed">
            {feedback}
          </p>

          {/* Explicit Mistakes / Weakness Guidance for Poor Performance */}
          {!passed && mistakeSummary && (
            <div className="mt-1 rounded-2xl border border-error/30 bg-error/5 p-3 sm:p-4 text-left font-sans text-xs">
              <div className="flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-error mb-1">
                <Target size={12} aria-hidden="true" />
                Focus for your retry
              </div>
              <p className="font-medium text-foreground/90 leading-relaxed">
                {mistakeSummary}
              </p>
              {weaknessFeedback && (
                <p className="mt-1.5 text-xs text-sub leading-relaxed border-t border-error/20 pt-1.5">
                  {weaknessFeedback}
                </p>
              )}
            </div>
          )}

          {/* Passed: Next Challenge Preview */}
          {passed && (
            <div className="mt-0.5 flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-sub-alt/30 px-3.5 py-1 text-xs text-sub">
              <span className="font-display text-[10px] font-bold uppercase tracking-wider text-accent">
                Next:
              </span>
              <span className="font-medium text-foreground truncate max-w-[260px]">
                {unitCompleted
                  ? nextUnitTitle ?? "Next Academy Unit"
                  : stepNumber && totalSteps && stepNumber < totalSteps
                    ? `Step ${stepNumber + 1} of ${totalSteps}`
                    : "Next Challenge"}
              </span>
            </div>
          )}
        </div>

        {/* 4. Core Performance Numbers (WPM, Accuracy, Errors, Time) */}
        <div className="grid w-full grid-cols-4 divide-x divide-border/60 rounded-2xl border border-border/80 bg-sub-alt/20 py-3 px-1 font-mono text-center shadow-inner">
          <div className="px-1 sm:px-2">
            <div className="font-display text-lg sm:text-xl font-bold text-foreground">
              {wpm}
            </div>
            <div className="text-[10px] uppercase font-sans text-sub">WPM</div>
          </div>

          <div className="px-1 sm:px-2">
            <div
              className={cn(
                "font-display text-lg sm:text-xl font-bold",
                roundedAccuracy >= minAccuracy ? "text-foreground" : "text-error",
              )}
            >
              {roundedAccuracy}%
            </div>
            <div className="text-[10px] uppercase font-sans text-sub">
              Accuracy {minAccuracy > 0 ? `(${minAccuracy}% req)` : ""}
            </div>
          </div>

          <div className="px-1 sm:px-2">
            <div
              className={cn(
                "font-display text-lg sm:text-xl font-bold",
                errors > 0 && !passed ? "text-error" : "text-foreground",
              )}
            >
              {errors}
            </div>
            <div className="text-[10px] uppercase font-sans text-sub">Errors</div>
          </div>

          <div className="px-1 sm:px-2">
            <div className="font-display text-lg sm:text-xl font-bold text-foreground">
              {durationSec}s
            </div>
            <div className="text-[10px] uppercase font-sans text-sub">Time</div>
          </div>
        </div>

        {/* 5. XP Reward Callout */}
        {Boolean(xpAwarded && xpAwarded > 0) && (
          <div className="flex items-center gap-1.5 font-display text-xs font-bold text-accent">
            <Zap size={14} className="fill-accent" aria-hidden="true" />
            <span>+{xpAwarded} Player XP Awarded</span>
          </div>
        )}

        {/* 6. Primary & Secondary Actions */}
        <div className="flex w-full flex-col gap-2.5 pt-1">
          {passed ? (
            <>
              {/* Primary: Continue */}
              <button
                ref={primaryButtonRef}
                type="button"
                disabled={isNavigating}
                onClick={handlePrimaryClick}
                className={cn(
                  "group relative flex h-12 sm:h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-accent px-6 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-background shadow-lg shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.98]",
                  isNavigating && "opacity-60 cursor-not-allowed",
                )}
              >
                <span>
                  {unitCompleted
                    ? nextUnitTitle
                      ? `Continue to ${nextUnitTitle}`
                      : isLastUnitInCurriculum
                        ? "Graduate Academy"
                        : "Continue to Next Lesson"
                    : "Continue"}
                </span>
                <span className="rounded bg-background/20 px-1.5 py-0.5 font-mono text-[10px] font-normal text-background/90 group-hover:bg-background/30">
                  Enter ↵
                </span>
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>

              {/* Secondary: Repeat for Higher Score */}
              <button
                type="button"
                disabled={isNavigating}
                onClick={handleRetryClick}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-transparent font-display text-xs font-semibold uppercase tracking-wider text-sub transition-colors hover:text-foreground hover:bg-sub-alt/30"
              >
                <RotateCcw size={12} aria-hidden="true" />
                <span>Repeat for Better Score</span>
              </button>
            </>
          ) : (
            <>
              {/* Primary: Try Again */}
              <button
                ref={primaryButtonRef}
                type="button"
                disabled={isNavigating}
                onClick={handlePrimaryClick}
                className={cn(
                  "group relative flex h-12 sm:h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-accent px-6 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-background shadow-lg shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.98]",
                  isNavigating && "opacity-60 cursor-not-allowed",
                )}
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>Try Again</span>
                <span className="rounded bg-background/20 px-1.5 py-0.5 font-mono text-[10px] font-normal text-background/90">
                  Enter ↵
                </span>
              </button>

              {/* Secondary: Practice Weak Keys */}
              {onPracticeLab && retryFocusKeys && retryFocusKeys.length > 0 && (
                <button
                  type="button"
                  disabled={isNavigating}
                  onClick={onPracticeLab}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-border bg-sub-alt/30 font-display text-xs font-semibold uppercase tracking-wider text-sub transition-colors hover:border-accent hover:text-foreground"
                >
                  <Target size={13} aria-hidden="true" />
                  <span>
                    Practice Weak Keys (
                    {retryFocusKeys
                      .slice(0, 3)
                      .map((k) => (k === " " ? "SPACE" : k.toUpperCase()))
                      .join(", ")}
                    )
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

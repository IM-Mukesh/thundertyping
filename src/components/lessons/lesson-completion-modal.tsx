"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [prevOpen, setPrevOpen] = useState(open);
  const modalRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  // Reset navigation state when modal open state transitions
  if (prevOpen !== open) {
    setPrevOpen(open);
    setIsNavigating(false);
  }

  const handlePrimaryClick = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    if (passed) {
      onContinue();
    } else {
      onRetry();
    }
  }, [isNavigating, passed, onContinue, onRetry]);

  const handleRetryClick = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    onRetry();
  }, [isNavigating, onRetry]);

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
    // Begin star reveal after modal settles smoothly (150ms)
    let interval: ReturnType<typeof setInterval> | null = null;
    let resolutionDelay: ReturnType<typeof setTimeout> | null = null;
    const initialDelay = setTimeout(() => {
      interval = setInterval(() => {
        current++;
        if (current <= stars) {
          setAnimatedStars(current);
          playStarSound(current, soundEnabled);
        }

        if (current >= stars) {
          if (interval) clearInterval(interval);
          // Play final emotional resolution sound
          resolutionDelay = setTimeout(() => {
            if (stars === 5) {
              playSound("lesson-perfect", soundEnabled);
            } else if (passed) {
              playSound("lesson-pass", soundEnabled);
            } else {
              playSound("lesson-retry", soundEnabled);
            }
          }, 140);
        }
      }, 160);
    }, 150);

    return () => {
      clearTimeout(initialDelay);
      if (interval) clearInterval(interval);
      if (resolutionDelay) clearTimeout(resolutionDelay);
    };
  }, [open, stars, passed, soundEnabled]);

  // Lock body scroll while open and restore on unmount/close
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Focus primary button when opened
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        primaryButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Keyboard navigation & Focus Trapping
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
      } else if (e.key === "Enter") {
        e.preventDefault();
        handlePrimaryClick();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleRetryClick();
      } else if (!passed && (e.key === " " || e.key.toLowerCase() === "r")) {
        e.preventDefault();
        handleRetryClick();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, passed, handlePrimaryClick, handleRetryClick]);

  if (!open) return null;

  const durationSec = Math.max(1, Math.round(timeMs / 1000));
  const roundedAccuracy = Math.round(accuracy);

  let primaryActionLabel = "Continue";
  if (passed) {
    if (unitCompleted) {
      if (nextUnitTitle) {
        primaryActionLabel = `Continue to ${nextUnitTitle}`;
      } else if (isLastUnitInCurriculum) {
        primaryActionLabel = "Graduate Academy";
      } else {
        primaryActionLabel = "Continue to Next Lesson";
      }
    } else {
      primaryActionLabel = "Continue";
    }
  } else {
    primaryActionLabel = "Try Again";
  }

  const nextStepLabel = unitCompleted
    ? nextUnitTitle ?? "Next Academy Unit"
    : stepNumber && totalSteps && stepNumber < totalSteps
      ? `Step ${stepNumber + 1} of ${totalSteps}`
      : "Next Challenge";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-result-title"
      aria-describedby="lesson-result-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-background/85 backdrop-blur-md select-none overflow-hidden animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="relative flex w-full max-w-[420px] sm:max-w-[450px] flex-col items-center gap-[clamp(0.45rem,1.2vh,0.8rem)] rounded-2xl sm:rounded-3xl border border-border-subtle bg-surface/95 backdrop-blur-md p-[clamp(0.8rem,2vh,1.375rem)] pb-[max(clamp(0.8rem,2vh,1.375rem),env(safe-area-inset-bottom))] text-center shadow-2xl transition-all max-h-[96dvh] box-border animate-in zoom-in-95 duration-200"
      >
        {/* Subtle Ambient Radial Highlight */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full blur-3xl opacity-20",
            passed ? "bg-accent" : "bg-error",
          )}
        />

        {/* 1. Header & Step Context Eyebrow */}
        <div className="flex w-full items-center justify-between border-b border-border/60 pb-[clamp(0.35rem,0.9vh,0.55rem)] gap-2">
          <div className="flex items-center gap-2 text-left min-w-0">
            <span
              className={cn(
                "flex h-2 w-2 shrink-0 rounded-full",
                passed ? "bg-accent animate-pulse" : "bg-error",
              )}
            />
            <span className="font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sub truncate">
              {lessonTitle ? lessonTitle : "HeroTyping Academy"}
              {stepNumber && totalSteps ? ` · Step ${stepNumber} of ${totalSteps}` : ""}
            </span>
          </div>

          {passed ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 sm:px-2.5 py-0.5 font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-accent shadow-xs">
              <Sparkles size={11} aria-hidden="true" />
              {unitCompleted ? "Unit Complete" : "Passed"}
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-error/40 bg-error/10 px-2 sm:px-2.5 py-0.5 font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-error shadow-xs">
              <RotateCcw size={11} aria-hidden="true" />
              Needs Practice
            </span>
          )}
        </div>

        {/* 2. Compact Celebratory Stars Display */}
        <div className="flex flex-col items-center gap-[clamp(0.2rem,0.5vh,0.35rem)] w-full pt-0.5">
          <div
            className="flex items-center justify-center gap-[clamp(0.375rem,1.1vh,0.625rem)]"
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
                      ? "scale-105 drop-shadow-[0_0_8px_rgba(226,183,20,0.45)]"
                      : "scale-95 opacity-35",
                  )}
                  aria-hidden="true"
                >
                  <Star
                    className={cn(
                      "w-[clamp(1.5rem,3.8vh,2.125rem)] h-[clamp(1.5rem,3.8vh,2.125rem)] transition-all duration-200",
                      earned
                        ? "fill-accent text-accent stroke-accent"
                        : "fill-sub-alt/40 text-sub/40 stroke-current stroke-[1.5]",
                    )}
                  />
                  {earned && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-accent/15 blur-xs -z-10"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="font-display text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-sub">
            <span className="text-foreground font-bold">{stars}</span> of 5 Stars Earned
          </div>
        </div>

        {/* 3. Headline & Human-Centric Feedback */}
        <div className="flex flex-col items-center gap-1 w-full max-w-[380px] sm:max-w-[420px]">
          <h2
            id="lesson-result-title"
            className="font-display text-[clamp(1.125rem,2.5vh,1.375rem)] font-black uppercase tracking-tight text-foreground leading-tight"
          >
            {headline}
          </h2>

          <p
            id="lesson-result-desc"
            className="text-[clamp(0.6875rem,1.3vh,0.8125rem)] text-sub leading-snug line-clamp-2 sm:line-clamp-none"
          >
            {feedback}
          </p>

          {/* Explicit Mistakes / Weakness Guidance for Poor Performance */}
          {!passed && mistakeSummary && (
            <div className="mt-0.5 w-full rounded-xl border border-error/30 bg-error/5 p-2 sm:p-2.5 text-left font-sans text-[11px]">
              <div className="flex items-center gap-1.5 font-display text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-error mb-0.5">
                <Target size={11} aria-hidden="true" />
                Focus for your retry
              </div>
              <p className="font-medium text-foreground/90 leading-snug">
                {mistakeSummary}
              </p>
              {weaknessFeedback && (
                <p className="mt-1 text-[10px] text-sub leading-snug border-t border-error/20 pt-1">
                  {weaknessFeedback}
                </p>
              )}
            </div>
          )}

          {/* Passed: Next Challenge Preview */}
          {passed && (
            <div className="mt-0.5 inline-flex items-center justify-center gap-1.5 rounded-full border border-border/70 bg-sub-alt/40 px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-[11px] text-sub max-w-full">
              <span className="font-display font-bold uppercase tracking-wider text-accent shrink-0">
                Next:
              </span>
              <span className="font-medium text-foreground truncate max-w-[190px] sm:max-w-[260px]">
                {nextStepLabel}
              </span>
            </div>
          )}
        </div>

        {/* 4. Core Performance Numbers (WPM, Accuracy, Errors, Time) */}
        <div className="grid w-full grid-cols-4 gap-1 sm:gap-1.5 font-mono text-center">
          <div className="rounded-xl border border-border/70 bg-sub-alt/25 py-[clamp(0.35rem,0.9vh,0.55rem)] px-1 sm:px-1.5 flex flex-col items-center justify-center shadow-xs">
            <div className="font-display text-[clamp(0.9375rem,2.1vh,1.1875rem)] font-bold text-foreground leading-tight">
              {wpm}
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase font-sans font-medium text-sub tracking-wider leading-none mt-0.5">
              WPM
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-sub-alt/25 py-[clamp(0.35rem,0.9vh,0.55rem)] px-1 sm:px-1.5 flex flex-col items-center justify-center shadow-xs">
            <div
              className={cn(
                "font-display text-[clamp(0.9375rem,2.1vh,1.1875rem)] font-bold leading-tight",
                roundedAccuracy >= minAccuracy ? "text-foreground" : "text-error",
              )}
            >
              {roundedAccuracy}%
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase font-sans font-medium text-sub tracking-wider leading-none mt-0.5">
              Accuracy
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-sub-alt/25 py-[clamp(0.35rem,0.9vh,0.55rem)] px-1 sm:px-1.5 flex flex-col items-center justify-center shadow-xs">
            <div
              className={cn(
                "font-display text-[clamp(0.9375rem,2.1vh,1.1875rem)] font-bold leading-tight",
                errors > 0 && !passed ? "text-error" : "text-foreground",
              )}
            >
              {errors}
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase font-sans font-medium text-sub tracking-wider leading-none mt-0.5">
              Errors
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-sub-alt/25 py-[clamp(0.35rem,0.9vh,0.55rem)] px-1 sm:px-1.5 flex flex-col items-center justify-center shadow-xs">
            <div className="font-display text-[clamp(0.9375rem,2.1vh,1.1875rem)] font-bold text-foreground leading-tight">
              {durationSec}s
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase font-sans font-medium text-sub tracking-wider leading-none mt-0.5">
              Time
            </div>
          </div>
        </div>

        {/* 5. XP Reward Callout */}
        {Boolean(xpAwarded && xpAwarded > 0) && (
          <div className="flex items-center justify-center gap-1.5 font-display text-[10px] sm:text-[11px] font-bold text-accent">
            <Zap size={12} className="fill-accent text-accent" aria-hidden="true" />
            <span>+{xpAwarded} Player XP Awarded</span>
          </div>
        )}

        {/* 6. Primary & Secondary Actions */}
        <div className="flex w-full flex-col gap-[clamp(0.35rem,0.8vh,0.5rem)] pt-0.5">
          {passed ? (
            <>
              {/* Primary: Continue */}
              <button
                ref={primaryButtonRef}
                type="button"
                disabled={isNavigating}
                onClick={handlePrimaryClick}
                className={cn(
                  "group relative flex h-[clamp(2.25rem,4.8vh,2.625rem)] w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 font-display text-[clamp(0.6875rem,1.3vh,0.8125rem)] font-bold uppercase tracking-wider text-background shadow-md shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  isNavigating && "opacity-60 cursor-not-allowed",
                )}
              >
                <span className="truncate max-w-[200px] sm:max-w-[260px]">
                  {primaryActionLabel}
                </span>
                <span className="rounded bg-background/20 px-1.5 py-0.5 font-mono text-[9px] font-normal text-background/90 group-hover:bg-background/30 shrink-0">
                  Enter ↵
                </span>
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5 shrink-0"
                  aria-hidden="true"
                />
              </button>

              {/* Secondary: Repeat for Higher Score */}
              <button
                type="button"
                disabled={isNavigating}
                onClick={handleRetryClick}
                className="flex h-[clamp(1.875rem,3.8vh,2.125rem)] w-full items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-sub-alt/15 font-display text-[clamp(0.625rem,1.15vh,0.75rem)] font-semibold uppercase tracking-wider text-sub transition-colors hover:text-foreground hover:bg-sub-alt/35 hover:border-sub/40 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
                  "group relative flex h-[clamp(2.25rem,4.8vh,2.625rem)] w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 font-display text-[clamp(0.6875rem,1.3vh,0.8125rem)] font-bold uppercase tracking-wider text-background shadow-md shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  isNavigating && "opacity-60 cursor-not-allowed",
                )}
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Try Again</span>
                <span className="rounded bg-background/20 px-1.5 py-0.5 font-mono text-[9px] font-normal text-background/90 shrink-0">
                  Enter ↵
                </span>
              </button>

              {/* Secondary: Practice Weak Keys */}
              {onPracticeLab && retryFocusKeys && retryFocusKeys.length > 0 && (
                <button
                  type="button"
                  disabled={isNavigating}
                  onClick={onPracticeLab}
                  className="flex h-[clamp(1.875rem,3.8vh,2.125rem)] w-full items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-sub-alt/15 font-display text-[clamp(0.625rem,1.15vh,0.75rem)] font-semibold uppercase tracking-wider text-sub transition-colors hover:border-accent hover:text-foreground active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Target size={12} aria-hidden="true" />
                  <span className="truncate max-w-[280px]">
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

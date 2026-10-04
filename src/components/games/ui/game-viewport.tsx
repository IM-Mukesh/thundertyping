"use client";

import { type ReactNode, forwardRef, useEffect } from "react";
import { useGameViewport, type GameViewportMetrics } from "@/lib/games/use-game-viewport";
import { cn } from "@/lib/utils/cn";

export interface GameViewportProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onFocusGame?: () => void;
  onPause?: () => void;
  isFocused?: boolean;
  isRunning?: boolean;
  onMetricsChange?: (metrics: GameViewportMetrics) => void;
}

/**
 * Mobile-safe responsive container for all arcade games.
 *
 * Automatically tracks `window.visualViewport` and sets CSS variables:
 * - `--safe-board-height`: Adjusted board height taking keyboard into account
 * - `--visible-height`: Height of the visible screen area
 * - `--keyboard-inset`: Pixels taken by virtual keyboard
 *
 * Prevents accidental page bouncing during touch-typing, ensures HUD and
 * bottom impact lines stay visible, and handles safe areas.
 */
export const GameViewport = forwardRef<HTMLDivElement, GameViewportProps>(
  function GameViewport(
    { children, className, style, onFocusGame, onPause, isFocused = true, isRunning = false },
    forwardedRef,
  ) {
    const { containerRef } = useGameViewport<HTMLDivElement>();

    useEffect(() => {
      if (!isRunning || !onPause) return;
      const onVisibility = () => { if (document.hidden) onPause(); };
      window.addEventListener("blur", onPause);
      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        window.removeEventListener("blur", onPause);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }, [isRunning, onPause]);

    // Merge internal containerRef with forwardedRef if present
    const setRef = (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    return (
      <div
        ref={setRef}
        onClick={(event) => {
          // Buttons, links and settings keep their native keyboard focus.
          if ((event.target as Element).closest("button, a, input, select, textarea, [role=tab]")) return;
          onFocusGame?.();
        }}
        onKeyDown={(event) => {
          if (isRunning && onPause && event.key === "Escape") {
            event.preventDefault();
            onPause();
          }
        }}
        className={cn(
          "relative flex w-full flex-col items-center select-none",
          "touch-manipulation",
          className,
        )}
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
          ...style,
        }}
      >
        {onPause && isRunning && (
          <button type="button" onClick={onPause} className="min-h-11 self-end rounded-lg border border-border px-3 text-xs text-sub hover:text-foreground">
            Pause · Esc
          </button>
        )}
        {children}

        {/* Focus warning banner for mobile & desktop when run is active but keyboard dropped */}
        {isRunning && !isFocused && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFocusGame?.();
            }}
            className="absolute inset-x-4 top-16 z-50 flex items-center justify-center gap-2 rounded-xl border border-accent/80 bg-background/95 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-accent shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            style={{
              boxShadow: "0 0 25px color-mix(in srgb, var(--accent) 40%, transparent)",
            }}
          >
            <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
            Tap to resume typing
          </button>
        )}
      </div>
    );
  },
);

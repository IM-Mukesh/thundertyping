"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export interface GameViewportMetrics {
  /** The visible height in px, accounting for on-screen virtual keyboard (OSK). */
  visibleHeight: number;
  /** The visible width in px. */
  visibleWidth: number;
  /** Estimated keyboard height in px (0 if keyboard is closed). */
  keyboardInset: number;
  /** True when the OS keyboard is detected as open. */
  isKeyboardOpen: boolean;
  /** True on small mobile screens (<640px). */
  isMobile: boolean;
  /** True in landscape orientation. */
  isLandscape: boolean;
}

const DEFAULT_METRICS: GameViewportMetrics = {
  visibleHeight: 600,
  visibleWidth: 800,
  keyboardInset: 0,
  isKeyboardOpen: false,
  isMobile: false,
  isLandscape: false,
};

/**
 * Hook to provide accurate visual viewport dimensions and virtual keyboard
 * detection across mobile Safari iOS, Android Chrome, and desktop browsers.
 *
 * Exposes CSS custom variables on the ref element:
 * - `--game-vh`: Actual visible height (px)
 * - `--visible-height`: Actual visible height (px)
 * - `--keyboard-inset`: Keyboard height inset (px)
 */
export function useGameViewport<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T | null>(null);
  const [metrics, setMetrics] = useState<GameViewportMetrics>(DEFAULT_METRICS);
  const rafIdRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    if (typeof window === "undefined") return;

    const vv = window.visualViewport;
    const windowH = window.innerHeight;
    const windowW = window.innerWidth;

    const vH = vv ? Math.round(vv.height) : windowH;
    const vW = vv ? Math.round(vv.width) : windowW;

    // Detect virtual keyboard: when windowH - vH exceeds 120px on mobile/touch devices
    const inset = Math.max(0, windowH - vH);
    const isKeyboard = inset > 120;
    const isMobile = windowW < 640 || (vv ? vv.width < 640 : false);
    const isLandscape = vW > vH;

    const newMetrics: GameViewportMetrics = {
      visibleHeight: vH,
      visibleWidth: vW,
      keyboardInset: isKeyboard ? inset : 0,
      isKeyboardOpen: isKeyboard,
      isMobile,
      isLandscape,
    };

    setMetrics((prev) => {
      if (
        prev.visibleHeight === newMetrics.visibleHeight &&
        prev.visibleWidth === newMetrics.visibleWidth &&
        prev.keyboardInset === newMetrics.keyboardInset &&
        prev.isKeyboardOpen === newMetrics.isKeyboardOpen &&
        prev.isMobile === newMetrics.isMobile &&
        prev.isLandscape === newMetrics.isLandscape
      ) {
        return prev;
      }
      return newMetrics;
    });

    // Update CSS variables directly on container element for layout speed without re-rendering
    if (containerRef.current) {
      const el = containerRef.current;
      el.style.setProperty("--game-vh", `${vH}px`);
      el.style.setProperty("--visible-height", `${vH}px`);
      el.style.setProperty("--keyboard-inset", `${newMetrics.keyboardInset}px`);
      // Compute safe game board height: when keyboard is open, board must not exceed available space
      const maxBoardH = isKeyboard
        ? Math.max(260, Math.min(vH - 30, 420))
        : isMobile
          ? Math.min(Math.max(vH * 0.65, 340), 560)
          : 540;
      el.style.setProperty("--safe-board-height", `${Math.round(maxBoardH)}px`);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const scheduleMeasure = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        measure();
        rafIdRef.current = null;
      });
    };

    scheduleMeasure();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", scheduleMeasure);
      vv.addEventListener("scroll", scheduleMeasure);
    }
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (vv) {
        vv.removeEventListener("resize", scheduleMeasure);
        vv.removeEventListener("scroll", scheduleMeasure);
      }
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
    };
  }, [measure]);

  return { containerRef, metrics, measure };
}

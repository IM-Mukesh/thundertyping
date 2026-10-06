"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  FallingWordsSceneLoop,
  createFallingWordsRenderer,
  type FallingWordsSceneRenderer,
} from "@/lib/games/falling-words/renderer";
import type {
  FallingWordsRenderMode,
  FallingWordsRenderQuality,
  FallingWordsVisualState,
} from "@/lib/games/falling-words/visual-model";

export interface FallingWordsVisualLayerProps {
  readonly state: FallingWordsVisualState;
  readonly laneCount: number;
  readonly reducedMotion?: boolean;
  readonly quality?: FallingWordsRenderQuality;
  readonly onMode?: (mode: FallingWordsRenderMode) => void;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const LAYER_STYLE: CSSProperties = {
  position: "absolute", inset: 0, width: "100%", height: "100%",
  overflow: "hidden", pointerEvents: "none",
  background: "radial-gradient(ellipse at 50% 95%, #173d48 0%, #0d182c 45%, #070b20 100%)",
};
const CANVAS_STYLE: CSSProperties = {
  position: "absolute", inset: 0, display: "block", width: "100%", height: "100%",
  pointerEvents: "none", visibility: "hidden",
};

/** Decorative scene, mounted inside the arena behind DOM labels and outside HUD. */
export function FallingWordsVisualLayer({
  state, laneCount, reducedMotion = false, quality = "auto", onMode, className, style,
}: FallingWordsVisualLayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const laneCountRef = useRef(laneCount);
  const onModeRef = useRef(onMode);
  const loopRef = useRef<FallingWordsSceneLoop | null>(null);

  useEffect(() => {
    stateRef.current = state;
    laneCountRef.current = laneCount;
    onModeRef.current = onMode;
    // Sampling never draws: the single coalescing RAF scheduler owns all frames.
    loopRef.current?.update(state, laneCount, performance.now());
  }, [state, laneCount, onMode]);

  useEffect(() => {
    const host = hostRef.current, glCanvas = glCanvasRef.current, fallbackCanvas = fallbackCanvasRef.current;
    if (!host || !glCanvas || !fallbackCanvas) return;
    let disposed = false;
    let renderer: FallingWordsSceneRenderer | null = null;
    let loop: FallingWordsSceneLoop | null = null;
    let lastWidth = 0, lastHeight = 0, lastDpr = 0;
    let intersects = true;
    const motionQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    let dprQuery: MediaQueryList | null = null;

    const measure = () => {
      if (disposed) return;
      const rect = host.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (rect.width > 0 && rect.height > 0 && (rect.width !== lastWidth || rect.height !== lastHeight || dpr !== lastDpr)) {
        lastWidth = rect.width; lastHeight = rect.height; lastDpr = dpr;
        renderer?.resize(rect.width, rect.height, dpr);
        loop?.invalidate();
      }
      const inViewport = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
      loop?.setVisible(document.visibilityState !== "hidden" && intersects && inViewport);
    };
    const mountRenderer = () => {
      if (disposed) return;
      loop?.dispose(); renderer?.dispose();
      const motion = reducedMotion || Boolean(motionQuery?.matches);
      renderer = createFallingWordsRenderer(glCanvas, {
        quality, reducedMotion: motion,
        onMode: (mode) => onModeRef.current?.(mode),
        onInvalidate: () => loop?.invalidate(),
        deviceHints: {
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
          saveData: (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
          coarsePointer: typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches,
        },
      }, fallbackCanvas);
      loop = new FallingWordsSceneLoop(renderer, {
        request: (callback) => window.requestAnimationFrame(callback),
        cancel: (id) => window.cancelAnimationFrame(id),
      }, motion);
      loopRef.current = loop;
      lastWidth = 0; lastHeight = 0; lastDpr = 0;
      loop.update(stateRef.current, laneCountRef.current, performance.now());
      measure();
    };
    const onDprChange = () => { watchDpr(); measure(); };
    const watchDpr = () => {
      dprQuery?.removeEventListener("change", onDprChange);
      dprQuery = typeof window.matchMedia === "function" ? window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`) : null;
      dprQuery?.addEventListener("change", onDprChange);
    };

    mountRenderer();
    watchDpr();
    motionQuery?.addEventListener("change", mountRenderer);
    window.addEventListener("resize", measure);
    // Also covers offscreen/onscreen movement when IntersectionObserver is absent.
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    document.addEventListener("visibilitychange", measure);

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    resizeObserver?.observe(host);
    const intersectionObserver = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((entries) => {
      if (disposed) return;
      intersects = entries.some((entry) => entry.target === host && entry.isIntersecting);
      measure();
    }) : null;
    intersectionObserver?.observe(host);

    return () => {
      disposed = true;
      resizeObserver?.disconnect(); intersectionObserver?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      document.removeEventListener("visibilitychange", measure);
      motionQuery?.removeEventListener("change", mountRenderer);
      dprQuery?.removeEventListener("change", onDprChange);
      loop?.dispose(); renderer?.dispose();
      if (loopRef.current === loop) loopRef.current = null;
    };
  }, [quality, reducedMotion]);

  return (
    <div ref={hostRef} aria-hidden="true" className={className} style={{ ...LAYER_STYLE, ...style }}>
      <canvas ref={glCanvasRef} tabIndex={-1} style={CANVAS_STYLE} />
      <canvas ref={fallbackCanvasRef} tabIndex={-1} style={CANVAS_STYLE} />
    </div>
  );
}

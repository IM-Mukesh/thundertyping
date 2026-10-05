"use client";

import { useEffect, useRef } from "react";
import {
  clampWar,
  createTacticalWarRenderer,
  createWebGLWarRenderer,
  type WarProjection,
  type WarRenderMode,
  type WarRenderQuality,
  type WarSceneRenderer,
} from "@/lib/games/rakshasa/renderer";
import type { WarEnemy, WarStage, WarState } from "@/lib/games/rakshasa/types";
import styles from "./scene.module.css";

export interface TypeboundSceneProps {
  state: WarState;
  stage: WarStage;
  reducedMotion: boolean;
  quality: WarRenderQuality;
  onMode: (mode: WarRenderMode) => void;
}
interface EnemyLabel {
  element: HTMLDivElement;
  typed: HTMLSpanElement;
  remaining: HTMLSpanElement;
  badge: HTMLSpanElement;
  signature: string;
  width: number;
  height: number;
}
interface LabelRect { left: number; right: number; top: number; bottom: number; }
const MAX_LABELS = 6;
const STATIC_PHASES = new Set(["menu", "paused", "victory", "defeat"]);

function makeLabel(enemy: WarEnemy, parent: HTMLDivElement): EnemyLabel {
  const element = document.createElement("div");
  element.className = styles.label;
  element.dataset.enemyId = String(enemy.id);
  element.setAttribute("role", "listitem");
  const word = document.createElement("span");
  word.className = styles.word;
  const typed = document.createElement("span");
  typed.className = styles.typed;
  const remaining = document.createElement("span");
  remaining.className = styles.remaining;
  word.append(typed, remaining);
  const badge = document.createElement("span");
  badge.className = styles.badge;
  element.append(word, badge);
  parent.append(element);
  return { element, typed, remaining, badge, signature: "", width: 100, height: 34 };
}

function updateLabel(label: EnemyLabel, enemy: WarEnemy, active: boolean): void {
  const count = Math.floor(clampWar(enemy.typed, 0, enemy.word.length));
  const badge = [enemy.elite ? "ELITE" : "", enemy.maxHp > 100 ? `ARMOR ${Math.ceil(enemy.hp / 100)} WORD LAYERS` : ""].filter(Boolean).join(" · ");
  const signature = `${enemy.word}:${count}:${badge}:${active}`;
  if (signature === label.signature) return;
  label.signature = signature;
  label.typed.textContent = enemy.word.slice(0, count);
  label.remaining.textContent = enemy.word.slice(count);
  label.badge.textContent = badge;
  label.badge.hidden = !badge;
  label.element.className = `${styles.label}${active ? ` ${styles.active}` : ""}${enemy.elite ? ` ${styles.elite}` : ""}`;
  label.element.dataset.active = String(active);
  label.element.setAttribute("aria-label", `${enemy.word}, ${enemy.kind.replaceAll("-", " ")}${badge ? `, ${badge.toLowerCase()}` : ""}${active ? ", active target" : ""}, ${count} of ${enemy.word.length} letters typed`);
  // Conservative measured-by-font bounds avoid layout reads in the RAF loop.
  label.width = Math.min(260, Math.max(60, enemy.word.length * 9.5 + 26, badge.length * 6.3 + 22));
  label.height = badge ? 49 : 33;
}

function placeLabels(labels: Map<number, EnemyLabel>, state: WarState, renderer: WarSceneRenderer, parent: HTMLDivElement, width: number, height: number): void {
  const enemies = state.enemies.slice().sort((a, b) => Number(b.id === state.targetId) - Number(a.id === state.targetId) || b.progress - a.progress).slice(0, MAX_LABELS);
  const present = new Set(enemies.map((enemy) => enemy.id));
  for (const [id, label] of labels) if (!present.has(id)) { label.element.remove(); labels.delete(id); }
  const projected: { enemy: WarEnemy; label: EnemyLabel; p: WarProjection }[] = [];
  for (const enemy of enemies) {
    let label = labels.get(enemy.id);
    if (!label) { label = makeLabel(enemy, parent); labels.set(enemy.id, label); }
    updateLabel(label, enemy, enemy.id === state.targetId);
    projected.push({ enemy, label, p: renderer.projectEnemy(enemy) });
  }
  const occupied: LabelRect[] = [];
  for (const { enemy, label, p } of projected) {
    if (!p.visible || width < 90 || height < 90) { label.element.hidden = true; continue; }
    const half = Math.min(label.width, width - 16) / 2;
    const x = clampWar(p.x, half + 8, width - half - 8);
    let y = clampWar(p.y - 5, label.height + 8, height - 14);
    for (let pass = 0; pass < 6; pass++) {
      const overlap = occupied.find((rect) => x + half + 4 > rect.left && x - half - 4 < rect.right && y > rect.top - 4 && y - label.height < rect.bottom + 4);
      if (!overlap) break;
      y = overlap.top - 6;
    }
    if ((y < label.height + 5 || p.y - y > 150) && enemy.id !== state.targetId) { label.element.hidden = true; continue; }
    y = Math.max(label.height + 5, y);
    label.element.hidden = false;
    label.element.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) translate(-50%,-100%)`;
    label.element.style.zIndex = enemy.id === state.targetId ? "200" : String(Math.max(1, Math.round(100 - p.depth)));
    occupied.push({ left: x - half, right: x + half, top: y - label.height, bottom: y });
  }
}

/** Lazy-load this client boundary from the game controller with ssr: false. */
export default function TypeboundScene({ state, stage, reducedMotion, quality, onMode }: TypeboundSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const webglRef = useRef<HTMLCanvasElement>(null);
  const tacticalRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const latest = useRef({ state, stage, reducedMotion, quality, onMode });
  const wake = useRef<(() => void) | null>(null);

  useEffect(() => {
    latest.current = { state, stage, reducedMotion, quality, onMode };
    wake.current?.();
  }, [state, stage, reducedMotion, quality, onMode]);

  useEffect(() => {
    const root = rootRef.current, webgl = webglRef.current, tactical = tacticalRef.current, overlay = labelsRef.current, indicator = indicatorRef.current;
    if (!root || !webgl || !tactical || !overlay || !indicator) return;
    const options = { reducedMotion, quality };
    const labels = new Map<number, EnemyLabel>();
    let renderer: WarSceneRenderer;
    let alive = true, raf: number | null = null, force = true, lastDraw = -Infinity;
    let width = 0, height = 0, dpr = 0, reportedMode: WarRenderMode | null = null;
    let hasObserver = typeof ResizeObserver !== "undefined";

    const reportMode = () => {
      webgl.hidden = renderer.mode !== "webgl";
      tactical.hidden = renderer.mode !== "fallback";
      indicator.hidden = renderer.mode !== "fallback";
      root.dataset.renderMode = renderer.mode;
      if (reportedMode !== renderer.mode) { reportedMode = renderer.mode; latest.current.onMode(renderer.mode); }
    };
    const measure = () => {
      const nextWidth = Math.max(1, root.clientWidth), nextHeight = Math.max(1, root.clientHeight);
      const nextDpr = Math.min(quality === "low" ? 1 : 1.5, window.devicePixelRatio || 1);
      if (width === nextWidth && height === nextHeight && dpr === nextDpr) return;
      width = nextWidth; height = nextHeight; dpr = nextDpr;
      try { renderer.resize(width, height, dpr); }
      catch { switchToFallback(); }
      force = true;
    };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const switchToFallback = () => {
      renderer?.dispose();
      renderer = createTacticalWarRenderer(tactical, options);
      renderer.resize(width, height, dpr);
      reportMode();
    };
    try {
      if (!hasObserver) throw new Error("Compatibility resize mode");
      renderer = createWebGLWarRenderer(webgl, options);
    } catch { renderer = createTacticalWarRenderer(tactical, options); }
    measure();
    reportMode();

    const tick = (now: number) => {
      raf = null;
      if (!alive || document.hidden) return;
      if (!hasObserver) measure();
      const current = latest.current;
      const fps = reducedMotion ? 16 : renderer.mode === "fallback" || quality === "low" || (quality === "auto" && width < 760) ? 30 : quality === "high" ? 60 : 45;
      if (force || now - lastDraw >= 1_000 / fps - 1) {
        force = false;
        lastDraw = now;
        root.style.backgroundColor = current.stage.palette.sky;
        try { renderer.render(current.state, current.stage, now); }
        catch {
          if (renderer.mode === "webgl") {
            switchToFallback();
            try { renderer.render(current.state, current.stage, now); } catch { /* Words remain usable if even Canvas painting fails. */ }
          }
        }
        placeLabels(labels, current.state, renderer, overlay, width, height);
      }
      if (!STATIC_PHASES.has(current.state.phase)) schedule();
    };
    function schedule() {
      if (alive && !document.hidden && raf === null) raf = requestAnimationFrame(tick);
    }
    const requestFrame = () => { force = true; schedule(); };
    wake.current = requestFrame;
    const resized = () => { measure(); requestFrame(); };
    const visibility = () => { stop(); lastDraw = -Infinity; if (!document.hidden) requestFrame(); };
    const contextLost = (event: Event) => { event.preventDefault(); stop(); switchToFallback(); requestFrame(); };
    const contextRestored = () => {
      if (!alive || !hasObserver) return;
      stop();
      let restored: WarSceneRenderer | null = null;
      try {
        restored = createWebGLWarRenderer(webgl, options);
        restored.resize(width, height, dpr);
        renderer.dispose();
        renderer = restored;
        restored = null;
        reportMode();
      } catch { restored?.dispose(); if (renderer.mode !== "fallback") switchToFallback(); }
      requestFrame();
    };
    let observer: ResizeObserver | null = null;
    try {
      if (hasObserver) { observer = new ResizeObserver(resized); observer.observe(root); }
    } catch {
      observer?.disconnect();
      observer = null;
      hasObserver = false;
      switchToFallback();
    }
    window.addEventListener("resize", resized);
    window.addEventListener("orientationchange", resized);
    document.addEventListener("visibilitychange", visibility);
    webgl.addEventListener("webglcontextlost", contextLost);
    webgl.addEventListener("webglcontextrestored", contextRestored);
    requestFrame();
    return () => {
      alive = false;
      wake.current = null;
      stop();
      observer?.disconnect();
      window.removeEventListener("resize", resized);
      window.removeEventListener("orientationchange", resized);
      document.removeEventListener("visibilitychange", visibility);
      webgl.removeEventListener("webglcontextlost", contextLost);
      webgl.removeEventListener("webglcontextrestored", contextRestored);
      renderer.dispose();
      labels.clear();
      overlay.replaceChildren();
    };
  }, [quality, reducedMotion]);

  return <div ref={rootRef} className={styles.scene}>
    <canvas ref={webglRef} className={styles.canvas} aria-hidden="true" />
    <canvas ref={tacticalRef} className={styles.canvas} aria-hidden="true" hidden />
    <div ref={labelsRef} className={styles.labels} role="list" aria-label="Approaching enemies" aria-live="off" />
    <span ref={indicatorRef} className={styles.mode} role="status" hidden>Tactical 2D mode</span>
  </div>;
}

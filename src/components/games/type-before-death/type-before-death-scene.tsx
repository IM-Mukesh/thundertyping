"use client";

import { useEffect, useRef } from "react";
import {
  clampTypeBeforeDeath,
  createCanvasTypeBeforeDeathRenderer,
  createWebGLTypeBeforeDeathRenderer,
  type TypeBeforeDeathProjection,
  type TypeBeforeDeathRenderMode,
  type TypeBeforeDeathRenderQuality,
  type TypeBeforeDeathSceneRenderer,
  type TypeBeforeDeathSceneView,
} from "@/lib/games/type-before-death/renderer";
import type { TypeBeforeDeathBossView, TypeBeforeDeathEnemyView } from "@/lib/games/type-before-death/scene-contract";
import styles from "./scene.module.css";

export interface TypeBeforeDeathSceneProps {
  readonly view: TypeBeforeDeathSceneView;
  readonly reducedMotion?: boolean;
  readonly quality?: TypeBeforeDeathRenderQuality;
  readonly onMode?: (mode: TypeBeforeDeathRenderMode) => void;
  readonly className?: string;
}

interface EnemyLabel {
  readonly element: HTMLDivElement;
  readonly typed: HTMLSpanElement;
  readonly remaining: HTMLSpanElement;
  readonly hpFill: HTMLSpanElement;
  readonly badge: HTMLSpanElement;
  signature: string;
  width: number;
  height: number;
}

interface BossLabel {
  readonly element: HTMLDivElement;
  readonly name: HTMLSpanElement;
  readonly hpFill: HTMLSpanElement;
  signature: string;
  width: number;
  height: number;
}

interface LabelRect {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

const MAX_ENEMY_LABELS = 8;

function idKey(id: string | number): string {
  return String(id);
}

function updateEnemyLabel(label: EnemyLabel, enemy: TypeBeforeDeathEnemyView): void {
  const typed = Math.floor(clampTypeBeforeDeath(enemy.typed, 0, enemy.word.length));
  const hp = clampTypeBeforeDeath(enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0, 0, 1);
  const kind = enemy.kind.replaceAll("-", " ");
  const signature = `${enemy.id}:${enemy.word}:${typed}:${enemy.hp}:${enemy.maxHp}:${enemy.targeted}:${enemy.hitFlash}:${kind}`;
  if (label.signature === signature) return;
  label.signature = signature;
  label.typed.textContent = enemy.word.slice(0, typed);
  label.remaining.textContent = enemy.word.slice(typed) || " ";
  label.badge.textContent = kind.toUpperCase();
  label.hpFill.style.width = `${Math.round(hp * 100)}%`;
  label.element.className = `${styles.label}${enemy.targeted ? ` ${styles.targeted}` : ""}${enemy.hitFlash > 0.04 ? ` ${styles.hit}` : ""}`;
  label.element.dataset.enemyId = idKey(enemy.id);
  label.element.dataset.targeted = String(enemy.targeted);
  label.element.setAttribute("aria-label", `${enemy.word}, ${kind}, ${typed} of ${enemy.word.length} letters typed, ${Math.ceil(Math.max(0, enemy.hp))} health${enemy.targeted ? ", active target" : ""}`);
  label.width = Math.min(280, Math.max(72, enemy.word.length * 9.4 + 30, kind.length * 6.4 + 24));
  label.height = 49;
}

function updateBossLabel(label: BossLabel, boss: TypeBeforeDeathBossView): void {
  const hp = clampTypeBeforeDeath(boss.maxHp > 0 ? boss.hp / boss.maxHp : 0, 0, 1);
  const name = boss.name ?? boss.kind?.replaceAll("-", " ") ?? "city revenant";
  const signature = `${name}:${boss.hp}:${boss.maxHp}:${boss.targeted}:${boss.hitFlash}:${boss.word ?? ""}:${boss.typed ?? 0}`;
  if (label.signature === signature) return;
  label.signature = signature;
  label.name.textContent = name.toUpperCase();
  label.hpFill.style.width = `${Math.round(hp * 100)}%`;
  label.element.className = `${styles.bossLabel}${boss.targeted ? ` ${styles.targeted}` : ""}${boss.hitFlash > 0.04 ? ` ${styles.hit}` : ""}`;
  label.element.setAttribute("aria-label", `${name}, boss, ${Math.ceil(Math.max(0, boss.hp))} health${boss.targeted ? ", active target" : ""}`);
  label.width = Math.min(300, Math.max(128, name.length * 8 + 38));
  label.height = 43;
}

function makeEnemyLabel(enemy: TypeBeforeDeathEnemyView, parent: HTMLDivElement): EnemyLabel {
  const element = document.createElement("div");
  element.className = styles.label;
  element.setAttribute("role", "listitem");
  const word = document.createElement("span");
  word.className = styles.word;
  const typed = document.createElement("span");
  typed.className = styles.typed;
  const remaining = document.createElement("span");
  remaining.className = styles.remaining;
  word.append(typed, remaining);
  const hp = document.createElement("span");
  hp.className = styles.hp;
  const hpFill = document.createElement("span");
  hpFill.className = styles.hpFill;
  hp.append(hpFill);
  const badge = document.createElement("span");
  badge.className = styles.badge;
  element.append(word, hp, badge);
  parent.append(element);
  const label = { element, typed, remaining, hpFill, badge, signature: "", width: 110, height: 49 };
  updateEnemyLabel(label, enemy);
  return label;
}

function makeBossLabel(parent: HTMLDivElement): BossLabel {
  const element = document.createElement("div");
  element.className = styles.bossLabel;
  element.setAttribute("role", "listitem");
  const name = document.createElement("span");
  name.className = styles.bossName;
  const hp = document.createElement("span");
  hp.className = styles.hp;
  const hpFill = document.createElement("span");
  hpFill.className = styles.bossHpFill;
  hp.append(hpFill);
  element.append(name, hp);
  parent.append(element);
  return { element, name, hpFill, signature: "", width: 180, height: 43 };
}

function placeLabels(
  labels: Map<string, EnemyLabel>,
  bossLabel: BossLabel | null,
  view: TypeBeforeDeathSceneView,
  renderer: TypeBeforeDeathSceneRenderer,
  parent: HTMLDivElement,
  width: number,
  height: number,
): void {
  const enemies = [...view.enemies]
    .sort((a, b) => Number(b.targeted) - Number(a.targeted) || b.progress - a.progress)
    .slice(0, MAX_ENEMY_LABELS);
  const present = new Set(enemies.map((enemy) => idKey(enemy.id)));
  for (const [id, label] of labels) {
    if (!present.has(id)) {
      label.element.remove();
      labels.delete(id);
    }
  }
  const projected: { enemy: TypeBeforeDeathEnemyView; label: EnemyLabel; projection: TypeBeforeDeathProjection }[] = [];
  for (const enemy of enemies) {
    const key = idKey(enemy.id);
    let label = labels.get(key);
    if (!label) {
      label = makeEnemyLabel(enemy, parent);
      labels.set(key, label);
    }
    updateEnemyLabel(label, enemy);
    projected.push({ enemy, label, projection: renderer.projectEnemy(enemy) });
  }
  const occupied: LabelRect[] = [];
  for (const { enemy, label, projection } of projected) {
    if (!projection.visible || width < 120 || height < 100) {
      label.element.hidden = true;
      continue;
    }
    const half = Math.min(label.width, Math.max(60, width - 16)) / 2;
    const x = clampTypeBeforeDeath(projection.x, half + 8, width - half - 8);
    let y = clampTypeBeforeDeath(projection.y - 7, label.height + 8, height - 12);
    for (let pass = 0; pass < 7; pass++) {
      const overlap = occupied.find((rect) => x + half + 4 > rect.left && x - half - 4 < rect.right && y > rect.top - 4 && y - label.height < rect.bottom + 4);
      if (!overlap) break;
      y = overlap.top - 7;
    }
    if ((y < label.height + 5 || projection.y - y > 190) && !enemy.targeted) {
      label.element.hidden = true;
      continue;
    }
    label.element.hidden = false;
    label.element.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) translate(-50%,-100%)`;
    label.element.style.zIndex = enemy.targeted ? "210" : String(Math.max(1, Math.round(130 - projection.depth)));
    occupied.push({ left: x - half, right: x + half, top: y - label.height, bottom: y });
  }

  if (!view.boss?.active || !bossLabel) {
    if (bossLabel) bossLabel.element.hidden = true;
    return;
  }
  updateBossLabel(bossLabel, view.boss);
  const bossProjection = renderer.projectBoss(view.boss);
  if (!bossProjection.visible) {
    bossLabel.element.hidden = true;
    return;
  }
  const bossHalf = Math.min(bossLabel.width, Math.max(72, width - 16)) / 2;
  const bossX = clampTypeBeforeDeath(bossProjection.x, bossHalf + 8, width - bossHalf - 8);
  let bossY = clampTypeBeforeDeath(bossProjection.y - 12, bossLabel.height + 8, height - 12);
  for (let pass = 0; pass < 7; pass++) {
    const overlap = occupied.find((rect) => bossX + bossHalf + 4 > rect.left && bossX - bossHalf - 4 < rect.right && bossY > rect.top - 4 && bossY - bossLabel.height < rect.bottom + 4);
    if (!overlap) break;
    bossY = overlap.top - 7;
  }
  bossLabel.element.hidden = false;
  bossLabel.element.style.transform = `translate3d(${Math.round(bossX)}px,${Math.round(bossY)}px,0) translate(-50%,-100%)`;
  bossLabel.element.style.zIndex = "220";
}

/**
 * Client-only and DOM-light scene boundary. The renderer/frame are owned by
 * the effect; props are sampled through refs so combat updates do not rebuild
 * WebGL resources or create React state churn in the animation loop.
 */
export function TypeBeforeDeathScene({ view, reducedMotion = view.reducedMotion, quality = view.quality, onMode, className }: TypeBeforeDeathSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const webglRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLSpanElement>(null);
  const latest = useRef({ view, reducedMotion, quality, onMode });
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    latest.current = { view, reducedMotion, quality, onMode };
    wakeRef.current?.();
  }, [view, reducedMotion, quality, onMode]);

  useEffect(() => {
    const root = rootRef.current;
    const webgl = webglRef.current;
    const fallback = fallbackRef.current;
    const labelsHost = labelsRef.current;
    const modeIndicator = modeRef.current;
    if (!root || !webgl || !fallback || !labelsHost || !modeIndicator) return;

    let renderer: TypeBeforeDeathSceneRenderer;
    let alive = true;
    let raf: number | null = null;
    let force = true;
    let lastDraw = -Infinity;
    let width = 0;
    let height = 0;
    let dpr = 0;
    let reportedMode: TypeBeforeDeathRenderMode | null = null;
    const labels = new Map<string, EnemyLabel>();
    let bossLabel: BossLabel | null = null;
    const requestFrame = (callback: FrameRequestCallback): number => {
      const request = (globalThis as typeof globalThis & { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
      return request ? request(callback) : 0;
    };
    const cancelFrame = (id: number): void => {
      const cancel = (globalThis as typeof globalThis & { cancelAnimationFrame?: typeof cancelAnimationFrame }).cancelAnimationFrame;
      cancel?.(id);
    };

    const reportMode = (mode: TypeBeforeDeathRenderMode): void => {
      webgl.hidden = mode !== "webgl";
      fallback.hidden = mode !== "fallback";
      modeIndicator.hidden = mode !== "fallback";
      root.dataset.renderMode = mode;
      if (reportedMode !== mode) {
        reportedMode = mode;
        latest.current.onMode?.(mode);
      }
    };

    const measure = (): void => {
      const nextWidth = Math.max(1, root.clientWidth || root.getBoundingClientRect().width);
      const nextHeight = Math.max(1, root.clientHeight || root.getBoundingClientRect().height);
      const nextDpr = Math.min(latest.current.quality === "low" ? 1 : 1.5, window.devicePixelRatio || 1);
      if (nextWidth === width && nextHeight === height && nextDpr === dpr) return;
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      try { renderer.resize(width, height, dpr); } catch { switchToFallback(); }
      force = true;
    };

    const stop = (): void => {
      if (raf !== null) cancelFrame(raf);
      raf = null;
    };

    const switchToFallback = (): void => {
      renderer?.dispose();
      renderer = createCanvasTypeBeforeDeathRenderer(fallback, { quality, reducedMotion });
      if (width > 0 && height > 0) renderer.resize(width, height, dpr);
      reportMode(renderer.mode);
    };

    try {
      renderer = createWebGLTypeBeforeDeathRenderer(webgl, { quality, reducedMotion });
    } catch {
      renderer = createCanvasTypeBeforeDeathRenderer(fallback, { quality, reducedMotion });
    }
    measure();
    reportMode(renderer.mode);

    const draw = (now: number): void => {
      raf = null;
      if (!alive || document.hidden) return;
      const current = latest.current;
      const fps = current.reducedMotion || renderer.mode === "fallback" || current.quality === "low" || (current.quality === "auto" && width < 760) ? 30 : current.quality === "high" ? 60 : 45;
      if (force || now - lastDraw >= 1_000 / fps - 1) {
        force = false;
        lastDraw = now;
        try { renderer.render(current.view, now); }
        catch {
          if (renderer.mode === "webgl") {
            switchToFallback();
            try { renderer.render(current.view, now); } catch { /* Labels remain readable if Canvas is unavailable too. */ }
          }
        }
        if (!bossLabel && current.view.boss?.active) bossLabel = makeBossLabel(labelsHost);
        placeLabels(labels, bossLabel, current.view, renderer, labelsHost, width, height);
      }
      // A paused/reduced-motion snapshot is complete after one draw. Waking
      // on the next view/resize change still refreshes labels and geometry.
      if (!current.view.reducedMotion) schedule();
    };

    const schedule = (): void => {
      if (alive && !document.hidden && raf === null) raf = requestFrame(draw);
    };

    wakeRef.current = (): void => { force = true; schedule(); };
    const resized = (): void => { measure(); force = true; schedule(); };
    const visibility = (): void => { stop(); lastDraw = -Infinity; if (!document.hidden) schedule(); };
    const contextLost = (event: Event): void => {
      event.preventDefault();
      stop();
      switchToFallback();
      force = true;
      schedule();
    };
    const contextRestored = (): void => {
      if (!alive) return;
      stop();
      let restored: TypeBeforeDeathSceneRenderer | null = null;
      try {
        restored = createWebGLTypeBeforeDeathRenderer(webgl, { quality, reducedMotion });
        restored.resize(width, height, dpr);
        renderer.dispose();
        renderer = restored;
        restored = null;
        reportMode(renderer.mode);
      } catch {
        restored?.dispose();
        if (renderer.mode !== "fallback") switchToFallback();
      }
      force = true;
      schedule();
    };

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      try { observer = new ResizeObserver(resized); observer.observe(root); } catch { observer = null; }
    }
    window.addEventListener("resize", resized);
    window.addEventListener("orientationchange", resized);
    document.addEventListener("visibilitychange", visibility);
    webgl.addEventListener("webglcontextlost", contextLost);
    webgl.addEventListener("webglcontextrestored", contextRestored);
    schedule();

    return () => {
      alive = false;
      wakeRef.current = null;
      stop();
      observer?.disconnect();
      window.removeEventListener("resize", resized);
      window.removeEventListener("orientationchange", resized);
      document.removeEventListener("visibilitychange", visibility);
      webgl.removeEventListener("webglcontextlost", contextLost);
      webgl.removeEventListener("webglcontextrestored", contextRestored);
      renderer.dispose();
      labels.clear();
      labelsHost.replaceChildren();
      bossLabel = null;
    };
  }, [quality, reducedMotion]);

  return (
    <div ref={rootRef} className={`${styles.scene}${className ? ` ${className}` : ""}`} data-render-mode="loading">
      <canvas ref={webglRef} className={styles.canvas} aria-hidden="true" />
      <canvas ref={fallbackRef} className={styles.canvas} aria-hidden="true" hidden />
      <div ref={labelsRef} className={styles.labels} role="list" aria-label="Approaching threats" aria-live="off" />
      <span ref={modeRef} className={styles.mode} role="status" hidden>2D tactical fallback</span>
    </div>
  );
}

export default TypeBeforeDeathScene;

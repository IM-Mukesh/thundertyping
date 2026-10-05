import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { type ReactElement } from "react";
import ts from "typescript";
import { startWar, tickWar, pauseWar } from "@/lib/games/rakshasa/engine";
import { WAR_STAGES } from "@/lib/games/rakshasa/content";
import { clampWar } from "@/lib/games/rakshasa/renderer";
import type { WarState } from "@/lib/games/rakshasa/types";
import type { WarRenderMode } from "@/lib/games/rakshasa/renderer";

/** Production scene effect with explicit DOM/RAF/ResizeObserver doubles. */
const require = createRequire(import.meta.url);
function sceneHarness(unavailable = false) {
  let cursor = 0, nextId = 0, observers = 0, disposed = 0, rendered = 0;
  const slots: unknown[] = [], effects: (() => void)[] = [], modes: WarRenderMode[] = [];
  const rafs = new Map<number, (now: number) => void>();
  const globalEvents = new Map<string, Set<(event?: unknown) => void>>();
  const add = (type: string, fn: (event?: unknown) => void) => { if (!globalEvents.has(type)) globalEvents.set(type, new Set()); globalEvents.get(type)!.add(fn); };
  const remove = (type: string, fn: (event?: unknown) => void) => globalEvents.get(type)?.delete(fn);
  const originals = { window: globalThis.window, document: globalThis.document, requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame, ResizeObserver: globalThis.ResizeObserver };
  class Dom {
    clientWidth = 1100; clientHeight = 780; hidden = false; dataset: Record<string, string> = {}; style: Record<string, string> = {};
    textContent = ""; className = ""; children: Dom[] = []; parent: Dom | null = null;
    attributes: Record<string, string> = {}; events = new Map<string, (event?: unknown) => void>();
    append(...nodes: Dom[]) { for (const node of nodes) { node.parent = this; this.children.push(node); } }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter((node) => node !== this); }
    replaceChildren() { this.children = []; }
    setAttribute(key: string, value: string) { this.attributes[key] = value; }
    addEventListener(type: string, fn: (event?: unknown) => void) { this.events.set(type, fn); }
    removeEventListener(type: string) { this.events.delete(type); }
  }
  const root = new Dom(), webgl = new Dom(), tactical = new Dom(), labels = new Dom(), indicator = new Dom();
  const doc = { hidden: false, createElement: () => new Dom(), addEventListener: add, removeEventListener: remove };
  globalThis.document = doc as unknown as Document;
  globalThis.window = { devicePixelRatio: 3, addEventListener: add, removeEventListener: remove } as unknown as Window & typeof globalThis;
  globalThis.requestAnimationFrame = (fn) => { const id = ++nextId; rafs.set(id, fn); return id; };
  globalThis.cancelAnimationFrame = (id) => { rafs.delete(id); };
  globalThis.ResizeObserver = class {
    observe() { observers++; }
    disconnect() { observers--; }
  } as unknown as typeof ResizeObserver;
  const same = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useRef: (initial: unknown) => { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useEffect: (fn: () => (() => void) | void, deps: unknown[]) => {
      const index = cursor++; const previous = slots[index] as { deps: unknown[]; cleanup?: () => void } | undefined;
      if (!previous || !same(deps, previous.deps)) effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: fn() }; });
    },
  };
  const factory = (mode: WarRenderMode) => () => ({ mode, resize() {}, render() { rendered++; },
    projectEnemy: () => ({ x: 400, y: 310, depth: 30, scale: 20, visible: true }), dispose() { disposed++; } });
  const modules: Record<string, unknown> = {
    react,
    "./scene.module.css": { __esModule: true, default: { scene: "scene", canvas: "canvas", labels: "labels", mode: "mode", label: "label", word: "word", badge: "badge", typed: "typed", remaining: "remaining", active: "active", elite: "elite" } },
    "@/lib/games/rakshasa/renderer": { clampWar, createWebGLWarRenderer: () => { if (unavailable) throw new Error("WebGL failed"); return factory("webgl")(); }, createTacticalWarRenderer: factory("fallback") },
  };
  const exports: { default?: (props: unknown) => ReactElement<Record<string, unknown>> } = {};
  const source = readFileSync(new URL("./rakshasa-scene.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }, fileName: "rakshasa-scene.tsx" }).outputText;
  new Function("require", "exports", compiled)((id: string) => id in modules ? modules[id] : require(id), exports);
  let state = tickWar(startWar({ stage: 0, difficulty: "normal" }), 2000);
  let quality = "auto", reducedMotion = false;
  const onMode = (mode: WarRenderMode) => modes.push(mode);
  const render = () => {
    cursor = 0;
    const tree = exports.default!({ state, stage: WAR_STAGES[0], quality, reducedMotion, onMode });
    (tree.props.ref as { current: unknown }).current = root;
    (tree.props.children as ReactElement<Record<string, unknown>>[]).forEach((child, i) => { (child.props.ref as { current: unknown }).current = [webgl, tactical, labels, indicator][i]; });
    while (effects.length) effects.shift()!();
  };
  const frame = (now = 1000) => {
    const [id, fn] = rafs.entries().next().value ?? [];
    if (fn && id !== undefined) { rafs.delete(id); fn(now); }
  };
  const cleanup = () => { for (const slot of slots) if (slot && typeof slot === "object" && "cleanup" in slot) (slot as { cleanup?: () => void }).cleanup?.(); };
  render();
  return { rafs, modes, frame, labels, webgl, tactical, indicator,
    pause: () => { state = pauseWar(state); render(); },
    update: (next: WarState) => { state = next; render(); },
    hide: () => { doc.hidden = true; for (const fn of globalEvents.get("visibilitychange") ?? []) fn(); },
    show: () => { doc.hidden = false; for (const fn of globalEvents.get("visibilitychange") ?? []) fn(); },
    preferences: () => { quality = "low"; reducedMotion = true; render(); },
    stats: () => ({ observers, disposed, rendered, listeners: [...globalEvents.values()].reduce((sum, set) => sum + set.size, 0) }),
    cleanup, restore: () => { cleanup(); Object.assign(globalThis, originals); } };
}

describe("Typebound: The Last Dawn production scene lifecycle", () => {
  it("renders DOM words, keeps one RAF and stops loops/listeners/observers on pause and exit", () => {
    const h = sceneHarness();
    try {
      assert.equal(h.modes[0], "webgl");
      assert.equal(h.rafs.size, 1);
      h.frame();
      assert.equal(h.labels.children.length, 1);
      assert.ok(h.labels.children[0].attributes["aria-label"].includes("0 of"));
      assert.equal(h.labels.children[0].children[1].hidden, true, "regular warriors are not labelled as armored");
      assert.equal(h.rafs.size, 1);
      h.pause(); h.frame(1200);
      assert.equal(h.rafs.size, 0);
      h.cleanup();
      assert.equal(h.stats().observers, 0);
      assert.equal(h.stats().listeners, 0);
      assert.equal(h.stats().disposed, 1);
      assert.equal(h.labels.children.length, 0);
      assert.equal(h.webgl.events.size, 0);
    } finally { h.restore(); }
  });
  it("stops hidden-page frames and redraws after visibility returns", () => {
    const h = sceneHarness();
    try {
      h.frame(); h.hide();
      assert.equal(h.rafs.size, 0);
      h.show();
      assert.equal(h.rafs.size, 1);
      h.frame(1600);
      assert.equal(h.stats().rendered, 2);
    } finally { h.restore(); }
  });
  it("labels fallback on setup failure and remains bounded through quality recreation", () => {
    const h = sceneHarness(true);
    try {
      assert.deepEqual(h.modes, ["fallback"]);
      assert.equal(h.webgl.hidden, true);
      assert.equal(h.tactical.hidden, false);
      assert.equal(h.indicator.hidden, false);
      h.frame(); h.preferences(); h.frame(1400);
      assert.equal(h.stats().observers, 1);
      assert.equal(h.stats().disposed, 1);
      assert.equal(h.rafs.size, 1);
    } finally { h.restore(); }
  });
  it("context loss disposes graphics, switches to fallback, and can restore WebGL", () => {
    const h = sceneHarness();
    try {
      h.webgl.events.get("webglcontextlost")?.({ preventDefault() {} });
      assert.deepEqual(h.modes, ["webgl", "fallback"]);
      assert.equal(h.stats().disposed, 1);
      h.frame();
      assert.equal(h.labels.children.length, 1);
      h.webgl.events.get("webglcontextrestored")?.();
      assert.deepEqual(h.modes, ["webgl", "fallback", "webgl"]);
      assert.equal(h.stats().disposed, 2);
    } finally { h.restore(); }
  });
});

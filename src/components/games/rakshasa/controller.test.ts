import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import ts from "typescript";
import * as engine from "@/lib/games/rakshasa/engine";
import * as content from "@/lib/games/rakshasa/content";
import * as progress from "@/lib/games/rakshasa/progress";
import * as input from "@/lib/games/rakshasa/input";
import { GAME_DEFINITIONS, GAME_LIST } from "@/lib/games/game-types";
import type { WarState } from "@/lib/games/rakshasa/types";

// Actual production handlers/effects, backed by hooks/DOM/clock doubles. These
// tests do NOT claim real React mounting, browser rendering or device keyboard QA.
const require = createRequire(import.meta.url);
type Node = ReactElement<Record<string, unknown>>;
function find(node: ReactNode, type: unknown): Node {
  if (isValidElement<Record<string, unknown>>(node)) {
    if (node.type === type) return node;
    for (const child of ([] as ReactNode[]).concat(node.props.children as ReactNode[])) {
      try { return find(child, type); } catch { /* search sibling */ }
    }
  }
  throw new Error("Element missing");
}

function harness() {
  let cursor = 0, now = 1000, owner: string | null = null, generation = 0, nextTimer = 0, focusCount = 0;
  const slots: unknown[] = [], effects: (() => void)[] = [];
  const timers = new Map<number, () => void>();
  const listeners = new Map<string, Set<(event?: unknown) => void>>();
  const audio = { stops: 0, transitions: 0 };
  const starts: unknown[][] = [], results: unknown[][] = [], rewards: unknown[][] = [];
  const originals = { window: globalThis.window, document: globalThis.document, performance: globalThis.performance };
  const values = new Map<string, string>();
  const add = (type: string, fn: (event?: unknown) => void) => { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type)!.add(fn); };
  const remove = (type: string, fn: (event?: unknown) => void) => { listeners.get(type)?.delete(fn); };
  const doc = { hidden: false, addEventListener: add, removeEventListener: remove };
  globalThis.document = doc as unknown as Document;
  globalThis.window = { addEventListener: add, removeEventListener: remove,
    setInterval: (fn: () => void) => { const id = ++nextTimer; timers.set(id, fn); return id; }, clearInterval: (id: number) => timers.delete(id),
    localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } },
    matchMedia: () => ({ matches: false }),
  } as unknown as Window & typeof globalThis;
  globalThis.performance = { now: () => now } as Performance;
  const same = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useRef: (initial: unknown) => { const slot = cursor++; if (!(slot in slots)) slots[slot] = { current: initial }; return slots[slot]; },
    useState: (initial: unknown) => {
      const index = cursor++;
      if (!(index in slots)) {
        const state = { value: typeof initial === "function" ? initial() : initial, setter: (value: unknown) => { state.value = typeof value === "function" ? value(state.value) : value; } };
        slots[index] = state;
      }
      const state = slots[index] as { value: unknown; setter: unknown };
      return [state.value, state.setter];
    },
    useCallback: (fn: unknown, deps: unknown[]) => {
      const index = cursor++; const previous = slots[index] as { fn: unknown; deps: unknown[] } | undefined;
      if (!previous || !same(deps, previous.deps)) slots[index] = { fn, deps };
      return (slots[index] as { fn: unknown }).fn;
    },
    useSyncExternalStore: (_: unknown, get: () => unknown) => get(),
    useEffect: (fn: () => (() => void) | void, deps: unknown[]) => {
      const index = cursor++; const previous = slots[index] as { deps: unknown[]; cleanup?: () => void } | undefined;
      if (!previous || !same(deps, previous.deps)) effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: fn() }; });
    },
  };
  const Interface = () => null, Scene = () => null, Boundary = () => null;
  const settings = { soundEnabled: true, toggleSound: () => { settings.soundEnabled = !settings.soundEnabled; } };
  const modules: Record<string, unknown> = {
    react,
    "next/dynamic": { __esModule: true, default: () => Scene },
    "@/components/games/rakshasa/war-interface": { WarInterface: Interface },
    "@/components/games/rakshasa/scene-boundary": { WarSceneBoundary: Boundary },
    "@/components/games/ui/audio-settings": { AudioVolumeBridge: () => null },
    "@/components/games/rakshasa/war.module.css": { __esModule: true, default: {} },
    "@/lib/games/rakshasa/content": content, "@/lib/games/rakshasa/engine": engine,
    "@/lib/games/rakshasa/input": input, "@/lib/games/rakshasa/progress": progress,
    "@/lib/games/rakshasa/audio": { warAudioGesture() {}, warAudioStop: () => { audio.stops++; }, warAudioTrack() {}, warAudioTransition: () => { audio.transitions++; } },
    "@/lib/auth/current-user": { getAuthGeneration: () => generation, getCurrentUserId: () => owner, subscribeCurrentUser() {} },
    "@/lib/games/game-scores": { recordGameStart: (...args: unknown[]) => starts.push(args), recordGameResult: (...args: unknown[]) => { results.push(args); return { isNewBest: true }; } },
    "@/lib/profile/player-profile": { awardXp: (...args: unknown[]) => rewards.push(args), bumpStat: (...args: unknown[]) => rewards.push(args), checkSiteAchievements() {} },
    "@/lib/games/game-types": { GAME_LIST },
    "@/lib/persistence/settings-store": { useSettingsStore: (selector: (s: typeof settings) => unknown) => selector(settings) },
  };
  const exports: { default?: (props: unknown) => Node } = {};
  const compiled = ts.transpileModule(readFileSync(new URL("../rakshasa-war-game.tsx", import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }, fileName: "rakshasa-war-game.tsx",
  }).outputText;
  new Function("require", "exports", compiled)((id: string) => id in modules ? modules[id] : require(id), exports);
  const board = { focus: () => { focusCount++; }, scrollIntoView() {} };
  const overlay = { querySelector: () => ({ focus() {} }) };
  let current: Record<string, unknown>, mountedKey: string | null = null;
  const render = () => {
    cursor = 0;
    const root = exports.default!({ definition: GAME_DEFINITIONS["rakshasa-war"] });
    if (mountedKey !== null && mountedKey !== root.key) { cleanup(); slots.length = 0; effects.length = 0; cursor = 0; }
    mountedKey = root.key;
    const child = (root.type as (props: unknown) => ReactNode)(root.props);
    current = find(child, Interface).props;
    (current.boardRef as { current: unknown }).current = board;
    (current.overlayRef as { current: unknown }).current = overlay;
    while (effects.length) effects.shift()!();
    return current;
  };
  const call = (name: string, ...args: unknown[]) => { render(); (current[name] as (...args: unknown[]) => void)(...args); render(); };
  const tick = (ms: number) => { now += ms; for (const fn of [...timers.values()]) fn(); render(); };
  const key = (key: string, options: Record<string, unknown> = {}) => {
    call("onBoardKey", { target: board, currentTarget: board, preventDefault() {}, nativeEvent: { key, repeat: false, ctrlKey: false, altKey: false, metaKey: false, isComposing: false, ...options } });
  };
  render();
  (find(render().scene as ReactNode, Scene).props.onMode as (mode: string) => void)("webgl"); render();
  function cleanup() {
    for (const slot of slots) if (slot && typeof slot === "object" && "cleanup" in slot) (slot as { cleanup?: () => void }).cleanup?.();
  }
  return { call, key, tick, state: () => render().state as WarState, props: render, timers, listeners, starts, results, rewards, audio,
    focusCount: () => focusCount,
    fire: (type: string) => { for (const fn of [...(listeners.get(type) ?? [])]) fn(); render(); },
    hide: () => { doc.hidden = true; }, show: () => { doc.hidden = false; },
    changeOwner: (id: string) => { owner = id; generation++; },
    captureKey: () => {
      const handler = render().onBoardKey as (event: unknown) => void;
      return (key: string) => handler({ target: board, currentTarget: board, preventDefault() {}, nativeEvent: { key, repeat: false, ctrlKey: false, altKey: false, metaKey: false, isComposing: false } });
    },
    cleanup, restore: () => { cleanup(); globalThis.window = originals.window; globalThis.document = originals.document; globalThis.performance = originals.performance; } };
}

describe("Typebound: The Last Dawn production controller event integration", () => {
  it("starts with keyboard focus and timers, pauses/rebases active time, and releases effects on exit", () => {
    const h = harness();
    try {
      assert.equal(h.props().gameName, "TYPEBOUND: THE LAST DAWN");
      h.call("onBegin", false, 0);
      assert.equal(h.state().phase, "intro");
      assert.equal(h.starts.length, 1);
      assert.ok(h.focusCount() > 0);
      h.tick(2100);
      assert.equal(h.state().phase, "playing");
      assert.equal(h.state().elapsedMs, 500);
      const word = h.state().enemies[0].word;
      h.tick(120); h.key(word[0]);
      const activeElapsed = h.state().elapsedMs;
      h.call("onPause");
      assert.equal(h.state().phase, "paused");
      assert.equal(h.timers.size, 0);
      h.tick(100000); h.key(word[1]);
      assert.equal(h.state().outputChars, 1);
      h.call("onResume"); h.tick(200);
      assert.equal(h.state().elapsedMs, activeElapsed + 200);
      h.cleanup();
      assert.equal(h.timers.size, 0);
      assert.ok([...h.listeners.values()].every((set) => set.size === 0));
      assert.ok(h.audio.stops > 0);
    } finally { h.restore(); }
  });
  it("Tab/hidden-window pause leaves native focus navigation and blocks hidden resume", () => {
    const h = harness();
    try {
      h.call("onBegin"); h.tick(1700); h.key("Tab");
      assert.equal(h.state().phase, "paused");
      h.call("onResume"); h.hide(); h.fire("visibilitychange");
      assert.equal(h.state().phase, "paused");
      h.call("onResume");
      assert.equal(h.state().phase, "paused");
      h.show(); h.call("onResume");
      assert.equal(h.state().phase, "playing");
    } finally { h.restore(); }
  });
  it("ignores physical repeats/composition/native control bubbling and stale-owner events", () => {
    const h = harness();
    try {
      h.call("onBegin"); h.tick(1700);
      const first = h.state().enemies[0].word[0];
      h.key(first, { repeat: true }); h.key(first, { isComposing: true });
      assert.equal(h.state().outputChars, 0);
      h.call("onBoardKey", { target: {}, currentTarget: {}, nativeEvent: { key: first }, preventDefault() { throw new Error("native control stolen"); } });
      const staleKey = h.captureKey();
      h.changeOwner("account-b"); staleKey(first); h.tick(2000);
      assert.equal(h.state().outputChars, 0);
      assert.equal(h.state().phase, "menu", "account generation remounts the campaign");
      assert.equal(h.results.length, 0);
    } finally { h.restore(); }
  });
  it("finishes safe training without publishing any records or XP", () => {
    const h = harness();
    try {
      h.call("onBegin", true, 0);
      for (const letter of "guardshieldresolvehold the line and let courage lead.") { h.tick(120); h.key(letter); }
      assert.equal(h.state().phase, "finisher");
      h.tick(1400);
      assert.equal(h.state().phase, "victory");
      assert.equal(h.starts.length, 0);
      assert.equal(h.results.length, 0);
      assert.equal(h.rewards.length, 0);
      assert.equal((h.props().progress as progress.WarProgress).tutorialDone, true);
    } finally { h.restore(); }
  });
  it("settles one complete stage once, unlocks the next, then cleanly restarts/returns to the map", () => {
    const h = harness();
    try {
      h.call("onBegin");
      for (let step = 0; step < 10000 && !["victory", "defeat"].includes(h.state().phase); step++) {
        const s = h.state();
        const target = s.enemies.find((e) => e.id === s.targetId) ?? [...s.enemies].sort((a, b) => b.progress - a.progress)[0];
        const key = s.boss?.text[s.boss.typed] ?? target?.word[target.typed];
        h.tick(key ? 95 : 100);
        if (key) h.key(key);
      }
      assert.equal(h.state().phase, "victory");
      assert.equal(h.results.length, 1);
      assert.equal((h.props().progress as progress.WarProgress).completed[0], 0);
      assert.equal((h.props().progress as progress.WarProgress).defeated, 19);
      assert.ok(h.state().specialUnlocks.includes("shockwave"));
      h.tick(10000); h.key(" "); h.fire("blur");
      assert.equal(h.results.length, 1);
      h.call("onBegin", false, 1);
      assert.equal(h.state().stage, 1);
      assert.equal(h.state().score, 0);
      h.call("onMenu");
      assert.equal(h.state().phase, "menu");
      assert.equal(h.timers.size, 0);
      assert.equal(h.results.length, 1);
    } finally { h.restore(); }
  });
});

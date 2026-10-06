import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import ts from "typescript";
import * as engine from "@/lib/games/falling-words/engine";
import * as input from "@/lib/games/falling-words/input";
import * as progress from "@/lib/games/falling-words/progress";
import * as nativeInput from "@/components/games/falling-words/native-input";
import { GAME_DEFINITIONS, GAME_LIST } from "@/lib/games/game-types";
import type { SkyfallState } from "@/lib/games/falling-words/engine";

// Execute actual controller handlers/effects with explicit hooks/clock/DOM
// doubles. Not a mounted-browser, virtual-keyboard or GPU verification.
const require = createRequire(import.meta.url);
type Node = ReactElement<Record<string, unknown>>;
function find(node: ReactNode, type: unknown): Node {
  if (isValidElement<Record<string, unknown>>(node)) {
    if (node.type === type) return node;
    for (const child of ([] as ReactNode[]).concat(node.props.children as ReactNode[])) {
      try { return find(child, type); } catch { /* sibling */ }
    }
  }
  throw Error("Interface not found");
}
function harness(width = 1180, initialSound = true, targets: readonly string[] = []) {
  let cursor = 0, now = 1000, generation = 0, owner: string | null = null, timerId = 0, focused = 0, soundEnabled = initialSound;
  const slots: unknown[] = [], effects: (() => void)[] = [], layouts: (() => void)[] = [];
  const timers = new Map<number, () => void>(), listeners = new Map<string, Set<() => void>>(), values = new Map<string, string>();
  const starts: unknown[][] = [], results: unknown[][] = [], rewards: unknown[][] = [];
  const audio = { stops: 0, transitions: 0, music: 0, warm: 0, enabled: [] as boolean[] };
  const original = { window: globalThis.window, document: globalThis.document, performance: globalThis.performance };
  const add = (name: string, fn: () => void) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(fn); };
  const remove = (name: string, fn: () => void) => listeners.get(name)?.delete(fn);
  const document = { hidden: false, activeElement: null as unknown, addEventListener: add, removeEventListener: remove };
  globalThis.document = document as unknown as Document;
  globalThis.window = { innerWidth: width, addEventListener: add, removeEventListener: remove, matchMedia: () => ({ matches: false }),
    setInterval: (fn: () => void) => { timers.set(++timerId, fn); return timerId; }, clearInterval: (id: number) => timers.delete(id),
    localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } },
  } as unknown as Window & typeof globalThis;
  globalThis.performance = { now: () => now } as Performance;
  const equal = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const scheduleEffect = (queue: (() => void)[], fn: () => void | (() => void), deps: unknown[]) => {
    const index = cursor++, old = slots[index] as { deps: unknown[]; cleanup?: () => void } | undefined;
    if (!old || !equal(old.deps, deps)) queue.push(() => { old?.cleanup?.(); slots[index] = { deps, cleanup: fn() }; });
  };
  const react = {
    useState: (initial: unknown) => {
      const index = cursor++;
      if (!(index in slots)) { const slot = { value: typeof initial === "function" ? initial() : initial, setter: (value: unknown) => { slot.value = typeof value === "function" ? value(slot.value) : value; } }; slots[index] = slot; }
      const slot = slots[index] as { value: unknown; setter: unknown }; return [slot.value, slot.setter];
    },
    useRef: (value: unknown) => { const index = cursor++; if (!(index in slots)) slots[index] = { current: value }; return slots[index]; },
    useSyncExternalStore: (_: unknown, get: () => unknown) => get(),
    useCallback: (fn: unknown, deps: unknown[]) => {
      const index = cursor++, old = slots[index] as { fn: unknown; deps: unknown[] } | undefined;
      if (!old || !equal(old.deps, deps)) slots[index] = { fn, deps };
      return (slots[index] as { fn: unknown }).fn;
    },
    useEffect: (fn: () => void | (() => void), deps: unknown[]) => scheduleEffect(effects, fn, deps),
    useLayoutEffect: (fn: () => void | (() => void), deps: unknown[]) => scheduleEffect(layouts, fn, deps),
  };
  const Interface = () => null, Boundary = () => null, Scene = () => null;
  const modules: Record<string, unknown> = {
    react, "react-dom": { flushSync: (fn: () => void) => fn() }, "next/dynamic": { __esModule: true, default: () => Scene },
    "@/components/games/falling-words/skyfall-interface": { SkyfallInterface: Interface }, "@/components/games/falling-words/scene-boundary": { SkyfallSceneBoundary: Boundary },
    "@/components/games/falling-words/native-input": nativeInput,
    "@/lib/games/falling-words/engine": { ...engine, startSkyfall: (...args: Parameters<typeof engine.startSkyfall>) => {
      const state = engine.startSkyfall(...args);
      // Explicit targets isolate repeated-word input sequences; scoring and
      // clock integration always use the actual production engine.
      return targets.length ? { ...state, nextId: targets.length + 1, words: targets.map((text, i) => ({ id: i + 1, text, lane: i, kind: "normal", progress: 0, fallMs: 9000, highWater: 0 })) } : state;
    } }, "@/lib/games/falling-words/input": input, "@/lib/games/falling-words/progress": progress,
    "@/lib/games/falling-words/audio": { createFallingWordsAudio: () => ({ stop() { audio.stops++; }, transition(_before: unknown, _after: unknown, enabled: boolean) { audio.transitions++; audio.enabled.push(enabled); }, reconcileMusic() { audio.music++; }, warm() { audio.warm++; }, startMusic() {} }) },
    "@/lib/games/use-game-viewport": { useGameViewport: () => ({ containerRef: react.useRef(null), metrics: { isKeyboardOpen: false } }) },
    "@/lib/games/use-game-best": { useGameBest: () => null },
    "@/lib/auth/current-user": { getAuthGeneration: () => generation, getCurrentUserId: () => owner, subscribeCurrentUser() {} },
    "@/lib/games/game-types": { GAME_LIST },
    "@/lib/games/game-scores": { recordGameStart: (...args: unknown[]) => starts.push(args), recordGameResult: (...args: unknown[]) => { results.push(args); return { isNewBest: true }; } },
    "@/lib/profile/player-profile": { bumpStat: (...args: unknown[]) => rewards.push(args), awardXp: (...args: unknown[]) => rewards.push(args), checkSiteAchievements() {} },
    "@/lib/persistence/settings-store": { useSettingsStore: (fn: (s: unknown) => unknown) => fn({ soundEnabled, toggleSound() { soundEnabled = !soundEnabled; } }) },
  };
  const exports: { FallingWordsGame?: (props: unknown) => Node } = {};
  const compiled = ts.transpileModule(readFileSync(new URL("../falling-words-game.tsx", import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function("require", "exports", compiled)((id: string) => id in modules ? modules[id] : require(id), exports);
  let domValue = "", valueWrites = 0;
  const inputListeners = new Map<string, Set<(event: unknown) => void>>();
  const root = { getBoundingClientRect: () => ({ width }), scrollIntoView() {} }, inputNode = {
    disabled: false, get value() { return domValue; }, set value(value: string) { valueWrites++; domValue = value; },
    focus() { if (!this.disabled) { focused++; document.activeElement = inputNode; } }, blur() { document.activeElement = null; },
    addEventListener(name: string, fn: (event: unknown) => void) { if (!inputListeners.has(name)) inputListeners.set(name, new Set()); inputListeners.get(name)!.add(fn); },
    removeEventListener(name: string, fn: (event: unknown) => void) { inputListeners.get(name)?.delete(fn); },
  }, overlay = { querySelector: () => ({ focus() { document.activeElement = overlay; } }) };
  let key: string | null = null;
  const cleanup = () => { for (const slot of slots) if (slot && typeof slot === "object" && "cleanup" in slot) (slot as { cleanup?: () => void }).cleanup?.(); };
  const render = () => {
    cursor = 0;
    const parent = exports.FallingWordsGame!({ definition: GAME_DEFINITIONS["falling-words"] });
    if (key !== null && key !== parent.key) { cleanup(); slots.length = 0; effects.length = 0; layouts.length = 0; cursor = 0; domValue = ""; }
    key = parent.key;
    const child = (parent.type as (p: unknown) => ReactNode)(parent.props);
    const p = find(child, Interface).props;
    (p.rootRef as { current: unknown }).current = root;
    (p.inputRef as { current: unknown }).current = inputNode;
    (p.overlayRef as { current: unknown }).current = overlay;
    inputNode.disabled = (p.state as SkyfallState).status !== "running";
    while (layouts.length) layouts.shift()!();
    while (effects.length) effects.shift()!();
    return p;
  };
  const call = (name: string, ...args: unknown[]) => { const p = render(); (p[name] as (...args: unknown[]) => void)(...args); return render(); };
  const fireInput = (name: string, value = domValue, nativeEvent: Record<string, unknown> = {}) => {
    const p = render(); domValue = value;
    let prevented = false;
    (p[name] as ((event: unknown) => void) | undefined)?.({ currentTarget: inputNode, target: inputNode, nativeEvent, preventDefault() { prevented = true; } });
    render(); return prevented;
  };
  const beforeInput = (inputType = "insertText", data: string | null = null, isComposing = false) => {
    render(); let prevented = false;
    for (const fn of inputListeners.get("beforeinput") ?? []) fn({ type: "beforeinput", inputType, data, isComposing, preventDefault() { prevented = true; } });
    return prevented;
  };
  const tick = (ms: number) => { now += ms; for (const fn of [...timers.values()]) fn(); return render(); };
  render();
  return { call, tick, props: render, state: () => render().state as SkyfallState, starts, results, rewards, timers, listeners, audio, values, inputListeners,
    focusCount: () => focused, domValue: () => domValue, valueWrites: () => valueWrites, fireInput, beforeInput,
    invoke: (name: string, ...args: unknown[]) => { const p = render(); (p[name] as (...args: unknown[]) => void)(...args); },
    elapse: (ms: number) => { now += ms; },
    key: (letter: string, options = {}) => { let prevented = false; call("onInputKey", { key: letter, currentTarget: inputNode, preventDefault() { prevented = true; }, nativeEvent: { key: letter, repeat: false, ctrlKey: false, altKey: false, metaKey: false, isComposing: false, ...options } }); return prevented; },
    hide: () => { document.hidden = true; for (const fn of listeners.get("visibilitychange") ?? []) fn(); render(); }, show: () => { document.hidden = false; },
    changeOwner: () => { owner = "new-owner"; generation++; },
    restore: () => { cleanup(); globalThis.window = original.window; globalThis.document = original.document; globalThis.performance = original.performance; },
  };
}

describe("Skyfall production controller integration", () => {
  it("uses active wall time, pauses without time credit, and releases timers/audio/listeners", () => {
    const h = harness();
    try {
      h.call("onStart", "standard");
      assert.equal(h.starts.length, 1); assert.ok(h.focusCount() > 0);
      h.tick(1800); assert.equal(h.state().elapsedMs, 1800);
      h.call("onPause"); const frozen = h.state();
      assert.equal(frozen.status, "paused"); assert.equal(h.timers.size, 0);
      h.tick(10000); assert.deepEqual(h.state(), frozen);
      h.call("onResume"); h.tick(150);
      assert.equal(h.state().elapsedMs, 1950);
      h.call("onMenu"); assert.equal(h.state().status, "idle");
      assert.equal(h.results.length, 0); assert.equal(h.rewards.length, 0);
    } finally { h.restore(); }
    assert.equal(h.timers.size, 0);
    assert.ok([...h.listeners.values()].every(set => set.size === 0));
    assert.ok([...h.inputListeners.values()].every(set => set.size === 0));
    assert.ok(h.audio.stops > 0);
  });
  it("supports mobile letters/touch input without accepting paste, repeats or multiple-character edits", () => {
    const h = harness(320);
    try {
      h.call("onStart", "standard"); assert.equal(h.state().laneCount, 2);
      h.tick(1800); const word = h.state().words[0].text;
      h.key(word[0], { repeat: true }); assert.equal(h.state().outputChars, 0);
      h.fireInput("onInputChange", word, { inputType: "insertFromPaste" });
      assert.equal(h.state().outputChars, 0);
      h.fireInput("onInputChange", word[0], { inputType: "insertText" });
      assert.equal(h.state().outputChars, 1);
      h.key("Backspace"); h.key(word[0]); assert.equal(h.state().outputChars, 1);
      for (const key of word.slice(1)) h.call("onTouchKey", key);
      assert.equal(h.state().cleared, 1); assert.equal(h.state().outputChars, word.length);
      h.key("Tab"); assert.equal(h.state().status, "paused");
    } finally { h.restore(); }
  });
  it("scores Android composing ASCII appends once and leaves the browser draft intact on ticks", () => {
    const h = harness(390);
    try {
      h.call("onStart", "standard"); h.tick(1800); const word = h.state().words[0].text;
      h.fireInput("onCompositionStart");
      assert.equal(h.state().status, "running");
      let raw = "";
      for (const letter of word) {
        raw += letter;
        h.beforeInput("insertCompositionText", raw, true);
        h.key("Process", { keyCode: 229, isComposing: true });
        h.fireInput("onInputChange", raw, { type: "input", inputType: "insertCompositionText", isComposing: true, data: raw });
        assert.equal(h.domValue(), raw);
        const writes = h.valueWrites(); h.tick(50);
        assert.equal(h.domValue(), raw); assert.equal(h.valueWrites(), writes);
      }
      assert.equal(h.state().cleared, 1); assert.equal(h.state().correctKeystrokes, word.length); assert.equal(h.state().incorrectKeystrokes, 0);
      h.fireInput("onCompositionEnd", word, { type: "compositionend", data: word });
      assert.equal(h.domValue(), "");
      h.fireInput("onBeforeInput", "", { type: "textInput", data: word });
      h.fireInput("onInputChange", word, { type: "input", inputType: "insertCompositionText", isComposing: false });
      h.fireInput("onInputChange", word, { type: "input", inputType: "insertText", isComposing: false });
      assert.equal(h.domValue(), ""); assert.equal(h.state().correctKeystrokes, word.length); assert.equal(h.state().incorrectKeystrokes, 0);
      // A genuine new edit of the same letters must not remain echo-suppressed.
      const errors = h.state().incorrectKeystrokes;
      h.beforeInput("insertText", word[0]);
      h.fireInput("onInputChange", word[0], { type: "input", inputType: "insertText", data: word[0] });
      assert.equal(h.state().incorrectKeystrokes, errors + 1);
    } finally { h.restore(); }
  });
  it("supports composing changes without compositionstart and deduplicates fallback completion", () => {
    const h = harness();
    try {
      h.call("onStart", "standard"); h.tick(1800); const letter = h.state().words[0].text[0];
      h.fireInput("onInputChange", letter, { type: "input", inputType: "insertText", isComposing: true, data: letter });
      assert.equal(h.state().typed, letter); assert.equal(h.state().correctKeystrokes, 1);
      h.fireInput("onInputChange", letter, { type: "input", inputType: "insertText", isComposing: false, data: letter });
      h.fireInput("onCompositionEnd", letter, { type: "compositionend", data: letter });
      h.fireInput("onInputChange", letter, { type: "input", inputType: "insertCompositionText", isComposing: false });
      assert.equal(h.state().correctKeystrokes, 1); assert.equal(h.state().incorrectKeystrokes, 0);
    } finally { h.restore(); }
  });
  it("never replays an auto-cleared raw word and permits identical words after fresh edit signals", () => {
    const h = harness(390, true, ["arch", "arch"]);
    try {
      h.call("onStart", "standard"); h.fireInput("onCompositionStart");
      for (let i = 1; i <= 4; i++) h.fireInput("onInputChange", "arch".slice(0, i), { inputType: "insertCompositionText", isComposing: true });
      assert.equal(h.state().cleared, 1); assert.equal(h.state().typed, ""); assert.equal(h.domValue(), "arch");
      h.fireInput("onCompositionEnd", "arch ", { type: "compositionend" });
      h.fireInput("onInputChange", "arch", { inputType: "insertCompositionText", isComposing: false });
      assert.equal(h.state().cleared, 1); assert.equal(h.state().correctKeystrokes, 4); assert.equal(h.state().incorrectKeystrokes, 0);
      let raw = "";
      for (const letter of "arch") {
        raw += letter; h.beforeInput("insertText", letter);
        h.fireInput("onInputChange", raw, { inputType: "insertText", data: letter });
      }
      assert.equal(h.state().cleared, 2); assert.equal(h.state().correctKeystrokes, 8); assert.equal(h.state().outputChars, 8); assert.equal(h.domValue(), "");
    } finally { h.restore(); }
  });
  it("continues the same composing draft across clears without crediting deletions from the old target", () => {
    const h = harness(390, true, ["arch", "arch"]);
    try {
      h.call("onStart", "standard"); h.fireInput("onCompositionStart");
      for (let i = 1; i <= 4; i++) h.fireInput("onInputChange", "arch".slice(0, i), { inputType: "insertCompositionText", isComposing: true });
      h.fireInput("onInputChange", "arc", { inputType: "deleteCompositionText", isComposing: true });
      assert.equal(h.state().typed, ""); assert.equal(h.state().correctKeystrokes, 4);
      h.fireInput("onInputChange", "arca", { inputType: "insertCompositionText", isComposing: true });
      assert.equal(h.state().typed, "a"); assert.equal(h.state().lockedId, 2);
      h.fireInput("onInputChange", "arcar", { inputType: "insertCompositionText", isComposing: true });
      assert.equal(h.state().typed, "ar"); assert.equal(h.state().correctKeystrokes, 6); assert.equal(h.state().incorrectKeystrokes, 0);
      h.fireInput("onCompositionEnd", "arcar", { type: "compositionend" });
      h.fireInput("onInputChange", "arcar", { inputType: "insertCompositionText", isComposing: false });
      assert.equal(h.state().typed, "ar"); assert.equal(h.domValue(), "ar"); assert.equal(h.state().correctKeystrokes, 6);
    } finally { h.restore(); }
  });
  it("flushes elapsed wall time before scoring a native append at a target's expiry", () => {
    const h = harness(390, true, ["arch", "rain"]);
    try {
      h.call("onStart", "standard"); h.fireInput("onCompositionStart");
      h.fireInput("onInputChange", "a", { inputType: "insertCompositionText", isComposing: true });
      h.fireInput("onInputChange", "ar", { inputType: "insertCompositionText", isComposing: true });
      const expected = engine.typeSkyfallKey(engine.tickSkyfall(h.state(), 9001), "c");
      h.elapse(9001);
      h.fireInput("onInputChange", "arc", { inputType: "insertCompositionText", isComposing: true });
      assert.deepEqual(h.state(), expected); assert.equal(h.state().outputChars, 2);
    } finally { h.restore(); }
  });
  it("deletes a rejected native letter without deleting an earlier correct engine letter", () => {
    for (const composing of [true, false]) {
      const h = harness();
      try {
        h.call("onStart", "standard"); h.tick(1800); const word = h.state().words[0].text;
        const wrong = word[1] === "x" ? "z" : "x";
        if (composing) h.fireInput("onCompositionStart");
        const insertion = { type: "input", inputType: composing ? "insertCompositionText" : "insertText", isComposing: composing };
        h.fireInput("onInputChange", word[0], insertion);
        h.fireInput("onInputChange", word[0] + wrong, insertion);
        assert.equal(h.state().typed, word[0]); assert.equal(h.state().incorrectKeystrokes, 1);
        h.fireInput("onInputChange", word[0], { type: "input", inputType: "deleteContentBackward", isComposing: composing });
        assert.equal(h.state().typed, word[0]); assert.equal(h.state().correctKeystrokes, 1);
        h.fireInput("onInputChange", word.slice(0, 2), insertion);
        assert.equal(h.state().typed, word.slice(0, 2));
        h.fireInput("onInputChange", word[0], { type: "input", inputType: composing ? "insertCompositionText" : "deleteContentBackward", isComposing: composing });
        assert.equal(h.state().typed, word[0]); assert.equal(h.state().outputChars, 2);
      } finally { h.restore(); }
    }
  });
  it("bounds browser-owned composition drafts and restores strict progress after oversized input", () => {
    const h = harness(390, true, ["arch"]);
    try {
      h.call("onStart", "standard"); h.fireInput("onCompositionStart");
      h.fireInput("onInputChange", "a", { inputType: "insertCompositionText", isComposing: true });
      h.fireInput("onInputChange", "a".repeat(10_000), { inputType: "insertCompositionText", isComposing: true });
      assert.equal(h.state().outputChars, 1); assert.equal(h.state().typed, "a"); assert.equal(h.domValue(), "a");
      h.fireInput("onCompositionStart");
      h.fireInput("onInputChange", "ar", { inputType: "insertCompositionText", isComposing: true });
      assert.equal(h.state().typed, "ar"); assert.equal(h.state().outputChars, 2);
    } finally { h.restore(); }
  });
  it("cancels old composing drafts on pause/restart and accepts fresh edits after the boundary", () => {
    const h = harness();
    try {
      h.call("onStart", "standard"); h.tick(1800); const letter = h.state().words[0].text[0];
      h.fireInput("onCompositionStart");
      h.fireInput("onInputChange", letter, { inputType: "insertCompositionText", isComposing: true });
      h.call("onPause"); const frozen = h.state();
      h.fireInput("onCompositionEnd", letter + "x", { type: "compositionend" });
      h.call("onResume");
      h.fireInput("onInputChange", letter + "x", { inputType: "insertCompositionText", isComposing: true });
      assert.equal(h.state().typed, frozen.typed); assert.equal(h.state().incorrectKeystrokes, 0);
      h.call("onStart", "standard");
      h.fireInput("onCompositionEnd", letter, { type: "compositionend" });
      h.fireInput("onInputChange", letter, { inputType: "insertCompositionText", isComposing: true });
      assert.equal(h.state().typed, ""); assert.equal(h.state().correctKeystrokes, 0); assert.equal(h.state().incorrectKeystrokes, 0);
      h.tick(1800); const fresh = h.state().words[0].text[0];
      h.fireInput("onCompositionStart");
      h.fireInput("onInputChange", fresh, { inputType: "insertCompositionText", isComposing: true });
      assert.equal(h.state().typed, fresh); assert.equal(h.state().correctKeystrokes, 1);
    } finally { h.restore(); }
  });
  it("rejects owner-stale composition handlers before remount and frees the new owner's input", () => {
    const h = harness(390, true, ["arch"]);
    try {
      h.call("onStart", "standard"); h.fireInput("onCompositionStart");
      h.fireInput("onInputChange", "a", { inputType: "insertCompositionText", isComposing: true });
      const old = h.props(), oldInput = (old.inputRef as { current: unknown }).current;
      h.changeOwner();
      (old.onInputChange as (event: unknown) => void)({ currentTarget: oldInput, nativeEvent: { inputType: "insertCompositionText", isComposing: true } });
      (old.onCompositionEnd as (event: unknown) => void)({ currentTarget: oldInput, nativeEvent: { type: "compositionend" } });
      assert.equal(h.state().status, "idle"); assert.equal(h.state().correctKeystrokes, 0); assert.equal(h.domValue(), "");
      h.call("onStart", "standard"); h.fireInput("onCompositionStart");
      h.fireInput("onInputChange", "a", { inputType: "insertCompositionText", isComposing: true });
      assert.equal(h.state().correctKeystrokes, 1); assert.equal(h.state().typed, "a"); assert.equal(h.results.length, 0);
    } finally { h.restore(); }
  });
  it("focuses a re-enabled input inside the resume gesture before passive effects", () => {
    const h = harness();
    try {
      h.call("onStart", "standard"); h.call("onPause");
      const focused = h.focusCount(); h.invoke("onResume");
      assert.equal(h.focusCount(), focused + 1);
      h.props(); assert.equal(h.focusCount(), focused + 1);
    } finally { h.restore(); }
  });
  it("preserves physical shortcut/repeat rules and lets IME Enter/Space select candidates", () => {
    const h = harness(390, true, ["arch"]);
    try {
      h.call("onStart", "standard");
      assert.equal(h.key("a", { ctrlKey: true }), false);
      assert.equal(h.key("a", { metaKey: true }), false);
      assert.equal(h.key("a", { altKey: true }), false);
      assert.equal(h.key("a", { repeat: true }), true);
      assert.equal(h.state().correctKeystrokes, 0);
      assert.equal(h.key("a"), true); assert.equal(h.state().correctKeystrokes, 1);
      h.fireInput("onCompositionStart");
      assert.equal(h.key(" ", { isComposing: true, keyCode: 229 }), false);
      assert.equal(h.key("Enter", { isComposing: true, keyCode: 229 }), false);
      assert.equal(h.state().status, "running"); assert.equal(h.state().correctKeystrokes, 1);
      h.key("Tab"); assert.equal(h.state().status, "paused");
    } finally { h.restore(); }
  });
  it("does not score multi-letter paste, autocorrect, candidate replacements or compositionend drafts", () => {
    const h = harness();
    try {
      h.call("onStart", "standard"); h.tick(1800); const word = h.state().words[0].text;
      assert.equal(h.beforeInput("insertFromPaste", word[0]), true);
      h.fireInput("onInputChange", word[0], { inputType: "insertFromPaste" });
      h.fireInput("onInputChange", word, { inputType: "insertText", data: word });
      assert.equal(h.state().correctKeystrokes, 0); assert.equal(h.state().incorrectKeystrokes, 0);
      h.fireInput("onCompositionStart");
      h.fireInput("onInputChange", word[0], { inputType: "insertCompositionText", isComposing: true });
      h.fireInput("onInputChange", word, { inputType: "insertCompositionText", isComposing: true, data: word });
      h.fireInput("onInputChange", word + "a", { inputType: "insertReplacementText", isComposing: true });
      h.fireInput("onInputChange", word + "ab", { inputType: "insertFromComposition", isComposing: false });
      h.fireInput("onCompositionEnd", word, { type: "compositionend" });
      h.fireInput("onInputChange", word, { inputType: "insertCompositionText", isComposing: false });
      assert.equal(h.state().typed, word[0]); assert.equal(h.state().correctKeystrokes, 1); assert.equal(h.state().incorrectKeystrokes, 0);
    } finally { h.restore(); }
  });
  it("does not turn deletion of an unscored replacement into deletion of engine progress", () => {
    const h = harness(390, true, ["arch"]);
    try {
      h.call("onStart", "standard"); h.fireInput("onCompositionStart");
      h.fireInput("onInputChange", "a", { inputType: "insertCompositionText", isComposing: true });
      h.fireInput("onInputChange", "x", { inputType: "insertReplacementText", isComposing: true });
      h.fireInput("onInputChange", "", { inputType: "deleteContentBackward", isComposing: true });
      assert.equal(h.state().typed, "a"); assert.equal(h.state().correctKeystrokes, 1); assert.equal(h.state().incorrectKeystrokes, 0);
      h.fireInput("onCompositionEnd", "", { type: "compositionend" });
      assert.equal(h.domValue(), "a");
      h.beforeInput("deleteContentBackward");
      h.fireInput("onInputChange", "", { inputType: "deleteContentBackward" });
      assert.equal(h.state().typed, ""); assert.equal(h.state().outputChars, 1);
    } finally { h.restore(); }
  });
  it("warms audio synchronously when enabled and stops/mutes transition cues before another render", () => {
    const h = harness(390, false);
    try {
      h.call("onStart", "standard"); h.tick(1800); assert.equal(h.audio.warm, 0);
      const p = h.props(), letter = h.state().words[0].text[0];
      (p.onSound as () => void)();
      assert.equal(h.audio.warm, 1);
      (p.onTouchKey as (key: string) => void)(letter);
      assert.equal(h.audio.enabled.at(-1), true);
      const stops = h.audio.stops;
      (p.onSound as () => void)();
      assert.ok(h.audio.stops > stops);
      (p.onTouchKey as (key: string) => void)("Backspace");
      assert.equal(h.audio.enabled.at(-1), false);
    } finally { h.restore(); }
  });
  it("settles a standard result exactly once with WPM/accuracy and device signals", () => {
    const h = harness();
    try {
      h.call("onStart", "standard"); h.tick(1800);
      for (const key of h.state().words[0].text) h.key(key);
      h.tick(30000);
      assert.equal(h.state().status, "over"); assert.equal(h.results.length, 1);
      h.tick(30000); h.props(); assert.equal(h.results.length, 1);
      const run = h.results[0][1] as Record<string, number>;
      assert.equal(run.cleared, 1); assert.ok(Number.isFinite(run.wpm)); assert.ok(run.wpm > 0);
      assert.equal(run.accuracy, 100); assert.equal(h.rewards.length, 2);
      assert.equal((h.props().progress as progress.SkyfallProgress).runs, 1);
      assert.equal((h.props().progress as progress.SkyfallProgress).totalCleared, 1);
    } finally { h.restore(); }
  });
  it("keeps Zen nonfatal and never records standard scores or rewards", () => {
    const h = harness();
    try {
      h.call("onStart", "zen"); h.tick(100000);
      assert.equal(h.state().status, "running"); assert.equal(h.state().lives, 3);
      h.call("onFinishPractice"); assert.equal(h.state().status, "over");
      assert.equal(h.starts.length, 0); assert.equal(h.results.length, 0); assert.equal(h.rewards.length, 0);
      assert.equal((h.props().progress as progress.SkyfallProgress).runs, 0);
    } finally { h.restore(); }
  });
  it("pauses hidden tabs and rejects stale owner handlers before remount", () => {
    const h = harness();
    try {
      h.call("onStart", "standard"); h.tick(1800); h.hide();
      assert.equal(h.state().status, "paused"); h.call("onResume"); assert.equal(h.state().status, "paused");
      h.show(); h.call("onResume");
      const stale = h.props().onTouchKey as (key: string) => void;
      h.changeOwner(); stale("a");
      assert.equal(h.state().status, "idle"); assert.equal(h.results.length, 0);
    } finally { h.restore(); }
  });
});

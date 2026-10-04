import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import ts from "typescript";
import * as commit from "@/lib/typing-engine/input-commit";
import * as focus from "@/lib/typing-engine/input-focus";
import { createInitialState, reducer, selectDisplayWordStates } from "@/lib/typing-engine/use-typing-engine";

// Actual component event handlers, with hooks and native input represented by
// small doubles. This reproduces the lost draft, not a real phone's keyboard.
const require = createRequire(import.meta.url);
type Element = ReactElement<Record<string, unknown>>;
function inputNode(node: ReactNode): Element {
  if (isValidElement<Record<string, unknown>>(node)) {
    if (node.type === "input") return node;
    const children = node.props.children as ReactNode[];
    for (const child of children ?? []) {
      if (isValidElement<Record<string, unknown>>(child) && child.type === "input") return child;
    }
  }
  throw new Error("Missing input");
}

function harness(connectEngine = false) {
  const slots: unknown[] = [];
  let index = 0;
  const effects: (() => void)[] = [];
  const scheduleEffect = (effect: () => (() => void) | void, deps: unknown[]) => {
    const slot = index++;
    const previous = slots[slot] as { deps: unknown[]; cleanup?: (() => void) | void } | undefined;
    if (previous && deps.every((dep, i) => Object.is(dep, previous.deps[i]))) return;
    effects.push(() => {
      previous?.cleanup?.();
      slots[slot] = { deps, cleanup: effect() };
    });
  };
  const react = {
    useEffect: scheduleEffect,
    useLayoutEffect: scheduleEffect,
    useId: () => "input-test",
    useRef: (initial: unknown) => {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = { current: initial };
      return slots[slot];
    },
    useState: (initial: unknown) => {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = initial;
      return [slots[slot], (next: unknown) => { slots[slot] = typeof next === "function" ? next(slots[slot]) : next; }];
    },
  };
  const exports: { HiddenInput?: (props: Record<string, unknown>) => ReactNode } = {};
  const source = readFileSync(new URL("./hidden-input.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }, fileName: "hidden-input.tsx",
  }).outputText;
  const modules: Record<string, unknown> = { react, "@/lib/typing-engine/input-commit": commit, "@/lib/typing-engine/input-focus": focus };
  new Function("require", "exports", compiled)((id: string) => id in modules ? modules[id] : require(id), exports);
  const scored: string[] = [];
  const previews: (string | null)[] = [];
  let commits = 0;
  let selections = 0;
  let now = 1000;
  let engineState = createInitialState({ mode: "custom", timeDuration: 60, wordCount: 10, quoteLength: "short",
    vocabDifficulty: "easy", wordDifficulty: "all", punctuation: false, numbers: false, customText: "hello world" });
  const syncEngine = () => {
    if (!connectEngine) return;
    props.value = engineState.wordStates[engineState.activeWordIndex]?.typed ?? "";
    props.status = engineState.status;
    props.resetKey = engineState.inputRevision;
  };
  const props: Record<string, unknown> = {
    value: "", status: "idle", focusToken: 0,
    onChange: (value: string) => {
      scored.push(value); props.value = value;
      if (connectEngine) engineState = reducer(engineState, { type: "SET_TYPED", value, now });
      syncEngine();
    },
    onCommitWord: () => {
      commits++; props.value = "";
      if (connectEngine) engineState = reducer(engineState, { type: "COMMIT_WORD", now });
      syncEngine();
    },
    onCompositionPreview: (value: string | null) => {
      previews.push(value);
      if (connectEngine) engineState = reducer(engineState, { type: "COMPOSITION_PREVIEW", value, now });
      syncEngine();
    },
    onRestart() {}, onEscape() {}, onFocusChange() {},
  };
  syncEngine();
  const listeners = new Map<string, (event: unknown) => void>();
  const dom = { value: "", selectionStart: 0, selectionEnd: 0,
    setSelectionRange() { selections++; }, focus() {}, blur() {},
    addEventListener(type: string, listener: (event: unknown) => void) { listeners.set(type, listener); },
    removeEventListener(type: string) { listeners.delete(type); } };
  window.matchMedia = () => ({ matches: true }) as MediaQueryList;
  (globalThis as unknown as { document: unknown }).document = { activeElement: dom };
  const render = () => {
    index = 0;
    const input = inputNode(exports.HiddenInput!(props));
    (input.props.ref as { current: unknown }).current = dom;
    while (effects.length) effects.shift()!();
    return input;
  };
  const fire = (name: string, value = dom.value, nativeEvent: Record<string, unknown> = {}, event: Record<string, unknown> = {}) => {
    dom.value = value;
    const input = render();
    const handler = input.props[name] as ((event: unknown) => void) | undefined;
    handler?.({ target: dom, currentTarget: dom, nativeEvent, preventDefault() {}, stopPropagation() {}, ...event });
  };
  return { render, fire, props, scored, previews, commitCount: () => commits, selectionCount: () => selections,
    beforeInput: (inputType: string, data: string | null = null) => {
      render(); listeners.get("beforeinput")?.({ type: "beforeinput", inputType, data, isComposing: false });
    },
    state: () => engineState, time: (value: number) => { now = value; } };
}

describe("mobile composition input", () => {
  it("retains and previews a composing letter instead of restoring an empty controlled value", () => {
    const h = harness();
    h.fire("onCompositionStart");
    h.fire("onChange", "h", { isComposing: true, inputType: "insertCompositionText" });
    assert.equal(h.render().props.value, "h");
    assert.equal(h.previews.at(-1), "h");
    assert.deepEqual(h.scored, []);
  });

  it("does not pin selection while the mobile keyboard owns a composition range", () => {
    const h = harness();
    h.fire("onCompositionStart");
    h.fire("onChange", "hello", { isComposing: true });
    h.fire("onSelect", "hello");
    assert.equal(h.selectionCount(), 0);
  });

  it("previews a phone word immediately, scores its finalized text once and advances on Space", () => {
    const h = harness(true);
    h.fire("onCompositionStart");
    h.fire("onChange", "h", { isComposing: true });
    assert.equal(h.state().status, "running");
    assert.equal(h.state().startedAt, 1000);
    assert.equal(selectDisplayWordStates(h.state())[0].typed, "h");
    assert.equal(h.state().totalTyped, 0);
    h.time(2400);
    h.fire("onChange", "hello", { isComposing: true });
    h.fire("onCompositionEnd", "hello ", { type: "compositionend" });
    assert.equal(h.state().activeWordIndex, 1);
    assert.equal(h.state().wordStates[0].typed, "hello");
    assert.equal(h.state().correctKeystrokes, 6);
    assert.equal(h.render().props.value, "");
    h.fire("onChange", "hello ", { inputType: "insertCompositionText" });
    assert.equal(h.commitCount(), 1);
    assert.equal(h.state().wordStates[1].typed, "");
    h.beforeInput("insertText", "w");
    h.fire("onChange", "w", { inputType: "insertText" });
    assert.equal(h.state().wordStates[1].typed, "w");
  });

  it("allows a new identical word after suppressing a trimmed composition echo", () => {
    const h = harness();
    h.fire("onCompositionStart");
    h.fire("onChange", "hello", { isComposing: true });
    h.fire("onCompositionEnd", "hello ");
    h.fire("onChange", "hello", { inputType: "insertCompositionText" });
    assert.deepEqual(h.scored, ["hello"]);
    h.beforeInput("insertText", "hello");
    h.fire("onChange", "hello ", { inputType: "insertText" });
    assert.deepEqual(h.scored, ["hello", "hello"]);
    assert.equal(h.commitCount(), 2);
  });

  it("retains native composing input even if compositionstart is missing", () => {
    const h = harness();
    h.fire("onChange", "h", { isComposing: true });
    assert.equal(h.render().props.value, "h");
    h.fire("onChange", "hello ", { isComposing: false });
    assert.deepEqual(h.scored, ["hello"]);
    assert.equal(h.commitCount(), 1);
    assert.equal(h.render().props.value, "");
  });

  it("cancels an empty composition without resurrecting text or stopping the clock", () => {
    const h = harness(true);
    h.fire("onCompositionStart");
    h.fire("onChange", "h", { isComposing: true });
    h.fire("onCompositionEnd", "");
    assert.equal(h.render().props.value, "");
    assert.equal(h.state().compositionPreview, null);
    assert.equal(h.state().totalTyped, 0);
    assert.equal(h.state().status, "running");
  });

  it("reset and blur discard stale composition events instead of reviving the old word", () => {
    const h = harness();
    h.fire("onCompositionStart");
    h.fire("onChange", "old", { isComposing: true });
    h.props.resetKey = 1;
    assert.equal(h.render().props.value, "");
    h.fire("onCompositionEnd", "old");
    h.fire("onChange", "old");
    assert.deepEqual(h.scored, []);
    h.fire("onCompositionStart", "");
    h.fire("onChange", "new", { isComposing: true });
    h.fire("onBlur");
    h.fire("onCompositionEnd", "new");
    assert.deepEqual(h.scored, []);
    h.fire("onFocus", "");
    h.beforeInput("insertText", "a");
    h.fire("onChange", "a");
    assert.deepEqual(h.scored, ["a"]);
  });

  it("lets the keyboard select candidates with Space, then preserves desktop word commit", () => {
    const h = harness();
    let prevented = false;
    h.fire("onKeyDown", "", { isComposing: true, keyCode: 229 }, { key: " ", preventDefault() { prevented = true; } });
    assert.equal(prevented, false);
    assert.equal(h.commitCount(), 0);
    h.fire("onChange", "hello");
    h.fire("onKeyDown", "hello", { isComposing: false }, { key: " ", preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(h.commitCount(), 1);
  });
});

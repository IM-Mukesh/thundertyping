import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import ts from "typescript";
import * as duration from "@/lib/typing-engine/custom-duration";
import * as types from "@/lib/typing-engine/engine-types";
import * as pace from "@/lib/typing-engine/pace-caret";
import { cn } from "@/lib/utils/cn";

// Execute the actual TSX handlers using bounded hook/ref doubles. These tests
// cover wiring, markup and event semantics, NOT browser layout/native modality.
const require = createRequire(import.meta.url);
type Element = ReactElement<Record<string, unknown>>;
type Component = (props: Record<string, unknown>) => ReactNode;

function loadComponent(file: string, name: string, dependencies: Record<string, unknown> = {}) {
  const hooks: unknown[] = [];
  let cursor = 0;
  const react = {
    useId: () => "duration-test",
    useEffect: () => {},
    useMemo: (factory: () => unknown) => factory(),
    useCallback: (callback: unknown) => callback,
    useRef: (initial: unknown) => {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useState: (initial: unknown) => {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], (next: unknown) => { hooks[index] = next; }];
    },
  };
  const exports: Record<string, Component> = {};
  const modules: Record<string, unknown> = {
    react,
    "@/lib/typing-engine/custom-duration": duration,
    "@/lib/typing-engine/engine-types": types,
    "@/lib/typing-engine/pace-caret": pace,
    "@/lib/utils/cn": { cn },
    ...dependencies,
  };
  const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: file,
  }).outputText;
  new Function("require", "exports", compiled)((id: string) => id in modules ? modules[id] : require(id), exports);
  return (props: Record<string, unknown>) => { cursor = 0; return exports[name](props); };
}

function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}
function find(node: ReactNode, type: string) {
  const found = elements(node).find((element) => element.type === type);
  assert.ok(found, `Missing ${type}`);
  return found;
}
function fire(node: Element, name: string, event: Record<string, unknown> = {}) {
  const handler = node.props[name] as (event: Record<string, unknown>) => void;
  assert.equal(typeof handler, "function", name);
  handler({ preventDefault() {}, stopPropagation() {}, ...event });
}

function controlHarness() {
  const render = loadComponent("./custom-duration-control.tsx", "CustomDurationControl");
  const saved: number[] = [];
  const props = { value: 60, isCustom: false, onApply: (seconds: number) => saved.push(seconds) };
  const tree = render(props);
  const trace: string[] = [];
  const dialog = { open: false, style: { setProperty() {} },
    showModal() { this.open = true; trace.push("showModal"); },
    close() { this.open = false; trace.push("close"); } };
  const input = { value: "", focus() { trace.push("input-focus"); } };
  (find(tree, "dialog").props.ref as { current: unknown }).current = dialog;
  (find(tree, "input").props.ref as { current: unknown }).current = input;
  (find(tree, "button").props.ref as { current: unknown }).current = { focus() { trace.push("trigger-focus"); } };
  return { tree, trace, saved, dialog, input, redraw: () => render(props) };
}

describe("compact duration control regression", () => {
  it("opens a native modal synchronously and submits arbitrary seconds once", () => {
    const h = controlHarness();
    assert.equal(h.dialog.open, false);
    fire(find(h.tree, "button"), "onClick");
    assert.deepEqual(h.trace, ["showModal", "input-focus"]);
    assert.equal(h.input.value, "60");
    h.input.value = "73";
    fire(find(h.tree, "form"), "onSubmit");
    fire(find(h.tree, "form"), "onSubmit");
    assert.deepEqual(h.saved, [73]);
    assert.equal(h.dialog.open, false);
    assert.equal(h.trace.at(-1), "trigger-focus");
  });

  it("rejects invalid seconds; Escape cancels without committing or reaching parent shortcuts", () => {
    const h = controlHarness();
    fire(find(h.tree, "button"), "onClick");
    h.input.value = "0";
    fire(find(h.tree, "form"), "onSubmit");
    assert.equal(h.dialog.open, true);
    assert.deepEqual(h.saved, []);
    assert.equal(find(h.redraw(), "input").props["aria-invalid"], true);
    h.input.value = "120";
    let stopped = false;
    fire(find(h.tree, "dialog"), "onKeyDown", { key: "Escape", stopPropagation() { stopped = true; } });
    assert.equal(stopped, true);
    assert.equal(h.dialog.open, false);
    assert.deepEqual(h.saved, []);
    assert.equal(find(h.tree, "input").props.onBlur, undefined, "Cancel must never auto-save on blur");
  });

  it("pins 15s / 30s / 1m / icon outside desktop scroll masks in one row", () => {
    const CustomControl = () => null;
    const state = { mode: "time", timeDuration: 120, setTimeDuration() {} };
    const render = loadComponent("./test-config-bar.tsx", "TestConfigBar", {
      "@/components/typing-test/custom-duration-control": { CustomDurationControl: CustomControl },
      "@/lib/persistence/settings-store": { useSettingsStore: (select: (s: typeof state) => unknown) => select(state) },
      "@/lib/vocabulary/vocabulary-words": { VOCAB_DIFFICULTIES: ["easy", "medium", "hard"] },
    });
    const tree = render({ onOpenCustomText() {} });
    const all = elements(tree);
    const control = all.find((element) => element.type === CustomControl)!;
    assert.ok(control);
    assert.equal(control.props.value, 120, "Existing custom durations are not lost");
    assert.equal(control.props.isCustom, true);
    assert.equal(control.props.onApply, state.setTimeDuration);
    const optionRow = all.find((element) => Array.isArray(element.props.children) && element.props.children.includes(control));
    assert.ok(optionRow);
    const options = elements(optionRow).filter((element) => ["15s", "30s", "1m", "2m"].includes(String(element.props.ariaLabel)));
    assert.deepEqual(options.map((element) => element.props.ariaLabel), ["15s", "30s", "1m"]);
    for (const container of all.filter((element) => String(element.props.className).includes("overflow-x-auto"))) {
      assert.equal(elements(container).includes(control), false, "Duration icon must never scroll off-screen");
    }
    assert.ok(all.some((element) => String(element.props.className).includes("flex-nowrap")));
    assert.ok(!all.some((element) => /\bflex-wrap\b/.test(String(element.props.className))));
  });

  it("uses the same three presets and popup as the fourth mobile duration slot", () => {
    const CustomControl = () => null;
    const state = { mode: "time", timeDuration: 73, setTimeDuration() {} };
    const render = loadComponent("./mobile-test-settings-modal.tsx", "MobileTestSettingsModal", {
      "@/components/typing-test/custom-duration-control": { CustomDurationControl: CustomControl },
      "@/lib/persistence/settings-store": { useSettingsStore: (select: (s: typeof state) => unknown) => select(state) },
      "@/lib/vocabulary/vocabulary-words": { VOCAB_DIFFICULTIES: ["easy", "medium", "hard"] },
      "motion/react": { AnimatePresence: "div", motion: { div: "div" } },
    });
    const tree = render({ open: true, onClose() {}, onOpenCustomText() {} });
    const grid = elements(tree).find((element) => String(element.props.className).includes("grid-cols-4"));
    assert.ok(grid);
    const slots = elements(grid).filter((element) => element.type === "button" || element.type === CustomControl);
    assert.equal(slots.length, 4);
    assert.deepEqual(slots.slice(0, 3).map((element) => element.props.children), ["15s", "30s", "1m"]);
    assert.equal(slots[3].type, CustomControl);
    assert.equal(slots[3].props.value, 73);
    assert.equal(slots[3].props.onApply, state.setTimeDuration);
  });

  it("visibly displays human-friendly formatted duration when isCustom is true, and updates dynamically", () => {
    const render = loadComponent("./custom-duration-control.tsx", "CustomDurationControl");

    // 70s -> 1m 10s
    const tree70 = render({ value: 70, isCustom: true, onApply: () => {} });
    const spans70 = elements(tree70).filter((el) => el.type === "span" && !String(el.props.className).includes("sr-only"));
    assert.equal(spans70.length, 1);
    assert.equal(spans70[0].props.children, "1m 10s");

    // 125s -> 2m 5s
    const tree125 = render({ value: 125, isCustom: true, onApply: () => {} });
    const spans125 = elements(tree125).filter((el) => el.type === "span" && !String(el.props.className).includes("sr-only"));
    assert.equal(spans125.length, 1);
    assert.equal(spans125[0].props.children, "2m 5s");

    // 300s -> 5m
    const tree300 = render({ value: 300, isCustom: true, onApply: () => {} });
    const spans300 = elements(tree300).filter((el) => el.type === "span" && !String(el.props.className).includes("sr-only"));
    assert.equal(spans300.length, 1);
    assert.equal(spans300[0].props.children, "5m");

    // Preset / not custom (isCustom: false) -> no visible custom duration span
    const tree60 = render({ value: 60, isCustom: false, onApply: () => {} });
    const spans60 = elements(tree60).filter((el) => el.type === "span" && !String(el.props.className).includes("sr-only"));
    assert.equal(spans60.length, 0);
  });
});


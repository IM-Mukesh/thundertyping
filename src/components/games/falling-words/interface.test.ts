import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as engine from "@/lib/games/falling-words/engine";
import * as progress from "@/lib/games/falling-words/progress";
import * as visuals from "@/lib/games/falling-words/visual-model";
import { GAME_DEFINITIONS } from "@/lib/games/game-types";

// The actual DOM markup, not an assertion of mounted layout/GPU/mobile behavior.
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL("./skyfall-interface.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const modules: Record<string, unknown> = {
  "@/lib/games/falling-words/engine": engine, "@/lib/games/falling-words/progress": progress, "@/lib/games/falling-words/visual-model": visuals,
  "./skyfall.module.css": { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) },
};
const exports: { SkyfallInterface?: (props: Record<string, unknown>) => ReactNode } = {};
new Function("require", "exports", compiled)((id: string) => id in modules ? modules[id] : require(id), exports);
const definition = GAME_DEFINITIONS["falling-words"];
function props(state: engine.SkyfallState, changes: Record<string, unknown> = {}) {
  const noop = () => {};
  return {
    state, progress: progress.freshSkyfallProgress(), best: null, newBest: false, renderMode: "webgl", reducedMotion: false, soundEnabled: true,
    storageOk: true, focused: true, announcement: "", scene: null, rootRef: { current: null }, inputRef: { current: null }, overlayRef: { current: null },
    onStart: noop, onPause: noop, onResume: noop, onMenu: noop, onFinishPractice: noop, onFocus: noop, onFocused: noop, onSound: noop,
    onPreferences: noop, onInputKey: noop, onInputChange: noop, onBeforeInput: noop, onCompositionStart: noop, onCompositionEnd: noop, onInputBlur: noop, onTouchKey: noop,
    ...changes,
  };
}
function markup(state: engine.SkyfallState, changes: Record<string, unknown> = {}) {
  return renderToStaticMarkup(createElement(exports.SkyfallInterface!, props(state, changes)));
}
function find(node: ReactNode, predicate: (node: ReactElement<Record<string, unknown>>) => boolean): ReactElement<Record<string, unknown>> {
  if (isValidElement<Record<string, unknown>>(node)) {
    if (predicate(node)) return node;
    for (const child of ([] as ReactNode[]).concat(node.props.children as ReactNode[])) {
      try { return find(child, predicate); } catch { /* sibling */ }
    }
  }
  throw new Error("Control not found");
}
describe("Skyfall readable interface", () => {
  it("renders a narrative menu, separate practice choice and honest local progress", () => {
    const html = markup(engine.createSkyfallState(definition));
    assert.match(html, /Falling<br\/>/); assert.match(html, /SKYFALL PROTOCOL/);
    assert.match(html, /Enter the storm/); assert.match(html, /Zen practice/);
    assert.match(html, /0 words rescued across 0 finished nights/);
    assert.match(html, /Desktop · tablet · phone/);
    assert.doesNotMatch(html, /players online|global rank|best in the world/i);
  });
  it("keeps targets as readable DOM words and supplies an unobscured native text input", () => {
    const initial = engine.tickSkyfall(engine.startSkyfall(definition, { seed: "interface" }), 1800);
    const state = engine.typeSkyfallKey(initial, initial.words[0].text[0]);
    const html = markup(state);
    assert.match(html, /aria-label="Falling target words"/); assert.match(html, /LOCKED/);
    assert.match(html, /aria-label="Falling Words typing input"/); assert.match(html, /autoComplete="off"/);
    assert.match(html, /inputMode="text"/); assert.doesNotMatch(html, /opacity-0/);
    assert.match(html, /Tab pauses and moves focus/);
  });
  it("leaves the native draft uncontrolled and forwards composition handlers without pausing", () => {
    let starts = 0, ends = 0, pauses = 0, writes = 0;
    const dom = { get value() { return "ar"; }, set value(_: string) { writes++; } };
    const p = props(engine.startSkyfall(definition), { onCompositionStart: () => starts++, onCompositionEnd: () => ends++, onPause: () => pauses++ });
    const input = find(exports.SkyfallInterface!(p), node => node.props.id === "skyfall-input");
    assert.equal(input.props.value, undefined); assert.equal(input.props.defaultValue, "");
    assert.equal(input.props.onCompositionStart, p.onCompositionStart); assert.equal(input.props.onCompositionEnd, p.onCompositionEnd);
    (input.props.onCompositionStart as (e: unknown) => void)({ currentTarget: dom });
    (input.props.onCompositionEnd as (e: unknown) => void)({ currentTarget: dom });
    assert.equal(starts, 1); assert.equal(ends, 1); assert.equal(pauses, 0); assert.equal(writes, 0);
  });
  it("cancels draft edits on blur, pauses external focus, and prevents paste/drop", () => {
    const events: string[] = [];
    const inside = {};
    const input = find(exports.SkyfallInterface!(props(engine.startSkyfall(definition), {
      rootRef: { current: { contains: (target: unknown) => target === inside } }, onInputBlur: () => events.push("cancel"),
      onFocused: (focused: boolean) => events.push(String(focused)), onPause: () => events.push("pause"),
    })), node => node.props.id === "skyfall-input");
    (input.props.onBlur as (e: unknown) => void)({ relatedTarget: inside });
    assert.deepEqual(events, ["cancel", "false"]);
    (input.props.onBlur as (e: unknown) => void)({ relatedTarget: null });
    assert.deepEqual(events.slice(2), ["cancel", "false", "pause"]);
    let prevented = 0;
    (input.props.onPaste as (e: unknown) => void)({ preventDefault() { prevented++; } });
    (input.props.onDrop as (e: unknown) => void)({ preventDefault() { prevented++; } });
    assert.equal(prevented, 2);
  });
  it("provides all 26 touch letters plus deletion without needing an OS keyboard", () => {
    const html = markup(engine.startSkyfall(definition), { progress: { ...progress.freshSkyfallProgress(), touchKeys: true }, focused: false });
    for (const letter of "abcdefghijklmnopqrstuvwxyz") assert.ok(html.includes(`aria-label="Type ${letter}"`));
    assert.match(html, /aria-label="Delete last character"/); assert.match(html, /inputMode="none"/);
    assert.doesNotMatch(html, /Tap to reconnect keyboard/);
  });
  it("offers pause/resume and practice results without pretending to award XP", () => {
    const paused = engine.pauseSkyfall(engine.startSkyfall(definition, { mode: "zen" }));
    assert.match(markup(paused), /Resume transmission/);
    const ended = { ...paused, status: "over" as const };
    const html = markup(ended);
    assert.match(html, /PRACTICE COMPLETE/); assert.match(html, /No lives, records or XP/);
    assert.match(html, /retyping cannot inflate WPM/);
  });
});

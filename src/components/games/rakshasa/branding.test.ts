import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { GAME_DEFINITIONS } from "@/lib/games/game-types";
import { buildGameSchema } from "@/lib/seo/json-ld";
import * as content from "@/lib/games/rakshasa/content";
import * as engine from "@/lib/games/rakshasa/engine";
import * as progress from "@/lib/games/rakshasa/progress";

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL("./war-interface.tsx", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }, fileName: "war-interface.tsx",
}).outputText;
const modules: Record<string, unknown> = {
  "@/lib/games/rakshasa/content": content,
  "@/lib/games/rakshasa/engine": engine,
  "@/lib/games/rakshasa/progress": progress,
  "./war.module.css": { __esModule: true, default: { title: "title" } },
};
const exports: { WarInterface?: (props: Record<string, unknown>) => ReactNode } = {};
new Function("require", "exports", compiled)((id: string) => id in modules ? modules[id] : require(id), exports);
const game = GAME_DEFINITIONS["rakshasa-war"];

describe("Typebound display branding without compatibility migration", () => {
  it("renders the full chosen name in the menu, header and accessible battlefield label", () => {
    const noop = () => {};
    const html = renderToStaticMarkup(createElement(exports.WarInterface!, {
      gameName: game.name, state: engine.createWarState(), progress: progress.freshWarProgress(), stage: content.WAR_STAGES[0], selectedStage: 0,
      onSelectStage: noop, onBegin: noop, onPause: noop, onResume: noop, onMenu: noop, onPreferences: noop, onSound: noop,
      soundEnabled: true, mode: "webgl", storageOk: true, newBest: false, reducedMotion: false,
      boardRef: { current: null }, overlayRef: { current: null }, onBoardKey: noop, scene: null,
    }));
    assert.match(html, /\/ TYPEBOUND: THE LAST DAWN/);
    assert.match(html, /aria-label="TYPEBOUND: THE LAST DAWN battlefield\./);
    assert.match(html, /<h2 class="title" aria-label="TYPEBOUND: THE LAST DAWN">TYPEBOUND: <span>THE LAST DAWN<\/span><\/h2>/);
    assert.doesNotMatch(html, /rakshasa\s+war/i);
  });
  it("gives structured data the same display name while keeping URL and device keys stable", () => {
    const schema = buildGameSchema({ name: game.name, description: game.about[0], path: `/games/${game.id}` });
    assert.equal(schema.name, "TYPEBOUND: THE LAST DAWN");
    assert.equal(game.id, "rakshasa-war");
    assert.ok(game.about[0].startsWith(game.name));
    assert.equal(progress.warProgressKey(null), "herotyping:rakshasa-war:v1:guest");
    assert.equal(engine.createWarState().seed, "rakshasa-war");
  });
});

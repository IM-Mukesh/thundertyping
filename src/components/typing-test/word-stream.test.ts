import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import ts from "typescript";
import type { CharState, WordState } from "@/lib/typing-engine/engine-types";
import * as unicode from "@/lib/typing-engine/unicode";

// The project test command intentionally runs TypeScript files directly and
// does not install a DOM renderer. Compile just this client component to
// CommonJS so these assertions exercise the exported model used by the real
// WordStream without inventing a second grapheme implementation for tests.
const require = createRequire(import.meta.url);
const source = readFileSync(new URL("./word-stream.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  fileName: "word-stream.tsx",
}).outputText;
const modules: Record<string, unknown> = {
  "@/lib/typing-engine/unicode": unicode,
  "@/lib/utils/cn": { cn: (...values: unknown[]) => values.filter(Boolean).join(" ") },
  "motion/react": { motion: { span: "span" } },
};
const wordStreamExports: {
  getWordCaretIndex: (typed: string) => number;
  getWordVisualUnits: (word: WordState) => { value: string; state: CharState }[];
} = {} as {
  getWordCaretIndex: (typed: string) => number;
  getWordVisualUnits: (word: WordState) => { value: string; state: CharState }[];
};
new Function("require", "exports", compiled)((id: string) => id in modules ? modules[id] : require(id), wordStreamExports);

const { getWordCaretIndex, getWordVisualUnits } = wordStreamExports;

const CASES: readonly [string, readonly string[]][] = [
  ["हिंदी", ["हिं", "दी"]],
  ["नमस्ते", ["न", "म", "स्ते"]],
  ["माँ", ["माँ"]],
  ["mañana", ["m", "a", "ñ", "a", "n", "a"]],
  ["español", ["e", "s", "p", "a", "ñ", "o", "l"]],
  ["acción", ["a", "c", "c", "i", "ó", "n"]],
  ["你好", ["你", "好"]],
  ["中文输入", ["中", "文", "输", "入"]],
];

function word(target: string, typed = "", chars?: CharState[]): WordState {
  return {
    target,
    typed,
    chars: chars ?? Array.from(
      { length: getWordVisualUnits({ target, typed, chars: [] }).length },
      () => "pending" as const,
    ),
  };
}

describe("WordStream grapheme rendering", () => {
  for (const [target, expected] of CASES) {
    it(`keeps ${target} in complete visual units`, () => {
      const units = getWordVisualUnits(word(target));
      assert.deepEqual(units.map(({ value }) => value), expected);
      assert.equal(units.length, expected.length);
    });
  }

  it("keeps state classes aligned with clusters instead of detached marks", () => {
    const units = getWordVisualUnits(word("नमस्ते", "नम", ["correct", "correct", "pending"]));
    assert.deepEqual(units, [
      { value: "न", state: "correct" },
      { value: "म", state: "correct" },
      { value: "स्ते", state: "pending" },
    ]);
  });

  it("renders extra typed clusters as whole units and preserves canonical accents", () => {
    const units = getWordVisualUnits(word("mañana", "man\u0303anaX", [
      "correct", "correct", "correct", "correct", "correct", "correct", "extra",
    ]));
    assert.deepEqual(units.map(({ value }) => value), ["m", "a", "ñ", "a", "n", "a", "X"]);

    const hindi = getWordVisualUnits(word("माँ", "माँक्ष", ["correct", "extra"]));
    assert.deepEqual(hindi.map(({ value }) => value), ["माँ", "क्ष"]);
  });

  it("places the real caret after graphemes, not UTF-16 code units", () => {
    assert.equal(getWordCaretIndex("हिं"), 1);
    assert.equal(getWordCaretIndex("माँ"), 1);
    assert.equal(getWordCaretIndex("man\u0303ana"), 6);
    assert.equal(getWordCaretIndex("中文"), 2);
  });
});

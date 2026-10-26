import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import type { LessonDefinition } from "@/lib/lessons/lesson-types";

const require = createRequire(import.meta.url);
type Element = ReactElement<Record<string, unknown>>;

function flattenElements(node: ReactNode): Element[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(flattenElements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  const children = node.props.children as ReactNode;
  return [node, ...flattenElements(children)];
}

const mockUnit: LessonDefinition = {
  id: "home-row-left",
  slug: "home-row-f-j",
  tier: "beginner",
  stage: "home-row",
  order: 1,
  name: "Home Row Keys: F & J",
  newKeys: ["f", "j"],
  instructions: ["Feel the small tactile bumps on F and J."],
  minAccuracy: 90,
  subLessonCount: 6,
  content: { kind: "drill", allowedKeys: ["f", "j", " "], wordCount: 15 },
};

function loadLessonUnitRow() {
  const stub = (name: string) => {
    const Component = (props: Record<string, unknown>) => ({
      type: name,
      props,
      key: null,
    });
    Component.displayName = name;
    return Component;
  };

  const LinkStub = stub("Link");
  const modules: Record<string, unknown> = {
    "next/link": Object.assign(LinkStub, { default: LinkStub }),
    "lucide-react": {
      CheckCircle2: stub("CheckCircle2"),
      ChevronRight: stub("ChevronRight"),
      Lock: stub("Lock"),
      Play: stub("Play"),
      RotateCcw: stub("RotateCcw"),
      Star: stub("Star"),
    },
    "@/lib/typing-engine/stats": {
      round: (n: number) => Math.round(n),
    },
    "@/lib/utils/cn": {
      cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
    },
  };

  const source = readFileSync(
    fileURLToPath(new URL("./lesson-unit-row.tsx", import.meta.url)),
    "utf8",
  );

  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;

  const exports: Record<string, (props: Record<string, unknown>) => ReactNode> = {};
  const customRequire = (specifier: string) => {
    if (specifier in modules) return modules[specifier];
    return require(specifier);
  };

  new Function("require", "exports", compiled)(customRequire, exports);
  return exports.LessonUnitRow;
}

describe("LessonUnitRow — Selective Prefetching & Semantic Crawlability", () => {
  const LessonUnitRow = loadLessonUnitRow();

  it("sets prefetch=false on locked units to avoid swarming network with unneeded requests", () => {
    const tree = LessonUnitRow({
      unit: mockUnit,
      position: 1,
      unlocked: false,
      isCurrent: false,
      lockedReason: "Complete previous lesson first",
    });
    const elements = flattenElements(tree);
    const link = elements.find((el) => el.type === "Link" || (typeof el.type === "function" && (el.type as { displayName?: string }).displayName === "Link"));

    assert.ok(link, "Must render a semantic Link component");
    assert.equal(link.props.prefetch, false, "Locked unit must have prefetch={false}");
    assert.equal(link.props.href, "/lessons/home-row-f-j", "Preserves canonical crawlable href");
  });

  it("sets prefetch=true on current up-next recommended lesson for instant navigation", () => {
    const tree = LessonUnitRow({
      unit: mockUnit,
      position: 1,
      unlocked: true,
      isCurrent: true,
    });
    const elements = flattenElements(tree);
    const link = elements.find((el) => el.type === "Link" || (typeof el.type === "function" && (el.type as { displayName?: string }).displayName === "Link"));

    assert.ok(link, "Must render a semantic Link component");
    assert.equal(link.props.prefetch, true, "Up-next lesson must have prefetch={true}");
    assert.equal(link.props.href, "/lessons/home-row-f-j");
  });

  it("sets prefetch=null on other unlocked review lessons for standard viewport/hover prefetch", () => {
    const tree = LessonUnitRow({
      unit: mockUnit,
      position: 1,
      unlocked: true,
      isCurrent: false,
      progress: { completed: true, currentStep: 6, passCount: 1, avgAccuracy: 98, avgWpm: 45, totalTimeMs: 5000, completedAt: 1000 },
    });
    const elements = flattenElements(tree);
    const link = elements.find((el) => el.type === "Link" || (typeof el.type === "function" && (el.type as { displayName?: string }).displayName === "Link"));

    assert.ok(link, "Must render a semantic Link component");
    assert.equal(link.props.prefetch, null, "Completed unlocked review lesson must have prefetch={null}");
    assert.equal(link.props.href, "/lessons/home-row-f-j");
  });

  it("preserves localized route prefix when locale is provided", () => {
    const tree = LessonUnitRow({
      locale: "es",
      unit: mockUnit,
      position: 1,
      unlocked: true,
      isCurrent: true,
    });
    const elements = flattenElements(tree);
    const link = elements.find((el) => el.type === "Link" || (typeof el.type === "function" && (el.type as { displayName?: string }).displayName === "Link"));

    assert.ok(link);
    assert.equal(link.props.href, "/es/lessons/home-row-f-j");
  });
});

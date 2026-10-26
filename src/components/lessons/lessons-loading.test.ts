import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { isValidElement, type ReactElement } from "react";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadComponent(relativePath: string): () => ReactElement<Record<string, unknown>> {
  const source = readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
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

  const exports: { default?: () => ReactElement<Record<string, unknown>> } = {};
  new Function("require", "exports", compiled)(require, exports);
  if (!exports.default) throw new Error(`Component at ${relativePath} has no default export`);
  return exports.default;
}

describe("Route Loading Boundaries — Instant UI Feedback & Accessibility", () => {
  const LessonLoading = loadComponent("../../app/[locale]/lessons/[lessonId]/loading.tsx");
  const LessonsHubLoading = loadComponent("../../app/[locale]/lessons/loading.tsx");

  it("renders a valid accessible loading skeleton for lesson drill route", () => {
    const tree = LessonLoading();
    assert.ok(isValidElement(tree), "Must return a valid React element");
    assert.equal(tree.props.role, "status", "Must define role='status' for screen readers");
    assert.ok(tree.props["aria-label"], "Must define an accessible aria-label");
    assert.ok(
      String(tree.props.className).includes("animate-pulse") &&
      String(tree.props.className).includes("motion-reduce:animate-none"),
      "Must pulse and respect motion-reduce preferences",
    );
  });

  it("renders a valid accessible loading skeleton for lessons curriculum hub", () => {
    const tree = LessonsHubLoading();
    assert.ok(isValidElement(tree), "Must return a valid React element");
    assert.equal(tree.props.role, "status", "Must define role='status' for screen readers");
    assert.ok(tree.props["aria-label"], "Must define an accessible aria-label");
    assert.ok(
      String(tree.props.className).includes("animate-pulse") &&
      String(tree.props.className).includes("motion-reduce:animate-none"),
      "Must pulse and respect motion-reduce preferences",
    );
  });
});

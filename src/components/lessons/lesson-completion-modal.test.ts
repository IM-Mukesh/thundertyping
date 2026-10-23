import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
type Element = ReactElement<Record<string, unknown>>;
type Component = (props: Record<string, unknown>) => ReactNode;

function flattenElements(node: ReactNode): Element[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(flattenElements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  const children = node.props.children as ReactNode;
  return [node, ...flattenElements(children)];
}

function loadLessonCompletionModal() {
  const hooks: unknown[] = [];
  let cursor = 0;

  const react = {
    useId: () => "test-modal-id",
    useEffect: () => {},
    useLayoutEffect: () => {},
    useMemo: (factory: () => unknown) => factory(),
    useCallback: (callback: unknown) => callback,
    useRef: (initial: unknown) => {
      const idx = cursor++;
      if (!(idx in hooks)) hooks[idx] = { current: initial };
      return hooks[idx];
    },
    useState: (initial: unknown) => {
      const idx = cursor++;
      if (!(idx in hooks)) {
        hooks[idx] = typeof initial === "function" ? (initial as () => unknown)() : initial;
      }
      return [hooks[idx], (next: unknown) => { hooks[idx] = next; }];
    },
  };

  const stub = (name: string) => {
    const Component = (props: Record<string, unknown>) => ({
      type: name,
      props,
      key: null,
    });
    Component.displayName = name;
    return Component;
  };

  const iconStub = (name: string) => stub(`Icon-${name}`);

  const modules: Record<string, unknown> = {
    react,
    React: react,
    "lucide-react": {
      ArrowRight: iconStub("ArrowRight"),
      RotateCcw: iconStub("RotateCcw"),
      Sparkles: iconStub("Sparkles"),
      Star: iconStub("Star"),
      Target: iconStub("Target"),
      Zap: iconStub("Zap"),
    },
    "@/lib/games/game-audio": {
      playSound: () => {},
      playStarSound: () => {},
    },
    "@/lib/utils/cn": {
      cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
    },
  };

  const source = readFileSync(
    fileURLToPath(new URL("./lesson-completion-modal.tsx", import.meta.url)),
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

  const exports: Record<string, Component> = {};
  const customRequire = (specifier: string) => {
    if (specifier in modules) return modules[specifier];
    return require(specifier);
  };

  new Function("require", "exports", compiled)(customRequire, exports);

  return (props: Record<string, unknown>) => {
    cursor = 0;
    return exports.LessonCompletionModal(props);
  };
}

import { fileURLToPath } from "node:url";

describe("LessonCompletionModal — Layout, Scrollbar Elimination & Accessibility", () => {
  const Modal = loadLessonCompletionModal();

  it("returns null when open is false", () => {
    const tree = Modal({
      open: false,
      stars: 5,
      passed: true,
      wpm: 60,
      accuracy: 98,
      errors: 0,
      timeMs: 30000,
      headline: "PERFECT RUN",
      feedback: "Great job!",
      unitCompleted: false,
      onContinue: () => {},
      onRetry: () => {},
      soundEnabled: false,
    });

    assert.equal(tree, null);
  });

  it("renders accessible dialog semantics and eliminates overflow-y-auto scrollbars", () => {
    const tree = Modal({
      open: true,
      stars: 5,
      passed: true,
      wpm: 72,
      accuracy: 100,
      errors: 0,
      timeMs: 25000,
      headline: "PERFECT RUN",
      feedback: "Clean execution with zero mistakes.",
      unitCompleted: false,
      lessonTitle: "Home Row Keys",
      stepNumber: 1,
      totalSteps: 5,
      onContinue: () => {},
      onRetry: () => {},
      soundEnabled: false,
    });

    assert.ok(tree, "Modal tree should render");
    const elements = flattenElements(tree);

    // 1. Dialog root element
    const dialog = elements.find((el) => el.props.role === "dialog");
    assert.ok(dialog, "Must have role='dialog'");
    assert.equal(dialog.props["aria-modal"], "true");
    assert.equal(dialog.props["aria-labelledby"], "lesson-result-title");
    assert.equal(dialog.props["aria-describedby"], "lesson-result-desc");

    // 2. ABSOLUTE REQUIREMENT: No overflow-y-auto or scrollbars inside popup
    const classNames = elements
      .map((el) => (typeof el.props.className === "string" ? el.props.className : ""))
      .join(" ");

    assert.ok(
      !classNames.includes("overflow-y-auto"),
      "Modal must NOT contain 'overflow-y-auto' on any element",
    );
    assert.ok(
      !classNames.includes("overflow-y-scroll"),
      "Modal must NOT contain 'overflow-y-scroll' on any element",
    );
    assert.ok(
      !classNames.includes("overflow-auto"),
      "Modal must NOT contain 'overflow-auto' on any element",
    );

    // 3. Viewport max-height constraint
    assert.ok(
      classNames.includes("max-h-[96dvh]"),
      "Modal card must enforce dynamic max-h-[96dvh]",
    );

    // 4. Charcoal/theme-aware background instead of invalid bg-card
    assert.ok(
      classNames.includes("bg-background"),
      "Modal must use theme-aware bg-background",
    );
    assert.ok(
      !classNames.includes("bg-card"),
      "Modal must not use invalid bg-card",
    );
  });

  it("renders five stars with accessible label and star rating", () => {
    const tree = Modal({
      open: true,
      stars: 4,
      passed: true,
      wpm: 55,
      accuracy: 96,
      errors: 2,
      timeMs: 32000,
      headline: "SPEED CHAMPION",
      feedback: "Solid rhythm maintained.",
      unitCompleted: false,
      onContinue: () => {},
      onRetry: () => {},
      soundEnabled: false,
    });

    const elements = flattenElements(tree);
    const starContainer = elements.find(
      (el) => el.props["aria-label"] === "4 of 5 stars earned",
    );
    assert.ok(starContainer, "Star group must have aria-label='4 of 5 stars earned'");

    const stars = elements.filter(
      (el) =>
        (typeof el.type === "function" &&
          (el.type as { displayName?: string }).displayName === "Icon-Star") ||
        el.type === "Icon-Star",
    );
    assert.equal(stars.length, 5, "Must render exactly 5 stars");
  });

  it("renders performance statistics (WPM, Accuracy, Errors, Time)", () => {
    const tree = Modal({
      open: true,
      stars: 5,
      passed: true,
      wpm: 84,
      accuracy: 99,
      errors: 1,
      timeMs: 42000,
      headline: "PERFECT RUN",
      feedback: "Lightning fast!",
      unitCompleted: false,
      onContinue: () => {},
      onRetry: () => {},
      soundEnabled: false,
    });

    const elements = flattenElements(tree);
    const textNodes = elements
      .flatMap((el) => {
        const c = el.props.children;
        if (typeof c === "string" || typeof c === "number") return [String(c)];
        if (Array.isArray(c)) {
          const joined = c.filter((x): x is string | number => typeof x === "string" || typeof x === "number").join("");
          return [joined, ...c.filter((x): x is string | number => typeof x === "string" || typeof x === "number").map(String)];
        }
        return [];
      });

    assert.ok(textNodes.includes("84"), "WPM 84 must be displayed");
    assert.ok(textNodes.includes("99%"), "Accuracy 99% must be displayed");
    assert.ok(textNodes.includes("1"), "Errors 1 must be displayed");
    assert.ok(textNodes.includes("42s"), "Time 42s must be displayed");
  });

  it("renders primary Continue action and secondary Repeat action on pass", () => {
    const tree = Modal({
      open: true,
      stars: 5,
      passed: true,
      wpm: 60,
      accuracy: 100,
      errors: 0,
      timeMs: 30000,
      headline: "PERFECT RUN",
      feedback: "Flawless!",
      unitCompleted: true,
      nextUnitTitle: "Top Row Left",
      onContinue: () => {},
      onRetry: () => {},
      soundEnabled: false,
    });

    const elements = flattenElements(tree);
    const buttons = elements.filter((el) => el.type === "button");
    assert.ok(buttons.length >= 2, "Must render at least Continue and Repeat buttons");

    const continueBtn = buttons.find((b) => {
      const cls = typeof b.props.className === "string" ? b.props.className : "";
      return cls.includes("bg-accent");
    });
    assert.ok(continueBtn, "Primary Continue button must have bg-accent");

    const repeatBtn = buttons.find((b) => {
      const cls = typeof b.props.className === "string" ? b.props.className : "";
      return cls.includes("border-border");
    });
    assert.ok(repeatBtn, "Secondary Repeat button must have border-border");
  });

  it("renders Try Again and Practice Weak Keys when failed", () => {
    const tree = Modal({
      open: true,
      stars: 1,
      passed: false,
      wpm: 25,
      accuracy: 70,
      minAccuracy: 80,
      errors: 8,
      timeMs: 60000,
      headline: "PRACTICE NEEDED",
      feedback: "Focus on finger placement.",
      mistakeSummary: "Difficulty with left index finger keys.",
      weaknessFeedback: "Try keeping hands on home row.",
      retryFocusKeys: ["f", "g", "r"],
      unitCompleted: false,
      onContinue: () => {},
      onRetry: () => {},
      onPracticeLab: () => {},
      soundEnabled: false,
    });

    const elements = flattenElements(tree);
    const badge = elements.find((el) => {
      const c = el.props.children;
      return Array.isArray(c) && c.includes("Needs Practice");
    });
    assert.ok(badge, "Must show 'Needs Practice' badge");

    const buttons = elements.filter((el) => el.type === "button");
    assert.ok(buttons.length >= 2, "Must render Try Again and Practice Weak Keys buttons");
  });
});

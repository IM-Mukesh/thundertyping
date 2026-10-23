import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
type Element = ReactElement<Record<string, unknown>>;
type Component = (props: Record<string, unknown>) => ReactNode;

function flattenElements(node: ReactNode): Element[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(flattenElements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  if (typeof node.type === "function") {
    try {
      const rendered = (node.type as Component)(node.props);
      return [node, ...flattenElements(rendered)];
    } catch {
      return [node];
    }
  }
  const children = node.props.children as ReactNode;
  return [node, ...flattenElements(children)];
}

function loadHomepageExploreSection(initialRunning = false) {
  let isRunning = initialRunning;
  const hooks: unknown[] = [];
  let cursor = 0;
  const effects: Array<() => void> = [];

  const react = {
    useId: () => "test-id",
    useEffect: (fn: () => void) => {
      effects.push(fn);
    },
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
      return [
        hooks[idx],
        (next: unknown) => {
          hooks[idx] = typeof next === "function" ? (next as (prev: unknown) => unknown)(hooks[idx]) : next;
        },
      ];
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

  const modules: Record<string, unknown> = {
    react,
    "@/lib/typing-engine/test-status-store": {
      useIsTestRunning: () => isRunning,
    },
    "@/components/layout/homepage-feature-nav": {
      HomepageFeatureNav: stub("HomepageFeatureNav"),
    },
    "@/components/layout/homepage-seo-content": {
      HomepageSeoContent: stub("HomepageSeoContent"),
    },
    "@/lib/utils/cn": {
      cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
    },
  };

  const source = readFileSync(
    fileURLToPath(new URL("./homepage-explore-section.tsx", import.meta.url)),
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

  const render = (runningState?: boolean) => {
    if (runningState !== undefined) {
      isRunning = runningState;
    }
    cursor = 0;
    effects.length = 0;
    const tree = exports.HomepageExploreSection({});
    // Run queued effects
    for (const effect of effects) {
      effect();
    }
    return tree;
  };

  return { render };
}

describe("HomepageExploreSection — Animated 3-Chevron SEO Disclosure", () => {
  it("renders a single accessible button with aria-expanded='false', aria-controls, and top margin", () => {
    const { render } = loadHomepageExploreSection(false);
    const tree = render();
    const elements = flattenElements(tree);

    const button = elements.find((el) => el.type === "button");
    assert.ok(button, "Must render exactly one disclosure button");
    assert.equal(button.props.id, "explore-resources-trigger");
    assert.equal(button.props["aria-expanded"], false);
    assert.equal(button.props["aria-controls"], "homepage-seo-resources");

    const className = String(button.props.className);
    assert.ok(
      className.includes("mt-1.5") || className.includes("mt-2") || className.includes("mt-3"),
      "Trigger button must have top margin for visual breathing room",
    );

    const textNodes = elements.flatMap((el) => {
      const c = el.props.children;
      return typeof c === "string" ? [c] : [];
    });
    assert.ok(
      textNodes.includes("Explore typing resources"),
      "Must display 'Explore typing resources' label in collapsed state",
    );
  });

  it("renders exactly 3 chevrons arranged vertically within the single button control", () => {
    const { render } = loadHomepageExploreSection(false);
    const tree = render();
    const elements = flattenElements(tree);

    const button = elements.find((el) => el.type === "button");
    assert.ok(button, "Button should exist");

    const buttonChildren = flattenElements(button);
    const svgs = buttonChildren.filter((el) => el.type === "svg");
    assert.equal(svgs.length, 3, "Must contain exactly 3 chevrons arranged as one control");
  });

  it("preserves SEO content region in the DOM with inert applied when collapsed", () => {
    const { render } = loadHomepageExploreSection(false);
    const tree = render();
    const elements = flattenElements(tree);

    const seoRegion = elements.find((el) => el.props.id === "homepage-seo-resources");
    assert.ok(seoRegion, "SEO content region must be present in the DOM for crawlers");
    assert.equal(seoRegion.props.role, "region");
    assert.equal(seoRegion.props["aria-labelledby"], "explore-resources-trigger");
    assert.equal(seoRegion.props.inert, true, "Collapsed region must have inert=true to prevent hidden tabbing");

    const className = String(seoRegion.props.className);
    assert.ok(
      className.includes("grid-rows-[0fr]"),
      "Must collapse visual height to 0fr when closed",
    );

    const seoContent = elements.find(
      (el) =>
        el.type === "HomepageSeoContent" ||
        (typeof el.type === "function" && (el.type as { displayName?: string }).displayName === "HomepageSeoContent"),
    );
    assert.ok(seoContent, "HomepageSeoContent must be embedded inside the region");
  });

  it("automatically closes when typing starts (isRunning becomes true)", () => {
    const { render } = loadHomepageExploreSection(false);
    let tree = render();
    let elements = flattenElements(tree);

    const button = elements.find((el) => el.type === "button");
    assert.ok(button, "Button should exist");
    assert.equal(button.props["aria-expanded"], false, "Initially collapsed");

    // Expand the disclosure
    const onClick = button.props.onClick as () => void;
    onClick();

    tree = render();
    elements = flattenElements(tree);
    const expandedButton = elements.find((el) => el.type === "button");
    assert.equal(expandedButton?.props["aria-expanded"], true, "Should be expanded after click");

    // Typing begins! isRunning transitions to true
    tree = render(true);
    // Re-render after state update from effect
    tree = render();
    elements = flattenElements(tree);

    const closedButton = elements.find((el) => el.type === "button");
    assert.equal(
      closedButton?.props["aria-expanded"],
      false,
      "Must automatically close when typing starts (isRunning = true)",
    );

    const seoRegion = elements.find((el) => el.props.id === "homepage-seo-resources");
    assert.equal(
      seoRegion?.props.inert,
      true,
      "SEO region must be inert again after auto-close",
    );
  });
});

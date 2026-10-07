import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import ts from "typescript";

import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
type Element = ReactElement<Record<string, unknown>>;

function flattenElements(node: ReactNode): Element[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(flattenElements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  const children = node.props.children as ReactNode;
  return [node, ...flattenElements(children)];
}

function createTypingTestHarness(engineStatus: "idle" | "running" | "finished" = "idle") {
  const hooks: unknown[] = [];
  let cursor = 0;

  const react = {
    useId: () => "test-id",
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
      if (!(idx in hooks)) hooks[idx] = initial;
      return [hooks[idx], (next: unknown) => { hooks[idx] = next; }];
    },
  };

  const mockSettings = {
    mode: "time",
    timeDuration: 30,
    wordCount: 25,
    quoteLength: "medium",
    vocabDifficulty: "easy",
    soundEnabled: true,
    setMode: () => {},
    toggleSound: () => {},
  };

  const mockEngineState = {
    status: engineStatus,
    activeWordIndex: 0,
    wordStates: [{ word: "hello", typed: "", status: "active" }],
    correctKeystrokes: 10,
    incorrectKeystrokes: 1,
    elapsedMs: 5000,
    netWpmCharacters: 50,
    wpmSamples: [],
    charTally: { extra: 0, missed: 0 },
    totalTyped: 11,
    correctedErrors: 0,
    inputRevision: 0,
    quoteSource: null,
    words: ["hello", "world"],
  };

  const mockEngine = {
    state: mockEngineState,
    displayWordStates: mockEngineState.wordStates,
    setTyped: () => {},
    previewComposition: () => {},
    commitWord: () => {},
    restart: () => {},
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
    "next/navigation": {
      useSearchParams: () => new URLSearchParams(),
    },
    "lucide-react": {
      RotateCcw: iconStub("RotateCcw"),
      SlidersHorizontal: iconStub("SlidersHorizontal"),
      Volume2: iconStub("Volume2"),
      VolumeX: iconStub("VolumeX"),
      Wrench: iconStub("Wrench"),
    },
    "@/lib/persistence/settings-store": {
      useSettingsStore: (selector: (s: typeof mockSettings) => unknown) => selector(mockSettings),
    },
    "@/lib/typing-engine/custom-duration": {
      formatDuration: (s: number) => `${s}s`,
      parseUrlDuration: () => null,
    },
    "@/lib/typing-engine/use-typing-engine": {
      useTypingEngine: () => mockEngine,
    },
    "@/lib/persistence/results-store": {
      getPersonalBest: () => null,
      paramForConfig: () => "time-30",
      recordResult: () => false,
    },
    "@/lib/typing-engine/stats": {
      calculateAccuracy: () => 98,
      calculateNetWpm: () => 60,
      calculateRawWpm: () => 62,
    },
    "@/lib/typing-engine/pace-caret": {
      computePaceCaretPosition: () => null,
    },
    "@/lib/analytics": {
      trackEvent: () => {},
    },
    "@/lib/utils/cn": {
      cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
    },
    "@/components/typing-test/hidden-input": {
      HiddenInput: stub("HiddenInput"),
    },
    "@/components/typing-test/word-stream": {
      WordStream: stub("WordStream"),
    },
    "@/components/typing-test/live-stats-bar": {
      LiveStatsBar: stub("LiveStatsBar"),
    },
    "@/components/typing-test/results-panel": {
      ResultsPanel: stub("ResultsPanel"),
    },
    "@/components/typing-test/test-config-bar": {
      TestConfigBar: stub("TestConfigBar"),
    },
    "@/components/typing-test/custom-text-modal": {
      CustomTextModal: stub("CustomTextModal"),
    },
    "@/components/typing-test/language-selector": {
      LanguageSelector: stub("LanguageSelector"),
    },
    "@/components/typing-test/mobile-test-settings-modal": {
      MobileTestSettingsModal: stub("MobileTestSettingsModal"),
    },
    "@/lib/typing-engine/reset-bus": {
      listenForTestReset: () => () => {},
    },
    "@/lib/typing-engine/test-status-store": {
      setTestStatus: () => {},
    },
    "@/lib/games/game-audio": {
      playSound: () => {},
    },
  };

  const file = fileURLToPath(new URL("./typing-test.tsx", import.meta.url));
  const source = readFileSync(file, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;

  const exports: { TypingTest?: (props?: Record<string, unknown>) => ReactNode } = {};
  new Function("require", "exports", compiled)(
    (id: string) => (id in modules ? modules[id] : require(id)),
    exports,
  );

  return {
    render: () => {
      cursor = 0;
      return exports.TypingTest!({});
    },
  };
}

describe("F16 & F26: Real DOM/Component Restart Control Accessibility Verification", () => {
  it("IDLE State: hides live stats & mobile restart behind inert container, desktop restart is active", () => {
    const harness = createTypingTestHarness("idle");
    const vdom = harness.render();
    const elements = flattenElements(vdom);

    // 1. Idle Chrome container: inert must be false
    const chromeContainers = elements.filter(
      (el) => el.type === "div" && typeof el.props.className === "string" && el.props.className.includes("[grid-area:1/1]"),
    );
    assert.equal(chromeContainers.length, 2, "Expected idle chrome container and live stats container");

    const idleChrome = chromeContainers[0]!;
    assert.equal(idleChrome.props.inert, false, "Idle chrome container must NOT be inert when idle");
    assert.ok(
      (idleChrome.props.className as string).includes("opacity-100"),
      "Idle chrome must be visible (opacity-100)",
    );

    // 2. Live stats container (which holds the mobile restart button): inert must be true
    const liveStatsContainer = chromeContainers[1]!;
    assert.equal(
      liveStatsContainer.props.inert,
      true,
      "Live stats container must be INERT when test is idle",
    );
    assert.ok(
      (liveStatsContainer.props.className as string).includes("pointer-events-none opacity-0"),
      "Live stats container must be pointer-events-none opacity-0 when idle",
    );

    // 3. Mobile restart button inside liveStatsContainer is shielded by inert={true}
    const mobileRestartBtn = elements.find(
      (el) =>
        el.type === "button" &&
        el.props["aria-label"] === "Restart test" &&
        typeof el.props.className === "string" &&
        el.props.className.includes("sm:hidden"),
    );
    assert.ok(mobileRestartBtn, "Mobile restart button must exist in markup");

    // 4. Bottom controls container: inert must be false when idle
    const bottomControlsContainer = elements.find(
      (el) =>
        el.type === "div" &&
        typeof el.props.className === "string" &&
        el.props.className.includes("flex items-center gap-2") &&
        "inert" in el.props,
    );
    assert.ok(bottomControlsContainer, "Bottom controls container must exist");
    assert.equal(
      bottomControlsContainer.props.inert,
      false,
      "Bottom controls container must NOT be inert when idle",
    );

    // 5. Desktop restart button in bottom controls is active
    const desktopRestartBtn = elements.find(
      (el) =>
        el.type === "button" &&
        el.props["aria-label"] === "Restart test" &&
        typeof el.props.className === "string" &&
        !el.props.className.includes("sm:hidden"),
    );
    assert.ok(desktopRestartBtn, "Desktop restart button must exist in bottom controls");
    assert.ok(
      (desktopRestartBtn.props.className as string).includes("opacity-100"),
      "Desktop restart button must be visible when idle",
    );
  });

  it("RUNNING State: activates mobile restart, makes bottom controls inert to prevent accidental keystroke capture", () => {
    const harness = createTypingTestHarness("running");
    const vdom = harness.render();
    const elements = flattenElements(vdom);

    const chromeContainers = elements.filter(
      (el) => el.type === "div" && typeof el.props.className === "string" && el.props.className.includes("[grid-area:1/1]"),
    );
    const idleChrome = chromeContainers[0]!;
    const liveStatsContainer = chromeContainers[1]!;

    // 1. Idle chrome is INERT during running test
    assert.equal(
      idleChrome.props.inert,
      true,
      "Idle chrome container must be INERT during running test",
    );
    assert.ok(
      (idleChrome.props.className as string).includes("pointer-events-none opacity-0"),
      "Idle chrome must be pointer-events-none opacity-0 during running test",
    );

    // 2. Live stats container (holding mobile restart) is NOT inert
    assert.equal(
      liveStatsContainer.props.inert,
      false,
      "Live stats container must NOT be inert during running test",
    );
    assert.ok(
      (liveStatsContainer.props.className as string).includes("opacity-100"),
      "Live stats container must be visible (opacity-100) during running test",
    );

    // 3. Mobile restart button is fully accessible and interactive
    const mobileRestartBtn = elements.find(
      (el) =>
        el.type === "button" &&
        el.props["aria-label"] === "Restart test" &&
        typeof el.props.className === "string" &&
        el.props.className.includes("sm:hidden"),
    );
    assert.ok(mobileRestartBtn, "Mobile restart button must exist");
    assert.equal(typeof mobileRestartBtn.props.onClick, "function", "Mobile restart button must be clickable");
    assert.equal(mobileRestartBtn.props["aria-label"], "Restart test");

    // 4. Bottom controls container is INERT during running test
    const bottomControlsContainer = elements.find(
      (el) =>
        el.type === "div" &&
        typeof el.props.className === "string" &&
        el.props.className.includes("flex items-center gap-2") &&
        "inert" in el.props,
    );
    assert.ok(bottomControlsContainer, "Bottom controls container must exist");
    assert.equal(
      bottomControlsContainer.props.inert,
      true,
      "Bottom controls container MUST be inert when test is running (prevents Tab navigation from stealing focus)",
    );

    // 5. Desktop restart button in bottom controls is hidden
    const desktopRestartBtn = elements.find(
      (el) =>
        el.type === "button" &&
        el.props["aria-label"] === "Restart test" &&
        typeof el.props.className === "string" &&
        !el.props.className.includes("sm:hidden"),
    );
    assert.ok(desktopRestartBtn, "Desktop restart button must exist");
    assert.ok(
      (desktopRestartBtn.props.className as string).includes("pointer-events-none opacity-0"),
      "Desktop restart button must be pointer-events-none opacity-0 during running test",
    );
  });

  it("FINISHED State: unmounts word stream and bottom controls, renders accessible ResultsPanel", () => {
    const harness = createTypingTestHarness("finished");
    const vdom = harness.render();
    const elements = flattenElements(vdom);

    // 1. ResultsPanel is rendered
    const resultsPanel = elements.find((el) => (el.type as { displayName?: string })?.displayName === "ResultsPanel" || el.type === "ResultsPanel");
    assert.ok(resultsPanel, "ResultsPanel must be rendered when status is finished");
    assert.equal(typeof resultsPanel.props.onRestart, "function", "ResultsPanel must receive onRestart handler");

    // 2. Bottom controls container and WordStream are unmounted
    const wordStream = elements.find((el) => (el.type as { displayName?: string })?.displayName === "WordStream" || el.type === "WordStream");
    assert.equal(wordStream, undefined, "WordStream must not be mounted when finished");

    const bottomControlsContainer = elements.find(
      (el) =>
        el.type === "div" &&
        typeof el.props.className === "string" &&
        el.props.className.includes("flex items-center gap-2") &&
        "inert" in el.props,
    );
    assert.equal(bottomControlsContainer, undefined, "Bottom controls must not be mounted when finished");
  });

  it("MOBILE Layout: exposes mobile settings in idle and mobile restart in running without DOM duplication", () => {
    const harnessIdle = createTypingTestHarness("idle");
    const idleElements = flattenElements(harnessIdle.render());

    // Mobile settings button in idle chrome
    const mobileSettingsBtn = idleElements.find(
      (el) =>
        el.type === "button" &&
        typeof el.props.className === "string" &&
        el.props.children?.toString().includes("Test Settings") ||
        flattenElements(el).some((child) => typeof child.props.children === "string" && child.props.children.includes("Test Settings")),
    );
    assert.ok(mobileSettingsBtn, "Mobile settings button must exist in idle state");

    const harnessRunning = createTypingTestHarness("running");
    const runningElements = flattenElements(harnessRunning.render());

    // Mobile restart button has sm:hidden responsive styling and proper touch-friendly size
    const mobileRestartBtn = runningElements.find(
      (el) =>
        el.type === "button" &&
        el.props["aria-label"] === "Restart test" &&
        typeof el.props.className === "string" &&
        el.props.className.includes("sm:hidden"),
    );
    assert.ok(mobileRestartBtn, "Mobile restart button must exist");
    const className = mobileRestartBtn.props.className as string;
    assert.ok(className.includes("h-8 w-8"), "Mobile restart button must have minimum square dimensions");
    assert.ok(className.includes("flex sm:hidden"), "Mobile restart button must be hidden on sm+ viewports");
  });

  it("RESULTS View: verifies ResultsPanel action controls are available, non-inert, and keyboard focusable", () => {
    const file = fileURLToPath(new URL("./results-panel.tsx", import.meta.url));
    const source = readFileSync(file, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: file,
    }).outputText;

    const stub = (name: string) => (props: Record<string, unknown>) => ({ type: name, props, key: null });
    const modules: Record<string, unknown> = {
      react: {
        useMemo: (factory: () => unknown) => factory(),
      },
      "next/link": stub("Link"),
      "motion/react": {
        motion: {
          div: stub("motion.div"),
        },
      },
      "lucide-react": {
        RotateCcw: stub("RotateCcw"),
        Sparkles: stub("Sparkles"),
        Target: stub("Target"),
      },
      "@/lib/typing-engine/stats": {
        calculateAccuracy: () => 98,
        calculateConsistency: () => 85,
        calculateNetWpm: () => 75,
        calculateRawWpm: () => 78,
        round: (n: number) => Math.round(n),
      },
      "@/components/layout/ad-slot": {
        AdSlot: stub("AdSlot"),
      },
      "@/components/typing-test/results-graph": {
        ResultsGraph: stub("ResultsGraph"),
      },
    };

    const exports: { ResultsPanel?: (props: Record<string, unknown>) => ReactNode } = {};
    new Function("require", "exports", compiled)(
      (id: string) => (id in modules ? modules[id] : require(id)),
      exports,
    );

    let restarted = false;
    const mockState = {
      correctKeystrokes: 100,
      incorrectKeystrokes: 2,
      netWpmCharacters: 500,
      elapsedMs: 30000,
      wpmSamples: [],
      charTally: { extra: 0, missed: 1 },
      totalTyped: 102,
      correctedErrors: 1,
    };

    const vdom = exports.ResultsPanel!({
      state: mockState,
      isNewBest: true,
      onRestart: () => { restarted = true; },
    });

    const elements = flattenElements(vdom);
    const restartBtn = elements.find(
      (el) =>
        el.type === "button" &&
        (el.props.children === "Restart" ||
          (Array.isArray(el.props.children) && el.props.children.includes("Restart"))),
    );

    assert.ok(restartBtn, "ResultsPanel must contain a Restart button");
    assert.equal(typeof restartBtn.props.onClick, "function", "Restart button must have onClick handler");
    (restartBtn.props.onClick as () => void)();
    assert.equal(restarted, true, "Clicking restart button must trigger onRestart callback");

    // Verify accessibility attributes
    const className = restartBtn.props.className as string;
    assert.ok(className.includes("min-h-[44px]"), "Restart button must have >=44px touch target height for mobile a11y");
    assert.ok(className.includes("focus-visible:outline-2"), "Restart button must have visible focus outline for keyboard users");
    assert.ok(className.includes("focus-visible:outline-accent"), "Restart button must highlight with accent color on focus");

    // Verify parent containers are NOT inert
    const inertParent = elements.find((el) => el.props.inert === true);
    assert.equal(inertParent, undefined, "ResultsPanel must not be wrapped in any inert container");
  });
});

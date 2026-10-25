import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { type ReactNode } from "react";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
type Component = (props: Record<string, unknown>) => ReactNode;

interface ElementNode {
  type: unknown;
  props: Record<string, unknown>;
}

function flattenElements(node: unknown): ElementNode[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(flattenElements);
  if (typeof node !== "object") return [];

  const elem = node as { type?: unknown; props?: Record<string, unknown> };
  const result: ElementNode[] = [];

  if (elem.props) {
    result.push({ type: elem.type, props: elem.props });
    if (typeof elem.type === "function") {
      try {
        const rendered = (elem.type as Component)(elem.props);
        result.push(...flattenElements(rendered));
      } catch {
        // leaf or mock
      }
    }
    if (elem.props.children) {
      result.push(...flattenElements(elem.props.children));
    }
  }

  return result;
}

function loadSiteHeader(pathname = "/games") {
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
    react: {
      useCallback: (cb: unknown) => cb,
      useRef: (init: unknown) => ({ current: init }),
      useState: (init: unknown) => [init, () => {}],
      useEffect: () => {},
    },
    "next/navigation": {
      usePathname: () => pathname,
    },
    "next/link": stub("Link"),
    "next/image": stub("Image"),
    "lucide-react": {
      Gamepad2: stub("Gamepad2"),
      GraduationCap: stub("GraduationCap"),
      Menu: stub("Menu"),
      User: stub("User"),
    },
    "@/components/theme/theme-switcher": {
      ThemeSwitcher: stub("ThemeSwitcher"),
    },
    "@/components/layout/more-menu": {
      MoreMenu: stub("MoreMenu"),
    },
    "@/components/layout/mobile-nav": {
      MobileNav: stub("MobileNav"),
    },
    "@/lib/typing-engine/reset-bus": {
      emitTestReset: () => {},
    },
    "@/components/layout/level-badge": {
      LevelBadge: stub("LevelBadge"),
    },
    "@/components/auth/user-account-menu": {
      UserAccountMenu: stub("UserAccountMenu"),
    },
    "@/lib/i18n/dictionaries": {
      getDictionary: () => ({
        nav: { lessons: "Lessons", games: "Games" },
        header: { searchGames: "Search games..." },
      }),
    },
    "@/lib/utils/cn": {
      cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
    },
  };

  const source = readFileSync(
    fileURLToPath(new URL("./site-header.tsx", import.meta.url)),
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

  return {
    render: (locale = "en") => exports.SiteHeader({ locale }),
  };
}

describe("SiteHeader — Clean Global Navigation without Route-Specific Game Search", () => {
  const routes = ["/games", "/", "/lessons", "/lessons/home-row-left", "/vocabulary", "/guides", "/de/games", "/es/games"];

  for (const route of routes) {
    it(`does not render a "Search games..." input on route "${route}"`, () => {
      const { render } = loadSiteHeader(route);
      const tree = render();
      const elements = flattenElements(tree);

      const searchInputs = elements.filter(
        (el) =>
          el.type === "input" &&
          (el.props.type === "search" ||
            String(el.props.placeholder).toLowerCase().includes("search") ||
            String(el.props["aria-label"]).toLowerCase().includes("search")),
      );

      assert.equal(
        searchInputs.length,
        0,
        `Global header must not render any search input on ${route}`,
      );
    });
  }

  it("preserves all required global navigation items in the header", () => {
    const { render } = loadSiteHeader("/games");
    const tree = render();
    const elements = flattenElements(tree);

    // Lessons and Games navigation links
    const links = elements.filter(
      (el) =>
        el.type === "Link" ||
        (typeof el.type === "function" &&
          (el.type as { displayName?: string })?.displayName === "Link") ||
        (el.props && typeof (el.props as Record<string, unknown>).href === "string"),
    );
    const hrefs = links.map((l) => (l.props as Record<string, unknown>).href);
    assert.ok(hrefs.includes("/lessons"), "Header must include /lessons link");
    assert.ok(hrefs.includes("/games"), "Header must include /games link");
    assert.ok(hrefs.includes("/profile"), "Header must include /profile link");

    // Utilities and menus
    const typeNames = elements.map((el) => {
      if (typeof el.type === "string") return el.type;
      if (typeof el.type === "function") return (el.type as { displayName?: string })?.displayName;
      return null;
    });
    assert.ok(typeNames.includes("ThemeSwitcher"), "Header must include ThemeSwitcher");
    assert.ok(typeNames.includes("MoreMenu"), "Header must include MoreMenu");
    assert.ok(typeNames.includes("LevelBadge"), "Header must include LevelBadge");
    assert.ok(typeNames.includes("UserAccountMenu"), "Header must include UserAccountMenu");
  });
});

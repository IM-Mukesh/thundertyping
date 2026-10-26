import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { LESSON_SLUG_MAP } from "@/lib/lessons/lesson-types";

describe("Request Proxy & Locale Casing", () => {
  it("permanently redirects lowercase /pt-br to canonical /pt-BR (308)", async () => {
    const req = new NextRequest("https://www.herotyping.com/pt-br");
    const res = await proxy(req);
    assert.equal(res.status, 308);
    assert.equal(res.headers.get("location"), "https://www.herotyping.com/pt-BR");
  });

  it("permanently redirects /pt-br/ (trailing slash) directly to /pt-BR (308)", async () => {
    const req = new NextRequest("https://www.herotyping.com/pt-br/");
    const res = await proxy(req);
    assert.equal(res.status, 308);
    assert.equal(res.headers.get("location"), "https://www.herotyping.com/pt-BR");
  });

  it("permanently redirects /pt-br/games/type-before-death to canonical /pt-BR/games/type-before-death (308)", async () => {
    const req = new NextRequest("https://www.herotyping.com/pt-br/games/type-before-death");
    const res = await proxy(req);
    assert.equal(res.status, 308);
    assert.equal(res.headers.get("location"), "https://www.herotyping.com/pt-BR/games/type-before-death");
  });

  it("permanently redirects lowercase /pt-br/typing-test/1-minute with query string directly to /typing-test/1-minute?duration=60 (one-hop 308)", async () => {
    const req = new NextRequest("https://www.herotyping.com/pt-br/typing-test/1-minute?duration=60");
    const res = await proxy(req);
    assert.equal(res.status, 308);
    assert.equal(res.headers.get("location"), "https://www.herotyping.com/typing-test/1-minute?duration=60");
  });

  it("permanently redirects /pt-BR/typing-test/1-minute with query string directly to canonical /typing-test/1-minute?duration=60 (one-hop 308)", async () => {
    const req = new NextRequest("https://www.herotyping.com/pt-BR/typing-test/1-minute?duration=60");
    const res = await proxy(req);
    assert.equal(res.status, 308);
    assert.equal(res.headers.get("location"), "https://www.herotyping.com/typing-test/1-minute?duration=60");
  });

  it("permanently redirects unsupported locale subpaths (/es/practice/accuracy, /de/lessons/home-row-left) to unprefixed canonical (308)", async () => {
    const esReq = new NextRequest("https://www.herotyping.com/es/practice/accuracy");
    const esRes = await proxy(esReq);
    assert.equal(esRes.status, 308);
    assert.equal(esRes.headers.get("location"), "https://www.herotyping.com/practice/accuracy");

    const deReq = new NextRequest("https://www.herotyping.com/de/lessons/home-row-left");
    const deRes = await proxy(deReq);
    assert.equal(deRes.status, 308);
    assert.equal(deRes.headers.get("location"), "https://www.herotyping.com/lessons/home-row-f-j");
  });

  it("normalizes trailing slash on localized homepages directly to canonical (/es/ -> /es) (308)", async () => {
    const req = new NextRequest("https://www.herotyping.com/es/");
    const res = await proxy(req);
    assert.equal(res.status, 308);
    assert.equal(res.headers.get("location"), "https://www.herotyping.com/es");
  });

  it("permanently redirects /en prefix to unprefixed English canonical URL (308)", async () => {
    const req = new NextRequest("https://www.herotyping.com/en/typing-test/1-minute");
    const res = await proxy(req);
    assert.equal(res.status, 308);
    assert.equal(res.headers.get("location"), "https://www.herotyping.com/typing-test/1-minute");
  });

  it("rewrites clean unprefixed English URL to internal /en route without redirecting", async () => {
    const req = new NextRequest("https://www.herotyping.com/typing-test/1-minute");
    const res = await proxy(req);
    // Rewritten request has status 200 and sets x-middleware-rewrite header pointing to /en/...
    assert.notEqual(res.status, 308);
    const rewriteHeader = res.headers.get("x-middleware-rewrite");
    if (rewriteHeader) {
      assert.ok(rewriteHeader.includes("/en/typing-test/1-minute"), "must rewrite to internal /en route");
    }
  });

  it("strictly preserves query parameters (?language=hi, ?duration=60) during internal /en rewrite", async () => {
    // 1. Root URL with ?language=hi
    const rootReq = new NextRequest("https://www.herotyping.com/?language=hi");
    const rootRes = await proxy(rootReq);
    assert.notEqual(rootRes.status, 308);
    const rootRewrite = rootRes.headers.get("x-middleware-rewrite");
    if (rootRewrite) {
      assert.ok(rootRewrite.includes("/en?language=hi"), `Expected /en?language=hi in rewrite, got: ${rootRewrite}`);
    }

    // 2. Subpath URL with multiple search parameters
    const drillReq = new NextRequest("https://www.herotyping.com/typing-test/1-minute?duration=60&theme=matrix");
    const drillRes = await proxy(drillReq);
    assert.notEqual(drillRes.status, 308);
    const drillRewrite = drillRes.headers.get("x-middleware-rewrite");
    if (drillRewrite) {
      assert.ok(drillRewrite.includes("/en/typing-test/1-minute?duration=60&theme=matrix"), `Expected params preserved, got: ${drillRewrite}`);
    }
  });

  it("passes through valid genuinely localized homepages (/pt-BR, /es, /de) without redirecting", async () => {
    for (const locale of ["pt-BR", "es", "de"]) {
      const req = new NextRequest(`https://www.herotyping.com/${locale}`);
      const res = await proxy(req);
      assert.notEqual(res.status, 308, `/${locale} should not redirect`);
    }
  });

  it("passes through valid genuinely localized game routes (/pt-BR, /es, /de /games/type-before-death) without redirecting", async () => {
    for (const locale of ["pt-BR", "es", "de"]) {
      const req = new NextRequest(`https://www.herotyping.com/${locale}/games/type-before-death`);
      const res = await proxy(req);
      assert.notEqual(res.status, 308, `/${locale}/games/type-before-death should not redirect`);
    }
  });

  it("permanently redirects retired /games/typing-grand-prix directly to /games/ghost-racer (308)", async () => {
    const urls = [
      "https://www.herotyping.com/games/typing-grand-prix",
      "https://www.herotyping.com/games/typing-grand-prix/",
      "https://www.herotyping.com/es/games/typing-grand-prix",
      "https://www.herotyping.com/pt-BR/games/typing-grand-prix",
    ];
    for (const url of urls) {
      const req = new NextRequest(url);
      const res = await proxy(req);
      assert.equal(res.status, 308, `${url} must return 308 redirect`);
      assert.equal(res.headers.get("location"), "https://www.herotyping.com/games/ghost-racer");
    }
  });

  it("permanently redirects retired /games/typing-survivor directly to /games (308)", async () => {
    const req = new NextRequest("https://www.herotyping.com/games/typing-survivor");
    const res = await proxy(req);
    assert.equal(res.status, 308);
    assert.equal(res.headers.get("location"), "https://www.herotyping.com/games");
  });

  it("permanently redirects all 28 old lesson IDs to their new descriptive slugs in a single hop (308)", async () => {
    for (const [oldId, newSlug] of Object.entries(LESSON_SLUG_MAP)) {
      // 1. Direct old path
      const req = new NextRequest(`https://www.herotyping.com/lessons/${oldId}`);
      const res = await proxy(req);
      assert.equal(res.status, 308, `/lessons/${oldId} must return 308`);
      assert.equal(
        res.headers.get("location"),
        `https://www.herotyping.com/lessons/${newSlug}`,
        `/lessons/${oldId} must redirect to /lessons/${newSlug}`
      );

      // 2. Trailing slash on old path
      const slashReq = new NextRequest(`https://www.herotyping.com/lessons/${oldId}/`);
      const slashRes = await proxy(slashReq);
      assert.equal(slashRes.status, 308);
      assert.equal(
        slashRes.headers.get("location"),
        `https://www.herotyping.com/lessons/${newSlug}`
      );

      // 3. Query string preserved
      const queryReq = new NextRequest(`https://www.herotyping.com/lessons/${oldId}?step=2`);
      const queryRes = await proxy(queryReq);
      assert.equal(queryRes.status, 308);
      assert.equal(
        queryRes.headers.get("location"),
        `https://www.herotyping.com/lessons/${newSlug}?step=2`
      );
    }
  });

  it("permanently redirects 3 consolidated guides directly to target guides in a single hop (308)", async () => {
    const guideRedirects = [
      ["/guides/beat-your-personal-best-typing-speed", "/guides/how-to-improve-typing-speed"],
      ["/guides/fix-burst-and-stall-typing-pace-caret", "/guides/how-to-improve-typing-consistency"],
      ["/guides/typing-test-vs-typing-race", "/guides/typing-games-vs-typing-tests"],
    ];

    for (const [src, target] of guideRedirects) {
      const req = new NextRequest(`https://www.herotyping.com${src}`);
      const res = await proxy(req);
      assert.equal(res.status, 308, `${src} must return 308`);
      assert.equal(res.headers.get("location"), `https://www.herotyping.com${target}`);
    }
  });

  it("bypasses session refresh on static assets and images directly", async () => {
    const staticPaths = [
      "/favicon.ico",
      "/_next/static/chunks/app.js",
      "/images/brand/logo.png",
      "/robots.txt",
      "/sitemap.xml",
    ];

    for (const path of staticPaths) {
      const req = new NextRequest(`https://www.herotyping.com${path}`);
      const res = await proxy(req);
      assert.notEqual(res.status, 308);
      // Status 200 next response without redirection
      assert.equal(res.status, 200);
    }
  });
});

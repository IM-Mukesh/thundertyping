import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

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
    assert.equal(deRes.headers.get("location"), "https://www.herotyping.com/lessons/home-row-left");
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
});

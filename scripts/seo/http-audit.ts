import http from "node:http";

function fetchText(url: string, headers: Record<string, string> = {}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 0, headers: res.headers, body }));
    });
    req.on("error", reject);
  });
}

async function runHttpAudit() {
  console.log("=== STARTING HTTP AUDIT ON PORT 3012 ===");

  // 1. Robots.txt
  const robotsRes = await fetchText("http://localhost:3012/robots.txt");
  console.log("Robots.txt status:", robotsRes.status);
  console.log("Robots.txt content preview:\n" + robotsRes.body.trim());

  // 2. Sitemap.xml XML Parsing
  const sitemapRes = await fetchText("http://localhost:3012/sitemap.xml");
  console.log("\nSitemap.xml status:", sitemapRes.status);
  const xml = sitemapRes.body;

  // Count <url> tags
  const urlMatches = xml.match(/<url>/g) || [];
  console.log("Total <url> elements in XML:", urlMatches.length);

  // Extract all <loc> values
  const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log("Total <loc> values in XML:", locMatches.length);
  const uniqueLocs = new Set(locMatches);
  console.log("Distinct <loc> values:", uniqueLocs.size);
  console.log("Duplicate <loc> count:", locMatches.length - uniqueLocs.size);

  // Check hreflang links
  const xhtmlMatches = [...xml.matchAll(/<xhtml:link[^>]+>/g)].map((m) => m[0]);
  console.log("Total <xhtml:link> elements:", xhtmlMatches.length);

  // 3. Portuguese redirects
  console.log("\n=== PORTUGUESE REDIRECT CHECKS ===");
  const testPaths = [
    "/pt-br",
    "/pt-br/",
    "/pt-br/games/type-before-death",
    "/pt-br/typing-test/1-minute?duration=60",
    "/pt-BR",
    "/pt-BR/games/type-before-death"
  ];

  for (const p of testPaths) {
    const res = await fetchText(`http://localhost:3012${p}`);
    console.log(`GET ${p} -> Status ${res.status}, Location: ${res.headers.location || "none"}`);
  }

  // 4. English canonical and lesson check (/lessons/home-row-left vs /lessons/home-row-1)
  console.log("\n=== ROUTE STATUS & CANONICAL AUDIT ===");
  const routesToTest = [
    "/",
    "/es",
    "/pt-BR",
    "/de",
    "/games/type-before-death",
    "/es/games/type-before-death",
    "/typing-test/1-minute",
    "/lessons/home-row-left",
    "/lessons/home-row-1",
    "/vocabulary/easy",
    "/vocabulary/medium",
    "/vocabulary/hard",
    "/vocabulary/beginner"
  ];

  for (const r of routesToTest) {
    const res = await fetchText(`http://localhost:3012${r}`);
    const canonicalMatch = res.body.match(/<link rel="canonical" href="([^"]+)"/);
    console.log(`Route ${r}: Status ${res.status}, Canonical: ${canonicalMatch ? canonicalMatch[1] : "not found"}`);
  }

  console.log("\n=== HTTP AUDIT COMPLETE ===");
}

runHttpAudit().catch(console.error);

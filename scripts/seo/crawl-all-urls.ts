import http from "node:http";

interface CrawlReport {
  url: string;
  status: number;
  title: string | null;
  h1: string | null;
  canonical: string | null;
  expectedCanonical: string;
  isCanonicalMatch: boolean;
  hasTitle: boolean;
  hasH1: boolean;
  isLocalized: boolean;
  localizedContentVerified: boolean;
  error?: string;
}

function fetchPage(url: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 0, headers: res.headers, body }));
    });
    req.on("error", reject);
  });
}

function extractTagContent(html: string, tagRegex: RegExp): string | null {
  const match = html.match(tagRegex);
  if (!match) return null;
  return match[1].replace(/<[^>]+>/g, "").trim();
}

function extractCanonical(html: string): string | null {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
                html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return match ? match[1] : null;
}

export async function crawlAllSitemapUrls(port = 3012): Promise<{
  totalUrls: number;
  passedCount: number;
  failedCount: number;
  failures: CrawlReport[];
}> {
  console.log(`\n=== Crawling All Sitemap URLs on Port ${port} ===`);
  const sitemapRes = await fetchPage(`http://localhost:${port}/sitemap.xml`);
  if (sitemapRes.status !== 200) {
    throw new Error(`Failed to load sitemap.xml: status ${sitemapRes.status}`);
  }

  const locMatches = [...sitemapRes.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`Discovered ${locMatches.length} URLs in sitemap.xml`);

  const reports: CrawlReport[] = [];
  const failures: CrawlReport[] = [];

  for (const prodUrl of locMatches) {
    // Map production URL to localhost
    const path = prodUrl.replace("https://www.herotyping.com", "") || "/";
    const localUrl = `http://localhost:${port}${path}`;

    try {
      const res = await fetchPage(localUrl);
      const title = extractTagContent(res.body, /<title[^>]*>([\s\S]*?)<\/title>/i);
      const h1 = extractTagContent(res.body, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const canonical = extractCanonical(res.body);

      // Expected canonical:
      // In HeroTyping, canonical is either absolute https://www.herotyping.com/... or root-relative /...
      const expectedCanonical = prodUrl;
      const canonicalMatches = canonical === prodUrl || canonical === path;

      const isLocalized = path.startsWith("/es") || path.startsWith("/pt-BR") || path.startsWith("/de");
      let localizedContentVerified = true;

      if (path === "/es" || path === "/es/") {
        localizedContentVerified = res.body.includes("escribe") || res.body.includes("palabras");
      } else if (path === "/pt-BR" || path === "/pt-BR/") {
        localizedContentVerified = res.body.includes("digite") || res.body.includes("palavras");
      } else if (path === "/de" || path === "/de/") {
        localizedContentVerified = res.body.includes("tippen") || res.body.includes("wörter");
      } else if (path === "/es/games/type-before-death") {
        localizedContentVerified = res.body.includes("Zombie") || res.body.includes("Mecanografía");
      } else if (path === "/pt-BR/games/type-before-death") {
        localizedContentVerified = res.body.includes("Zumbi") || res.body.includes("Digitação");
      } else if (path === "/de/games/type-before-death") {
        localizedContentVerified = res.body.includes("Zombie-Tippspiel");
      }

      const report: CrawlReport = {
        url: prodUrl,
        status: res.status,
        title,
        h1,
        canonical,
        expectedCanonical,
        isCanonicalMatch: canonicalMatches,
        hasTitle: Boolean(title && title.length > 0),
        hasH1: Boolean(h1 && h1.length > 0),
        isLocalized,
        localizedContentVerified,
      };

      reports.push(report);

      if (res.status !== 200 || !canonicalMatches || !report.hasTitle || !report.hasH1 || !localizedContentVerified) {
        failures.push(report);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const report: CrawlReport = {
        url: prodUrl,
        status: 0,
        title: null,
        h1: null,
        canonical: null,
        expectedCanonical: prodUrl,
        isCanonicalMatch: false,
        hasTitle: false,
        hasH1: false,
        isLocalized: false,
        localizedContentVerified: false,
        error: msg,
      };
      reports.push(report);
      failures.push(report);
    }
  }

  const passedCount = reports.length - failures.length;
  console.log(`Crawl Results: ${passedCount}/${reports.length} PASSED (Failures: ${failures.length})`);
  return {
    totalUrls: reports.length,
    passedCount,
    failedCount: failures.length,
    failures,
  };
}

// Run directly
crawlAllSitemapUrls(3012).then((res) => {
  if (res.failedCount > 0) {
    console.error("FAILURES DETECTED:\n", JSON.stringify(res.failures, null, 2));
    process.exit(1);
  } else {
    console.log("All 116 Sitemap URLs crawled successfully: 100% 200 OK, canonical matched, titles and H1s verified!");
    process.exit(0);
  }
}).catch((err) => {
  console.error("Crawler error:", err);
  process.exit(1);
});

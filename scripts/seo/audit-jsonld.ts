import http from "node:http";

interface SchemaAudit {
  url: string;
  schemasFound: string[];
  canonical: string | null;
  passed: boolean;
  details: unknown[];
  errors: string[];
}

function fetchPage(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 0, body }));
    });
    req.on("error", reject);
  });
}

function extractJsonLd(html: string): unknown[] {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const objects: unknown[] = [];
  for (const s of scripts) {
    try {
      const parsed = JSON.parse(s[1]);
      objects.push(parsed);
    } catch {
      // Ignore parse errors here; captured by audit
    }
  }
  return objects;
}

function extractCanonical(html: string): string | null {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
                html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return match ? match[1] : null;
}

export async function auditTemplatesJsonLd(port = 3012): Promise<SchemaAudit[]> {
  const targetPages = [
    {
      path: "/",
      expectedTypes: ["WebSite", "Organization", "WebApplication"],
      expectedCanonical: "https://www.herotyping.com",
    },
    {
      path: "/es",
      expectedTypes: ["WebSite", "Organization", "WebApplication"],
      expectedCanonical: "https://www.herotyping.com/es",
    },
    {
      path: "/lessons/home-row-left",
      expectedTypes: ["LearningResource"],
      expectedCanonical: "https://www.herotyping.com/lessons/home-row-left",
    },
    {
      path: "/vocabulary/easy",
      expectedTypes: ["BreadcrumbList"],
      expectedCanonical: "https://www.herotyping.com/vocabulary/easy",
    },
    {
      path: "/games/type-before-death",
      expectedTypes: ["VideoGame", "FAQPage", "BreadcrumbList"],
      expectedCanonical: "https://www.herotyping.com/games/type-before-death",
    },
    {
      path: "/pt-BR/games/type-before-death",
      expectedTypes: ["VideoGame", "FAQPage", "BreadcrumbList"],
      expectedCanonical: "https://www.herotyping.com/pt-BR/games/type-before-death",
    },
    {
      path: "/guides/how-to-improve-typing-speed",
      expectedTypes: ["Article", "BreadcrumbList"],
      expectedCanonical: "https://www.herotyping.com/guides/how-to-improve-typing-speed",
    },
  ];

  const results: SchemaAudit[] = [];

  for (const target of targetPages) {
    const res = await fetchPage(`http://localhost:${port}${target.path}`);
    const canonical = extractCanonical(res.body);
    const jsonLdObjects = extractJsonLd(res.body);
    const typesFound = jsonLdObjects.flatMap((obj) => {
      if (typeof obj === "object" && obj !== null && "@type" in obj) {
        return [(obj as Record<string, unknown>)["@type"] as string];
      }
      return [];
    });

    const errors: string[] = [];
    if (res.status !== 200) {
      errors.push(`Status is ${res.status}, expected 200`);
    }
    if (canonical !== target.expectedCanonical && canonical !== target.path) {
      errors.push(`Canonical is ${canonical}, expected ${target.expectedCanonical}`);
    }
    for (const expType of target.expectedTypes) {
      if (!typesFound.includes(expType)) {
        errors.push(`Missing expected schema @type: ${expType}`);
      }
    }

    results.push({
      url: target.path,
      schemasFound: typesFound,
      canonical,
      passed: errors.length === 0,
      details: jsonLdObjects,
      errors,
    });
  }

  return results;
}

// Run directly
auditTemplatesJsonLd(3012).then((results) => {
  console.log("=== JSON-LD & CANONICAL TEMPLATE AUDIT RESULTS ===");
  let allPassed = true;
  for (const r of results) {
    console.log(`\nPage: ${r.url} | Status: ${r.passed ? "PASS" : "FAIL"} | Canonical: ${r.canonical}`);
    console.log(`  Schemas found: [${r.schemasFound.join(", ")}]`);
    if (!r.passed) {
      allPassed = false;
      console.error(`  Errors: ${r.errors.join("; ")}`);
    }
  }
  if (!allPassed) {
    process.exit(1);
  } else {
    console.log("\nALL TEMPLATES PASSED JSON-LD AND CANONICAL CHECKS!");
    process.exit(0);
  }
}).catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});

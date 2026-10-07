/**
 * HeroTyping - Real HTTP API Verification Script
 * Validates real HTTP responses against the running Next.js production server.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

async function run() {
  console.log("================================================================================");
  console.log("HEROTYPING F22C: REAL HTTP API INTEGRATION VERIFICATION");
  console.log(`Target: ${BASE_URL}`);
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  async function check(name, testFn) {
    process.stdout.write(`• Checking: ${name}... `);
    try {
      await testFn();
      console.log("PASS ✓");
      passed++;
    } catch (err) {
      console.log(`FAIL ✗\n  Error: ${err.message}`);
      failed++;
    }
  }

  // 1. POST /api/typing-results (Unauthenticated -> 401)
  await check("POST /api/typing-results unauthenticated returns 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${BASE_URL}/api/typing-results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "sec-fetch-site": "same-origin"
      },
      body: JSON.stringify({ wpm: 60, accuracy: 98, duration: 60 })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const json = await res.json();
    if (json.success !== false || json.error?.code !== "UNAUTHORIZED") {
      throw new Error(`Unexpected body: ${JSON.stringify(json)}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Unexpected Content-Type: ${contentType}`);
    }
  });

  // 2. GET /api/typing-results (Unauthenticated -> 401)
  await check("GET /api/typing-results unauthenticated returns 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${BASE_URL}/api/typing-results`, {
      headers: {
        "sec-fetch-site": "same-origin"
      }
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const json = await res.json();
    if (json.success !== false || json.error?.code !== "UNAUTHORIZED") {
      throw new Error(`Unexpected body: ${JSON.stringify(json)}`);
    }
  });

  // 3. POST /api/lessons/progress (Untrusted Origin -> 403 FORBIDDEN)
  await check("POST /api/lessons/progress untrusted origin returns 403 FORBIDDEN", async () => {
    const res = await fetch(`${BASE_URL}/api/lessons/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://malicious-site.example.com"
      },
      body: JSON.stringify({ lessonId: "home-row-left", status: "completed" })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    const json = await res.json();
    if (json.error?.code !== "FORBIDDEN" && json.error !== "Invalid request origin") {
      throw new Error(`Unexpected response: ${JSON.stringify(json)}`);
    }
  });

  // 4. POST /api/games/scores (Untrusted Origin -> 403 FORBIDDEN)
  await check("POST /api/games/scores untrusted origin returns 403 FORBIDDEN", async () => {
    const res = await fetch(`${BASE_URL}/api/games/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://malicious-site.example.com"
      },
      body: JSON.stringify({ game: "type-before-death", score: 1000 })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    const json = await res.json();
    if (json.error?.code !== "FORBIDDEN" && json.error !== "Invalid request origin") {
      throw new Error(`Unexpected response: ${JSON.stringify(json)}`);
    }
  });

  // 5. POST /api/auth/otp (Invalid Email format -> 400 INVALID_EMAIL)
  await check("POST /api/auth/otp rejects invalid email with 400 INVALID_EMAIL", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "sec-fetch-site": "same-origin"
      },
      body: JSON.stringify({ email: "invalid-not-an-email" })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const json = await res.json();
    if (json.success !== false || json.error?.code !== "INVALID_EMAIL") {
      throw new Error(`Unexpected body: ${JSON.stringify(json)}`);
    }
  });

  // 6. POST /api/auth/otp (Malformed JSON -> 400 INVALID_INPUT)
  await check("POST /api/auth/otp rejects malformed JSON with 400 INVALID_INPUT", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "sec-fetch-site": "same-origin"
      },
      body: "{ not valid json"
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const json = await res.json();
    if (json.success !== false || json.error?.code !== "INVALID_INPUT") {
      throw new Error(`Unexpected body: ${JSON.stringify(json)}`);
    }
  });

  // 7. GET /api/games/scores (Unauthenticated -> 401 UNAUTHORIZED)
  await check("GET /api/games/scores unauthenticated returns 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${BASE_URL}/api/games/scores`, {
      headers: {
        "sec-fetch-site": "same-origin"
      }
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const json = await res.json();
    if (json.success !== false || json.error?.code !== "UNAUTHORIZED") {
      throw new Error(`Unexpected body: ${JSON.stringify(json)}`);
    }
  });

  // 8. GET /api/lessons/progress (Unauthenticated -> 401 UNAUTHORIZED)
  await check("GET /api/lessons/progress unauthenticated returns 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${BASE_URL}/api/lessons/progress`, {
      headers: {
        "sec-fetch-site": "same-origin"
      }
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const json = await res.json();
    if (json.success !== false || json.error?.code !== "UNAUTHORIZED") {
      throw new Error(`Unexpected body: ${JSON.stringify(json)}`);
    }
  });

  // 9. Content-Type and Security Headers on API routes
  await check("API routes return application/json and secure no-sniff headers", async () => {
    const res = await fetch(`${BASE_URL}/api/typing-results`, {
      headers: { "sec-fetch-site": "same-origin" }
    });
    const ctype = res.headers.get("content-type");
    if (!ctype || !ctype.includes("application/json")) {
      throw new Error(`Missing application/json content-type header: ${ctype}`);
    }
    const nosniff = res.headers.get("x-content-type-options");
    if (nosniff !== "nosniff") {
      throw new Error(`Missing x-content-type-options nosniff header`);
    }
  });

  console.log("\n================================================================================");
  console.log("REAL HTTP API AUDIT SUMMARY");
  console.log(`Passed: ${passed} / ${passed + failed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Status: ${failed === 0 ? "REAL HTTP API VERIFIED ✓" : "FAIL ✗"}`);
  console.log("================================================================================");

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

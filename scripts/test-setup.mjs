// Maps the project's "@/*" import alias for Node's test runner, which does not
// read tsconfig paths, and appends the .ts extension Node requires but
// TypeScript omits. Keeps test imports byte-identical to application imports,
// so a test can never accidentally exercise a different module than the app.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Unit tests never load private environment files or contact a real service.
// Individual tests may replace fetch with their own in-memory fixtures.
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.invalid";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_placeholder";
process.env.SUPABASE_SECRET_KEY = "sb_secret_test_placeholder";
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
globalThis.fetch = async () => { throw new Error("Network is disabled in unit tests; provide an explicit fixture."); };

// A tiny browser-storage shim keeps local-only persistence tests deterministic
// under Node's test runner without changing production SSR behavior.
if (!globalThis.window) {
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
      clear: () => values.clear(),
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
}

const root = pathToFileURL(`${process.cwd()}/src/`).href;

const hook = `
export async function resolve(specifier, context, next) {
  if (specifier === "next/server") {
    return next("next/server.js", context);
  }
  if (specifier === "server-only") {
    return { url: "data:text/javascript,export {};", format: "module", shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    let url = ${JSON.stringify(root)} + specifier.slice(2);
    if (!/\\.[a-z]+$/.test(url)) url += ".ts";
    return next(url, context);
  }
  return next(specifier, context);
}`;

register(`data:text/javascript,${encodeURIComponent(hook)}`, import.meta.url);

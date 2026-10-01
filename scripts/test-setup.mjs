// Maps the project's "@/*" import alias for Node's test runner, which does not
// read tsconfig paths, and appends the .ts extension Node requires but
// TypeScript omits. Keeps test imports byte-identical to application imports,
// so a test can never accidentally exercise a different module than the app.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

try {
  process.loadEnvFile?.(".env.local");
} catch {
  try {
    process.loadEnvFile?.(".env");
  } catch {
    // env file optional in test environments
  }
}

// In unit test runner, ensure environment variables exist if not loaded from file
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://humzucvcxyapcxkrmutj.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4jYCbNHvfcUYhstD6_QZyA_iwV3hD-X";
}
if (!process.env.SUPABASE_SECRET_KEY) {
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test_placeholder_key";
}

const root = pathToFileURL(`${process.cwd()}/src/`).href;

const hook = `
export async function resolve(specifier, context, next) {
  if (specifier === "next/server") {
    return next("next/server.js", context);
  }
  if (specifier.startsWith("@/")) {
    let url = ${JSON.stringify(root)} + specifier.slice(2);
    if (!/\\.[a-z]+$/.test(url)) url += ".ts";
    return next(url, context);
  }
  return next(specifier, context);
}`;

register(`data:text/javascript,${encodeURIComponent(hook)}`, import.meta.url);

// Maps the project's "@/*" import alias for Node's test runner, which does not
// read tsconfig paths, and appends the .ts extension Node requires but
// TypeScript omits. Keeps test imports byte-identical to application imports,
// so a test can never accidentally exercise a different module than the app.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const root = pathToFileURL(`${process.cwd()}/src/`).href;

const hook = `
export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    let url = ${JSON.stringify(root)} + specifier.slice(2);
    if (!/\\.[a-z]+$/.test(url)) url += ".ts";
    return next(url, context);
  }
  return next(specifier, context);
}`;

register(`data:text/javascript,${encodeURIComponent(hook)}`, import.meta.url);

/** Global arcade shortcuts must not steal activation from ordinary controls. */
export function isGameRestartShortcut(event: Pick<KeyboardEvent, "key" | "repeat" | "ctrlKey" | "metaKey" | "altKey" | "target">): boolean {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return false;
  if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return false;
  return !(typeof Element !== "undefined" && event.target instanceof Element &&
    event.target.closest("button, a, input, select, textarea, [contenteditable=true], [role=tab]"));
}

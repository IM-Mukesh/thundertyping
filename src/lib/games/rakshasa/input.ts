/** Physical-key combat only: do not intercept browser/IME/native UI activation. */
export function warInputKey(event: Pick<KeyboardEvent, "key" | "repeat" | "ctrlKey" | "altKey" | "metaKey" | "isComposing">): string | null {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return null;
  if (event.key === "Backspace" || event.key === "Escape" || event.key === "Tab") return event.key;
  return /^[a-zA-Z .,!?'123]$/.test(event.key) ? event.key.toLowerCase() : null;
}

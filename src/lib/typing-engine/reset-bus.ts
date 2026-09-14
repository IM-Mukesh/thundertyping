// A transient (non-persisted) signal for "restart the current test," fired
// from places outside the typing-test subtree (currently: the header logo).
// Deliberately not zustand state — nothing needs to read the current value,
// only react to the event firing, so a plain DOM CustomEvent avoids adding a
// store for what's really just a notification.
const RESET_EVENT = "thundertyping:reset";

export function emitTestReset() {
  window.dispatchEvent(new Event(RESET_EVENT));
}

export function listenForTestReset(callback: () => void): () => void {
  window.addEventListener(RESET_EVENT, callback);
  return () => window.removeEventListener(RESET_EVENT, callback);
}

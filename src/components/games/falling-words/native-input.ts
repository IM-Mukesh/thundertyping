import type { SkyfallState } from "@/lib/games/falling-words/engine";

type InputState = Pick<SkyfallState, "typed" | "lockedId" | "cleared">;
interface NativeEdit {
  type?: string;
  inputType?: string;
  isComposing?: boolean;
  data?: string | null;
}
type Credit = { word: number; prefix: string } | null;
type ScoreKey = (key: string) => InputState;
const ordinaryEdits = ["insertText", "deleteContentBackward", "deleteContentForward"];
const MAX_NATIVE_DRAFT = 128;
const compositionEdit = (event: NativeEdit) => event.isComposing || event.type === "compositionend" || event.inputType?.includes("Composition");

/**
 * Event-owned projection, never read or mutated during React render. The native
 * field owns its draft; engine progress is only changed by one observed ASCII
 * append or deletion of a credited suffix. Committing a candidate scores nothing.
 */
export function createSkyfallNativeInput() {
  let raw = "", composing = false, hasStart = false, cancelled = false;
  let credits: Credit[] = [], echoes: string[] = [];
  const remember = (...values: string[]) => {
    const bounded = values.filter(value => value.length <= MAX_NATIVE_DRAFT);
    echoes = [...new Set([...echoes, ...bounded, ...bounded.map(value => value.trimEnd())])].slice(-6);
  };
  const project = (state: InputState) => {
    raw = state.typed;
    credits = [...raw].map((_, i) => state.lockedId === null ? null : { word: state.lockedId, prefix: raw.slice(0, i + 1) });
    return raw;
  };
  const retain = (next: string) => {
    let shared = 0;
    while (shared < raw.length && shared < next.length && raw[shared] === next[shared]) shared++;
    credits = [...credits.slice(0, shared), ...Array<Credit>(next.length - shared).fill(null)];
    raw = next;
  };
  const end = (next: string, state: InputState) => {
    remember(raw, next, state.typed);
    composing = false; hasStart = false;
    return project(state);
  };
  const change = (next: string, event: NativeEdit, state: InputState, score: ScoreKey): string | null => {
    if (next.length > MAX_NATIVE_DRAFT) {
      composing = false; hasStart = false; cancelled = true;
      return project(state);
    }
    if (cancelled || (!composing && echoes.includes(next))) return project(state);
    const wasComposing = composing;
    composing ||= !!event.isComposing || (event.inputType === "insertCompositionText" && event.isComposing !== false);
    const insertion = !event.inputType || event.inputType === "insertText"
      ? (!event.data || event.data.length === 1 || !!event.isComposing)
      : event.inputType === "insertCompositionText" && event.isComposing !== false && composing;
    const deletion = !event.inputType || event.inputType === "deleteContentBackward" || event.inputType === "deleteContentForward"
      || (["insertCompositionText", "deleteCompositionText"].includes(event.inputType) && event.isComposing !== false && composing);
    const append = next.length === raw.length + 1 && next.startsWith(raw) && /^[a-zA-Z]$/.test(next.slice(-1)) && insertion;
    const remove = next.length === raw.length - 1 && raw.startsWith(next) && deletion;
    let after = state;
    if (append) {
      const letter = next.slice(-1).toLowerCase();
      after = score(letter);
      credits.push(after.lockedId !== null && after.typed === state.typed + letter ? { word: after.lockedId, prefix: after.typed } : null);
      raw = next; echoes = [];
    } else if (remove) {
      const credit = credits.pop();
      if (credit && credit.word === state.lockedId && credit.prefix === state.typed) after = score("Backspace");
      raw = next; echoes = [];
    } else if (next !== raw) {
      if (!composing) return end(next, state);
      // Non-cancelable IME replacements stay browser-owned, but their changed
      // characters get no credit and cannot delete an earlier engine letter.
      retain(next);
    }
    if (!hasStart && wasComposing && !event.isComposing) return end(next, after);
    if (!composing && after.cleared > state.cleared) return end(next, after);
    return null;
  };
  return {
    isComposing: () => composing,
    before(event: NativeEdit) {
      if (compositionEdit(event)) return true;
      if (event.inputType && !ordinaryEdits.includes(event.inputType)) return false;
      // React may synthesize beforeinput from the final composition's textInput.
      // Only a genuine new edit releases an echo/cancellation boundary.
      if (event.type === "textInput" && event.data !== null && event.data !== undefined && echoes.includes(event.data)) return true;
      if (event.type === "beforeinput" || event.type === "textInput") { echoes = []; cancelled = false; }
      return true;
    },
    start(next: string, state: InputState) {
      const restore = next.length > MAX_NATIVE_DRAFT || cancelled || (!composing && echoes.includes(next) && next !== raw);
      if (restore) project(state);
      else if (next !== raw) retain(next);
      composing = true; hasStart = true; cancelled = false; echoes = [];
      return restore ? raw : null;
    },
    change,
    end,
    cancel(state: InputState) {
      remember(raw, state.typed);
      composing = false; hasStart = false; cancelled = true;
      return project(state);
    },
    reconcile(state: InputState) {
      if (composing) return null;
      if (raw !== state.typed) remember(raw, state.typed);
      return project(state);
    },
    physical(key: string, state: InputState, score: ScoreKey) {
      const oldComposition = composing, previous = raw;
      composing = false; hasStart = false; cancelled = false; echoes = [];
      let value: string;
      if (key === "Backspace" && raw !== state.typed && raw.length > 0) {
        value = change(raw.slice(0, -1), { inputType: "deleteContentBackward" }, state, score) ?? raw;
      } else value = project(score(key));
      if (oldComposition) { cancelled = true; remember(previous); }
      return value;
    },
  };
}

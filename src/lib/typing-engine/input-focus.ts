/**
 * Focus an input while the browser still considers the current pointer/touch
 * gesture user-initiated.
 *
 * Calling focus from a later React effect is too late for iOS Safari and some
 * Android keyboards to open the virtual keyboard. Keeping this tiny operation
 * separate makes the gesture path testable without a DOM test runner.
 */
export interface GestureFocusableInput {
  focus: (options?: FocusOptions) => void;
}

export function focusInputDuringGesture(
  input: GestureFocusableInput | null,
  disabled: boolean,
): boolean {
  if (disabled || input === null) return false;
  input.focus({ preventScroll: true });
  return true;
}

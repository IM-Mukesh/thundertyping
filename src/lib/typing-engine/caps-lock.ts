export type CapsLockEvent = Pick<KeyboardEvent, "getModifierState">;

/**
 * Read the browser's current Caps Lock modifier state from a keyboard event.
 *
 * The modifier state is authoritative on both keydown and keyup, so consumers
 * can use this for the live state instead of trying to infer it from the key.
 */
export function getCapsLockState(event: CapsLockEvent): boolean {
  return event.getModifierState("CapsLock");
}

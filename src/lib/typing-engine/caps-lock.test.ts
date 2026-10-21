import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCapsLockState, type CapsLockEvent } from "@/lib/typing-engine/caps-lock";

function keyboardEvent(capsLockOn: boolean): CapsLockEvent {
  return {
    getModifierState: (modifier) => {
      assert.equal(modifier, "CapsLock");
      return capsLockOn;
    },
  };
}

describe("Caps Lock event state", () => {
  it("reads the current modifier state from a keyboard event", () => {
    assert.equal(getCapsLockState(keyboardEvent(false)), false);
    assert.equal(getCapsLockState(keyboardEvent(true)), true);
  });

  it("supports live transitions from keydown and keyup event state", () => {
    let isCapsLockOn = false;
    const update = (event: CapsLockEvent) => {
      isCapsLockOn = getCapsLockState(event);
    };

    update(keyboardEvent(true));
    assert.equal(isCapsLockOn, true);

    update(keyboardEvent(false));
    assert.equal(isCapsLockOn, false);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { focusInputDuringGesture, type GestureFocusableInput } from "@/lib/typing-engine/input-focus";

describe("typing input gesture focus", () => {
  it("focuses immediately and prevents the gesture from scrolling the stream", () => {
    const focusOptions: FocusOptions[] = [];
    const input: GestureFocusableInput = {
      focus: (options) => focusOptions.push(options ?? {}),
    };

    assert.equal(focusInputDuringGesture(input, false), true);
    assert.deepEqual(focusOptions, [{ preventScroll: true }]);
  });

  it("does not focus a missing or disabled input", () => {
    let focusCalls = 0;
    const input: GestureFocusableInput = {
      focus: () => {
        focusCalls += 1;
      },
    };

    assert.equal(focusInputDuringGesture(null, false), false);
    assert.equal(focusInputDuringGesture(input, true), false);
    assert.equal(focusCalls, 0);
  });
});

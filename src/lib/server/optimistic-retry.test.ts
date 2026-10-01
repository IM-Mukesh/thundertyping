import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withOptimisticRetry } from "@/lib/server/optimistic-retry";

describe("withOptimisticRetry", () => {
  it("returns the result on first success without retrying", async () => {
    let calls = 0;
    const result = await withOptimisticRetry(async () => {
      calls += 1;
      return "ok";
    });
    assert.equal(result, "ok");
    assert.equal(calls, 1);
  });

  it("retries on a CONFLICT error and succeeds once the writer sees fresh data", async () => {
    let calls = 0;
    const result = await withOptimisticRetry(async () => {
      calls += 1;
      if (calls < 3) {
        throw new Error("CONFLICT: row changed concurrently");
      }
      return "recovered";
    });
    assert.equal(result, "recovered");
    assert.equal(calls, 3);
  });

  it("gives up and throws after exhausting all attempts on repeated conflicts", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        withOptimisticRetry(async () => {
          calls += 1;
          throw new Error("CONFLICT: row changed concurrently");
        }, 3),
      /CONFLICT/
    );
    assert.equal(calls, 3);
  });

  it("does not retry a non-conflict error, and fails fast", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        withOptimisticRetry(async () => {
          calls += 1;
          throw new Error("network unreachable");
        }, 3),
      /network unreachable/
    );
    assert.equal(calls, 1);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCountdown } from "@/lib/typing-engine/format-countdown";

describe("formatCountdown", () => {
  it("formats seconds under 60 with 's' suffix", () => {
    assert.equal(formatCountdown(0), "0s");
    assert.equal(formatCountdown(1), "1s");
    assert.equal(formatCountdown(59), "59s");
  });

  it("formats minutes and seconds for values between 60s and 3599s", () => {
    assert.equal(formatCountdown(60), "1:00");
    assert.equal(formatCountdown(61), "1:01");
    assert.equal(formatCountdown(65), "1:05");
    assert.equal(formatCountdown(599), "9:59");
    assert.equal(formatCountdown(600), "10:00");
    assert.equal(formatCountdown(3599), "59:59");
  });

  it("formats hours, minutes, and seconds for 3600s and above", () => {
    assert.equal(formatCountdown(3600), "1:00:00");
    assert.equal(formatCountdown(3601), "1:00:01");
    assert.equal(formatCountdown(3723), "1:02:03");
    assert.equal(formatCountdown(3661), "1:01:01");
    assert.equal(formatCountdown(86400), "24:00:00");
  });

  it("handles negative and non-finite values safely", () => {
    assert.equal(formatCountdown(-5), "0s");
    assert.equal(formatCountdown(NaN), "0s");
    assert.equal(formatCountdown(Infinity), "0s");
  });
});

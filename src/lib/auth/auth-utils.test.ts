import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isNewAuthUser } from "@/lib/auth/auth-utils";

describe("isNewAuthUser telemetry verification", () => {
  it("classifies user created 5 seconds ago as a new user", () => {
    const now = Date.now();
    const user = {
      created_at: new Date(now - 5000).toISOString(),
      last_sign_in_at: new Date(now - 5000).toISOString(),
    };
    assert.equal(isNewAuthUser(user, now), true);
  });

  it("classifies user created 45 seconds ago as a new user", () => {
    const now = Date.now();
    const user = {
      created_at: new Date(now - 45000).toISOString(),
    };
    assert.equal(isNewAuthUser(user, now), true);
  });

  it("classifies user created 2 minutes ago with matching last_sign_in_at as a new user (fallback handshake)", () => {
    const now = Date.now();
    const user = {
      created_at: new Date(now - 120000).toISOString(),
      last_sign_in_at: new Date(now - 119500).toISOString(),
    };
    assert.equal(isNewAuthUser(user, now), true);
  });

  it("classifies returning user created 2 days ago as existing user (false)", () => {
    const now = Date.now();
    const user = {
      created_at: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
      last_sign_in_at: new Date(now).toISOString(),
    };
    assert.equal(isNewAuthUser(user, now), false);
  });

  it("classifies returning user created 1 hour ago as existing user (false)", () => {
    const now = Date.now();
    const user = {
      created_at: new Date(now - 3600000).toISOString(),
      last_sign_in_at: new Date(now).toISOString(),
    };
    assert.equal(isNewAuthUser(user, now), false);
  });

  it("returns false for null or undefined user", () => {
    assert.equal(isNewAuthUser(null), false);
    assert.equal(isNewAuthUser(undefined), false);
  });

  it("returns false for user with missing or invalid created_at", () => {
    assert.equal(isNewAuthUser({}), false);
    assert.equal(isNewAuthUser({ created_at: "not-a-date" }), false);
  });

  it("returns false for abnormal future timestamps (severe clock skew)", () => {
    const now = Date.now();
    const user = {
      created_at: new Date(now + 60000).toISOString(), // 1 minute in the future
    };
    assert.equal(isNewAuthUser(user, now), false);
  });
});

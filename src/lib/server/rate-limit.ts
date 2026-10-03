import "server-only";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds until retry allowed
}

interface InMemoryEntry {
  count: number;
  resetAtMs: number;
}

// Memory fallback cache for local dev, offline unit tests, or DB failover
const memoryStore = new Map<string, InMemoryEntry>();

// Periodic memory store cleanup
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetAtMs <= now) {
        memoryStore.delete(key);
      }
    }
  }, 60000).unref?.();
}

/**
 * Extracts a client IP from NextRequest safely.
 */
export function getClientIp(request: NextRequest): string {
  const inetMax = 45;
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const validIp = (value: string | null) => {
    if (!value) return null;
    const candidate = value.trim();
    // A bounded, syntactically valid address prevents arbitrary key injection.
    if (candidate.length >  inetMax) return null;
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(candidate) && candidate.split(".").every((n) => Number(n) <= 255)) return candidate;
    if (/^[0-9a-f:]+$/i.test(candidate) && candidate.includes(":")) return candidate.toLowerCase();
    return null;
  };
  const trusted = validIp(cfConnectingIp) || validIp(request.headers.get("x-real-ip"));
  if (trusted) return trusted;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((ip) => validIp(ip)).filter(Boolean).at(-1);
  if (forwarded) return forwarded;

  return "unknown";
}

/**
 * Checks and updates rate limits using memory store.
 */
function checkMemoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAtMs <= now) {
    const resetAtMs = now + windowSeconds * 1000;
    memoryStore.set(key, { count: 1, resetAtMs });
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: Math.ceil(resetAtMs / 1000),
      retryAfter: 0,
    };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const resetAt = Math.ceil(entry.resetAtMs / 1000);
  const retryAfter = Math.max(1, Math.ceil((entry.resetAtMs - now) / 1000));

  return {
    success: entry.count <= limit,
    limit,
    remaining,
    resetAt,
    retryAfter: entry.count <= limit ? 0 : retryAfter,
  };
}

/**
 * Checks and increments rate limit using Upstash Redis if configured.
 */
async function checkUpstashRateLimit(
  url: string,
  token: string,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult | null> {
  try {
    const cleanUrl = url.replace(/\/+$/, "");
    // Use multi pipeline: INCR key, EXPIRE key windowSeconds NX, TTL key
    const pipelineRes = await fetch(`${cleanUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds, "NX"],
        ["TTL", key],
      ]),
    });

    if (!pipelineRes.ok) return null;
    const json = (await pipelineRes.json()) as Array<{ result: number }>;
    const count = json[0]?.result ?? 1;
    const ttl = json[2]?.result ?? windowSeconds;

    const remaining = Math.max(0, limit - count);
    const retryAfter = ttl > 0 ? ttl : windowSeconds;
    const resetAt = Math.ceil(Date.now() / 1000) + retryAfter;

    return {
      success: count <= limit,
      limit,
      remaining,
      resetAt,
      retryAfter: count <= limit ? 0 : retryAfter,
    };
  } catch (err) {
    console.warn("[rate-limit] Upstash request failed, falling back:", err);
    return null;
  }
}

/**
 * Checks and increments rate limit using the atomic `rate_limit_increment`
 * Postgres function (supabase/migrations/20261003000000_atomic_rate_limit.sql).
 *
 * This used to be a SELECT, then a JS-side count+1, then an UPDATE -- three
 * separate round-trips with no locking between them. Two concurrent requests
 * for the same key could both read the same count, both compute the same
 * new count, and both write it back: one increment silently lost, so the
 * real limit was weaker than configured under any real concurrency. The RPC
 * does the read-decide-write as one atomic statement inside Postgres, so
 * concurrent callers for the same key are serialized by the database's own
 * row lock, not by anything in this process.
 */
async function checkPostgresRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .rpc("rate_limit_increment", { p_key: key, p_window_seconds: windowSeconds })
      .maybeSingle();

    if (error || !data) return null;

    const resetAtMs = new Date(data.reset_at).getTime();
    const nowMs = Date.now();
    const resetAtSec = Math.ceil(resetAtMs / 1000);
    const retryAfter = Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));

    return {
      success: data.count <= limit,
      limit,
      remaining: Math.max(0, limit - data.count),
      resetAt: resetAtSec,
      retryAfter: data.count <= limit ? 0 : retryAfter,
    };
  } catch {
    return null;
  }
}

/**
 * Main distributed rate limit check function.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    const upstashResult = await checkUpstashRateLimit(upstashUrl, upstashToken, key, limit, windowSeconds);
    if (upstashResult) return upstashResult;
  }

  // Attempt Postgres rate limiting
  const pgResult = await checkPostgresRateLimit(key, limit, windowSeconds);
  if (pgResult) return pgResult;

  // Fallback to memory store
  return checkMemoryRateLimit(key, limit, windowSeconds);
}

/**
 * Helper to build rate limit response headers.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
  };

  if (!result.success) {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}

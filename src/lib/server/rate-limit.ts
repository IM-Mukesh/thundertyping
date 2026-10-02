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
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
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
 * Checks and increments rate limit using Supabase PostgreSQL table `api_rate_limits`.
 */
async function checkPostgresRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult | null> {
  try {
    const supabase = createAdminClient();
    const now = new Date();
    const resetTime = new Date(now.getTime() + windowSeconds * 1000);

    // Fetch existing bucket
    const { data: existing, error: selectErr } = await supabase
      .from("api_rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (selectErr) {
      return null;
    }

    if (!existing || new Date(existing.reset_at).getTime() <= now.getTime()) {
      // Upsert new or expired bucket
      const { error: upsertErr } = await supabase
        .from("api_rate_limits")
        .upsert(
          {
            key,
            count: 1,
            reset_at: resetTime.toISOString(),
          },
          { onConflict: "key" }
        );

      if (upsertErr) return null;

      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - 1),
        resetAt: Math.ceil(resetTime.getTime() / 1000),
        retryAfter: 0,
      };
    }

    const currentCount = existing.count + 1;
    const resetAtDate = new Date(existing.reset_at);
    const resetAtSec = Math.ceil(resetAtDate.getTime() / 1000);
    const retryAfter = Math.max(1, Math.ceil((resetAtDate.getTime() - now.getTime()) / 1000));

    // Increment count
    await supabase
      .from("api_rate_limits")
      .update({ count: currentCount })
      .eq("key", key);

    return {
      success: currentCount <= limit,
      limit,
      remaining: Math.max(0, limit - currentCount),
      resetAt: resetAtSec,
      retryAfter: currentCount <= limit ? 0 : retryAfter,
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

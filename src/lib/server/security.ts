import "server-only";
import { NextRequest } from "next/server";
import { sanitizeInternalRedirect } from "@/lib/utils/redirect";

export { sanitizeInternalRedirect };

/**
 * Returns a trusted canonical base origin for redirects and link generation.
 * Never blindly trusts arbitrary `x-forwarded-host` headers.
 */
export function getTrustedOrigin(request: NextRequest): string {
  const isDevelopment = process.env.NODE_ENV === "development";
  const canonicalUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://herotyping.com";
  let canonicalOrigin: string;
  try {
    canonicalOrigin = new URL(canonicalUrl).origin;
  } catch {
    canonicalOrigin = "https://herotyping.com";
  }

  if (isDevelopment) {
    const origin = request.nextUrl.origin;
    // Allow localhost, 127.0.0.1, or standard RFC1918 private LAN IPs in dev
    const hostname = request.nextUrl.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.")
    ) {
      return origin;
    }
    return "http://localhost:3000";
  }

  // In production / preview:
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) {
    return canonicalOrigin;
  }

  // Reject any userinfo (@), path separators (/ or \), or spaces
  if (
    forwardedHost.includes("@") ||
    forwardedHost.includes("/") ||
    forwardedHost.includes("\\") ||
    forwardedHost.includes(" ")
  ) {
    return canonicalOrigin;
  }

  let parsed: URL;
  try {
    parsed = new URL(`https://${forwardedHost}`);
  } catch {
    return canonicalOrigin;
  }

  const hostname = parsed.hostname.toLowerCase();
  const port = parsed.port;

  // Validate port if present: must be integer within valid 1..65535 range
  if (port && (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)) {
    return canonicalOrigin;
  }

  // Trusted host allowlist. Never trust arbitrary tenant hosts:
  // a forwarded host is only trusted when it matches configured origins.
  const canonicalHost = new URL(canonicalOrigin).hostname.toLowerCase();
  let vercelUrlHost: string | null = null;
  if (process.env.VERCEL_URL) {
    try {
      vercelUrlHost = new URL(`https://${process.env.VERCEL_URL}`).hostname.toLowerCase();
    } catch {
      vercelUrlHost = null;
    }
  }

  const isTrusted =
    hostname === canonicalHost ||
    hostname === "herotyping.com" ||
    hostname === "www.herotyping.com" ||
    (vercelUrlHost !== null && hostname === vercelUrlHost);

  if (isTrusted) {
    // Only return standard https origin with trusted hostname and validated non-default port if present
    return port && port !== "443" ? `https://${hostname}:${port}` : `https://${hostname}`;
  }

  // Untrusted host: fall back to canonical origin
  return canonicalOrigin;
}

/** Reject cross-site requests to cookie-authenticated mutation endpoints. */
export function hasTrustedMutationOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try { return new URL(origin).origin === getTrustedOrigin(request); } catch { return false; }
  }
  // Modern browsers send Sec-Fetch-Site for fetch/navigation requests.  Do not
  // treat a missing Origin as proof of same-site (old browsers are ambiguous).
  return request.headers.get("sec-fetch-site") === "same-origin";
}

/**
 * Generates a collision-resistant unique request ID for observability.
 */
export function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validates request payload size in bytes to prevent memory-exhaustion DoS.
 */
export async function readBoundedJson<T = unknown>(
  request: NextRequest,
  maxSizeBytes = 65536 // 64 KB default
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      return { ok: false, error: "Payload too large", status: 413 };
    }

    let text = "";
    if (!request.body) return { ok: false, error: "Request body is empty", status: 400 };
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let byteCount = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        byteCount += value.byteLength;
        if (byteCount > maxSizeBytes) {
          await reader.cancel();
          return { ok: false, error: "Payload too large", status: 413 };
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }

    if (!text.trim()) {
      return { ok: false, error: "Request body is empty", status: 400 };
    }

    const parsed = JSON.parse(text) as T;
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, error: "Malformed JSON payload", status: 400 };
  }
}

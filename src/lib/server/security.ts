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

  // Clean the host (remove any port if needed)
  const hostOnly = forwardedHost.split(":")[0].toLowerCase();

  // Trusted host allowlist:
  // 1. herotyping.com and www.herotyping.com
  // 2. Vercel deployment URLs (*.vercel.app)
  // 3. Exact host from NEXT_PUBLIC_SITE_URL or VERCEL_URL
  const canonicalHost = new URL(canonicalOrigin).hostname.toLowerCase();
  const vercelUrlHost = process.env.VERCEL_URL ? process.env.VERCEL_URL.split(":")[0].toLowerCase() : null;

  const isTrusted =
    hostOnly === canonicalHost ||
    hostOnly === "herotyping.com" ||
    hostOnly === "www.herotyping.com" ||
    (vercelUrlHost && hostOnly === vercelUrlHost) ||
    hostOnly.endsWith(".vercel.app");

  if (isTrusted) {
    return `https://${forwardedHost}`;
  }

  // Untrusted host: fall back to canonical origin
  return canonicalOrigin;
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

    const text = await request.text();
    if (text.length > maxSizeBytes) {
      return { ok: false, error: "Payload too large", status: 413 };
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

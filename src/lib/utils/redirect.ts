/**
 * Sanitizes a redirect destination so it can only ever navigate to a
 * safe, internal relative path on this origin.
 *
 * Strictly rejects:
 * - Absolute URLs with any protocol (http:, https:, javascript:, data:, etc.)
 * - Protocol-relative URLs (//evil.com, ///evil.com)
 * - Backslash-based parser confusion (\evil.com, /\evil.com, /\\evil.com)
 * - URL-encoded evasion attempts (%2F%2F, %5C)
 * - Control characters and unprintable characters
 */
export function sanitizeInternalRedirect(
  target: string | null | undefined,
  defaultPath = "/"
): string {
  if (!target || typeof target !== "string") {
    return defaultPath;
  }

  const trimmed = target.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) {
    return defaultPath;
  }

  // Reject control characters, newlines, carriage returns, null bytes
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return defaultPath;
  }

  // Check for encoded backslashes or encoded slashes that could create protocol-relative targets
  let decoded: string;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // Malformed URI encoding
    return defaultPath;
  }

  // Double-decode check to catch nested encoding like %252F
  try {
    if (decoded.includes("%")) {
      const doubleDecoded = decodeURIComponent(decoded);
      if (
        doubleDecoded.includes("\\") ||
        doubleDecoded.startsWith("//") ||
        doubleDecoded.includes("://")
      ) {
        return defaultPath;
      }
    }
  } catch {
    return defaultPath;
  }

  // Reject if decoded string has backslashes or dangerous protocol schemes
  if (
    decoded.includes("\\") ||
    /^(?:[a-z][a-z0-9+.-]*:)/i.test(decoded) ||
    /^(?:javascript|data|vbscript|file|about):/i.test(decoded) ||
    decoded.startsWith("//")
  ) {
    return defaultPath;
  }

  // Must begin with a single slash and not followed by another slash or backslash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return defaultPath;
  }

  try {
    // Parse against a dummy base origin to verify parser outcome
    const parsed = new URL(trimmed, "https://herotyping.internal");
    if (parsed.origin !== "https://herotyping.internal") {
      return defaultPath;
    }

    // Ensure the pathname starts with / and not //
    if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) {
      return defaultPath;
    }

    // Return the safe relative path (pathname + search + hash)
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return defaultPath;
  }
}

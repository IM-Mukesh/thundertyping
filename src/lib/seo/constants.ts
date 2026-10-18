export const SITE_NAME = "HeroTyping";

export const CANONICAL_ORIGIN = "https://www.herotyping.com";

/**
 * Normalizes a URL or origin to ensure:
 * - Trimmed whitespace
 * - No trailing slashes (preventing //path accidental construction)
 * - Required HTTPS scheme
 * - Normalizes apex herotyping.com to canonical www.herotyping.com
 * - Safeguard: Vercel preview URLs are never claimed as canonical URLs
 */
export function normalizeSiteUrl(input?: string): string {
  if (!input || typeof input !== "string") {
    return CANONICAL_ORIGIN;
  }
  let cleaned = input.trim();
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, "");

  // If apex domain is provided, force canonical www
  if (cleaned === "https://herotyping.com" || cleaned === "http://herotyping.com") {
    return CANONICAL_ORIGIN;
  }

  // Previews should never claim their ephemeral host as canonical
  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
  ) {
    return CANONICAL_ORIGIN;
  }

  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
      return CANONICAL_ORIGIN;
    }
    // Prevent accidental http in production for herotyping.com
    if (cleaned.startsWith("http://") && cleaned.includes("herotyping.com")) {
      return CANONICAL_ORIGIN;
    }
  }

  return cleaned || CANONICAL_ORIGIN;
}

export const IS_PREVIEW =
  process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const SITE_TAGLINE = "Free Online Typing Speed Test";

export const SITE_DESCRIPTION =
  "Test and improve your typing speed with free 1-minute to 5-minute WPM tests, structured touch-typing lessons, and arcade games. No sign-up required.";

// Overridable via NEXT_PUBLIC_SUPPORT_EMAIL; defaults to hello@herotyping.com.
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@herotyping.com";

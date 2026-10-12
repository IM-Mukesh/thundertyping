export const SITE_NAME = "HeroTyping";

// Overridable via NEXT_PUBLIC_SITE_URL (e.g. for preview deployments); the
let _siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.herotyping.com";
if (_siteUrl === "https://herotyping.com") {
  _siteUrl = "https://www.herotyping.com";
}
export const SITE_URL = _siteUrl;

export const SITE_TAGLINE = "Free Online Typing Speed Test";

export const SITE_DESCRIPTION =
  "Free online typing speed test. Measure your WPM and accuracy, practice with time or word-count modes, real quotes, and your own custom text — no sign-up required.";

// Overridable via NEXT_PUBLIC_SUPPORT_EMAIL; defaults to hello@herotyping.com.
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@herotyping.com";

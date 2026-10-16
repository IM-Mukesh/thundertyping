import type { Metadata } from "next";
import { IS_PREVIEW } from "@/lib/seo/constants";

/**
 * Truncates at the last full word within maxLength, never mid-word. A raw
 * `.slice(0, n)` cut a real page description off mid-sentence in production
 * (e.g. "...how long a word takes to" with nothing after it) -- this is the
 * fix, used anywhere a description is built from longer source text.
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/**
 * Helper for localized pages that need their canonical and Open Graph URLs
 * to reflect the current route locale (/es/..., /pt-BR/..., /de/...) while
 * keeping the default English URLs prefix-less (/...).
 */
export function localizedPageMetadata({
  locale,
  title,
  description,
  path,
  robots,
  image,
}: {
  locale?: string;
  title: string;
  description: string;
  path: string;
  robots?: Metadata["robots"];
  image?: string;
}): Metadata {
  const isLocalized = path === "" || path === "/" || path === "/games/type-before-death";
  const canonicalPath = !locale || locale === "en" || !isLocalized ? (path === "" ? "/" : path) : `/${locale}${path}`;
  const effectiveRobots = IS_PREVIEW
    ? { index: false, follow: false }
    : robots;

  const ogImageUrl = image || "/opengraph-image";

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      title,
      description,
      images: [ogImageUrl],
    },
    ...(effectiveRobots ? { robots: effectiveRobots } : {}),
  };
}

/**
 * Every static page's metadata needs the same three things — title,
 * description, canonical — plus an explicit openGraph/twitter so it doesn't
 * silently inherit the root layout's (which describes the homepage). Next's
 * metadata resolution only overrides a field a segment sets explicitly; a
 * page that sets `title`/`description` but no `openGraph` keeps the
 * parent's openGraph.title verbatim, which is exactly the bug this fixes.
 * Dynamic routes (games/[gameId], lessons/[lessonId], vocabulary/[difficulty])
 * build their own per-item version of this and don't use it.
 */
export function pageMetadata({
  title,
  description,
  path,
  robots,
  image,
}: {
  title: string;
  description: string;
  path: string;
  robots?: Metadata["robots"];
  image?: string;
}): Metadata {
  return localizedPageMetadata({
    title,
    description,
    path,
    robots,
    image,
  });
}

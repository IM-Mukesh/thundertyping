import type { Metadata } from "next";

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
}: {
  title: string;
  description: string;
  path: string;
  robots?: Metadata["robots"];
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description },
    twitter: { title, description },
    ...(robots ? { robots } : {}),
  };
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { LESSON_SLUG_MAP } from "@/lib/lessons/lesson-types";

// The only routes that provide genuine, complete multi-language content across UI, copy, schemas, and FAQs.
const GENUINELY_LOCALIZED_SUBPATHS = new Set(["", "/", "/games/type-before-death"]);

// Permanent redirect mappings for retired games, consolidated guides, and migrated lesson slugs.
const PERMANENT_REDIRECT_MAP: Record<string, string> = {
  "/games/typing-grand-prix": "/games/ghost-racer",
  "/games/typing-survivor": "/games",
  "/guides/beat-your-personal-best-typing-speed": "/guides/how-to-improve-typing-speed",
  "/guides/fix-burst-and-stall-typing-pace-caret": "/guides/how-to-improve-typing-consistency",
  "/guides/typing-test-vs-typing-race": "/guides/typing-games-vs-typing-tests",
};

/**
 * Resolves any retired, consolidated, or migrated paths to their final canonical destination.
 * Always resolves in a single hop with zero redirect chains.
 */
export function resolvePermanentRedirect(path: string): string | null {
  const clean = path.replace(/\/+$/, '') || '/';
  if (PERMANENT_REDIRECT_MAP[clean]) {
    return PERMANENT_REDIRECT_MAP[clean];
  }
  if (clean.startsWith('/lessons/')) {
    const rawLessonId = clean.slice('/lessons/'.length);
    if (LESSON_SLUG_MAP[rawLessonId]) {
      return `/lessons/${LESSON_SLUG_MAP[rawLessonId]}`;
    }
  }
  return null;
}

/**
 * Next.js 16 Request Proxy.
 * Handles locale routing and refreshes Supabase session tokens.
 */
async function handleProxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search || '';

  // Paths that shouldn't be rewritten/redirected:
  // Static assets and internal Next.js requests bypass auth refresh entirely to eliminate proxy latency.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(?:png|jpg|jpeg|gif|webp|svg|ico|xml|txt|json|webmanifest|map)$/i)
  ) {
    return NextResponse.next();
  }

  // API routes handle their own auth or pass through
  if (pathname.startsWith('/api')) {
    return await updateSession(request);
  }

  // 0. Permanent redirects (retired games, consolidated guides, migrated lesson slugs)
  // Immediate 308 redirect with zero network or session-refresh overhead.
  const directRedirect = resolvePermanentRedirect(pathname);
  if (directRedirect) {
    return NextResponse.redirect(new URL(`${directRedirect}${search}`, request.url), 308);
  }

  // 1. If a user visits /en or /en/... redirect them directly to the canonical prefix-less English URL
  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    const rawPath = pathname.replace(new RegExp(`^/${DEFAULT_LOCALE}`), '') || '/';
    const newPath = resolvePermanentRedirect(rawPath) || rawPath;
    return NextResponse.redirect(new URL(`${newPath}${search}`, request.url), 308);
  }

  // 2. Portuguese case normalization (/pt-br or /pt-br/*)
  const lowerPath = pathname.toLowerCase();
  if (
    !pathname.startsWith('/pt-BR/') &&
    pathname !== '/pt-BR' &&
    (lowerPath === '/pt-br' || lowerPath.startsWith('/pt-br/'))
  ) {
    const rawSuffix = pathname.slice(6);
    const suffix = rawSuffix === '/' ? '' : rawSuffix;

    if (GENUINELY_LOCALIZED_SUBPATHS.has(suffix)) {
      // Localized route: redirect to canonical /pt-BR
      const canonicalPath = `/pt-BR${suffix}`;
      return NextResponse.redirect(new URL(`${canonicalPath}${search}`, request.url), 308);
    } else {
      // English-only route: single-hop redirect directly to clean unprefixed canonical URL
      const canonicalPath = resolvePermanentRedirect(suffix) || suffix || '/';
      return NextResponse.redirect(new URL(`${canonicalPath}${search}`, request.url), 308);
    }
  }

  // 3. Supported non-default locales ('es', 'pt-BR', 'de')
  for (const locale of ['es', 'pt-BR', 'de']) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      const rawSuffix = pathname.slice(locale.length + 1);
      const suffix = rawSuffix === '/' ? '' : rawSuffix;

      // Trailing slash normalization on localized root (e.g. /es/ -> /es)
      if (rawSuffix === '/') {
        return NextResponse.redirect(new URL(`/${locale}${search}`, request.url), 308);
      }

      if (GENUINELY_LOCALIZED_SUBPATHS.has(suffix)) {
        // Genuinely localized route (Homepage or /games/type-before-death)
        return await updateSession(request);
      } else {
        // English-only subpath visited under a locale prefix (e.g. /pt-BR/typing-test/1-minute):
        // Single-hop permanent redirect directly to the unprefixed canonical English URL!
        const canonicalPath = resolvePermanentRedirect(suffix) || suffix || '/';
        return NextResponse.redirect(new URL(`${canonicalPath}${search}`, request.url), 308);
      }
    }
  }

  // 4. Trailing slash normalization on default English subpaths (e.g. /typing-test/1-minute/ -> /typing-test/1-minute)
  if (pathname !== '/' && pathname.endsWith('/')) {
    const unslashed = pathname.slice(0, -1);
    const targetPath = resolvePermanentRedirect(unslashed) || unslashed;
    return NextResponse.redirect(new URL(`${targetPath}${search}`, request.url), 308);
  }

  // 5. Default clean English URLs (unprefixed)
  // Rewrite to internal /en route so Next.js App Router handles it uniformly in src/app/[locale],
  // while strictly preserving searchParams and query strings (e.g. ?language=hi, ?duration=60).
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return await updateSession(request, () =>
    NextResponse.rewrite(rewriteUrl)
  );
}

export async function proxy(request: NextRequest) {
  const response = await handleProxy(request);
  if (process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static file extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .opus, .webmanifest)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|opus|webmanifest)$).*)",
  ],
};

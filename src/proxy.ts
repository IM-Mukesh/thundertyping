import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { DEFAULT_LOCALE } from '@/lib/i18n/config';

// The only routes that provide genuine, complete multi-language content across UI, copy, schemas, and FAQs.
const GENUINELY_LOCALIZED_SUBPATHS = new Set(["", "/", "/games/type-before-death"]);

/**
 * Next.js 16 Request Proxy.
 * Handles locale routing and refreshes Supabase session tokens.
 */
async function handleProxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search || '';

  // Paths that shouldn't be rewritten/redirected
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(.*)$/) // Has extension like .png, .xml, .txt
  ) {
    return await updateSession(request);
  }

  // 1. If a user visits /en or /en/... redirect them directly to the canonical prefix-less English URL
  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    const newPath = pathname.replace(new RegExp(`^/${DEFAULT_LOCALE}`), '') || '/';
    return await updateSession(request, () =>
      NextResponse.redirect(new URL(`${newPath}${search}`, request.url), 308)
    );
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
      return await updateSession(request, () =>
        NextResponse.redirect(new URL(`${canonicalPath}${search}`, request.url), 308)
      );
    } else {
      // English-only route: single-hop redirect directly to clean unprefixed canonical URL
      const canonicalPath = suffix || '/';
      return await updateSession(request, () =>
        NextResponse.redirect(new URL(`${canonicalPath}${search}`, request.url), 308)
      );
    }
  }

  // 3. Supported non-default locales ('es', 'pt-BR', 'de')
  for (const locale of ['es', 'pt-BR', 'de']) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      const rawSuffix = pathname.slice(locale.length + 1);
      const suffix = rawSuffix === '/' ? '' : rawSuffix;

      // Trailing slash normalization on localized root (e.g. /es/ -> /es)
      if (rawSuffix === '/') {
        return await updateSession(request, () =>
          NextResponse.redirect(new URL(`/${locale}${search}`, request.url), 308)
        );
      }

      if (GENUINELY_LOCALIZED_SUBPATHS.has(suffix)) {
        // Genuinely localized route (Homepage or /games/type-before-death)
        return await updateSession(request);
      } else {
        // English-only subpath visited under a locale prefix (e.g. /pt-BR/typing-test/1-minute):
        // Single-hop permanent redirect directly to the unprefixed canonical English URL!
        const canonicalPath = suffix || '/';
        return await updateSession(request, () =>
          NextResponse.redirect(new URL(`${canonicalPath}${search}`, request.url), 308)
        );
      }
    }
  }

  // 4. Trailing slash normalization on default English subpaths (e.g. /typing-test/1-minute/ -> /typing-test/1-minute)
  if (pathname !== '/' && pathname.endsWith('/')) {
    return await updateSession(request, () =>
      NextResponse.redirect(new URL(`${pathname.slice(0, -1)}${search}`, request.url), 308)
    );
  }

  // 5. Default clean English URLs (unprefixed)
  // Rewrite to internal /en route so Next.js App Router handles it uniformly in src/app/[locale].
  return await updateSession(request, () =>
    NextResponse.rewrite(
      new URL(`/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`, request.url)
    )
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

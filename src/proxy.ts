import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n/config';

/**
 * Next.js 16 Request Proxy.
 * Handles locale routing and refreshes Supabase session tokens.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = LOCALES.every(
    (locale: string) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Requirement: English existing URLs MUST remain stable. They will not be prefixed with /en/.
  if (pathnameIsMissingLocale) {
    // If it's missing a locale, it means it's the default English path.
    // We rewrite to the /en internal path so Next.js App Router can handle it uniformly in src/app/[locale].
    return await updateSession(request, () => 
      NextResponse.rewrite(
        new URL(`/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`, request.url)
      )
    );
  }

  // If a user visits /en/something, redirect them to /something to enforce canonical prefix-less English URLs
  if (pathname.startsWith(`/${DEFAULT_LOCALE}/`) || pathname === `/${DEFAULT_LOCALE}`) {
    const newPath = pathname.replace(new RegExp(`^/${DEFAULT_LOCALE}`), '') || '/';
    return await updateSession(request, () => 
      NextResponse.redirect(new URL(newPath, request.url), 308)
    );
  }

  // Fallback
  return await updateSession(request);
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

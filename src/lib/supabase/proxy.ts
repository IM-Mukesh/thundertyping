import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Refreshes auth tokens stored in cookies and updates request/response headers.
 * Used by Next.js 16 Proxy (`src/proxy.ts`).
 *
 * Strictly requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * (falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY if set).
 *
 * No hardcoded project URLs or placeholder fallbacks are permitted.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Do not interfere with callback exchange or signout
  if (
    pathname.startsWith("/api/auth/callback") ||
    pathname.startsWith("/api/auth/signout")
  ) {
    return NextResponse.next({ request });
  }

  // If there are no Supabase auth cookies present, this is a guest visitor.
  // Avoid network roundtrip on every page navigation.
  const supabaseCookieNames = request.cookies
    .getAll()
    .map((c) => c.name)
    .filter((name) => name.startsWith("sb-"));
  const hasAuthCookies = supabaseCookieNames.length > 0;

  if (!hasAuthCookies) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh auth session
    await supabase.auth.getUser();
  } catch (err) {
    // If token refresh fails, don't crash the proxy - allow request to proceed
    console.warn("[proxy] session refresh error:", err);
  }

  return supabaseResponse;
}

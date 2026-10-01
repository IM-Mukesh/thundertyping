import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseUrl = isLocalEnv
    ? request.nextUrl.origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : request.nextUrl.origin;

  // If OAuth provider returned an error (e.g. user cancelled or denied access)
  if (oauthError || oauthErrorDescription) {
    const msg = oauthErrorDescription || oauthError || "Authentication cancelled";
    console.warn("[auth/callback] OAuth error:", oauthError, oauthErrorDescription);
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(msg)}`, baseUrl));
  }

  let next = searchParams.get("next") ?? "/profile";

  // Open-redirect protection: only allow relative local paths starting with /
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    next = "/profile";
  }

  if (code) {
    try {
      const redirectResponse = NextResponse.redirect(new URL(next, baseUrl));

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.redirect(new URL("/auth/login?error=Configuration+error", baseUrl));
      }

      const cookieStore = await cookies();

      const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                // Ignore if in restricted context
              }
              redirectResponse.cookies.set(name, value, options);
            });
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return redirectResponse;
      }

      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, baseUrl));
    } catch (err) {
      console.error("[auth/callback] unexpected exception during session exchange:", err);
      return NextResponse.redirect(new URL("/auth/login?error=Session+exchange+failed", baseUrl));
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=missing_code", baseUrl));
}

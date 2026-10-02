import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { sanitizeInternalRedirect, getTrustedOrigin } from "@/lib/server/security";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  // Rate limit callback attempts per IP to prevent authorization code brute forcing
  const rateLimit = await checkRateLimit(`auth:callback:${clientIp}`, 30, 60);
  if (!rateLimit.success) {
    const trustedOrigin = getTrustedOrigin(request);
    return NextResponse.redirect(
      new URL("/auth/login?error=Too+many+attempts.+Please+try+again+later.", trustedOrigin)
    );
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  // Harden forwarded host trust
  const baseUrl = getTrustedOrigin(request);

  // If OAuth provider returned an error (e.g. user cancelled or denied access)
  if (oauthError || oauthErrorDescription) {
    console.warn("[auth/callback] OAuth provider error:", oauthError, oauthErrorDescription);
    return NextResponse.redirect(
      new URL("/auth/login?error=Authentication+was+cancelled+or+denied.", baseUrl)
    );
  }

  // Open-redirect protection
  const rawNext = searchParams.get("next");
  const next = sanitizeInternalRedirect(rawNext, "/profile");

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
      return NextResponse.redirect(
        new URL("/auth/login?error=Failed+to+authenticate.+Please+try+again.", baseUrl)
      );
    } catch (err) {
      console.error("[auth/callback] unexpected exception during session exchange:", err);
      return NextResponse.redirect(
        new URL("/auth/login?error=Session+exchange+failed", baseUrl)
      );
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=missing_code", baseUrl));
}

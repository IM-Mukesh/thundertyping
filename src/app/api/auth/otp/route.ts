import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { sanitizeInternalRedirect, getTrustedOrigin, readBoundedJson, hasTrustedMutationOrigin } from "@/lib/server/security";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    if (!hasTrustedMutationOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const clientIp = getClientIp(request);

    // 1. Rate Limit Check: IP level (max 5 requests per 10 minutes)
    const ipLimit = await checkRateLimit(`otp:ip:${clientIp}`, 5, 600);
    if (!ipLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please wait a few minutes before trying again.",
          },
        },
        { status: 429, headers: getRateLimitHeaders(ipLimit) }
      );
    }

    // 2. Bounded JSON reading (max 16KB)
    const bodyResult = await readBoundedJson<{ email?: unknown; redirectTo?: unknown }>(request, 16384);
    if (!bodyResult.ok) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: bodyResult.error } },
        { status: bodyResult.status }
      );
    }

    const { email: rawEmail, redirectTo: rawRedirectTo } = bodyResult.data;

    // Validate email format
    if (typeof rawEmail !== "string" || !EMAIL_REGEX.test(rawEmail.trim()) || rawEmail.length > 254) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_EMAIL",
            message: "Please enter a valid email address",
          },
        },
        { status: 400 }
      );
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();

    // 3. Rate Limit Check: Per-email cooldown (1 per 60 seconds)
    const emailCooldown = await checkRateLimit(`otp:cooldown:${normalizedEmail}`, 1, 60);
    if (!emailCooldown.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "A verification code was recently sent. Please wait 60 seconds before requesting another.",
          },
        },
        { status: 429, headers: getRateLimitHeaders(emailCooldown) }
      );
    }

    // 4. Rate Limit Check: Per-email bucket (max 3 per 10 minutes)
    const emailLimit = await checkRateLimit(`otp:email:${normalizedEmail}`, 3, 600);
    if (!emailLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many verification attempts for this email. Please try again later.",
          },
        },
        { status: 429, headers: getRateLimitHeaders(emailLimit) }
      );
    }

    // 5. Sanitize redirectTo parameter
    // The redirect target must only ever point to this site's trusted callback with a safe internal next path
    const trustedOrigin = getTrustedOrigin(request);
    const safeCallbackUrl = new URL("/api/auth/callback", trustedOrigin);

    if (typeof rawRedirectTo === "string" && rawRedirectTo.trim()) {
      try {
        const candidateUrl = new URL(rawRedirectTo, trustedOrigin);
        // Only accept the candidate URL's `next` parameter
        const candidateNext = candidateUrl.searchParams.get("next");
        const safeNext = sanitizeInternalRedirect(candidateNext || candidateUrl.pathname, "/profile");
        safeCallbackUrl.searchParams.set("next", safeNext);
      } catch {
        safeCallbackUrl.searchParams.set("next", "/profile");
      }
    } else {
      safeCallbackUrl.searchParams.set("next", "/profile");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: safeCallbackUrl.toString(),
      },
    });

    if (error) {
      // Log internal Supabase error server-side
      console.warn("[api/auth/otp] Supabase error:", error.message);
      // If error message indicates provider rate limiting:
      if (error.message.toLowerCase().includes("rate limit") || error.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Authentication service rate limit exceeded. Please wait a few minutes.",
            },
          },
          { status: 429 }
        );
      }
      // Anti-enumeration: Return generic success to avoid confirming whether an email exists
      return NextResponse.json({
        success: true,
        data: { message: "If this email is registered, a sign-in link has been sent." },
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: "If this email is registered, a sign-in link has been sent." },
    });
  } catch (err: unknown) {
    console.error("[api/auth/otp] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred. Please try again later.",
        },
      },
      { status: 500 }
    );
  }
}

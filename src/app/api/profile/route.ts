import "server-only";
import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError, safeInternalError } from "@/lib/server/errors";
import { getUserProfile, updateUserProfile } from "@/lib/server/profiles";
import { validateProfileUpdateInput } from "@/lib/server/validation";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { createRequestId, readBoundedJson } from "@/lib/server/security";

export async function GET() {
  const requestId = createRequestId();
  try {
    const { user } = await requireAuthUser();
    const data = await getUserProfile(user.id);

    // Minimize returned user profile information (explicit allowlist, no app_metadata)
    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
        },
      },
      ...data,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to load user profile", requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = createRequestId();
  try {
    const { user } = await requireAuthUser();

    // Rate limit profile updates (max 30 per minute per user)
    const rateLimit = await checkRateLimit(`profile:patch:${user.id}`, 30, 60);
    if (!rateLimit.success) {
      return apiError(
        "RATE_LIMITED",
        "Too many profile updates. Please wait a moment before trying again.",
        429,
        undefined,
        getRateLimitHeaders(rateLimit),
        requestId
      );
    }

    const bodyResult = await readBoundedJson<unknown>(request, 16384);
    if (!bodyResult.ok) {
      return apiError("INVALID_INPUT", bodyResult.error, bodyResult.status, undefined, undefined, requestId);
    }

    const validation = validateProfileUpdateInput(bodyResult.data);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400, undefined, undefined, requestId);
    }

    const updated = await updateUserProfile(user.id, validation.data);
    return apiSuccess(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update profile";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    if (msg.includes("already taken")) {
      return apiError("CONFLICT", "Username is already taken", 409, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to update profile", requestId);
  }
}

import "server-only";
import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError, safeInternalError } from "@/lib/server/errors";
import { getUserPreferences, updateUserPreferences } from "@/lib/server/profiles";
import { validatePreferencesInput } from "@/lib/server/validation";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { createRequestId, readBoundedJson, hasTrustedMutationOrigin } from "@/lib/server/security";

export async function GET() {
  const requestId = createRequestId();
  try {
    const { user } = await requireAuthUser();
    const data = await getUserPreferences(user.id);
    return apiSuccess(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to load preferences", requestId);
  }
}

export async function PUT(request: NextRequest) {
  const requestId = createRequestId();
  try {
    if (!hasTrustedMutationOrigin(request)) return apiError("FORBIDDEN", "Invalid request origin", 403, undefined, undefined, requestId);
    const { user } = await requireAuthUser();

    // Rate limit preferences updates (max 30 per minute per user)
    const rateLimit = await checkRateLimit(`profile:prefs:${user.id}`, 30, 60);
    if (!rateLimit.success) {
      return apiError(
        "RATE_LIMITED",
        "Too many updates. Please wait a moment before trying again.",
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

    const validation = validatePreferencesInput(bodyResult.data);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400, undefined, undefined, requestId);
    }

    const updated = await updateUserPreferences(user.id, validation.data);
    return apiSuccess(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update preferences";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to update preferences", requestId);
  }
}

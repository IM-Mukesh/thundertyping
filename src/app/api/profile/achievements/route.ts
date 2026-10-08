import "server-only";
import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError, safeInternalError } from "@/lib/server/errors";
import {
  getCloudAchievements,
  grantVerifiedCloudAchievement,
  evaluateAndSyncAchievements,
} from "@/lib/server/progress";
import { validateAchievementGrantInput } from "@/lib/server/validation";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { createRequestId, readBoundedJson, hasTrustedMutationOrigin } from "@/lib/server/security";

export async function GET() {
  const requestId = createRequestId();
  try {
    const { user } = await requireAuthUser();
    const achievementIds = await getCloudAchievements(user.id);
    return apiSuccess(achievementIds);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to fetch achievements", requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  try {
    if (!hasTrustedMutationOrigin(request)) return apiError("FORBIDDEN", "Invalid request origin", 403, undefined, undefined, requestId);
    const { user } = await requireAuthUser();

    // Rate limit achievement evaluation calls (max 30 per minute per user)
    const rateLimit = await checkRateLimit(`achievements:sync:${user.id}`, 30, 60);
    if (!rateLimit.success) {
      return apiError(
        "RATE_LIMITED",
        "Too many requests. Please wait a moment before trying again.",
        429,
        undefined,
        getRateLimitHeaders(rateLimit),
        requestId
      );
    }

    const bodyResult = await readBoundedJson<unknown>(request, 8192);
    
    if (!bodyResult.ok) {
      return apiError("INVALID_INPUT", bodyResult.error, bodyResult.status, undefined, undefined, requestId);
    }

    if (typeof bodyResult.data === "object" && bodyResult.data !== null && "achievementId" in bodyResult.data) {
      const validation = validateAchievementGrantInput(bodyResult.data);
      if (!validation.valid) {
        return apiError("INVALID_INPUT", validation.message, 400, undefined, undefined, requestId);
      }

      // Authoritative evaluation: will ONLY grant if the user's DB records satisfy the condition
      const result = await grantVerifiedCloudAchievement(user.id, validation.data.achievementId);
      return apiSuccess(result);
    }

    if (typeof bodyResult.data !== "object" || bodyResult.data === null || Object.keys(bodyResult.data).length > 0) {
       return apiError("INVALID_INPUT", "Invalid achievement payload", 400, undefined, undefined, requestId);
    }

    // Default: sync all eligible achievements based on authoritative DB records (when {} is sent)
    const syncResult = await evaluateAndSyncAchievements(user.id);
    return apiSuccess({
      granted: syncResult.newlyUnlocked.length > 0,
      newlyUnlocked: syncResult.newlyUnlocked,
      allUnlocked: syncResult.allUnlocked,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to evaluate achievements";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to process achievements", requestId);
  }
}

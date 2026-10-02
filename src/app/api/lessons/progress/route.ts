import "server-only";
import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError, safeInternalError } from "@/lib/server/errors";
import { saveLessonProgress, getUserLessonProgress } from "@/lib/server/lesson-progress";
import { validateLessonProgressInput } from "@/lib/server/validation";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { createRequestId, readBoundedJson } from "@/lib/server/security";

export async function GET() {
  const requestId = createRequestId();
  try {
    const { user } = await requireAuthUser();
    const progress = await getUserLessonProgress(user.id);
    return apiSuccess(progress);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to load lesson progress", requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  try {
    const { user } = await requireAuthUser();

    // Rate limit lesson progress submissions (max 60 per minute per user)
    const rateLimit = await checkRateLimit(`lessons_progress:post:${user.id}`, 60, 60);
    if (!rateLimit.success) {
      return apiError(
        "RATE_LIMITED",
        "Too many submissions. Please wait a moment before trying again.",
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

    const validation = validateLessonProgressInput(bodyResult.data);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400, undefined, undefined, requestId);
    }

    const saved = await saveLessonProgress(user.id, validation.data);
    return apiSuccess(saved);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to record lesson progress";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to record lesson progress", requestId);
  }
}

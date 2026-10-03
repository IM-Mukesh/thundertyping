import "server-only";
import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError, safeInternalError } from "@/lib/server/errors";
import { saveTypingResult, getTypingResultsHistory } from "@/lib/server/typing-results";
import { validateTypingResultInput } from "@/lib/server/validation";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { createRequestId, readBoundedJson, hasTrustedMutationOrigin } from "@/lib/server/security";

export async function GET(request: NextRequest) {
  const requestId = createRequestId();
  try {
    if (!hasTrustedMutationOrigin(request)) return apiError("FORBIDDEN", "Invalid request origin", 403, undefined, undefined, requestId);
    const { user } = await requireAuthUser();
    const limitParam = request.nextUrl.searchParams.get("limit");
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : 50;
    const safeLimit = Math.max(1, Math.min(100, Number.isFinite(parsedLimit) ? parsedLimit : 50));

    const history = await getTypingResultsHistory(user.id, safeLimit);
    return apiSuccess(history);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to load typing history", requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  try {
    const { user } = await requireAuthUser();

    // Rate limit typing results submissions (max 60 per minute per user)
    const rateLimit = await checkRateLimit(`typing_results:post:${user.id}`, 60, 60);
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

    const bodyResult = await readBoundedJson<unknown>(request, 32768);
    if (!bodyResult.ok) {
      return apiError("INVALID_INPUT", bodyResult.error, bodyResult.status, undefined, undefined, requestId);
    }

    const validation = validateTypingResultInput(bodyResult.data);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400, undefined, undefined, requestId);
    }

    const saved = await saveTypingResult(user.id, validation.data);
    return apiSuccess(saved);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to record typing result";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to record typing result", requestId);
  }
}

import "server-only";
import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError, safeInternalError } from "@/lib/server/errors";
import { issueTypingRunChallenge } from "@/lib/server/typing-proof";
import { isUuid } from "@/lib/games/game-result-contract";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { createRequestId, readBoundedJson, hasTrustedMutationOrigin } from "@/lib/server/security";

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  try {
    if (!hasTrustedMutationOrigin(request)) {
      return apiError("FORBIDDEN", "Invalid request origin", 403, undefined, undefined, requestId);
    }

    const { user } = await requireAuthUser();

    // Rate limit typing challenges per user (max 60 per minute)
    const rateLimit = await checkRateLimit(`typing_challenges:post:${user.id}`, 60, 60);
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

    const bodyResult = await readBoundedJson<Record<string, unknown>>(request, 2048);
    if (!bodyResult.ok) {
      return apiError("INVALID_INPUT", bodyResult.error, bodyResult.status, undefined, undefined, requestId);
    }

    const p = bodyResult.data;
    if (!p || typeof p !== "object") {
      return apiError("INVALID_INPUT", "Payload must be an object", 400, undefined, undefined, requestId);
    }

    if (!isUuid(p.runId)) {
      return apiError("INVALID_INPUT", "runId must be a valid UUID", 400, undefined, undefined, requestId);
    }

    const mode = typeof p.mode === "string" ? p.mode.slice(0, 32) : "time";
    const param = typeof p.param === "string" ? p.param.slice(0, 32) : "60";

    const challenge = issueTypingRunChallenge(p.runId, mode, param, user.id);

    return apiSuccess({
      challengeId: challenge.challengeId,
      runId: challenge.runId,
      mode: challenge.mode,
      param: challenge.param,
      issuedAt: challenge.issuedAt,
      token: challenge.token,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to issue typing challenge";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to issue typing challenge", requestId);
  }
}

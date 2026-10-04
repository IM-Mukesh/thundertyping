import "server-only";
import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError, safeInternalError } from "@/lib/server/errors";
import { saveGameScore, getUserGameBests, GameSettlementUnavailable, GameRunConflict } from "@/lib/server/game-scores";
import { validateGameScoreInput } from "@/lib/server/validation";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { createRequestId, readBoundedJson, hasTrustedMutationOrigin } from "@/lib/server/security";

export async function GET(request: NextRequest) {
  const requestId = createRequestId();
  try {
    const { user } = await requireAuthUser();
    const owner = request.headers.get("X-Game-Owner");
    if (owner && owner !== user.id) return apiError("ACCOUNT_CHANGED", "Your account changed. Reload your game bests.", 409, undefined, undefined, requestId);
    const bests = await getUserGameBests(user.id);
    return apiSuccess(bests);
  } catch (error: unknown) {
    if (error instanceof GameSettlementUnavailable) return apiError("GAME_SETTLEMENT_UNAVAILABLE", error.message, 503, undefined, undefined, requestId);
    const msg = error instanceof Error ? error.message : "Authentication required";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to load game bests", requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  try {
    if (!hasTrustedMutationOrigin(request)) return apiError("FORBIDDEN", "Invalid request origin", 403, undefined, undefined, requestId);
    const { user } = await requireAuthUser();

    // Rate limit game score submissions (max 60 per minute per user)
    const rateLimit = await checkRateLimit(`games_scores:post:${user.id}`, 60, 60);
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

    const validation = validateGameScoreInput(bodyResult.data);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400, undefined, undefined, requestId);
    }

    if (validation.data.ownerId !== user.id) {
      return apiError("ACCOUNT_CHANGED", "Sign in to the account that started this run before retrying its save.", 409, undefined, undefined, requestId);
    }

    const result = await saveGameScore(user.id, validation.data);
    return apiSuccess(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to record game score";
    if (error instanceof GameSettlementUnavailable) return apiError("GAME_SETTLEMENT_UNAVAILABLE", error.message, 503, undefined, undefined, requestId);
    if (error instanceof GameRunConflict) return apiError("RUN_CONFLICT", error.message, 409, undefined, undefined, requestId);
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to record game score", requestId);
  }
}

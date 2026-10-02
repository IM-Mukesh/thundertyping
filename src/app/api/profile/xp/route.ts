import "server-only";
import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError, safeInternalError } from "@/lib/server/errors";
import { validateXpAwardInput } from "@/lib/server/validation";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { createRequestId, readBoundedJson } from "@/lib/server/security";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  try {
    const { user } = await requireAuthUser();

    const rateLimit = await checkRateLimit(`xp:post:${user.id}`, 30, 60);
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

    // Critical security check: rejects any arbitrary client-selected XP amount
    const validation = validateXpAwardInput(bodyResult.data);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400, undefined, undefined, requestId);
    }

    const { eventType, runId } = validation.data;
    const supabase = createAdminClient();

    // Verify that the event authoritatively exists in the database for this user
    let eventVerified = false;
    if (eventType === "typing_test") {
      const { data } = await supabase
        .from("typing_results")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", runId)
        .maybeSingle();
      eventVerified = Boolean(data);
    } else if (eventType === "game_completion") {
      const { data } = await supabase
        .from("game_scores")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", runId)
        .maybeSingle();
      eventVerified = Boolean(data);
    } else if (eventType === "lesson_completion") {
      const { data } = await supabase
        .from("lesson_attempts")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", runId)
        .maybeSingle();
      eventVerified = Boolean(data);
    }

    if (!eventVerified) {
      return apiError(
        "EVENT_NOT_FOUND",
        "The specified event run could not be verified.",
        404,
        undefined,
        undefined,
        requestId
      );
    }

    // Return the user's authoritative current streak & total XP
    const { data: streak } = await supabase
      .from("player_streaks")
      .select("total_xp")
      .eq("user_id", user.id)
      .maybeSingle();

    return apiSuccess({ totalXp: streak?.total_xp ?? 0 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to process XP event";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, undefined, requestId);
    }
    return safeInternalError(error, "Failed to process XP event", requestId);
  }
}

import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/errors";
import { saveGameScore, getUserGameBests } from "@/lib/server/game-scores";
import { validateGameScoreInput } from "@/lib/server/validation";

export async function GET() {
  try {
    const { user } = await requireAuthUser();
    const bests = await getUserGameBests(user.id);
    return apiSuccess(bests);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    return apiError("UNAUTHORIZED", msg, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuthUser();
    const body = await request.json().catch(() => null);

    const validation = validateGameScoreInput(body);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400);
    }

    const result = await saveGameScore(user.id, validation.data);
    return apiSuccess(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to record game score";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return apiError("INTERNAL_ERROR", msg, 500);
  }
}

import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/errors";
import { awardCloudXp } from "@/lib/server/progress";
import { validateXpAwardInput } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuthUser();
    const body = await request.json().catch(() => null);

    const validation = validateXpAwardInput(body);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400);
    }

    const result = await awardCloudXp(user.id, validation.data.amount);
    return apiSuccess(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to award XP";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return apiError("INTERNAL_ERROR", msg, 500);
  }
}

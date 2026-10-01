import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/errors";
import { getCloudAchievements, grantCloudAchievement } from "@/lib/server/progress";
import { validateAchievementGrantInput } from "@/lib/server/validation";

export async function GET() {
  try {
    const { user } = await requireAuthUser();
    const achievementIds = await getCloudAchievements(user.id);
    return apiSuccess(achievementIds);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    return apiError("UNAUTHORIZED", msg, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuthUser();
    const body = await request.json().catch(() => null);

    const validation = validateAchievementGrantInput(body);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400);
    }

    const granted = await grantCloudAchievement(user.id, validation.data.achievementId);
    return apiSuccess({ granted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to grant achievement";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return apiError("INTERNAL_ERROR", msg, 500);
  }
}

import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/errors";
import { saveLessonProgress, getUserLessonProgress } from "@/lib/server/lesson-progress";
import { validateLessonProgressInput } from "@/lib/server/validation";

export async function GET() {
  try {
    const { user } = await requireAuthUser();
    const progress = await getUserLessonProgress(user.id);
    return apiSuccess(progress);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    return apiError("UNAUTHORIZED", msg, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuthUser();
    const body = await request.json().catch(() => null);

    const validation = validateLessonProgressInput(body);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400);
    }

    const saved = await saveLessonProgress(user.id, validation.data);
    return apiSuccess(saved);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to record lesson progress";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return apiError("INTERNAL_ERROR", msg, 500);
  }
}

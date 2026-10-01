import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/errors";
import { getUserPreferences, updateUserPreferences } from "@/lib/server/profiles";
import { validatePreferencesInput } from "@/lib/server/validation";

export async function GET() {
  try {
    const { user } = await requireAuthUser();
    const data = await getUserPreferences(user.id);
    return apiSuccess(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    return apiError("UNAUTHORIZED", msg, 401);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuthUser();
    const body = await request.json().catch(() => null);

    const validation = validatePreferencesInput(body);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400);
    }

    const updated = await updateUserPreferences(user.id, validation.data);
    return apiSuccess(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update preferences";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return apiError("INTERNAL_ERROR", msg, 500);
  }
}

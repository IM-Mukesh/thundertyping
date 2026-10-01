import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/errors";
import { getUserProfile, updateUserProfile } from "@/lib/server/profiles";
import { validateProfileUpdateInput } from "@/lib/server/validation";

export async function GET() {
  try {
    const { user } = await requireAuthUser();
    console.info("[api/profile] authenticated", { userId: user.id, email: user.email });
    const data = await getUserProfile(user.id);
    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
      ...data,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    console.error("[api/profile] authentication/profile lookup failed", { message: msg });
    return apiError("UNAUTHORIZED", msg, 401);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireAuthUser();
    const body = await request.json().catch(() => null);

    const validation = validateProfileUpdateInput(body);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400);
    }

    const updated = await updateUserProfile(user.id, validation.data);
    return apiSuccess(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update profile";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    if (msg.includes("already taken")) {
      return apiError("CONFLICT", msg, 409);
    }
    return apiError("INTERNAL_ERROR", msg, 500);
  }
}

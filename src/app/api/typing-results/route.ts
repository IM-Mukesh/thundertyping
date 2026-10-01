import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/errors";
import { saveTypingResult, getTypingResultsHistory } from "@/lib/server/typing-results";
import { validateTypingResultInput } from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuthUser();
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const history = await getTypingResultsHistory(user.id, Number.isFinite(limit) ? limit : 50);
    return apiSuccess(history);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication required";
    return apiError("UNAUTHORIZED", msg, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuthUser();
    const body = await request.json().catch(() => null);

    const validation = validateTypingResultInput(body);
    if (!validation.valid) {
      return apiError("INVALID_INPUT", validation.message, 400);
    }

    const saved = await saveTypingResult(user.id, validation.data);
    return apiSuccess(saved);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to record typing result";
    if (msg === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return apiError("INTERNAL_ERROR", msg, 500);
  }
}

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { startFruitFuryRun } from "@/lib/server/fruit-fury-evaluator";
import { requireAuthUser } from "@/lib/server/auth";
import { checkRateLimit, getRateLimitHeaders, getClientIp } from "@/lib/server/rate-limit";
import { createRequestId, hasTrustedMutationOrigin } from "@/lib/server/security";

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  try {
    if (!hasTrustedMutationOrigin(request)) {
      return NextResponse.json(
        { error: "Invalid request origin", requestId },
        { status: 403 }
      );
    }

    const { user } = await requireAuthUser().catch(() => ({ user: null }));
    const ip = getClientIp(request);
    const rateLimitKey = user?.id
      ? `fruit_fury:start:user:${user.id}`
      : `fruit_fury:start:ip:${ip}`;
    const limit = user?.id ? 30 : 15; // 30 runs/min for authenticated, 15 runs/min for anonymous

    const rateLimit = await checkRateLimit(rateLimitKey, limit, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many run initialization requests. Please wait a moment before trying again.", requestId },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    const result = await startFruitFuryRun(user?.id);
    return NextResponse.json(result, { status: 200, headers: getRateLimitHeaders(rateLimit) });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to start run", requestId },
      { status: 400 }
    );
  }
}

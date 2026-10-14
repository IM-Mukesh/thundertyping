import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { advanceFruitFuryChunk, type FruitFuryEvent } from "@/lib/server/fruit-fury-evaluator";
import { FruitFuryPersistenceError, CHUNK_SIZE } from "@/lib/server/fruit-fury-state";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { createRequestId, readBoundedJson, hasTrustedMutationOrigin } from "@/lib/server/security";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_REGEX = /^[0-9a-f]{64}$/i;
const ALLOWED_EVENT_TYPES = new Set(["slice", "miss", "bomb", "drop"]);

interface WavePayload {
  runId: string;
  token: string;
  events: FruitFuryEvent[];
}

function isValidWavePayload(data: unknown): data is WavePayload {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;

  if (typeof d.runId !== "string" || !UUID_REGEX.test(d.runId)) return false;
  if (typeof d.token !== "string" || !TOKEN_REGEX.test(d.token)) return false;
  if (!Array.isArray(d.events) || d.events.length === 0 || d.events.length > CHUNK_SIZE) return false;

  for (const ev of d.events) {
    if (!ev || typeof ev !== "object") return false;
    const e = ev as Record<string, unknown>;
    if (typeof e.t !== "number" || !Number.isFinite(e.t) || e.t < 0 || e.t > 3600000) return false;
    if (typeof e.type !== "string" || !ALLOWED_EVENT_TYPES.has(e.type)) return false;
    if (e.fruitType !== undefined && (typeof e.fruitType !== "string" || e.fruitType.length > 32)) {
      return false;
    }
  }

  return true;
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  try {
    if (!hasTrustedMutationOrigin(request)) {
      return NextResponse.json(
        { error: "Invalid request origin", requestId },
        { status: 403 }
      );
    }

    // 16KB bounded payload parse
    const bodyResult = await readBoundedJson<unknown>(request, 16384);
    if (!bodyResult.ok) {
      return NextResponse.json(
        { error: bodyResult.error, requestId },
        { status: bodyResult.status }
      );
    }

    if (!isValidWavePayload(bodyResult.data)) {
      return NextResponse.json(
        { error: "Invalid payload", requestId },
        { status: 400 }
      );
    }

    const { runId, token, events } = bodyResult.data;

    // Rate limit per active run (max 60 chunk evaluations per minute per run)
    const rateLimit = await checkRateLimit(`fruit_fury:wave:run:${runId}`, 60, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many chunk submissions. Please wait a moment before trying again.", requestId },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    const result = await advanceFruitFuryChunk(runId, token, events);
    return NextResponse.json(result, { status: 200, headers: getRateLimitHeaders(rateLimit) });
  } catch (err: unknown) {
    if (err instanceof FruitFuryPersistenceError) {
      return NextResponse.json(
        { error: "Database/persistence failure", requestId },
        { status: 503 }
      );
    }
    const message = (err as Error).message;
    const status = message === "Run has expired" ? 410 : 403;
    return NextResponse.json({ error: message, requestId }, { status });
  }
}

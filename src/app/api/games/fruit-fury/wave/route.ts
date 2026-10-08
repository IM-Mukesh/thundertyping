import { NextResponse } from "next/server";
import { advanceFruitFuryChunk } from "@/lib/server/fruit-fury-evaluator";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { runId, token, events } = body;
    if (!runId || !token || !Array.isArray(events)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const result = await advanceFruitFuryChunk(runId, token, events);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 403 });
  }
}

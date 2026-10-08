import { NextResponse } from "next/server";
import { startFruitFuryRun } from "@/lib/server/fruit-fury-evaluator";
import { requireAuthUser } from "@/lib/server/auth";

export async function POST() {
  try {
    const { user } = await requireAuthUser().catch(() => ({ user: null }));
    const result = await startFruitFuryRun(user?.id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

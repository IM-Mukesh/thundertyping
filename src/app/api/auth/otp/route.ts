import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email;
    const redirectTo = body?.redirectTo;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error("[api/auth/otp] Supabase error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send verification code";
    console.error("[api/auth/otp] Unexpected error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

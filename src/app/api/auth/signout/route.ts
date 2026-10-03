import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[api/auth/signout] Supabase signOut error:", err);
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      try {
        cookieStore.delete(cookie.name);
      } catch {
        // Ignore deletion errors
      }
    }
  }

  const response = NextResponse.json({ success: true });
  // Explicitly ensure response headers expire cookies as well
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}

export function GET() {
  return NextResponse.json({ error: "Use POST to sign out" }, { status: 405, headers: { Allow: "POST" } });
}

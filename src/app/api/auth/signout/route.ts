import { NextResponse, type NextRequest } from "next/server";
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

export async function GET(request: NextRequest) {
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

  const url = new URL(request.url);
  const redirectPath = url.searchParams.get("redirect") || "/auth/login";
  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}

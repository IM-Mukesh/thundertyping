import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Retrieves the currently authenticated Supabase user on the server.
 * Uses `supabase.auth.getUser()`, which validates the JWT securely with the Supabase Auth server.
 */
export async function getAuthenticatedUser(): Promise<{ user: User | null; supabase: Awaited<ReturnType<typeof createClient>> }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!error && user) {
    return { user, supabase };
  }

  // getUser() re-verifies the JWT against Supabase's auth server over the
  // network, unlike the local cookie read getSession() does -- right after a
  // fresh sign-in this can transiently fail before the new token finishes
  // propagating, even though the session cookie itself is valid. Retry once,
  // but only when a session cookie is actually present: a genuine guest
  // request has none, and shouldn't pay this latency on every call.
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const hasSessionCookie = cookieStore
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (hasSessionCookie) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const retry = await supabase.auth.getUser();
    if (!retry.error && retry.data.user) {
      return { user: retry.data.user, supabase };
    }
  }

  return { user: null, supabase };
}

/**
 * Enforces server-side authentication. Throws an error or returns the verified User object.
 */
export async function requireAuthUser(): Promise<{ user: User; supabase: Awaited<ReturnType<typeof createClient>> }> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return { user, supabase };
}

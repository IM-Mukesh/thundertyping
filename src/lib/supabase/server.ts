import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Returns a typed Supabase client for Server Components, Route Handlers, and Server Actions.
 * Safely accesses cookies via Next.js next/headers.
 *
 * Strictly requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * (falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY if set).
 *
 * No hardcoded project URLs or placeholder fallbacks are permitted.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing Supabase server environment variable: NEXT_PUBLIC_SUPABASE_URL is not defined."
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing Supabase server environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not defined."
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have a proxy / middleware refreshing user sessions.
        }
      },
    },
  });
}

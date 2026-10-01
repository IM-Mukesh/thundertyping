import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Returns a typed Supabase client for use in browser / Client Components.
 * Strictly requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * (falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY if set).
 *
 * No hardcoded project URLs or placeholder fallbacks are permitted.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing Supabase browser environment variable: NEXT_PUBLIC_SUPABASE_URL is not defined."
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing Supabase browser environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not defined."
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}

export const getSupabaseBrowserClient = createClient;

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Creates a privileged Supabase client for validated server-side writes.
 *
 * Uses the NEW Supabase API key model (SUPABASE_SECRET_KEY).
 * Supports SUPABASE_SERVICE_ROLE_KEY as a backward-compatible fallback.
 *
 * CRITICAL SECURITY INVARIANTS:
 * 1. Server-Only: This client MUST NEVER be imported into Client Components.
 * 2. Key Confidentiality: SUPABASE_SECRET_KEY is never prefixed with NEXT_PUBLIC_.
 * 3. Session Isolation: Does NOT read cookies, store sessions, or attach user JWTs.
 * 4. Prior Validation: All inputs MUST be strictly validated before invoking database writes.
 * 5. Identity Derivation: Writes MUST bind user_id directly from requireAuthUser(),
 *    never from untrusted client payloads.
 * 6. No Fallbacks: No hardcoded project URLs or placeholder keys are permitted.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Primary: New Supabase API key model (sb_secret_...)
  // Fallback: Legacy service role key if legacy environment variables are in use
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing Supabase admin URL: NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables."
    );
  }

  if (!secretKey) {
    throw new Error(
      "Missing Supabase admin key: SUPABASE_SECRET_KEY is not configured in environment variables."
    );
  }

  return createClient<Database>(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

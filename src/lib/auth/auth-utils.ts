/**
 * Authentication utilities and heuristics for HeroTyping.
 * Accurately determines if an authenticated session represents a first-time signup
 * vs an existing returning user logging in.
 */

export interface AuthUserTimestamps {
  created_at?: string | null;
  last_sign_in_at?: string | null;
}

/**
 * Evaluates whether an authenticated user object represents a brand new signup.
 *
 * Evaluation logic:
 * 1. User must exist and have a valid `created_at` timestamp.
 * 2. If account age (`nowMs - createdAtMs`) is <= `thresholdMs` (default 60,000ms / 1 min),
 *    the account was just created during this auth exchange.
 * 3. Fallback: If `last_sign_in_at` and `created_at` are within 2,000ms of each other,
 *    and account age is under 5 minutes (handling slower mobile OAuth handshakes),
 *    it is classified as a new user.
 * 4. In all other cases (e.g. account created yesterday or hours ago), returns false (existing user).
 */
export function isNewAuthUser(
  user: AuthUserTimestamps | null | undefined,
  nowMs: number = Date.now(),
  thresholdMs: number = 60000
): boolean {
  if (!user || !user.created_at) {
    return false;
  }

  const createdAtMs = new Date(user.created_at).getTime();
  if (isNaN(createdAtMs) || createdAtMs <= 0) {
    return false;
  }

  const ageMs = nowMs - createdAtMs;

  // Protect against severe future clock skew (> 5000ms in the future)
  if (ageMs < -5000) {
    return false;
  }

  // Account created within the last 60 seconds
  if (ageMs <= thresholdMs) {
    return true;
  }

  // Fallback: initial sign-in where created_at and last_sign_in_at match
  if (user.last_sign_in_at) {
    const lastSignInMs = new Date(user.last_sign_in_at).getTime();
    if (!isNaN(lastSignInMs) && Math.abs(lastSignInMs - createdAtMs) < 2000 && ageMs < 300000) {
      return true;
    }
  }

  return false;
}

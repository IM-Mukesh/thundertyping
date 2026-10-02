import "server-only";

/**
 * Retries an optimistic-concurrency-controlled read-modify-write. `fn` must
 * throw an Error whose message starts with "CONFLICT" when its write was
 * lost to a concurrent writer (e.g. a compare-and-swap update matched zero
 * rows, or an insert hit a unique-constraint violation), so a fresh read can
 * be attempted. Any other error is not retried.
 */
export async function withOptimisticRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!(err instanceof Error) || !err.message.startsWith("CONFLICT")) {
        throw err;
      }
    }
  }
  throw lastErr;
}

export const UNIQUE_VIOLATION = "23505";

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Refreshes auth tokens stored in cookies and updates request/response headers.
 * Used by Next.js 16 Proxy (`src/proxy.ts`).
 */
export async function updateSession(
  request: NextRequest,
  createResponse: () => NextResponse = () => NextResponse.next({ request })
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Do not interfere with callback exchange or signout
  if (
    pathname.startsWith("/api/auth/callback") ||
    pathname.startsWith("/api/auth/signout")
  ) {
    return createResponse();
  }

  // If there are no Supabase auth cookies present, this is a guest visitor.
  // Avoid network roundtrip on every page navigation.
  const authCookies = request.cookies
    .getAll()
    .filter((c) => c.name.startsWith("sb-") && c.value && c.value.trim().length > 0);
  const hasAuthCookies = authCookies.length > 0;

  if (!hasAuthCookies) {
    return createResponse();
  }

  let supabaseResponse = createResponse();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const timeoutMs = 2500;
  const abortController = new AbortController();
  const timer = setTimeout(() => {
    abortController.abort(new Error(`Supabase auth getUser timed out after ${timeoutMs}ms`));
  }, timeoutMs);
  timer.unref?.();

  try {
    // Pass active abort signal to underlying network fetches so timed-out requests
    // or cancelled client requests are actively aborted at the socket layer.
    const boundedFetch: typeof fetch = (input, init) => {
      const signals: AbortSignal[] = [abortController.signal];
      if (request.signal) signals.push(request.signal);
      if (init?.signal) signals.push(init.signal);

      const signal = typeof AbortSignal.any === "function" ? AbortSignal.any(signals) : abortController.signal;
      return fetch(input, { ...init, signal });
    };

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      global: {
        fetch: boundedFetch,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = createResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh auth session with active socket-level cancellation on timeout or client abort.
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((_, reject) => {
      if (abortController.signal.aborted) {
        reject(new Error(`Supabase auth getUser timed out after ${timeoutMs}ms`));
      } else if (request.signal?.aborted) {
        reject(new Error("Client request aborted"));
      } else {
        abortController.signal.addEventListener(
          "abort",
          () => reject(new Error(`Supabase auth getUser timed out after ${timeoutMs}ms`)),
          { once: true }
        );
        if (request.signal) {
          request.signal.addEventListener(
            "abort",
            () => reject(new Error("Client request aborted")),
            { once: true }
          );
        }
      }
    });

    await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise,
    ]);
  } catch (err) {
    // If token refresh fails, times out, or is aborted, don't crash or block the proxy - allow request to proceed safely
    console.warn("[proxy] session refresh failed or timed out:", err instanceof Error ? err.message : err);
  } finally {
    clearTimeout(timer);
  }

  return supabaseResponse;
}

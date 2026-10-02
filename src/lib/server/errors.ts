import "server-only";
import { NextResponse } from "next/server";

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiFailure;

const DEFAULT_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
};

export function apiSuccess<T>(
  data: T,
  status = 200,
  extraHeaders?: HeadersInit
): NextResponse<ApiSuccess<T>> {
  const headers = new Headers(DEFAULT_HEADERS);
  if (extraHeaders) {
    new Headers(extraHeaders).forEach((val, key) => headers.set(key, val));
  }
  return NextResponse.json({ success: true, data }, { status, headers });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  extraHeaders?: HeadersInit,
  requestId?: string
): NextResponse<ApiFailure> {
  const headers = new Headers(DEFAULT_HEADERS);
  if (extraHeaders) {
    new Headers(extraHeaders).forEach((val, key) => headers.set(key, val));
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
        ...(requestId ? { requestId } : {}),
      },
    },
    { status, headers }
  );
}

/**
 * Sanitizes internal/unhandled errors to prevent information disclosure
 * (such as database column names, Postgres syntax errors, secret keys, or stack traces).
 */
export function safeInternalError(
  error: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again later.",
  requestId?: string,
  extraHeaders?: HeadersInit
): NextResponse<ApiFailure> {
  const rawMessage = error instanceof Error ? error.message : String(error);
  // Log full internal details securely on the server with correlation ID
  console.error(`[INTERNAL_ERROR][${requestId || "no-req-id"}]`, error);

  // If the error is an authorization error, return 401
  if (rawMessage === "UNAUTHORIZED") {
    return apiError("UNAUTHORIZED", "Authentication required", 401, undefined, extraHeaders, requestId);
  }

  // Never return raw DB errors or stack traces to client
  return apiError(
    "INTERNAL_ERROR",
    fallbackMessage,
    500,
    undefined,
    extraHeaders,
    requestId
  );
}

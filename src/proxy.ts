import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 Request Proxy.
 * Refreshes Supabase session tokens on incoming requests.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static file extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .opus, .webmanifest)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|opus|webmanifest)$).*)",
  ],
};

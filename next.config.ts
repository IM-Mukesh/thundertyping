import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Lets a phone on the same Wi-Fi load the dev server for real-device testing.
   *
   * Next blocks cross-origin requests to dev-only assets (HMR, the error
   * overlay) by default, allowing only localhost and the hostname the server
   * started with. Hitting the machine's LAN IP from a phone is a different
   * hostname, so HMR is refused and the page loads but never hot-reloads.
   *
   * Only the Origin/Referer *hostname* is matched — scheme, port, path and
   * query are ignored — so these entries carry no `http://` and no port, and
   * stay correct regardless of which port `next dev` lands on. A single `*`
   * stands in for exactly one label, so each entry below covers every host on
   * that private subnet and survives a DHCP lease change.
   *
   * Dev-only: this has no effect on `next build` or the Vercel deployment.
   * The ranges are the RFC 1918 private ones, so it cannot expose the dev
   * server to a public origin.
   */
  allowedDevOrigins: ["10.254.181.*", "192.168.*.*", "172.16.*.*"],

  /**
   * Keeps the build's file tracer out of directories it has no business in.
   *
   * `next build` runs @vercel/nft over the project to work out which files a
   * deployment needs. `assets-raw/` holds the uncompressed source art and audio
   * -- several hundred megabytes that are deliberately gitignored and never
   * imported -- so tracing it is pure wasted IO. The tooling directories are
   * listed for the same reason.
   *
   * Note this is NOT the fix for a "Permission denied .../.claude/workflows"
   * build failure. That one is the sandbox denying reads under `.claude/`, not
   * the tracer misbehaving, and it does not reproduce outside a sandbox or on
   * Vercel, where the directory does not exist at all.
   */
  outputFileTracingExcludes: {
    "*": [".claude/**/*", ".mcp.json", "assets-raw/**/*"],
  },

  images: {
    /**
     * Allowed `quality` values for next/image. Next only generates variants at
     * qualities named here, so an unlisted value is rejected at build time.
     *
     * 75 is the default and covers everything the reader actually looks at. 45
     * exists for decorative backdrops -- art sitting at 60-70% opacity under
     * two gradient overlays, where the compression artefacts are invisible and
     * the file is otherwise the single heaviest thing on the page.
     */
    qualities: [45, 75],
  },

  async headers() {
    // Supabase calls from the browser (auth session/token exchange) go
    // straight to the project's own REST/Auth endpoint, not through our API
    // routes, so it needs to be an explicit connect-src origin.
    const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const isDev = process.env.NODE_ENV === "development";

    // React 19 / Next.js dev tooling (Fast Refresh, error overlay, callstack reconstruction)
    // requires eval() in development mode. 'unsafe-eval' is strictly excluded in production.
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://pagead2.googlesyndication.com",
      "https://accounts.google.com/gsi/client",
    ].join(" ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
              "img-src 'self' blob: data: https://www.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com",
              "font-src 'self' data:",
              `connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://accounts.google.com/gsi/ ${supabaseOrigin}`.trim(),
              "media-src 'self' blob: data:",
              "frame-src 'self' https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://accounts.google.com",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      // Vercel's edge adds `Access-Control-Allow-Origin: *` by default to
      // static/prerendered output (the cache-control: public, max-age=0,
      // must-revalidate signature on pages like /, /profile, /auth/login,
      // and the 404 page -- confirmed in production) when the origin
      // response doesn't already set the header itself. That default is
      // harmless for a plain page load (CORS only governs cross-origin
      // fetch/XHR reading a response body, not navigation), but it's
      // unnecessary for a site with no legitimate cross-origin consumer,
      // and a blanket wildcard is the wrong thing to have sitting around if
      // a future route ever reuses this response shape for something
      // sensitive. Setting it explicitly to the canonical origin here is
      // enough for Vercel to skip its own default (CDN "fill the gap"
      // defaults don't double up on headers the origin already set).
      //
      // Deliberately scoped to exclude /api/*: API routes already emit no
      // CORS header at all (confirmed in production), which is the
      // correct state for same-origin-only APIs per the audit's own
      // guidance ("prefer no CORS header rather than broad CORS" over
      // adding an explicit one where none is needed) -- this rule must not
      // change that.
      {
        source: "/((?!api/).*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_SITE_URL ?? "https://herotyping.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

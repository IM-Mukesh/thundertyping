import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Defense in depth alongside each page's own `robots: { index: false }`
      // meta tag (profile/page.tsx, debug/typing-engine/page.tsx,
      // auth/login/layout.tsx) -- a crawler that ignores meta robots for some
      // reason still gets stopped here. /profile is per-visitor local state
      // with no standalone search value; /debug is a dev-only utility page;
      // /auth/login is a sign-in form with no content worth indexing.
      disallow: [
        "/profile", "/debug", "/auth/login",
        "/es/profile", "/es/debug", "/es/auth/login",
        "/pt-br/profile", "/pt-br/debug", "/pt-br/auth/login",
        "/de/profile", "/de/debug", "/de/auth/login"
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

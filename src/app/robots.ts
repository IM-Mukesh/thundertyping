import type { MetadataRoute } from "next";
import { IS_PREVIEW, SITE_URL } from "@/lib/seo/constants";

export default function robots(): MetadataRoute.Robots {
  // In preview environments, crawlers must be allowed to fetch pages so they can
  // read the `<meta name="robots" content="noindex, nofollow"/>` directive (and
  // `X-Robots-Tag: noindex, nofollow` HTTP header).
  // Google Search documentation explicitly warns:
  // "For the noindex rule to be effective, the page must not be blocked by a robots.txt file.
  // If the page is blocked by robots.txt, the crawler will never see the noindex rule."
  // Blocking with `disallow: "/"` prevents crawlers from seeing `noindex` and causes
  // "Indexed, though blocked by robots.txt" conflicts. Previews allow fetching while
  // omitting the sitemap.
  if (IS_PREVIEW) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/debug", "/api/"],
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /profile and /auth/login (and localized variants) explicitly emit
      // `robots: { index: false, follow: true }` metadata directives. Crawlers
      // must be allowed to fetch them to read the noindex tag (blocking in
      // robots.txt prevents crawlers from seeing noindex, causing Search
      // Console "Indexed though blocked by robots.txt" conflicts).
      // Only internal APIs and dev/diagnostic endpoints are disallowed here.
      disallow: ["/debug", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

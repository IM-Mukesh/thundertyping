import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/constants";

// Each route's lastModified is the date its content was actually last
// changed, set by hand at edit time — not `new Date()` evaluated per
// request, which would falsely tell crawlers every page changed on every
// crawl. Bump a route's date only when you actually change that page.
const routes: {
  path: string;
  priority: number;
  changeFrequency: "daily" | "monthly";
  lastModified: string;
}[] = [
  { path: "", priority: 1, changeFrequency: "daily", lastModified: "2026-09-15" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly", lastModified: "2026-09-14" },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly", lastModified: "2026-09-14" },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly", lastModified: "2026-09-14" },
  {
    path: "/guides/how-to-improve-typing-speed",
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: "2026-09-15",
  },
  { path: "/games", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-09-15" },
  {
    path: "/games/falling-words",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-09-15",
  },
  { path: "/games/word-rain", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-09-15" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority, changeFrequency, lastModified }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}

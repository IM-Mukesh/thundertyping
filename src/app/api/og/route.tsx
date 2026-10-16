import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import { ogImageElement } from "@/lib/seo/og-image";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "HeroTyping Guide";
  const subtitle =
    searchParams.get("subtitle") ||
    "Free Touch Typing Guides, Speed Benchmarks & Technique";
  const category = searchParams.get("category") || "GUIDE";

  return new ImageResponse(
    ogImageElement({
      eyebrow: category,
      title,
      subtitle,
      tags: ["Speed", "Accuracy", "Technique"],
    }),
    {
      width: 1200,
      height: 630,
    },
  );
}

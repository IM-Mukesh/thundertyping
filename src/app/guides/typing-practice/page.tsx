import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { GuideCategoryView } from "@/components/guides/guide-category-view";
import { GUIDE_CATEGORIES } from "@/lib/guides/guide-registry";

export const metadata: Metadata = pageMetadata({
  title: GUIDE_CATEGORIES["typing-practice"].title,
  description: GUIDE_CATEGORIES["typing-practice"].description,
  path: GUIDE_CATEGORIES["typing-practice"].path,
});

export default function TypingPracticeCategoryPage() {
  return <GuideCategoryView categoryId="typing-practice" />;
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { GuideCategoryView } from "@/components/guides/guide-category-view";
import { GUIDE_CATEGORIES } from "@/lib/guides/guide-registry";

export const metadata: Metadata = pageMetadata({
  title: GUIDE_CATEGORIES["typing-basics"].title,
  description: GUIDE_CATEGORIES["typing-basics"].description,
  path: GUIDE_CATEGORIES["typing-basics"].path,
});

export default function TypingBasicsCategoryPage() {
  return <GuideCategoryView categoryId="typing-basics" />;
}

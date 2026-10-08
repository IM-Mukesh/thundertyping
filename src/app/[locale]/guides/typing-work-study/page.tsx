import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { GuideCategoryView } from "@/components/guides/guide-category-view";
import { GUIDE_CATEGORIES } from "@/lib/guides/guide-registry";

export const metadata: Metadata = pageMetadata({
  title: GUIDE_CATEGORIES["typing-work-study"].title,
  description: GUIDE_CATEGORIES["typing-work-study"].description,
  path: GUIDE_CATEGORIES["typing-work-study"].path,
});

export default function TypingWorkStudyCategoryPage() {
  return <GuideCategoryView categoryId="typing-work-study" />;
}

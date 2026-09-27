import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { GuideCategoryView } from "@/components/guides/guide-category-view";
import { GUIDE_CATEGORIES } from "@/lib/guides/guide-registry";

export const metadata: Metadata = pageMetadata({
  title: GUIDE_CATEGORIES["typing-tests-tools"].title,
  description: GUIDE_CATEGORIES["typing-tests-tools"].description,
  path: GUIDE_CATEGORIES["typing-tests-tools"].path,
});

export default function TypingTestsToolsCategoryPage() {
  return <GuideCategoryView categoryId="typing-tests-tools" />;
}

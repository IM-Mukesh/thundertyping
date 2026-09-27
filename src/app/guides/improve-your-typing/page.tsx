import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { GuideCategoryView } from "@/components/guides/guide-category-view";
import { GUIDE_CATEGORIES } from "@/lib/guides/guide-registry";

export const metadata: Metadata = pageMetadata({
  title: GUIDE_CATEGORIES["improve-your-typing"].title,
  description: GUIDE_CATEGORIES["improve-your-typing"].description,
  path: GUIDE_CATEGORIES["improve-your-typing"].path,
});

export default function ImproveYourTypingCategoryPage() {
  return <GuideCategoryView categoryId="improve-your-typing" />;
}

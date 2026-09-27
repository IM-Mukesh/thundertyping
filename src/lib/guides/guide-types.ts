export type GuideCategory =
  | "typing-basics"
  | "typing-practice"
  | "improve-your-typing"
  | "typing-tests-tools"
  | "keyboard-skills"
  | "typing-work-study";

export interface GuideCategoryMeta {
  id: GuideCategory;
  name: string;
  slug: string;
  path: string;
  title: string;
  description: string;
  shortDescription: string;
  recommendedOrderDescription?: string;
  productRoute: string;
  productLabel: string;
}

export type GuideIntent = "informational" | "practical" | "benchmark" | "tool" | "career";

export interface GuideSource {
  title: string;
  url?: string;
  note?: string;
}

export interface GuideEntry {
  slug: string;
  href: string;
  title: string;
  description: string;
  category: GuideCategory;
  primaryTopic: string;
  intent: GuideIntent;
  readingTimeMinutes: number;
  featured?: boolean;
  recommendedSequenceOrder?: number;
  relatedGuides: string[];
  relatedProductRoute: string;
  relatedProductLabel: string;
  heroImage?: string;
  expectedHeroImage?: string;
  articleImages?: string[];
  expectedArticleImages?: string[];
  sources?: GuideSource[];
  publishedAt: string;
  updatedAt: string;
}

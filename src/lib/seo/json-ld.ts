import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/constants";

/**
 * Sitewide identity, emitted once from the root layout so it's present on
 * every page rather than duplicated per-route. `logo` points at the actual
 * shipped mark (public/brand/hero-mark.png) -- no fabricated founding date,
 * address, or social profiles that don't exist.
 */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/hero-mark.png`,
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function buildWebApplicationSchema(input?: {
  path?: string;
  name?: string;
  description?: string;
  inLanguage?: string;
}) {
  const path = input?.path ?? "";
  const name = input?.name ?? SITE_NAME;
  const description = input?.description ?? SITE_DESCRIPTION;
  const url = path ? `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}` : SITE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url,
    description,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    ...(input?.inLanguage ? { inLanguage: input.inLanguage } : {}),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

interface ArticleSchemaInput {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  inLanguage?: string;
  image?: string;
}

export function buildArticleSchema({
  headline,
  description,
  path,
  datePublished,
  dateModified,
  inLanguage = "en",
  image,
}: ArticleSchemaInput) {
  const url = `${SITE_URL}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    inLanguage,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: image ?? `${SITE_URL}/opengraph-image`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: "Mukesh",
      url: `${SITE_URL}/about`,
      jobTitle: "Founder & Developer",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/hero-mark.png`,
      },
    },
  };
}

/** One crumb in a trail, in order from the site root. `path` is site-relative ("/games/word-blaster"); the root itself is added automatically. */
export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[], locale?: string) {
  const isDefaultLocale = !locale || locale === "en";
  const homePath = isDefaultLocale ? "/" : `/${locale}`;
  const localizedItems: BreadcrumbItem[] = items.map((item) => ({
    name: item.name,
    path: isDefaultLocale || item.path.startsWith(`/${locale}`) ? item.path : `/${locale}${item.path}`,
  }));
  const trail: BreadcrumbItem[] = [{ name: "Home", path: homePath }, ...localizedItems];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

interface GameSchemaInput {
  name: string;
  description: string;
  path: string;
  genre?: string;
}

/** VideoGame is schema.org's dedicated type for a playable browser game -- distinct from Article/WebApplication, and accurate for what these pages actually are. */
export function buildGameSchema({ name, description, path, genre }: GameSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name,
    description,
    url: `${SITE_URL}${path}`,
    genre: genre ?? "Educational",
    applicationCategory: "Game",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

interface FaqItem {
  question: string;
  /** Plain text only -- FAQPage schema doesn't support markup, and the rendered FAQ section carries the real (possibly linked) answer. */
  answer: string;
}

export function buildFaqSchema(items: FaqItem[], inLanguage?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(inLanguage ? { inLanguage } : {}),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

interface LearningResourceSchemaInput {
  name: string;
  description: string;
  path: string;
  educationalLevel: string;
}

/** LearningResource, not Course -- Course carries Google rich-result expectations (course instances, providers) this site doesn't have data for. LearningResource is a valid, accurate schema.org type for a single practice unit without overclaiming. */
export function buildLearningResourceSchema({
  name,
  description,
  path,
  educationalLevel,
}: LearningResourceSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name,
    description,
    url: `${SITE_URL}${path}`,
    educationalLevel,
    learningResourceType: "Interactive typing lesson",
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}

export function buildDefinedTermSetSchema({
  name,
  description,
  path,
  terms,
}: {
  name: string;
  description: string;
  path: string;
  terms: { name: string; description: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name,
    description,
    url: `${SITE_URL}${path}`,
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.name,
      description: t.description,
      inDefinedTermSet: `${SITE_URL}${path}`,
    })),
  };
}


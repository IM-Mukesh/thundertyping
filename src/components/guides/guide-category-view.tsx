import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { GuideCategory } from "@/lib/guides/guide-types";
import { GUIDE_CATEGORIES, getGuidesByCategory } from "@/lib/guides/guide-registry";

interface GuideCategoryViewProps {
  categoryId: GuideCategory;
}

export function GuideCategoryView({ categoryId }: GuideCategoryViewProps) {
  const category = GUIDE_CATEGORIES[categoryId];
  const guides = getGuidesByCategory(categoryId);
  const otherCategories = Object.values(GUIDE_CATEGORIES).filter((c) => c.id !== categoryId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12 sm:px-10">
      <Breadcrumbs
        items={[
          { name: "Guides", path: "/guides" },
          { name: category.name, path: category.path },
        ]}
      />

      {/* Hero Header */}
      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-sub-alt/40 px-3 py-1 text-xs font-medium text-sub">
          <BookOpen size={13} className="text-accent" aria-hidden="true" />
          <span>Category Pillar</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {category.title}
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-foreground/85">
          {category.description}
        </p>
      </header>

      {/* Recommended Learning Path */}
      {category.recommendedOrderDescription && (
        <section aria-labelledby="curriculum-heading" className="rounded-2xl border border-border bg-sub-alt/20 p-6 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
            <Sparkles size={14} aria-hidden="true" />
            <h2 id="curriculum-heading">Recommended Learning Progression</h2>
          </div>
          <p className="mt-2 text-sm text-foreground/80">
            {category.recommendedOrderDescription}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {guides.map((guide, idx) => (
              <Link
                key={guide.slug}
                href={guide.href}
                className="group flex flex-col justify-between rounded-xl border border-border/80 bg-background/60 p-4 transition-colors hover:border-accent hover:bg-sub-alt/30"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-accent">Step 0{idx + 1}</div>
                  <h3 className="mt-1 text-sm font-semibold text-foreground group-hover:text-accent">
                    {guide.title}
                  </h3>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] text-sub">
                  <Clock size={11} aria-hidden="true" />
                  <span>{guide.readingTimeMinutes} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Guides Grid */}
      <section aria-labelledby="all-guides-heading" className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between border-b border-border/80 pb-3">
          <h2 id="all-guides-heading" className="text-xl font-semibold text-foreground">
            All Guides in {category.name} ({guides.length})
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={guide.href}
              className="group flex flex-col justify-between gap-4 rounded-xl border border-border bg-sub-alt/20 p-5 transition-all hover:border-accent hover:bg-sub-alt/30"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-[11px] font-medium text-sub">
                    {guide.primaryTopic}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-sub">
                    <Clock size={11} aria-hidden="true" />
                    {guide.readingTimeMinutes} min
                  </span>
                </div>
                <h3 className="font-medium text-foreground transition-colors group-hover:text-accent">
                  {guide.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/80">{guide.description}</p>
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                <span>Read Full Guide</span>
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Interactive Tool CTA */}
      <section
        aria-label="Interactive practice integration"
        className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-accent/40 bg-accent/5 p-6 sm:flex-row sm:items-center sm:p-7"
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-base font-bold text-foreground">
            Put {category.name} Principles Into Practice
          </h2>
          <p className="text-xs text-sub sm:text-sm">
            Theory without deliberate repetition will not change finger motor memory. Train right now on HeroTyping.
          </p>
        </div>
        <Link
          href={category.productRoute}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-background shadow-md transition-[filter] hover:brightness-110"
        >
          <span>{category.productLabel}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>

      {/* Explore Other Pillars */}
      <section aria-labelledby="other-pillars-heading" className="flex flex-col gap-4 border-t border-border/80 pt-8">
        <h2 id="other-pillars-heading" className="text-base font-semibold text-foreground">
          Explore Other Content Pillars
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {otherCategories.map((other) => (
            <Link
              key={other.id}
              href={other.path}
              className="group flex flex-col gap-1 rounded-xl border border-border bg-sub-alt/10 p-4 transition-colors hover:border-accent hover:bg-sub-alt/20"
            >
              <span className="text-xs font-bold text-foreground group-hover:text-accent">
                {other.name} &rarr;
              </span>
              <span className="text-[11px] leading-relaxed text-sub">{other.shortDescription}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

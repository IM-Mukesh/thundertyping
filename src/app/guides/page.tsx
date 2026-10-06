import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Compass,
  Gauge,
  Keyboard,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { SITE_NAME } from "@/lib/seo/constants";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { pageMetadata } from "@/lib/seo/metadata";
import { GUIDE_CATEGORIES, getGuidesByCategory } from "@/lib/guides/guide-registry";
import type { GuideCategory } from "@/lib/guides/guide-types";
import { GAME_LIST } from "@/lib/games/game-types";

export const metadata: Metadata = pageMetadata({
  title: "Typing Guides & Mastery Curriculum — Speed, Accuracy & Ergonomics",
  description:
    "Comprehensive, practical guides to touch typing mastery: home row ergonomics, speed and accuracy protocols, WPM formulas, and specialized workflows.",
  path: "/guides",
});

interface CategoryHubCard {
  id: GuideCategory;
  icon: typeof Keyboard;
}

const CATEGORY_HUBS: CategoryHubCard[] = [
  { id: "typing-basics", icon: Keyboard },
  { id: "typing-practice", icon: Target },
  { id: "improve-your-typing", icon: TrendingUp },
  { id: "typing-tests-tools", icon: Gauge },
  { id: "keyboard-skills", icon: Layers },
  { id: "typing-work-study", icon: Briefcase },
];

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-12 sm:px-10">
      <Breadcrumbs items={[{ name: "Guides", path: "/guides" }]} />

      {/* Hero Header */}
      <header className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-sub-alt/40 px-3 py-1 text-xs font-medium text-sub">
          <BookOpen size={13} className="text-accent" aria-hidden="true" />
          <span>Curated Knowledge Base</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Typing Guides
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-foreground/85">
          Practical, evidence-backed guides covering touch typing technique, structured practice routines,
          speed and accuracy protocols, typing test metrics, advanced keyboard skills, and workflows for work
          and study. Designed to be read once and actively applied on HeroTyping.
        </p>

        {/* Quick Category Navigation Pills */}
        <nav aria-label="Quick category navigation" className="mt-1 flex flex-wrap gap-2">
          {CATEGORY_HUBS.map(({ id }) => {
            const cat = GUIDE_CATEGORIES[id];
            const count = getGuidesByCategory(id).length;
            return (
              <Link
                key={id}
                href={cat.path}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-sub-alt/30 px-3 py-1.5 text-xs font-medium text-sub transition-colors hover:border-accent hover:text-foreground"
              >
                <span>{cat.name}</span>
                <span className="rounded bg-sub-alt px-1.5 py-0.2 font-mono text-[10px] text-accent">
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Start Here / Foundational Roadmap */}
      <section aria-labelledby="start-here-heading" className="rounded-2xl border border-accent/40 bg-accent/5 p-6 sm:p-7">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
          <Compass size={15} aria-hidden="true" />
          <h2 id="start-here-heading">Start Here: The 3 Core Pillars</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">
          New to deliberate typing training? Begin with these foundational guides before diving into specialized topics:
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Link
            href="/guides/how-to-touch-type"
            className="group flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 p-4 transition-colors hover:border-accent hover:bg-sub-alt/30"
          >
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">Pillar 1: Form</span>
              <h3 className="mt-1 text-sm font-semibold text-foreground group-hover:text-accent">
                How to Touch Type
              </h3>
              <p className="mt-1.5 text-xs text-sub">Home row positioning, tactile anchor bumps, and full finger maps.</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-[11px] text-accent">
              <span>Read guide</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>

          <Link
            href="/guides/how-to-improve-typing-accuracy"
            className="group flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 p-4 transition-colors hover:border-accent hover:bg-sub-alt/30"
          >
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">Pillar 2: Precision</span>
              <h3 className="mt-1 text-sm font-semibold text-foreground group-hover:text-accent">
                How to Improve Typing Accuracy
              </h3>
              <p className="mt-1.5 text-xs text-sub">The 7-step error reduction loop and why speed without accuracy is an illusion.</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-[11px] text-accent">
              <span>Read guide</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>

          <Link
            href="/guides/how-to-improve-typing-speed"
            className="group flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 p-4 transition-colors hover:border-accent hover:bg-sub-alt/30"
          >
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">Pillar 3: Velocity</span>
              <h3 className="mt-1 text-sm font-semibold text-foreground group-hover:text-accent">
                How to Improve Typing Speed
              </h3>
              <p className="mt-1.5 text-xs text-sub">The progression ladder from 30 WPM to 100+ WPM with deliberate practice routines.</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-[11px] text-accent">
              <span>Read guide</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>

      {/* Six Category Hubs */}
      <section aria-labelledby="categories-heading" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
            <Sparkles size={14} aria-hidden="true" />
            <span>Curriculum Pillars</span>
          </div>
          <h2 id="categories-heading" className="text-2xl font-bold tracking-tight text-foreground">
            Explore by Category
          </h2>
          <p className="text-sm text-sub">
            Browse our six dedicated learning hubs to access comprehensive tutorials, benchmarks, and step-by-step progressions.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_HUBS.map(({ id, icon: Icon }) => {
            const category = GUIDE_CATEGORIES[id];
            const guideCount = getGuidesByCategory(id).length;

            return (
              <Link
                key={category.id}
                href={category.path}
                className="group relative flex flex-col justify-between gap-5 rounded-2xl border border-border bg-sub-alt/20 p-6 transition-all hover:border-accent hover:bg-sub-alt/40 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-background/80 text-accent transition-colors group-hover:border-accent/40 group-hover:bg-accent/10">
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-0.5 font-mono text-xs font-medium text-sub group-hover:text-foreground">
                      {guideCount} {guideCount === 1 ? "guide" : "guides"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
                      {category.name}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-foreground/80 sm:text-sm">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <span>Explore category</span>
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Product Connection CTA */}
      <section aria-labelledby="practice-cta-heading" className="rounded-2xl border border-border bg-sub-alt/30 p-6 sm:p-8">
        <h2 id="practice-cta-heading" className="text-lg font-bold text-foreground sm:text-xl">
          Put Theory Into Deliberate Practice
        </h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-sub sm:text-sm">
          Reading guides builds the mental model, but muscle memory develops on the keyboard.
          Every concept in these guides connects directly to interactive training tools on HeroTyping:
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Link
            href="/"
            className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 p-3.5 transition-colors hover:border-accent hover:bg-sub-alt/40"
          >
            <div>
              <span className="text-xs font-bold text-foreground">Typing Speed Test</span>
              <p className="mt-1 text-[11px] text-sub">Benchmark your net WPM &amp; accuracy</p>
            </div>
            <span className="mt-3 text-[11px] font-medium text-accent">Take test &rarr;</span>
          </Link>

          <Link
            href="/lessons"
            className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 p-3.5 transition-colors hover:border-accent hover:bg-sub-alt/40"
          >
            <div>
              <span className="text-xs font-bold text-foreground">28 Curriculum Units</span>
              <p className="mt-1 text-[11px] text-sub">Symmetrical 2-key progression across 3 tiers</p>
            </div>
            <span className="mt-3 text-[11px] font-medium text-accent">Start lessons &rarr;</span>
          </Link>

          <Link
            href="/lessons/practice"
            className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 p-3.5 transition-colors hover:border-accent hover:bg-sub-alt/40"
          >
            <div>
              <span className="text-xs font-bold text-foreground">Adaptive Practice Lab</span>
              <p className="mt-1 text-[11px] text-sub">Target struggling keys with Wilson-score tracking</p>
            </div>
            <span className="mt-3 text-[11px] font-medium text-accent">Drill keys &rarr;</span>
          </Link>

          <Link
            href="/games"
            className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 p-3.5 transition-colors hover:border-accent hover:bg-sub-alt/40"
          >
            <div>
              <span className="text-xs font-bold text-foreground">{GAME_LIST.length} Arcade Games</span>
              <p className="mt-1 text-[11px] text-sub">Build velocity under pressure</p>
            </div>
            <span className="mt-3 text-[11px] font-medium text-accent">Play games &rarr;</span>
          </Link>

          <Link
            href="/vocabulary"
            className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 p-3.5 transition-colors hover:border-accent hover:bg-sub-alt/40"
          >
            <div>
              <span className="text-xs font-bold text-foreground">1,300 Vocabulary Words</span>
              <p className="mt-1 text-[11px] text-sub">Tiered English word pools with audio</p>
            </div>
            <span className="mt-3 text-[11px] font-medium text-accent">Practice words &rarr;</span>
          </Link>
        </div>

        <p className="mt-5 text-[11px] text-sub">
          All tools are free, ad-free, and run locally in your browser. &mdash; {SITE_NAME}
        </p>
      </section>

      {/* Bottom Category Directory Footer */}
      <footer className="flex flex-col gap-3 border-t border-border/60 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-medium text-sub">Explore all categories:</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {CATEGORY_HUBS.map(({ id }) => {
              const cat = GUIDE_CATEGORIES[id];
              return (
                <Link
                  key={id}
                  href={cat.path}
                  className="text-sub transition-colors hover:text-accent"
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}

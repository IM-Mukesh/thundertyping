import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, Keyboard, Sparkles } from "lucide-react";
import { LessonDashboard } from "@/components/lessons/lesson-dashboard";
import { AdSlot } from "@/components/layout/ad-slot";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Learn to Type — Free Touch-Typing Curriculum",
  description:
    "Free touch-typing curriculum with 28 structured lessons across Beginner, Intermediate, and Advanced tiers. Interactive hands, visual keyboard, and real-time adaptive feedback.",
  path: "/lessons",
});

export default function LessonsHubPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8">
      {/* Top Breadcrumb / Title Area */}
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-2 pb-6">
        <div className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-wider text-accent">
          <Sparkles size={12} aria-hidden="true" />
          Touch-Typing Academy
        </div>
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
          Typing Lessons &amp; Curriculum
        </h1>
        <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-sub">
          Master touch typing without looking down. Follow our structured 28-lesson progression
          from home row fundamentals through speed and precision.
        </p>
      </header>

      <div className="mx-auto w-full max-w-6xl flex flex-col gap-10">
        <div>
          <AdSlot id="lessons-hub-leaderboard" format="horizontal" />
        </div>

        <h2 className="sr-only">Lessons Learning Dashboard</h2>
        <LessonDashboard />

        {/* Crawlable Educational Guide Content (SEO & Learning Pillars) */}
        <section className="mt-8 flex flex-col gap-6 rounded-2xl border border-border/70 bg-sub-alt/10 p-6 sm:p-10">
          <div className="flex flex-col gap-2">
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-accent">
              Pedagogical Methodology
            </span>
            <h2 className="font-display text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
              How the HeroTyping Curriculum Works
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-sub">
              Learning to touch-type is fundamentally about building neuromuscular automaticity. Rather than memorizing
              where keys live with your eyes, you train each finger to memorize its home-position resting anchor and
              its specific spatial reach.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center gap-2 font-display text-xs font-bold uppercase text-foreground">
                <Keyboard size={15} className="text-accent" aria-hidden="true" /> 1. Home Row First
              </div>
              <p className="text-xs text-sub leading-relaxed">
                Fingers rest on A S D F and J K L ;. Feel for the tactile bumps on F and J to center your hands
                instantly without glancing at the keys.
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center gap-2 font-display text-xs font-bold uppercase text-foreground">
                <BookOpen size={15} className="text-accent" aria-hidden="true" /> 2. Vertical Reaches
              </div>
              <p className="text-xs text-sub leading-relaxed">
                Expand upward to the Top Row (QWERTY) and downward to the Bottom Row (ZXCVBNM), returning each finger
                to home position immediately after striking.
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center gap-2 font-display text-xs font-bold uppercase text-foreground">
                <Award size={15} className="text-accent" aria-hidden="true" /> 3. Real Prose Flow
              </div>
              <p className="text-xs text-sub leading-relaxed">
                Transition from single keys into common letter pairs, English words, punctuation, numbers, and
                eventually full paragraphs under timed cadence.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-4 text-xs text-sub">
            <span>Want a comprehensive visual diagram of all finger zones?</span>
            <Link
              href="/guides/how-to-touch-type"
              className="font-semibold text-accent underline underline-offset-2 hover:text-foreground"
            >
              Read the Complete Touch-Typing Guide &rarr;
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

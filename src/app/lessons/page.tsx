import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Keyboard } from "lucide-react";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { LessonDashboard } from "@/components/lessons/lesson-dashboard";
import { AdSlot } from "@/components/layout/ad-slot";

export const metadata: Metadata = {
  title: "Learn to Type",
  description:
    "Free touch-typing lessons for complete beginners through advanced speed and precision -- three tiers, home row to full-length passages, with an on-screen keyboard and finger guide for every key. No sign-up required.",
  alternates: { canonical: "/lessons" },
};

export default function LessonsHubPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-10 text-center sm:py-16">
        <span className="flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-3.5 py-1.5 font-display text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
          <Keyboard size={12} aria-hidden="true" />
          New here?
        </span>

        <h1 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl">
          Learn to type
          <br />
          <span className="text-accent text-glow">without looking down</span>
        </h1>

        <p className="max-w-xl text-sm leading-relaxed text-sub sm:text-base">
          Beginner, Intermediate and Advanced -- home row through full-length,
          full-speed passages. Every unit shows an on-screen keyboard and hand
          diagram that highlight exactly which key and which finger come next,
          no prior typing skill required.
        </p>

        <Link
          href={`/lessons/${LESSON_LIST[0].id}`}
          className="flex h-12 items-center gap-2 rounded-lg bg-accent px-8 font-display text-xs font-bold uppercase tracking-[0.16em] text-background transition-[filter] duration-200 hover:brightness-110"
        >
          Start lesson 1
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10">
          <AdSlot id="lessons-hub-leaderboard" format="horizontal" />
        </div>

        <h2 className="sr-only">All lessons</h2>
        <LessonDashboard />

        {/* No second ad slot down here -- SiteFooter (every route) already
            carries one directly below this page's content, and stacking a
            second, identical-looking box right above it just reads as a
            mistake. The leaderboard slot above the dashboard is the one
            placement on this page. */}
      </div>
    </div>
  );
}

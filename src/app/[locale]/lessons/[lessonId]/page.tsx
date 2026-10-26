import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronLeft, Keyboard } from "lucide-react";
import {
  LESSON_LIST,
  LESSON_STAGES,
  LESSON_TIERS,
} from "@/lib/lessons/lesson-types";
import { LessonClient } from "@/components/lessons/lesson-client";
import { AdSlot } from "@/components/layout/ad-slot";
import { AdRail } from "@/components/layout/ad-rail";
import { buildLearningResourceSchema } from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils/cn";
import { getLocalizedLesson, getLocalizedLessonList } from "@/lib/server/lesson-mapper";
import { LESSON_SEO_DATA } from "@/lib/lessons/lesson-seo-content";

export function generateStaticParams() {
  return LESSON_LIST.map((lesson) => ({ lessonId: lesson.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string, locale: string }> }): Promise<Metadata> {
  const { lessonId, locale } = await params;
  const lesson = await getLocalizedLesson(locale, lessonId);
  if (!lesson) {
    return {
      title: "Lesson Not Found",
      robots: { index: false, follow: false },
    };
  }
  const seo = LESSON_SEO_DATA[lesson.slug] || LESSON_SEO_DATA[lesson.id];
  const title = `${lesson.name} — Lesson`;
  const description = seo?.metaDescription || lesson.instructions[0];
  const canonicalPath = locale === "en" ? `/lessons/${lesson.slug}` : `/${locale}/lessons/${lesson.slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { title, description, url: canonicalPath },
    twitter: { title, description },
  };
}

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string, locale: string }> }) {
  const { lessonId, locale } = await params;
  const lesson = await getLocalizedLesson(locale, lessonId);
  if (!lesson) notFound();

  const seo = LESSON_SEO_DATA[lesson.slug] || LESSON_SEO_DATA[lesson.id];

  const lessonList = await getLocalizedLessonList(locale);

  const stageLabel = LESSON_STAGES.find((s) => s.id === lesson.stage)?.label ?? lesson.stage;
  const tierLabel = LESSON_TIERS.find((t) => t.id === lesson.tier)?.label ?? lesson.tier;
  const lessonIndex = lessonList.findIndex((l) => l.id === lesson.id);
  const previousLesson = lessonIndex > 0 ? lessonList[lessonIndex - 1] : undefined;
  const nextLesson =
    lessonIndex >= 0 && lessonIndex < lessonList.length - 1 ? lessonList[lessonIndex + 1] : undefined;
  const practiceKeys =
    lesson.newKeys.length > 0
      ? lesson.newKeys
      : lesson.content.kind === "exact_text" || lesson.content.kind === "database_steps"
        ? lesson.newKeys
        : lesson.content.kind !== "graduation"
          ? lesson.content.allowedKeys
          : [];

  return (
    <div className="relative flex flex-1 flex-col items-center px-3 pb-12 pt-2 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildLearningResourceSchema({
              name: lesson.name,
              description: seo?.metaDescription || lesson.instructions[0],
              path: locale === "en" ? `/lessons/${lesson.slug}` : `/${locale}/lessons/${lesson.slug}`,
              educationalLevel: tierLabel,
            }),
          ),
        }}
      />

      {/* Grid container keeping drill dead-centered while supporting desktop ad rail */}
      <div className="grid w-full grid-cols-1 min-[1760px]:grid-cols-[1fr_auto_1fr] min-[1760px]:items-start">
        <div aria-hidden="true" className="hidden min-[1760px]:block" />
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          {/* Top Navigation & Breadcrumbs */}
          <div className="flex w-full items-center justify-between gap-3 pb-3">
            <Link
              href={locale === "en" ? "/lessons" : `/${locale}/lessons`}
              className="flex items-center gap-1 font-display text-xs font-bold uppercase tracking-wider text-sub transition-colors hover:text-accent"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              All Lessons
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded bg-accent/15 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-accent">
                {tierLabel}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-sub">
                {stageLabel} &middot; {lesson.order} of {lessonList.length}
              </span>
            </div>
          </div>

          {/* Lesson Header */}
          <div className="mb-3 flex w-full flex-col items-start gap-1 text-left min-[900px]:mb-2 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
            <h1 className="font-display text-xl font-black uppercase tracking-tight text-foreground sm:text-2xl xl:text-3xl">
              {lesson.name}
            </h1>
            <p className="max-w-xl text-[11px] leading-relaxed text-sub sm:text-xs min-[900px]:max-w-sm min-[900px]:text-right xl:text-sm">
              {lesson.instructions[0]}
            </p>
          </div>

          {/* Interactive Lesson Drill */}
          <LessonClient definition={lesson} />

          {/* Educational Content & Crawlable Instructions */}
          <div className="mt-10 flex w-full flex-col gap-6">
            {practiceKeys.length > 0 && (
              <div className="theme-transition flex flex-wrap items-center gap-2 rounded-xl border border-border bg-sub-alt/20 p-4">
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-sub">
                  <Keyboard size={13} aria-hidden="true" />
                  Keys introduced or practiced
                </span>
                {practiceKeys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border border-border bg-background px-2.5 py-1 font-mono text-xs text-foreground shadow-sm"
                  >
                    {key === " " ? "space" : key}
                  </kbd>
                ))}
              </div>
            )}

            {seo ? (
              <div className="flex flex-col gap-5">
                {/* Technique Guidance & Lesson Summary */}
                <div className="rounded-xl border border-border/60 bg-sub-alt/10 p-5 text-sm leading-relaxed text-sub">
                  <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                    Technique Guidance &amp; Objective
                  </h2>
                  <p className="mb-2 text-foreground/90">{seo.summary}</p>
                  {lesson.instructions.map((line, i) => (
                    <p key={i} className="text-xs text-sub/80 mt-1">{line}</p>
                  ))}
                </div>

                {/* Finger Map & Hand Biomechanics */}
                <div className="rounded-xl border border-border/60 bg-sub-alt/10 p-5 text-sm leading-relaxed text-sub">
                  <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                    Finger Map &amp; Hand Biomechanics
                  </h2>
                  <p>{seo.fingerMap}</p>
                </div>

                {/* 3 Common Key Mistakes */}
                <div className="rounded-xl border border-border/60 bg-sub-alt/10 p-5 text-sm leading-relaxed text-sub">
                  <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                    3 Common Key Mistakes &amp; Fixes
                  </h2>
                  <ul className="flex flex-col gap-2.5">
                    {seo.mistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-sub">
                        <span className="font-mono text-accent font-bold mt-0.5">{i + 1}.</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3-Step Practice Sequence */}
                <div className="rounded-xl border border-border/60 bg-sub-alt/10 p-5 text-sm leading-relaxed text-sub">
                  <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                    3-Step Practice Sequence
                  </h2>
                  <ul className="flex flex-col gap-2.5">
                    {seo.sequence.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-sub">
                        <span className="font-mono text-accent font-bold mt-0.5">Step {i + 1}:</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pass Criteria & Benchmark */}
                <div className="rounded-xl border border-border/60 bg-sub-alt/10 p-5 text-sm leading-relaxed text-sub">
                  <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                    Pass Criteria &amp; Speed Benchmark
                  </h2>
                  <p>{seo.passCriteria}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 rounded-xl border border-border/60 bg-sub-alt/10 p-5 text-sm leading-relaxed text-sub">
                <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Technique Guidance
                </h2>
                {lesson.instructions.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}

            <p className="text-xs text-sub">
              Want the full finger-to-key map?{" "}
              <Link href={locale === "en" ? "/guides/how-to-touch-type" : `/${locale}/guides/how-to-touch-type`} className="text-accent underline underline-offset-2 hover:text-foreground">
                How to touch type
              </Link>{" "}
              covers posture and ergonomics. Once comfortable, build vocabulary with{" "}
              <Link href={locale === "en" ? "/vocabulary" : `/${locale}/vocabulary`} className="text-accent underline underline-offset-2 hover:text-foreground">
                vocabulary practice
              </Link>{" "}
              or test reflexes in an{" "}
              <Link href={locale === "en" ? "/games" : `/${locale}/games`} className="text-accent underline underline-offset-2 hover:text-foreground">
                arcade typing game
              </Link>
              .
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
              {previousLesson && (
                 <Link
                   href={locale === "en" ? `/lessons/${previousLesson.slug}` : `/${locale}/lessons/${previousLesson.slug}`}
                   className="flex items-center gap-3 rounded-xl border border-border bg-sub-alt/20 p-4 text-sm text-sub transition-colors hover:border-accent hover:text-foreground"
                 >
                   <ArrowLeft size={16} className="shrink-0 text-accent" aria-hidden="true" />
                   <span className="flex min-w-0 flex-col">
                     <span className="font-mono text-[10px] uppercase tracking-wider text-sub">Previous Lesson</span>
                     <span className="truncate font-semibold text-foreground">{previousLesson.name}</span>
                   </span>
                 </Link>
               )}
               {nextLesson && (
                 <Link
                   href={locale === "en" ? `/lessons/${nextLesson.slug}` : `/${locale}/lessons/${nextLesson.slug}`}
                   className={cn(
                     "flex items-center justify-between gap-3 rounded-xl border border-border bg-sub-alt/20 p-4 text-sm text-sub transition-colors hover:border-accent hover:text-foreground",
                     !previousLesson && "sm:col-start-2",
                   )}
                 >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-sub">Next Lesson</span>
                    <span className="truncate font-semibold text-foreground">{nextLesson.name}</span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-accent" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-10 w-full">
            <AdSlot id={`lesson-${lesson.id}-below-board`} format="horizontal" />
          </div>
        </div>

        <div className="hidden min-[1760px]:flex min-[1760px]:justify-start min-[1760px]:pl-6">
          <AdRail id={`lesson-${lesson.id}-rail`} />
        </div>
      </div>
    </div>
  );
}

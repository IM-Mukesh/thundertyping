import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronLeft, Keyboard } from "lucide-react";
import {
  LESSON_DEFINITIONS,
  LESSON_LIST,
  LESSON_STAGES,
  LESSON_TIERS,
  type LessonId,
} from "@/lib/lessons/lesson-types";
import { LessonClient } from "@/components/lessons/lesson-client";
import { AdSlot } from "@/components/layout/ad-slot";
import { AdRail } from "@/components/layout/ad-rail";
import { buildLearningResourceSchema } from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils/cn";

export function generateStaticParams() {
  return LESSON_LIST.map((lesson) => ({ lessonId: lesson.id }));
}

function getLesson(lessonId: string) {
  return Object.prototype.hasOwnProperty.call(LESSON_DEFINITIONS, lessonId)
    ? LESSON_DEFINITIONS[lessonId as LessonId]
    : null;
}

export async function generateMetadata({ params }: PageProps<"/lessons/[lessonId]">): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) return {};
  const title = `${lesson.name} — Typing Lesson`;
  const description = lesson.instructions[0];
  return {
    title,
    description,
    alternates: { canonical: `/lessons/${lesson.id}` },
    openGraph: { title, description, url: `/lessons/${lesson.id}` },
    twitter: { title, description },
  };
}

export default async function LessonPage({ params }: PageProps<"/lessons/[lessonId]">) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();

  const stageLabel = LESSON_STAGES.find((s) => s.id === lesson.stage)?.label ?? lesson.stage;
  const tierLabel = LESSON_TIERS.find((t) => t.id === lesson.tier)?.label ?? lesson.tier;
  const lessonIndex = LESSON_LIST.findIndex((l) => l.id === lesson.id);
  const previousLesson = lessonIndex > 0 ? LESSON_LIST[lessonIndex - 1] : undefined;
  const nextLesson =
    lessonIndex >= 0 && lessonIndex < LESSON_LIST.length - 1 ? LESSON_LIST[lessonIndex + 1] : undefined;
  const practiceKeys =
    lesson.newKeys.length > 0
      ? lesson.newKeys
      : lesson.content.kind !== "graduation"
        ? lesson.content.allowedKeys
        : [];

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildLearningResourceSchema({
              name: lesson.name,
              description: lesson.instructions[0],
              path: `/lessons/${lesson.id}`,
              educationalLevel: tierLabel,
            }),
          ),
        }}
      />

      {/* Grid container keeping drill dead-centered while supporting desktop ad rail */}
      <div className="grid w-full grid-cols-1 min-[1760px]:grid-cols-[1fr_auto_1fr] min-[1760px]:items-start">
        <div aria-hidden="true" className="hidden min-[1760px]:block" />
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
          {/* Top Navigation & Breadcrumbs */}
          <div className="flex w-full items-center justify-between gap-4 pb-6">
            <Link
              href="/lessons"
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
                {stageLabel} &middot; {lesson.order} of {LESSON_LIST.length}
              </span>
            </div>
          </div>

          {/* Lesson Header */}
          <div className="mb-6 flex w-full flex-col items-center gap-2 text-center">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
              {lesson.name}
            </h1>
            <p className="max-w-xl text-xs sm:text-sm text-sub leading-relaxed">
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

            <div className="flex flex-col gap-2.5 rounded-xl border border-border/60 bg-sub-alt/10 p-5 text-sm leading-relaxed text-sub">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                Technique Guidance
              </h2>
              {lesson.instructions.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <p className="text-xs text-sub">
              Want the full finger-to-key map?{" "}
              <Link href="/guides/how-to-touch-type" className="text-accent underline underline-offset-2 hover:text-foreground">
                How to touch type
              </Link>{" "}
              covers posture and ergonomics. Once comfortable, build vocabulary with{" "}
              <Link href="/vocabulary" className="text-accent underline underline-offset-2 hover:text-foreground">
                vocabulary practice
              </Link>{" "}
              or test reflexes in an{" "}
              <Link href="/games" className="text-accent underline underline-offset-2 hover:text-foreground">
                arcade typing game
              </Link>
              .
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
              {previousLesson && (
                <Link
                  href={`/lessons/${previousLesson.id}`}
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
                  href={`/lessons/${nextLesson.id}`}
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

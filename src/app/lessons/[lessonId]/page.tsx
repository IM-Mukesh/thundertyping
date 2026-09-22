import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LESSON_DEFINITIONS, LESSON_LIST, LESSON_STAGES, type LessonId } from "@/lib/lessons/lesson-types";
import { LessonClient } from "@/components/lessons/lesson-client";
import { AdSlot } from "@/components/layout/ad-slot";
import { AdRail } from "@/components/layout/ad-rail";

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
  return {
    title: `${lesson.name} — Typing Lesson`,
    description: lesson.instructions[0],
    alternates: { canonical: `/lessons/${lesson.id}` },
  };
}

export default async function LessonPage({ params }: PageProps<"/lessons/[lessonId]">) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();

  const stageLabel = LESSON_STAGES.find((s) => s.id === lesson.stage)?.label ?? lesson.stage;

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8">
      {/* Same centering grid as the homepage -- see the comment there. Keeps
          the drill column dead-centered regardless of the rail. */}
      <div className="grid w-full grid-cols-1 min-[1760px]:grid-cols-[1fr_auto_1fr] min-[1760px]:items-start">
        <div aria-hidden="true" className="hidden min-[1760px]:block" />
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-4 pb-6">
            <Link
              href="/lessons"
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-sub transition-colors hover:text-foreground"
            >
              <ArrowLeft size={13} />
              All lessons
            </Link>
            <span className="font-mono text-[11px] uppercase tracking-wider text-sub">
              {stageLabel} &middot; Lesson {lesson.order} of {LESSON_LIST.length}
            </span>
          </div>

          {/* Instructional copy used to render here in full -- moved off the
              drill screen entirely (not just collapsed) so the screen someone
              is actually typing on stays uncluttered. It still exists: the
              dashboard row's description, this page's <meta description>,
              and the noscript/SEO surfaces all still carry it. */}
          <div className="mb-6 flex w-full flex-col items-center gap-1 text-center">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
              {lesson.name}
            </h1>
          </div>

          <LessonClient definition={lesson} />

          <div className="mt-14 w-full">
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

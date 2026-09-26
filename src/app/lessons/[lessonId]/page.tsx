import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Keyboard } from "lucide-react";
import { LESSON_DEFINITIONS, LESSON_LIST, LESSON_STAGES, LESSON_TIERS, type LessonId } from "@/lib/lessons/lesson-types";
import { LessonClient } from "@/components/lessons/lesson-client";
import { AdSlot } from "@/components/layout/ad-slot";
import { AdRail } from "@/components/layout/ad-rail";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
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
    openGraph: { title, description },
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
  const nextLesson = lessonIndex >= 0 && lessonIndex < LESSON_LIST.length - 1 ? LESSON_LIST[lessonIndex + 1] : undefined;
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

      {/* Same centering grid as the homepage -- see the comment there. Keeps
          the drill column dead-centered regardless of the rail. */}
      <div className="grid w-full grid-cols-1 min-[1760px]:grid-cols-[1fr_auto_1fr] min-[1760px]:items-start">
        <div aria-hidden="true" className="hidden min-[1760px]:block" />
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-4 pb-6">
            <Breadcrumbs
              items={[
                { name: "Typing Lessons", path: "/lessons" },
                { name: lesson.name, path: `/lessons/${lesson.id}` },
              ]}
            />
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-sub">
              {stageLabel} &middot; Lesson {lesson.order} of {LESSON_LIST.length}
            </span>
          </div>

          {/* The typing surface itself stays the focus up top; instructional
              copy used to be dropped entirely once it moved off this screen.
              It's real content (hand-written per lesson, not templated) that
              was going completely unrendered except as a truncated meta
              description -- now the full text renders below the drill,
              where it's genuinely useful without competing with the screen
              someone is actually typing on. */}
          <div className="mb-6 flex w-full flex-col items-center gap-1 text-center">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
              {lesson.name}
            </h1>
          </div>

          <LessonClient definition={lesson} />

          <div className="mt-10 flex w-full flex-col gap-6">
            {practiceKeys.length > 0 && (
              <div className="theme-transition flex flex-wrap items-center gap-2 rounded-xl border border-border bg-sub-alt/20 p-4">
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-sub">
                  <Keyboard size={13} aria-hidden="true" />
                  Keys you&apos;ll practice
                </span>
                {practiceKeys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs text-foreground"
                  >
                    {key === " " ? "space" : key}
                  </kbd>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 text-sm leading-relaxed text-sub">
              {lesson.instructions.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <p className="text-xs text-sub">
              Want the full finger-to-key map?{" "}
              <Link href="/guides/how-to-touch-type" className="text-accent underline underline-offset-2">
                How to touch type
              </Link>{" "}
              covers it end to end. Once you&apos;re comfortable, build vocabulary with{" "}
              <Link href="/vocabulary" className="text-accent underline underline-offset-2">
                vocabulary practice
              </Link>{" "}
              or keep it fun with a{" "}
              <Link href="/games" className="text-accent underline underline-offset-2">
                typing game
              </Link>
              .
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {previousLesson && (
                <Link
                  href={`/lessons/${previousLesson.id}`}
                  className="flex items-center gap-2 rounded-xl border border-border bg-sub-alt/20 p-4 text-sm text-sub transition-colors hover:border-accent hover:text-foreground"
                >
                  <ArrowLeft size={14} className="shrink-0" aria-hidden="true" />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-sub/70">Previous</span>
                    <span className="truncate">{previousLesson.name}</span>
                  </span>
                </Link>
              )}
              {nextLesson && (
                <Link
                  href={`/lessons/${nextLesson.id}`}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border border-border bg-sub-alt/20 p-4 text-sm text-sub transition-colors hover:border-accent hover:text-foreground",
                    !previousLesson && "sm:col-start-2",
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-sub/70">Next</span>
                    <span className="truncate">{nextLesson.name}</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0" aria-hidden="true" />
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

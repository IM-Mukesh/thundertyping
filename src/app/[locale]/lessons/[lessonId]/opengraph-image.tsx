import { ImageResponse } from "next/og";
import { LESSON_LIST, LESSON_TIERS } from "@/lib/lessons/lesson-types";
import { ogImageElement } from "@/lib/seo/og-image";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return LESSON_LIST.map((lesson) => ({ lessonId: lesson.slug }));
}

function getLesson(lessonId: string) {
  return LESSON_LIST.find((l) => l.slug === lessonId || l.id === lessonId) || null;
}

export default async function Image({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  const tierLabel = lesson ? LESSON_TIERS.find((t) => t.id === lesson.tier)?.label : undefined;

  return new ImageResponse(
    ogImageElement({
      eyebrow: tierLabel ? `${tierLabel} Typing Lesson` : "Typing Lesson",
      title: lesson?.name ?? "HeroTyping",
      subtitle: lesson?.instructions[0] ?? "Structured typing lessons from the home row up.",
    }),
    { ...size },
  );
}

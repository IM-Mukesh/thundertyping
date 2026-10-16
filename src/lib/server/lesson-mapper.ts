import { getLessons, getLessonWithSteps } from "./content";
import { LESSON_LIST, LESSON_SLUG_MAP, type LessonDefinition, type LessonTier, type LessonStage } from "@/lib/lessons/lesson-types";

export async function getLocalizedLessonList(locale: string): Promise<LessonDefinition[]> {
  if (locale === "en") {
    return LESSON_LIST;
  }

  const dbLessons = await getLessons(locale);
  return dbLessons.map(row => ({
    id: row.lesson_key,
    slug: LESSON_SLUG_MAP[row.lesson_key] || row.lesson_key,
    tier: row.tier as LessonTier,
    stage: row.stage as LessonStage,
    order: row.order_index,
    name: row.title,
    newKeys: row.new_keys || [],
    instructions: [row.description || ""],
    minAccuracy: row.min_accuracy || 90,
    subLessonCount: 1, // Will be overridden if requested with steps
    content: { kind: "database_steps", wordCount: 15, steps: [] },
  }));
}

export async function getLocalizedLesson(locale: string, lessonId: string): Promise<LessonDefinition | null> {
  if (locale === "en") {
    const found = LESSON_LIST.find((l) => l.slug === lessonId || l.id === lessonId);
    return found ?? null;
  }

  const dbData = await getLessonWithSteps(locale, lessonId);
  if (!dbData) return null;

  return {
    id: dbData.lesson.lesson_key,
    slug: LESSON_SLUG_MAP[dbData.lesson.lesson_key] || dbData.lesson.lesson_key,
    tier: dbData.lesson.tier as LessonTier,
    stage: dbData.lesson.stage as LessonStage,
    order: dbData.lesson.order_index,
    name: dbData.lesson.title,
    newKeys: dbData.lesson.new_keys || [],
    instructions: [dbData.lesson.description || ""],
    minAccuracy: dbData.lesson.min_accuracy || 90,
    subLessonCount: dbData.steps.length,
    content: {
      kind: "database_steps",
      wordCount: 15,
      steps: dbData.steps.map(s => ({
        targetText: s.target_text || "",
        practiceType: s.practice_type || "drill",
      })),
    },
  };
}

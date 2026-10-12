import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type VocabularyItem = Database["public"]["Tables"]["vocabulary_items"]["Row"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];
type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
type LessonStep = Database["public"]["Tables"]["lesson_steps"]["Row"];
type Guide = Database["public"]["Tables"]["guides"]["Row"];

const CACHE_TAGS = {
  content: "content",
};

/**
 * Get random quotes for typing practice
 */
export const getQuotes = async (languageCode: string, limit: number = 50): Promise<Quote[]> => {
  return unstable_cache(
    async () => {
    const supabase = createAdminClient();
    
    // For quotes, we might have hundreds. Randomizing in DB is slow,
    // so we fetch a chunk of published ones and randomize in memory.
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("language_code", languageCode)
      .eq("status", "published")
      .limit(limit * 2); // Fetch extra for randomization

    if (error) {
      console.error(`Failed to fetch quotes for ${languageCode}:`, error);
      return [];
    }

    if (!data) return [];
    
    // Simple randomization
    return data.sort(() => 0.5 - Math.random()).slice(0, limit);
  },
    ["get-quotes", languageCode, limit.toString()],
    {
      tags: [CACHE_TAGS.content],
      revalidate: 3600,
    }
  )();
};

/**
 * Get vocabulary words by difficulty
 */
export const getVocabulary = async (languageCode: string, difficulty: string, limit: number = 200): Promise<VocabularyItem[]> => {
  return unstable_cache(
    async () => {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from("vocabulary_items")
      .select("*")
      .eq("language_code", languageCode)
      .eq("difficulty", difficulty)
      .eq("status", "published")
      .order("frequency_rank", { ascending: true })
      .limit(limit);

    if (error) {
      console.error(`Failed to fetch vocabulary for ${languageCode} (${difficulty}):`, error);
      return [];
    }

    return data || [];
  },
    ["get-vocabulary", languageCode, difficulty, limit.toString()],
    {
      tags: [CACHE_TAGS.content],
      revalidate: 3600,
    }
  )();
};

/**
 * Get all published lessons for a language
 */
export const getLessons = async (languageCode: string): Promise<Lesson[]> => {
  return unstable_cache(
    async () => {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("language_code", languageCode)
      .eq("status", "published")
      .order("order_index", { ascending: true });

    if (error) {
      console.error(`Failed to fetch lessons for ${languageCode}:`, error);
      return [];
    }

    return data || [];
  },
    ["get-lessons", languageCode],
    {
      tags: [CACHE_TAGS.content],
      revalidate: 3600,
    }
  )();
};

/**
 * Get a specific lesson and all its steps (0 N+1 query pattern)
 */
export const getLessonWithSteps = async (languageCode: string, lessonKey: string): Promise<{ lesson: Lesson; steps: LessonStep[] } | null> => {
  return unstable_cache(
    async () => {
    const supabase = createAdminClient();
    
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("*")
      .eq("language_code", languageCode)
      .eq("lesson_key", lessonKey)
      .eq("status", "published")
      .single();

    if (lessonError || !lesson) {
      console.error(`Lesson not found: ${lessonKey} (${languageCode})`, lessonError);
      return null;
    }

    const { data: steps, error: stepsError } = await supabase
      .from("lesson_steps")
      .select("*")
      .eq("lesson_id", lesson.id)
      .order("step_order", { ascending: true });

    if (stepsError) {
      console.error(`Failed to fetch steps for lesson: ${lesson.id}`, stepsError);
      return null;
    }

    return {
      lesson,
      steps: steps || [],
    };
  },
    ["get-lesson-with-steps", languageCode, lessonKey],
    {
      tags: [CACHE_TAGS.content],
      revalidate: 3600,
    }
  )();
};

/**
 * Get a single guide by key or slug
 */
export const getGuide = async (languageCode: string, slugOrKey: string): Promise<Guide | null> => {
  return unstable_cache(
    async () => {
    const supabase = createAdminClient();
    
    // First try by guide_key, then fallback to slug
    const guideRes = await supabase
      .from("guides")
      .select("*")
      .eq("language_code", languageCode)
      .eq("guide_key", slugOrKey)
      .eq("status", "published")
      .single();
    let guide = guideRes.data;
    const error = guideRes.error;

    if (!guide) {
      const { data: guideBySlug } = await supabase
        .from("guides")
        .select("*")
        .eq("language_code", languageCode)
        .eq("slug", slugOrKey)
        .eq("status", "published")
        .single();
      
      guide = guideBySlug;
    }

    if (error && !guide) {
      return null;
    }

    return guide;
  },
    ["get-guide", languageCode, slugOrKey],
    {
      tags: [CACHE_TAGS.content],
      revalidate: 3600,
    }
  )();
};

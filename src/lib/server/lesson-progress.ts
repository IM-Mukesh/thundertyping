import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedLessonProgressInput } from "@/lib/server/validation";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";

async function getSupabaseForRead() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

export async function saveLessonProgress(userId: string, input: ValidatedLessonProgressInput) {
  const supabase = createAdminClient();

  // 1. Record individual attempt
  const { error: attemptError } = await supabase.from("lesson_attempts").insert({
    user_id: userId,
    lesson_id: input.lessonId,
    wpm: input.wpm,
    accuracy: input.accuracy,
    stars: input.stars,
  });

  if (attemptError) {
    console.error("Non-fatal: failed to record lesson attempt:", attemptError);
  }

  // 2. Fetch existing aggregate progress for this unit (optimistic-concurrency:
  // retries on a conflicting concurrent writer instead of blindly overwriting it)
  const progressRecord = await withOptimisticRetry(async () => {
    const { data: existing } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", input.lessonId)
      .maybeSingle();

    if (existing) {
      const isCompleted = existing.completed || input.completed;
      const bestStars = Math.max(existing.stars, input.stars);
      const bestWpm = Math.max(existing.best_wpm, input.wpm);
      const bestAccuracy = Math.max(existing.best_accuracy, input.accuracy);
      const attemptCount = existing.attempt_count + (input.attemptCount || 1);

      const { data: updated, error: updateError } = await supabase
        .from("lesson_progress")
        .update({
          completed: isCompleted,
          stars: bestStars,
          best_wpm: bestWpm,
          best_accuracy: bestAccuracy,
          attempt_count: attemptCount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("lesson_id", input.lessonId)
        .eq("updated_at", existing.updated_at)
        .select()
        .maybeSingle();

      if (updateError) {
        throw new Error(`Failed to update lesson progress: ${updateError.message}`);
      }
      if (!updated) {
        throw new Error("CONFLICT: lesson_progress row changed concurrently");
      }
      return updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("lesson_progress")
        .insert({
          user_id: userId,
          lesson_id: input.lessonId,
          completed: input.completed,
          stars: input.stars,
          best_wpm: input.wpm,
          best_accuracy: input.accuracy,
          attempt_count: input.attemptCount || 1,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === UNIQUE_VIOLATION) {
          throw new Error("CONFLICT: lesson_progress row created concurrently");
        }
        throw new Error(`Failed to insert lesson progress: ${insertError.message}`);
      }
      return inserted;
    }
  });

  // 3. Update daily stats if completed
  if (input.completed) {
    const today = new Date().toISOString().split("T")[0];
    try {
      await withOptimisticRetry(async () => {
        const { data: existingDaily } = await supabase
          .from("daily_stats")
          .select("*")
          .eq("user_id", userId)
          .eq("date", today)
          .maybeSingle();

        if (existingDaily) {
          const { data: updatedRows, error } = await supabase
            .from("daily_stats")
            .update({
              lessons_completed: existingDaily.lessons_completed + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("date", today)
            .eq("updated_at", existingDaily.updated_at)
            .select();

          if (error) throw error;
          if (!updatedRows || updatedRows.length === 0) {
            throw new Error("CONFLICT: daily_stats row changed concurrently");
          }
        } else {
          const { error } = await supabase.from("daily_stats").insert({
            user_id: userId,
            date: today,
            lessons_completed: 1,
          });
          if (error) {
            if (error.code === UNIQUE_VIOLATION) {
              throw new Error("CONFLICT: daily_stats row created concurrently");
            }
            throw error;
          }
        }
      });
    } catch (err) {
      console.error("Non-fatal: failed to update daily lesson stats:", err);
    }
  }

  return progressRecord;
}

export async function getUserLessonProgress(userId: string) {
  const supabase = await getSupabaseForRead();

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch lesson progress: ${error.message}`);
  }

  return data || [];
}

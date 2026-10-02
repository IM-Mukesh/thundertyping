import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedLessonProgressInput } from "@/lib/server/validation";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";
import { evaluateAndSyncAchievements } from "@/lib/server/progress";
import type { Database } from "@/lib/supabase/database.types";

type LessonAttemptInsert = Database["public"]["Tables"]["lesson_attempts"]["Insert"];

async function getSupabaseForRead() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

export async function saveLessonProgress(userId: string, input: ValidatedLessonProgressInput) {
  const supabase = createAdminClient();

  // 1. Idempotency Check: if runId is supplied, check if already recorded
  if (input.runId) {
    const { data: existingAttempt } = await supabase
      .from("lesson_attempts")
      .select("id")
      .eq("user_id", userId)
      .eq("id", input.runId)
      .maybeSingle();

    if (existingAttempt) {
      const { data: currentProgress } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("lesson_id", input.lessonId)
        .maybeSingle();

      const { data: streak } = await supabase
        .from("player_streaks")
        .select("total_xp")
        .eq("user_id", userId)
        .maybeSingle();

      return {
        progress: currentProgress,
        earnedXp: 0,
        totalXp: streak?.total_xp ?? 0,
        idempotent: true,
      };
    }
  }

  // 2. Record individual attempt
  const attemptPayload: LessonAttemptInsert = {
    user_id: userId,
    lesson_id: input.lessonId,
    wpm: input.wpm,
    accuracy: input.accuracy,
    stars: input.stars,
    ...(input.runId ? { id: input.runId } : {}),
  };

  const { error: attemptError } = await supabase
    .from("lesson_attempts")
    .insert(attemptPayload);

  if (attemptError) {
    if (attemptError.code === UNIQUE_VIOLATION && input.runId) {
      // Race condition idempotency recovery
      const { data: currentProgress } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("lesson_id", input.lessonId)
        .maybeSingle();
      return { progress: currentProgress, earnedXp: 0, idempotent: true };
    }
    console.error("Non-fatal: failed to record lesson attempt:", attemptError);
  }

  // 3. Fetch existing aggregate progress and determine whether this is a FIRST-TIME completion
  let isFirstTimeCompletion = false;

  const progressRecord = await withOptimisticRetry(async () => {
    const { data: existing } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", input.lessonId)
      .maybeSingle();

    if (existing) {
      const wasAlreadyCompleted = existing.completed;
      const isCompleted = wasAlreadyCompleted || input.completed;
      if (!wasAlreadyCompleted && input.completed) {
        isFirstTimeCompletion = true;
      }

      const bestStars = Math.max(existing.stars, input.stars);
      const bestWpm = Math.max(existing.best_wpm, input.wpm);
      const bestAccuracy = Math.max(existing.best_accuracy, input.accuracy);
      // Never accept arbitrary attempt count from client; always increment by 1
      const attemptCount = existing.attempt_count + 1;

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
      if (input.completed) {
        isFirstTimeCompletion = true;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("lesson_progress")
        .insert({
          user_id: userId,
          lesson_id: input.lessonId,
          completed: input.completed,
          stars: input.stars,
          best_wpm: input.wpm,
          best_accuracy: input.accuracy,
          attempt_count: 1,
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

  // 4. If this is a first-time completion, award server-derived XP and increment daily stats
  let earnedXp = 0;
  let finalTotalXp = 0;

  if (isFirstTimeCompletion) {
    earnedXp = 50 + Math.min(100, Math.round(input.wpm));
    const today = new Date().toISOString().split("T")[0];

    try {
      // Increment daily lessons completed
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

      // Award XP
      await withOptimisticRetry(async () => {
        const { data: streak } = await supabase
          .from("player_streaks")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (streak) {
          finalTotalXp = streak.total_xp + earnedXp;
          const { data: updatedRows, error } = await supabase
            .from("player_streaks")
            .update({
              total_xp: finalTotalXp,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("updated_at", streak.updated_at)
            .select();

          if (error) throw error;
          if (!updatedRows || updatedRows.length === 0) {
            throw new Error("CONFLICT: player_streaks row changed concurrently");
          }
        }
      });

      // Evaluate achievements
      await evaluateAndSyncAchievements(userId).catch((err) =>
        console.warn("[lessons] achievement sync non-fatal error:", err)
      );
    } catch (err) {
      console.error("Non-fatal: failed to update daily lesson stats/XP:", err);
    }
  }

  return {
    progress: progressRecord,
    earnedXp,
    totalXp: finalTotalXp,
  };
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

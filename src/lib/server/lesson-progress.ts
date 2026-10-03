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

      // An attempt row alone is not a completed operation. Continue through
      // the aggregate/reward stages so a retry can repair a partial write.
      if (currentProgress) {
        return {
          progress: currentProgress,
          earnedXp: 0,
          totalXp: streak?.total_xp ?? 0,
          idempotent: true,
        };
      }
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
      if (currentProgress) return { progress: currentProgress, earnedXp: 0, idempotent: true };
    }
    console.error("Non-fatal: failed to record lesson attempt:", attemptError);
  }

  // 3. Fetch existing aggregate progress and determine whether this is a FIRST-TIME completion
  let isFirstTimeCompletion = false;

  const progressRecord = await withOptimisticRetry(async () => {
    // Recompute this for every optimistic-lock attempt. A retry may observe
    // another request's completion and must not retain the stale reward flag.
    isFirstTimeCompletion = false;
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
          current_step: Math.max(existing.current_step ?? 0, input.step),
          pass_count: (existing.pass_count ?? 0) + (input.completed ? 1 : 0),
          avg_wpm: input.completed ? (((existing.avg_wpm ?? 0) * (existing.pass_count ?? 0)) + input.wpm) / ((existing.pass_count ?? 0) + 1) : (existing.avg_wpm ?? 0),
          avg_accuracy: input.completed ? (((existing.avg_accuracy ?? 0) * (existing.pass_count ?? 0)) + input.accuracy) / ((existing.pass_count ?? 0) + 1) : (existing.avg_accuracy ?? 0),
          last_attempt_at: new Date().toISOString(),
          typed_chars: (existing.typed_chars ?? 0) + input.typedChars,
          correct_chars: (existing.correct_chars ?? 0) + input.correctChars,
          incorrect_chars: (existing.incorrect_chars ?? 0) + input.incorrectChars,
          total_time_ms: (existing.total_time_ms ?? 0) + input.elapsedMs,
          ...(isCompleted ? { completed_at: existing.completed_at ?? new Date().toISOString() } : {}),
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
            current_step: input.step,
            pass_count: input.completed ? 1 : 0,
            avg_wpm: input.completed ? input.wpm : 0,
            avg_accuracy: input.completed ? input.accuracy : 0,
            last_attempt_at: new Date().toISOString(),
            typed_chars: input.typedChars,
            correct_chars: input.correctChars,
            incorrect_chars: input.incorrectChars,
            total_time_ms: input.elapsedMs,
            ...(input.completed ? { completed_at: new Date().toISOString() } : {}),
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

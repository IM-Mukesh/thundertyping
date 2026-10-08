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

import {
  getSettlementReceipt,
  updateSettlementReceipt,
  assertLessonPayloadMatch,
} from "@/lib/server/settlement";

export async function saveLessonProgress(userId: string, input: ValidatedLessonProgressInput) {
  const supabase = createAdminClient();

  // 1. Idempotency & Conflict Check (F03 & F06)
  const { data: existingAttempt } = await supabase
    .from("lesson_attempts")
    .select("*")
    .eq("id", input.runId)
    .maybeSingle();

  let receipt = await getSettlementReceipt(userId, input.runId, "lesson_progress");

  if (existingAttempt) {
    assertLessonPayloadMatch(existingAttempt, {
      userId,
      lessonId: input.lessonId,
      wpm: input.wpm,
      accuracy: input.accuracy,
    });

    if (receipt?.stage === "complete") {
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

  if (!receipt) {
    receipt = {
      runId: input.runId,
      userId,
      eventType: "lesson_progress",
      stage: existingAttempt ? "primary_saved" : "received",
      earnedXp: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  // 2. Primary Save: Record individual attempt if not already recorded
  if (!existingAttempt) {
    const attemptPayload: LessonAttemptInsert = {
      id: input.runId,
      user_id: userId,
      lesson_id: input.lessonId,
      wpm: input.wpm,
      accuracy: input.accuracy,
      stars: input.stars,
      completed: input.completed,
      language_code: input.languageCode || "en",
    };

    const { error: attemptError } = await supabase
      .from("lesson_attempts")
      .insert(attemptPayload);

    if (attemptError) {
      if (attemptError.code === UNIQUE_VIOLATION) {
        const { data: duplicate } = await supabase
          .from("lesson_attempts")
          .select("*")
          .eq("id", input.runId)
          .single();

        if (duplicate) {
          assertLessonPayloadMatch(duplicate, {
            userId,
            lessonId: input.lessonId,
            wpm: input.wpm,
            accuracy: input.accuracy,
          });
        } else {
          throw new Error(`Failed to recover concurrent lesson attempt: ${attemptError.message}`);
        }
      } else {
        throw new Error(`Failed to record lesson attempt: ${attemptError.message}`);
      }
    }

    receipt.stage = "primary_saved";
    await updateSettlementReceipt(receipt);
  }

  // 3. Aggregate Progress Save
  let isFirstTimeCompletion = false;
  let progressRecord: Record<string, unknown> | null = null;

  if (receipt.stage === "primary_saved") {
    progressRecord = await withOptimisticRetry(async () => {
      isFirstTimeCompletion = false;
      const { data: existing } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("lesson_id", input.lessonId)
        .eq("language_code", input.languageCode || "en")
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
        const attemptCount = existing.attempt_count + 1;

        const passed = input.stars >= 3;
        
        const { data: updated, error: updateError } = await supabase
          .from("lesson_progress")
          .update({
            completed: isCompleted,
            stars: bestStars,
            best_wpm: bestWpm,
            best_accuracy: bestAccuracy,
            attempt_count: attemptCount,
            current_step: Math.max(existing.current_step ?? 0, input.step),
            pass_count: (existing.pass_count ?? 0) + (passed ? 1 : 0),
            avg_wpm: passed
              ? (((existing.avg_wpm ?? 0) * (existing.pass_count ?? 0)) + input.wpm) / ((existing.pass_count ?? 0) + 1)
              : (existing.avg_wpm ?? 0),
            avg_accuracy: passed
              ? (((existing.avg_accuracy ?? 0) * (existing.pass_count ?? 0)) + input.accuracy) / ((existing.pass_count ?? 0) + 1)
              : (existing.avg_accuracy ?? 0),
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
          .eq("language_code", input.languageCode || "en")
          .eq("updated_at", existing.updated_at)
          .select()
          .maybeSingle();

        if (updateError) throw new Error(`Failed to update lesson progress: ${updateError.message}`);
        if (!updated) throw new Error("CONFLICT: lesson_progress row changed concurrently");
        return updated;
      } else {
        if (input.completed) {
          isFirstTimeCompletion = true;
        }
        
        const passed = input.stars >= 3;

        const { data: inserted, error: insertError } = await supabase
          .from("lesson_progress")
          .insert({
            user_id: userId,
            lesson_id: input.lessonId,
            language_code: input.languageCode || "en",
            completed: input.completed,
            stars: input.stars,
            best_wpm: input.wpm,
            best_accuracy: input.accuracy,
            attempt_count: 1,
            current_step: input.step,
            pass_count: passed ? 1 : 0,
            avg_wpm: passed ? input.wpm : 0,
            avg_accuracy: passed ? input.accuracy : 0,
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

    receipt.stage = "aggregate_saved";
    if (isFirstTimeCompletion) {
      receipt.earnedXp = 50 + Math.min(100, Math.round(input.wpm));
    }
    await updateSettlementReceipt(receipt);
  } else {
    // Replay / recovery: fetch existing progress record
    const { data: existingProgress } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", input.lessonId)
      .maybeSingle();
    progressRecord = existingProgress;
  }

  // 4. Rewards Stage: XP and Daily Stats
  let earnedXp = 0;
  let finalTotalXp = 0;

  if (receipt.stage === "aggregate_saved") {
    if (receipt.earnedXp > 0) {
      earnedXp = receipt.earnedXp;
      const today = new Date().toISOString().split("T")[0];

      // Daily stats update
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

      // Player streak & XP update
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

      receipt.stage = "rewards_saved";
      receipt.earnedXp = earnedXp;
      await updateSettlementReceipt(receipt);
    }
  }

  if (finalTotalXp === 0) {
    const { data: streak } = await supabase
      .from("player_streaks")
      .select("total_xp")
      .eq("user_id", userId)
      .maybeSingle();
    finalTotalXp = streak?.total_xp ?? 0;
  }

  // Evaluate achievements
  await evaluateAndSyncAchievements(userId).catch((err) =>
    console.warn("[lessons] achievement sync non-fatal error:", err)
  );

  // Settlement complete
  receipt.stage = "complete";
  await updateSettlementReceipt(receipt);

  return {
    progress: progressRecord,
    earnedXp: existingAttempt ? 0 : earnedXp,
    totalXp: finalTotalXp,
    idempotent: Boolean(existingAttempt),
  };
}

export async function getUserLessonProgress(userId: string, languageCode: string = "en") {
  const supabase = await getSupabaseForRead();

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("language_code", languageCode);

  if (error) {
    throw new Error(`Failed to fetch lesson progress: ${error.message}`);
  }

  return data || [];
}

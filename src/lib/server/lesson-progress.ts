import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedLessonProgressInput } from "@/lib/server/validation";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";
import { evaluateAndSyncAchievements } from "@/lib/server/progress";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import type { Database } from "@/lib/supabase/database.types";

export class LessonPrerequisiteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LessonPrerequisiteError";
  }
}

export class LessonStepSequenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LessonStepSequenceError";
  }
}

type LessonAttemptInsert = Database["public"]["Tables"]["lesson_attempts"]["Insert"];

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getSupabaseForRead(userSupabase?: SupabaseServerClient) {
  if (userSupabase) return userSupabase;
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

export async function saveLessonProgress(
  userId: string,
  input: ValidatedLessonProgressInput
) {
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

    const { data: currentProgress } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", input.lessonId)
      .maybeSingle();

    if (currentProgress) {
      const { data: streak } = await supabase
        .from("player_streaks")
        .select("total_xp")
        .eq("user_id", userId)
        .maybeSingle();

      if (receipt) {
        receipt.stage = "complete";
        await updateSettlementReceipt(receipt);
      }

      return {
        progress: currentProgress,
        earnedXp: 0,
        totalXp: streak?.total_xp ?? 0,
        idempotent: true,
      };
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
    // 2a. Verify Lesson Exists in Curriculum
    const lessonIndex = LESSON_LIST.findIndex((l) => l.id === input.lessonId);
    if (lessonIndex < 0) {
      throw new LessonPrerequisiteError(`Unknown lesson ID: ${input.lessonId}`);
    }

    // 2b. Verify Curriculum Prerequisite (Lesson N requires Lesson N-1 to be completed in verified account state)
    if (lessonIndex > 0) {
      const prevLesson = LESSON_LIST[lessonIndex - 1];
      const { data: prevProgress } = await supabase
        .from("lesson_progress")
        .select("completed")
        .eq("user_id", userId)
        .eq("lesson_id", prevLesson.id)
        .maybeSingle();

      if (!prevProgress || !prevProgress.completed) {
        throw new LessonPrerequisiteError(
          `Curriculum prerequisite not met: you must complete ${prevLesson.name} before starting ${LESSON_LIST[lessonIndex].name}`
        );
      }
    }

    // 2c. Verify Step Sequence within Lesson (Step K requires Step K-1 to have been passed or completed)
    if (input.step > 1) {
      const { data: currentProgressRow } = await supabase
        .from("lesson_progress")
        .select("current_step, completed")
        .eq("user_id", userId)
        .eq("lesson_id", input.lessonId)
        .maybeSingle();

      const recordedStep = currentProgressRow?.current_step ?? 0;
      const isAlreadyCompleted = currentProgressRow?.completed ?? false;

      if (!isAlreadyCompleted && recordedStep < input.step - 1) {
        throw new LessonStepSequenceError(
          `Step prerequisite not met: step ${input.step} cannot be submitted before completing step ${input.step - 1}`
        );
      }
    }

    const attemptPayload: LessonAttemptInsert = {
      id: input.runId,
      user_id: userId,
      lesson_id: input.lessonId,
      wpm: input.wpm,
      accuracy: input.accuracy,
      stars: input.stars,
      completed: input.completed,
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
    if (isFirstTimeCompletion && !input.isGuestImport) {
      receipt.earnedXp = 50 + Math.min(100, Math.round(input.wpm));
    } else {
      receipt.earnedXp = 0;
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

      // Daily stats update (non-fatal if RLS restricts daily stats mutations)
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
        console.warn("[lessons] daily_stats update non-fatal error:", err);
      }

      // Player streak & XP update (non-fatal if RLS restricts streak mutations)
      try {
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
      } catch (err) {
        console.warn("[lessons] player_streaks update non-fatal error:", err);
      }

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

  // Evaluate achievements (strictly only for authenticated verified runs, never for guest imports)
  if (!input.isGuestImport) {
    await evaluateAndSyncAchievements(userId).catch((err) =>
      console.warn("[lessons] achievement sync non-fatal error:", err)
    );
  }

  // Settlement complete
  receipt.stage = "complete";
  await updateSettlementReceipt(receipt);

  return {
    progress: progressRecord,
    earnedXp: existingAttempt ? 0 : earnedXp,
    totalXp: finalTotalXp,
    idempotent: Boolean(existingAttempt),
    verified: !input.isGuestImport,
    trustTier: input.isGuestImport ? "imported" : "verified",
  };
}

export async function getUserLessonProgress(
  userId: string,
  userSupabase?: SupabaseServerClient
) {
  const supabase = await getSupabaseForRead(userSupabase);

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch lesson progress: ${error.message}`);
  }

  return data || [];
}

export async function resetUserLessonProgress(userId: string) {
  const supabase = createAdminClient();

  const [delAttempts, delProgress] = await Promise.all([
    supabase.from("lesson_attempts").delete().eq("user_id", userId),
    supabase.from("lesson_progress").delete().eq("user_id", userId),
  ]);

  if (delAttempts.error) {
    console.warn("[lessons] failed to delete lesson_attempts on reset:", delAttempts.error);
  }
  if (delProgress.error) {
    console.warn("[lessons] failed to delete lesson_progress on reset:", delProgress.error);
    throw new Error(`Failed to reset lesson progress: ${delProgress.error.message}`);
  }

  return { success: true };
}

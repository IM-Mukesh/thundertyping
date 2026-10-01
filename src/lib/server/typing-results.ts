import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedTypingResultInput } from "@/lib/server/validation";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";

async function getSupabaseForRead() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

export async function saveTypingResult(userId: string, input: ValidatedTypingResultInput) {
  const supabase = createAdminClient();

  // 1. Insert result record
  const { data: result, error: insertError } = await supabase
    .from("typing_results")
    .insert({
      user_id: userId,
      mode: input.mode,
      duration: input.duration,
      wpm: input.wpm,
      raw_wpm: input.rawWpm,
      accuracy: input.accuracy,
      consistency: input.consistency,
      correct_chars: input.correctChars,
      incorrect_chars: input.incorrectChars,
      extra_chars: input.extraChars,
      missed_chars: input.missedChars,
      param: input.param,
      punctuation: input.punctuation,
      numbers: input.numbers,
      ...(input.createdAt ? { created_at: input.createdAt } : {}),
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to save typing result: ${insertError.message}`);
  }

  // 2. Update daily aggregate stats (optimistic-concurrency: retries on a
  // conflicting concurrent writer instead of blindly overwriting its update)
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
        const newTestsCompleted = existingDaily.tests_completed + 1;
        const newAvgWpm = Math.round(((existingDaily.average_wpm * existingDaily.tests_completed) + input.wpm) / newTestsCompleted);
        const newBestWpm = Math.max(existingDaily.best_wpm, input.wpm);
        const newAvgAcc = Math.round(((existingDaily.average_accuracy * existingDaily.tests_completed) + input.accuracy) / newTestsCompleted);

        const { data: updatedRows, error } = await supabase
          .from("daily_stats")
          .update({
            tests_completed: newTestsCompleted,
            average_wpm: newAvgWpm,
            best_wpm: newBestWpm,
            average_accuracy: newAvgAcc,
            practice_minutes: Number((existingDaily.practice_minutes + (input.duration / 60)).toFixed(2)),
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
          tests_completed: 1,
          average_wpm: Math.round(input.wpm),
          best_wpm: Math.round(input.wpm),
          average_accuracy: Math.round(input.accuracy),
          practice_minutes: Number((input.duration / 60).toFixed(2)),
        });
        if (error) {
          if (error.code === UNIQUE_VIOLATION) {
            throw new Error("CONFLICT: daily_stats row created concurrently");
          }
          throw error;
        }
      }
    });

    // 3. Update player streak & XP
    const earnedXp = Math.max(5, Math.round(input.wpm / 2));
    await withOptimisticRetry(async () => {
      const { data: streak } = await supabase
        .from("player_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (streak) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        let newStreak = streak.current_streak;

        if (streak.last_active_date === yesterday) {
          newStreak += 1;
        } else if (streak.last_active_date !== today) {
          newStreak = 1;
        }

        const { data: updatedRows, error } = await supabase
          .from("player_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(streak.longest_streak, newStreak),
            last_active_date: today,
            total_xp: streak.total_xp + earnedXp,
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
    // Non-blocking: daily stats / streak update should not fail the primary result insert
    console.error("Non-fatal error updating daily stats/streaks:", err);
  }

  return result;
}

export async function getTypingResultsHistory(userId: string, limit = 50) {
  const supabase = await getSupabaseForRead();
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const { data, error } = await supabase
    .from("typing_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(`Failed to fetch typing history: ${error.message}`);
  }

  return data || [];
}

import { createAdminClient } from "@/lib/supabase/admin";
import { withOptimisticRetry, UNIQUE_VIOLATION } from "@/lib/server/optimistic-retry";

export async function awardCloudXp(userId: string, amount: number): Promise<{ totalXp: number }> {
  const supabase = createAdminClient();

  return withOptimisticRetry(async () => {
    const { data: streak } = await supabase
      .from("player_streaks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // player_streaks rows are auto-created by the handle_new_user() trigger
    // on signup, so this should always exist -- but don't silently drop a
    // real XP award if it's somehow missing.
    if (!streak) {
      const { data: inserted, error } = await supabase
        .from("player_streaks")
        .insert({ user_id: userId, total_xp: amount })
        .select()
        .single();
      if (error) {
        if (error.code === UNIQUE_VIOLATION) {
          throw new Error("CONFLICT: player_streaks row created concurrently");
        }
        throw error;
      }
      return { totalXp: inserted.total_xp };
    }

    const newTotal = streak.total_xp + amount;
    const { data: updatedRows, error } = await supabase
      .from("player_streaks")
      .update({ total_xp: newTotal, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("updated_at", streak.updated_at)
      .select();

    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error("CONFLICT: player_streaks row changed concurrently");
    }
    return { totalXp: newTotal };
  });
}

export async function getCloudAchievements(userId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch achievements: ${error.message}`);
  }

  return (data || []).map((row) => row.achievement_id);
}

/** Returns true only the first time this achievement is granted for this user. */
export async function grantCloudAchievement(userId: string, achievementId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("achievements").insert({
    user_id: userId,
    achievement_id: achievementId,
  });

  if (!error) return true;
  if (error.code === UNIQUE_VIOLATION) return false;
  throw new Error(`Failed to grant achievement: ${error.message}`);
}

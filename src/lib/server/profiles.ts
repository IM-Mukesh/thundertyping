import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedProfileUpdateInput, ValidatedPreferencesInput } from "@/lib/server/validation";

async function getSupabaseForRead() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

async function getSupabaseForWrite() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

export async function getUserProfile(userId: string) {
  const supabase = await getSupabaseForRead();

  const [profileRes, prefsRes, streakRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("player_streaks").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (profileRes.error) {
    throw new Error(`Failed to fetch profile: ${profileRes.error.message}`);
  }

  // Self-heal default rows if trigger was skipped (e.g. manual insertion or direct signup)
  let profile = profileRes.data;
  if (!profile) {
    try {
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({ id: userId })
        .select()
        .single();
      if (!createError && newProfile) {
        profile = newProfile;
      }
    } catch {
      // Ignore if restricted by RLS
    }
  }

  let preferences = prefsRes.data;
  if (!preferences) {
    try {
      const { data: newPrefs, error: createPrefsError } = await supabase
        .from("user_preferences")
        .insert({ user_id: userId })
        .select()
        .single();
      if (!createPrefsError && newPrefs) {
        preferences = newPrefs;
      }
    } catch {
      // Ignore if restricted by RLS
    }
  }

  let streak = streakRes.data;
  if (!streak) {
    try {
      const { data: newStreak, error: createStreakError } = await supabase
        .from("player_streaks")
        .insert({ user_id: userId })
        .select()
        .single();
      if (!createStreakError && newStreak) {
        streak = newStreak;
      }
    } catch {
      // Ignore if restricted by RLS
    }
  }

  return {
    profile,
    preferences,
    streak,
  };
}

export async function updateUserProfile(userId: string, input: ValidatedProfileUpdateInput) {
  const supabase = await getSupabaseForWrite();

  const updatePayload: {
    display_name?: string | null;
    username?: string | null;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.displayName !== undefined) {
    updatePayload.display_name = input.displayName;
  }
  if (input.username !== undefined) {
    updatePayload.username = input.username;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Username is already taken");
    }
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data;
}

export async function getUserPreferences(userId: string) {
  const supabase = await getSupabaseForRead();

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch preferences: ${error.message}`);
  }

  return data;
}

export async function updateUserPreferences(userId: string, input: ValidatedPreferencesInput) {
  const supabase = await getSupabaseForWrite();

  const payload: {
    theme?: string;
    sound_enabled?: boolean;
    sound_volume?: number;
    keyboard_layout?: string;
    confidence_mode?: string;
    quick_restart?: string;
    smooth_caret?: string;
    font_size?: string;
    font_family?: string;
    default_test_mode?: string;
    default_test_duration?: number;
    punctuation?: boolean;
    numbers?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.theme !== undefined) payload.theme = input.theme;
  if (input.soundEnabled !== undefined) payload.sound_enabled = input.soundEnabled;
  if (input.soundVolume !== undefined) payload.sound_volume = input.soundVolume;
  if (input.keyboardLayout !== undefined) payload.keyboard_layout = input.keyboardLayout;
  if (input.confidenceMode !== undefined) payload.confidence_mode = input.confidenceMode;
  if (input.quickRestart !== undefined) payload.quick_restart = input.quickRestart;
  if (input.smoothCaret !== undefined) payload.smooth_caret = input.smoothCaret;
  if (input.fontSize !== undefined) payload.font_size = input.fontSize;
  if (input.fontFamily !== undefined) payload.font_family = input.fontFamily;
  if (input.defaultTestMode !== undefined) payload.default_test_mode = input.defaultTestMode;
  if (input.defaultTestDuration !== undefined) payload.default_test_duration = input.defaultTestDuration;
  if (input.punctuation !== undefined) payload.punctuation = input.punctuation;
  if (input.numbers !== undefined) payload.numbers = input.numbers;

  // Upsert preferences in case the row didn't exist
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: userId,
      ...payload,
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update preferences: ${error.message}`);
  }

  return data;
}

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { getAuthGeneration, getCurrentUserId, setCurrentUserId } from "@/lib/auth/current-user";
import { primeCloudGameBests, clearCloudGameBests } from "@/lib/games/game-scores";
import { primeCloudLessonProgress, restoreLocalLessonProgress } from "@/lib/lessons/lesson-progress-store";
import { primeCloudPersonalBests, clearCloudPersonalBests } from "@/lib/persistence/results-store";
import { primeCloudXp, primeCloudAchievements, clearCloudProfile } from "@/lib/profile/player-profile";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PreferencesRow = Database["public"]["Tables"]["user_preferences"]["Row"];
type StreakRow = Database["public"]["Tables"]["player_streaks"]["Row"];

export interface AuthContextValue {
  user: User | null;
  profile: ProfileRow | null;
  preferences: PreferencesRow | null;
  streak: StreakRow | null;
  isLoading: boolean;
  isGuest: boolean;
  signInWithGoogleIdToken: (idToken: string, nonce: string) => Promise<{ error: string | null }>;
  signInWithOtp: (email: string, redirectTo?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [preferences, setPreferences] = useState<PreferencesRow | null>(null);
  const [streak, setStreak] = useState<StreakRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const refreshProfile = useCallback(async () => {
    let generation = getAuthGeneration();
    // The session is the source of truth for authentication. Profile loading
    // may fail independently (for example while the server key is being
    // configured), but that must not make an authenticated user appear as a
    // guest in the UI.
    try {
      const { data } = await supabase.auth.getSession();
      if (generation !== getAuthGeneration()) return null;
      const sessionUser = data.session?.user ?? null;
      if (getCurrentUserId() !== (sessionUser?.id ?? null)) {
        setCurrentUserId(sessionUser?.id ?? null);
        setProfile(null);
        setPreferences(null);
        setStreak(null);
      }
      generation = getAuthGeneration();
      setUser(sessionUser);
    } catch {
      // Falls through to the /api/profile check below.
    }

    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const json = await res.json();
        if (generation !== getAuthGeneration()) return null;
        if (json.success && json.data && json.data.user?.id === getCurrentUserId()) {
          if (json.data.user) {
            setUser(json.data.user as User);
          }
          setProfile(json.data.profile);
          setPreferences(json.data.preferences);
          setStreak(json.data.streak);
          primeCloudXp(json.data.streak?.total_xp ?? 0);
          return json.data.user as User;
        }
      } else if (res.status === 401) {
        // The server round-trip (getUser(), which re-verifies the JWT against
        // Supabase's auth server over the network) can transiently fail right
        // after a fresh sign-in, before the new token is done propagating —
        // even though the local session (getSession(), no network call) is
        // already valid. Only treat this as a real sign-out if the local
        // session agrees there's no one signed in; otherwise keep the user
        // signed in in the UI and let the next refresh retry the profile load.
        const { data: recheck } = await supabase.auth.getSession();
        if (generation !== getAuthGeneration()) return null;
        if (!recheck.session?.user) {
          setUser(null);
          setProfile(null);
          setPreferences(null);
          setStreak(null);
        }
      }
    } catch {
      // Falls through to the session check below.
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (generation !== getAuthGeneration()) return null;
    return sessionData.session?.user ?? null;
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const verifiedUser = await refreshProfile();
        if (!mounted) return;
        const id = verifiedUser?.id ?? null;
        if (id !== getCurrentUserId()) return;
        if (id) {
          primeCloudGameBests(id);
          primeCloudLessonProgress();
          primeCloudPersonalBests(id);
          primeCloudAchievements();
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    let unsubscribe = () => {};
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_IN" || (event === "INITIAL_SESSION" && session?.user)) {
          if (!mounted) return;
          const id = session?.user.id ?? null;
          if (id !== getCurrentUserId()) {
            setCurrentUserId(id);
            setProfile(null);
            setPreferences(null);
            setStreak(null);
          }
          setUser(session?.user ?? null);
          const u = await refreshProfile();
          if (mounted && u && u.id === getCurrentUserId()) {
            primeCloudGameBests(u.id);
            primeCloudLessonProgress();
            primeCloudPersonalBests(u.id);
            primeCloudAchievements();
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setPreferences(null);
          setStreak(null);
          setCurrentUserId(null);
          clearCloudGameBests();
          restoreLocalLessonProgress();
          clearCloudPersonalBests();
          clearCloudProfile();
        }
      });
      if (data?.subscription) {
        unsubscribe = () => data.subscription.unsubscribe();
      }
    } catch {
      // Ignore — unsubscribe stays the no-op default.
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [supabase, refreshProfile]);

  const signInWithGoogleIdToken = useCallback(
    async (idToken: string, nonce: string): Promise<{ error: string | null }> => {
      try {
        // Exchanges an ID token obtained directly from Google Identity
        // Services (client-side, no redirect through Supabase's hosted
        // /authorize endpoint) for a real Supabase session. Supabase still
        // verifies the token server-side against Google's public keys --
        // same security guarantee as the redirect-based signInWithOAuth,
        // just without the account picker being attributed to a Supabase
        // subdomain instead of this site.
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
          nonce,
        });

        return { error: error ? error.message : null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to sign in with Google";
        return { error: msg };
      }
    },
    [supabase]
  );

  const signInWithOtp = useCallback(
    async (email: string, redirectTo?: string): Promise<{ error: string | null }> => {
      try {
        const callbackUrl = new URL("/api/auth/callback", window.location.origin);
        if (redirectTo) {
          callbackUrl.searchParams.set("next", redirectTo);
        }

        const res = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, redirectTo: callbackUrl.toString() }),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          return { error: json?.error || "Failed to send verification code" };
        }

        return { error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to communicate with authentication service";
        console.error("[signInWithOtp] error:", err);
        return { error: msg };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch (e) {
      console.error("[signOut] Server signout call error:", e);
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[signOut] Browser client signout error:", e);
    }
    setUser(null);
    setProfile(null);
    setPreferences(null);
    setStreak(null);
    setCurrentUserId(null);
    clearCloudGameBests();
    restoreLocalLessonProgress();
    clearCloudPersonalBests();
    clearCloudProfile();
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      profile,
      preferences,
      streak,
      isLoading,
      isGuest: !user,
      signInWithGoogleIdToken,
      signInWithOtp,
      signOut,
      refreshProfile,
    }),
    [user, profile, preferences, streak, isLoading, signInWithGoogleIdToken, signInWithOtp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

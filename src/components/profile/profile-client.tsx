"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Flame,
  Gamepad2,
  Star,
  Trophy,
  Cloud,
  CheckCircle2,
  Edit3,
  Check,
  X as CloseIcon,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  levelProgress,
  profileServerSnapshot,
  parseProfile,
  readProfileRaw,
  subscribeProfile,
  getEarnedAchievementCount,
  primeCloudAchievements,
} from "@/lib/profile/player-profile";
import { ACHIEVEMENT_LIST } from "@/lib/profile/achievements";
import { LESSON_ACHIEVEMENT_LIST, computeLessonAchievements } from "@/lib/lessons/lesson-achievements";
import { useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { GAME_LIST } from "@/lib/games/game-types";
import { getGameBest, primeCloudGameBests } from "@/lib/games/game-scores";
import { AudioSettings } from "@/components/games/ui/audio-settings";
import { cn } from "@/lib/utils/cn";

const emptySubscribe = () => () => {};

export function ProfileClient() {
  const router = useRouter();
  const { user, profile: serverProfile, streak, refreshProfile, signOut } = useAuth();
  const [cloudBestsTick, setCloudBestsTick] = useState(0);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Raw string snapshot, parsed in a memo: a parsed object is a new reference
  // every call and would re-render forever.
  const raw = useSyncExternalStore(
    subscribeProfile,
    readProfileRaw,
    profileServerSnapshot,
  );
  const profile = useMemo(() => parseProfile(raw), [raw]);
  useEffect(() => {
    if (!user) return;
    Promise.all([primeCloudGameBests(user.id), primeCloudAchievements()]).then(() =>
      setCloudBestsTick((t) => t + 1)
    );
  }, [user]);

  const units = useLessonProgressStore((s) => s.units);
  const lessonEarned = useMemo(() => computeLessonAchievements(units), [units]);
  const lessonEarnedCount = Object.values(lessonEarned).filter(Boolean).length;
  const gameEarnedCount = useMemo(() => {
    void cloudBestsTick;
    void profile;
    return getEarnedAchievementCount();
  }, [cloudBestsTick, profile]);
  const totalEarned = gameEarnedCount + lessonEarnedCount;
  const totalPossible = ACHIEVEMENT_LIST.length + LESSON_ACHIEVEMENT_LIST.length;

  // Signed-in players show cloud-only stats so a different account on the
  // same browser never inherits another player's local progress. Guests show
  // their local-only stats.
  const displayXp = user ? streak?.total_xp ?? 0 : profile.xp;
  const displayStreakCount = user ? streak?.current_streak ?? 0 : profile.streak.count;
  const { level, into, needed, fraction } = levelProgress(displayXp);

  const gameBests = useMemo(() => {
    void cloudBestsTick;
    const map: Record<string, ReturnType<typeof getGameBest>> = {};
    if (!mounted) return map;
    for (const game of GAME_LIST) map[game.id] = getGameBest(game.id);
    return map;
  }, [mounted, cloudBestsTick]);

  // Cloud writes don't track per-game run counts yet, so for signed-in
  // players this undercounts (one per game with a recorded best) rather than
  // reading local per-run counters, which would risk a different signed-in
  // account inheriting this browser's local counts.
  const totalRuns = user
    ? Object.values(gameBests).filter(Boolean).length
    : Object.values(profile.stats).reduce((n, s) => n + (s.runs ?? 0), 0);

  const effectiveDisplayName =
    serverProfile?.display_name ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    user?.email?.split("@")[0] ||
    "Typist";
  const effectiveInitial = (effectiveDisplayName[0] || "U").toUpperCase();

  const handleStartEdit = () => {
    setDisplayNameInput(
      serverProfile?.display_name ||
      (user?.user_metadata?.full_name as string) ||
      (user?.user_metadata?.name as string) ||
      ""
    );
    setUsernameInput(serverProfile?.username || "");
    setEditError(null);
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setEditError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayNameInput.trim() || undefined,
          username: usernameInput.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setEditError(json.error?.message || "Failed to update profile");
      } else {
        await refreshProfile();
        setIsEditing(false);
      }
    } catch {
      setEditError("Failed to communicate with server");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Account & Cloud Sync Status Card */}
      <section className="theme-transition rounded-2xl border border-border bg-sub-alt/25 p-5 sm:p-6">
        {user ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 font-display text-lg font-bold text-accent shadow-sm">
                  {effectiveInitial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-display text-base font-bold text-foreground">
                      {effectiveDisplayName}
                    </h2>
                    {serverProfile?.username && (
                      <span className="font-mono text-xs text-sub">@{serverProfile.username}</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-sub">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-medium text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>Cloud Sync Active</span>
                </span>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-sub-alt/40 px-3 py-1 font-display text-xs text-sub hover:border-accent hover:text-foreground transition-colors"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    router.refresh();
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-display text-xs text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Inline Profile Edit Form */}
            {isEditing && (
              <form onSubmit={handleSaveProfile} className="mt-2 flex flex-col gap-3 rounded-xl border border-border bg-sub-alt/40 p-4">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Update Profile Details
                </h3>

                {editError && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                    {editError}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="displayName" className="block text-[11px] font-medium text-sub mb-1">
                      Display Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      maxLength={50}
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="e.g. MasterTypist"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-[11px] font-medium text-sub mb-1">
                      Username (alphanumeric)
                    </label>
                    <input
                      id="username"
                      type="text"
                      maxLength={24}
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="e.g. speed_demon"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-sub hover:text-foreground"
                  >
                    <CloseIcon size={13} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-background hover:brightness-110 disabled:opacity-50"
                  >
                    <Check size={13} /> {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent mt-0.5">
                <Cloud size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm font-bold text-foreground">Guest Mode</h2>
                  <span className="rounded-full bg-sub-alt px-2 py-0.5 font-mono text-[10px] text-sub">Local Only</span>
                </div>
                <p className="mt-1 text-xs text-sub max-w-xl">
                  Your stats are currently saved in this browser only. Sign in with Google to enable cloud backup and sync progress across devices.
                </p>
              </div>
            </div>

            <Link
              href="/auth/login"
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-background shadow-sm hover:brightness-110 active:scale-95 transition-all"
            >
              <LogIn size={14} />
              <span>Enable Cloud Sync</span>
            </Link>
          </div>
        )}
      </section>
      {/* level */}
      <section className="theme-transition rounded-2xl border border-border bg-sub-alt/20 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-lg font-bold text-foreground">
            Level {mounted ? level : 1}
          </h2>
          <span className="font-mono text-xs tabular-nums text-accent">
            {mounted ? into.toLocaleString() : "0"} / {mounted ? needed.toLocaleString() : "100"} XP
          </span>
        </div>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sub-alt"
          role="progressbar"
          aria-valuenow={mounted ? Math.round(fraction * 100) : 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level ${mounted ? level : 1} progress`}
        >
          <div
            className="h-full bg-accent transition-[width] duration-500"
            style={{ width: `${mounted ? fraction * 100 : 0}%` }}
          />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={<Star size={14} />} label="Total XP" value={mounted ? displayXp.toLocaleString() : "0"} />
          <Stat icon={<Gamepad2 size={14} />} label="Runs played" value={mounted ? totalRuns.toLocaleString() : "0"} />
          <Stat
            icon={<Trophy size={14} />}
            label="Achievements"
            value={mounted ? `${totalEarned}/${totalPossible}` : `0/${totalPossible}`}
            href="/achievements"
          />
          <Stat icon={<Flame size={14} />} label="Day streak" value={mounted ? displayStreakCount.toLocaleString() : "0"} />
        </dl>
      </section>

      {/* per-game */}
      <section>
        <h2 className="mb-3 font-mono text-lg font-bold text-foreground">
          By game
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {GAME_LIST.map((game) => {
            const s = !user && mounted ? (profile.stats[game.id] ?? {}) : {};
            const best = gameBests[game.id];
            const played = mounted && ((s.runs ?? 0) > 0 || Boolean(best));
            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors",
                  played
                    ? "border-border bg-sub-alt/30 hover:border-accent"
                    : "border-border/50 opacity-60 hover:border-border",
                )}
                style={{ ["--accent" as string]: game.accent }}
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold text-foreground">
                    {game.name}
                  </p>
                  <p className="font-mono text-[11px] text-sub">
                    {played
                       ? `${s.runs ?? 1} run${(s.runs ?? 1) === 1 ? "" : "s"}${
                          s.wins ? ` · ${s.wins} won` : ""
                        }`
                      : "Not played yet"}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs tabular-nums text-accent">
                  {best
                    ? game.scoreBy === "time"
                      ? `${best.score}s`
                      : best.score.toLocaleString()
                    : "—"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* audio */}
      <section>
        <h2 className="mb-3 font-mono text-lg font-bold text-foreground">Audio</h2>
        <div className="theme-transition rounded-2xl border border-border bg-sub-alt/20 p-5">
          <AudioSettings />
        </div>
      </section>

    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-accent">{icon}</span>
      <div className="min-w-0">
        <dd className="font-mono text-base font-bold tabular-nums text-foreground group-hover/stat:text-accent">
          {value}
        </dd>
        <dt className="truncate font-mono text-[10px] uppercase tracking-wide text-sub">
          {label}
        </dt>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group/stat transition-colors hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

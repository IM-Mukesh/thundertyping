"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Flame, Gamepad2, Star, Trophy } from "lucide-react";
import {
  levelProgress,
  profileServerSnapshot,
  parseProfile,
  readProfileRaw,
  subscribeProfile,
} from "@/lib/profile/player-profile";

/**
 * The player's own figures, in the slot a mockup would put "125,432 active
 * players" in.
 *
 * That number would be fabricated: this site has no backend and no accounts, so
 * there is nothing to count. Publishing an invented player count is dishonest to
 * the reader and a real risk in an ad-network review, where inflated traffic
 * claims are exactly what gets a site rejected. These are all things the profile
 * actually knows.
 *
 * Renders a zeroed state on the server and fills in after mount, because the
 * profile lives in localStorage and reading it during render would desync
 * hydration.
 *
 * The store snapshot is the raw string, not the parsed profile: a snapshot must
 * be referentially stable between changes, and readProfile() builds a fresh
 * object every call, which re-renders forever. Parsing happens in the memo
 * below.
 */
export function PlayerSummary() {
  const raw = useSyncExternalStore(
    subscribeProfile,
    readProfileRaw,
    profileServerSnapshot,
  );
  const profile = useMemo(() => (raw === null ? null : parseProfile(raw)), [raw]);

  const xp = profile?.xp ?? 0;
  const { level, into, needed, fraction } = levelProgress(xp);
  const runs = profile
    ? Object.values(profile.stats).reduce((n, s) => n + (s.runs ?? 0), 0)
    : 0;
  const achievements = profile ? Object.keys(profile.achievements).length : 0;
  const streak = profile?.streak.count ?? 0;

  const stats = [
    { icon: Star, label: "Level", value: level.toLocaleString() },
    { icon: Gamepad2, label: "Runs played", value: runs.toLocaleString() },
    { icon: Trophy, label: "Achievements", value: achievements.toLocaleString() },
    { icon: Flame, label: "Day streak", value: streak.toLocaleString() },
  ];

  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
        <span className="text-sub">Your progress</span>
        <span className="tabular-nums text-accent">
          {into.toLocaleString()} / {needed.toLocaleString()} XP
        </span>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-sub-alt"
        role="progressbar"
        aria-valuenow={Math.round(fraction * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level ${level} progress`}
      >
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon size={14} className="shrink-0 text-accent" aria-hidden="true" />
            <div className="min-w-0">
              <dd className="font-mono text-sm font-bold tabular-nums text-foreground">
                {value}
              </dd>
              <dt className="truncate font-mono text-[10px] uppercase tracking-wide text-sub">
                {label}
              </dt>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

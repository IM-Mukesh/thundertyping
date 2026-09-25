"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import {
  levelProgress,
  parseProfile,
  profileServerSnapshot,
  readProfileRaw,
  subscribeProfile,
} from "@/lib/profile/player-profile";

import { cn } from "@/lib/utils/cn";

/**
 * The level chip in the header, as in the reference design.
 *
 * The reference shows "Level 24 / 2,840 XP" — those are real here, read from
 * the local profile, and start at Level 1 rather than being seeded with an
 * invented number.
 *
 * Hidden until the player has any XP at all: a permanent "Level 1 / 0 XP" chip
 * on a first visit is noise, and it makes the header wider on the one screen
 * size where that hurts most.
 */
export function LevelBadge({ showOnMobile }: { showOnMobile?: boolean } = {}) {
  const raw = useSyncExternalStore(
    subscribeProfile,
    readProfileRaw,
    profileServerSnapshot,
  );
  const profile = useMemo(() => parseProfile(raw), [raw]);
  const { level, fraction } = levelProgress(profile.xp);

  if (profile.xp <= 0) return null;

  return (
    <Link
      href="/profile"
      className={cn(
        "ml-1 items-center gap-2 rounded-lg border border-border px-2.5 transition-colors hover:border-accent min-h-9",
        showOnMobile ? "flex" : "hidden sm:flex",
      )}
      aria-label={`Level ${level}, ${profile.xp.toLocaleString()} XP. Open your profile.`}
    >
      <span className="flex flex-col leading-none">
        <span className="font-display text-[11px] font-bold uppercase tracking-wide text-foreground">
          Lv {level}
        </span>
        <span className="mt-1 block h-1 w-10 sm:w-12 overflow-hidden rounded-full bg-sub-alt">
          <span
            className="block h-full bg-accent transition-[width] duration-500"
            style={{ width: `${fraction * 100}%` }}
          />
        </span>
      </span>
      <span className="hidden sm:inline font-display text-[9px] tabular-nums text-sub">
        {profile.xp.toLocaleString()}
      </span>
    </Link>
  );
}

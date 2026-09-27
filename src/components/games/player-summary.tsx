"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Gamepad2, Layers, Star, Trophy } from "lucide-react";
import { GAME_LIST } from "@/lib/games/game-types";
import {
  levelProgress,
  profileServerSnapshot,
  parseProfile,
  readProfileRaw,
  subscribeProfile,
} from "@/lib/profile/player-profile";

import { computeLessonAchievements } from "@/lib/lessons/lesson-achievements";
import { useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";

// Site facts (never change per-player) alongside the two genuinely personal
// figures. Computed once at module scope, not per render -- GAME_LIST is
// static data.
const GAME_COUNT = GAME_LIST.length;
const GAME_MODE_COUNT = new Set(GAME_LIST.map((g) => g.category)).size;

/**
 * The player's own figures, in the slot a mockup would put "125,432 active
 * players" in.
 *
 * A global player count or ranking would be fabricated: this site has no
 * backend and no accounts, so there is nothing to count. Publishing an
 * invented number is dishonest to the reader and a real risk in an ad-network
 * review, where inflated traffic claims are exactly what gets a site
 * rejected. Achievements and level/XP are real, local, and actually known.
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
  const profile = useMemo(() => parseProfile(raw), [raw]);
  const { level, into, needed } = levelProgress(profile.xp);

  const units = useLessonProgressStore((s) => s.units);
  const lessonEarned = useMemo(() => computeLessonAchievements(units), [units]);
  const lessonEarnedCount = Object.values(lessonEarned).filter(Boolean).length;
  const gameEarnedCount = Object.keys(profile.achievements).length;
  const totalEarned = gameEarnedCount + lessonEarnedCount;

  const stats = [
    { icon: Gamepad2, value: GAME_COUNT.toLocaleString(), label: "Games" },
    { icon: Layers, value: GAME_MODE_COUNT.toLocaleString(), label: "Game modes" },
    { icon: Trophy, value: totalEarned.toLocaleString(), label: "Achievements" },
    {
      icon: Star,
      value: `${into.toLocaleString()}/${needed.toLocaleString()} XP`,
      label: `Level ${level}`,
    },
  ];

  return (
    <dl className="flex flex-wrap items-center gap-x-7 gap-y-3">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon size={16} className="shrink-0 text-accent" aria-hidden="true" />
          <div className="min-w-0 leading-tight">
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
  );
}

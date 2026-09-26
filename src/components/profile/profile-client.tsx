"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Flame,
  Gamepad2,
  RotateCcw,
  Star,
  Trophy,
} from "lucide-react";
import {
  levelProgress,
  profileServerSnapshot,
  parseProfile,
  readProfileRaw,
  resetProfile,
  subscribeProfile,
} from "@/lib/profile/player-profile";
import { ACHIEVEMENT_LIST } from "@/lib/profile/achievements";
import { GAME_LIST } from "@/lib/games/game-types";
import { gameBestKey, parseGameBest } from "@/lib/games/game-scores";
import { getStorageItem } from "@/lib/persistence/storage";
import { AudioSettings } from "@/components/games/ui/audio-settings";
import { cn } from "@/lib/utils/cn";

export function ProfileClient() {
  // Raw string snapshot, parsed in a memo: a parsed object is a new reference
  // every call and would re-render forever.
  const raw = useSyncExternalStore(
    subscribeProfile,
    readProfileRaw,
    profileServerSnapshot,
  );
  const profile = useMemo(() => parseProfile(raw), [raw]);
  const [confirmReset, setConfirmReset] = useState(false);

  const { level, into, needed, fraction } = levelProgress(profile.xp);
  const earned = Object.keys(profile.achievements).length;
  const totalRuns = Object.values(profile.stats).reduce(
    (n, s) => n + (s.runs ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      {/* level */}
      <section className="theme-transition rounded-2xl border border-border bg-sub-alt/20 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-lg font-bold text-foreground">
            Level {level}
          </h2>
          <span className="font-mono text-xs tabular-nums text-accent">
            {into.toLocaleString()} / {needed.toLocaleString()} XP
          </span>
        </div>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sub-alt"
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
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat icon={<Star size={14} />} label="Total XP" value={profile.xp.toLocaleString()} />
          <Stat icon={<Gamepad2 size={14} />} label="Runs played" value={totalRuns.toLocaleString()} />
          <Stat icon={<Trophy size={14} />} label="Achievements" value={`${earned}/${ACHIEVEMENT_LIST.length}`} />
          <Stat icon={<Flame size={14} />} label="Day streak" value={profile.streak.count.toLocaleString()} />
        </dl>
      </section>

      {/* per-game */}
      <section>
        <h2 className="mb-3 font-mono text-lg font-bold text-foreground">
          By game
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {GAME_LIST.map((game) => {
            const s = profile.stats[game.id] ?? {};
            const best = parseGameBest(getStorageItem(gameBestKey(game.id)));
            const played = (s.runs ?? 0) > 0 || Boolean(best);
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
                      ? `${s.runs ?? 0} run${(s.runs ?? 0) === 1 ? "" : "s"}${
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

      {/* danger zone */}
      <section>
        <h2 className="mb-3 font-mono text-lg font-bold text-foreground">
          Reset
        </h2>
        <div className="theme-transition flex flex-col gap-3 rounded-2xl border border-error/40 bg-error/5 p-5">
          <p className="text-sm text-sub">
            Clears your level, XP, achievements, unlocks and per-game statistics
            on this device. Best scores and recorded ghosts are kept separately
            and are not affected. This cannot be undone.
          </p>
          {confirmReset ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  resetProfile();
                  setConfirmReset(false);
                }}
                className="min-h-11 rounded-lg bg-error px-4 font-mono text-xs font-bold uppercase tracking-wider text-background"
              >
                Yes, erase my progress
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-11 rounded-lg border border-border px-4 font-mono text-xs text-sub hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex min-h-11 w-fit items-center gap-2 rounded-lg border border-error/50 px-4 font-mono text-xs text-error transition-colors hover:bg-error hover:text-background"
            >
              <RotateCcw size={14} />
              Reset progress
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-accent">{icon}</span>
      <div className="min-w-0">
        <dd className="font-mono text-base font-bold tabular-nums text-foreground">
          {value}
        </dd>
        <dt className="truncate font-mono text-[10px] uppercase tracking-wide text-sub">
          {label}
        </dt>
      </div>
    </div>
  );
}

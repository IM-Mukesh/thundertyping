"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { Check, Lock } from "lucide-react";
import {
  profileServerSnapshot,
  parseProfile,
  readProfileRaw,
  subscribeProfile,
} from "@/lib/profile/player-profile";
import {
  ACHIEVEMENT_LIST,
  GAME_LABELS,
  type AchievementDef,
} from "@/lib/profile/achievements";
import { GAME_DEFINITIONS, type GameId } from "@/lib/games/game-types";
import { cn } from "@/lib/utils/cn";

export function AchievementsClient() {
  const raw = useSyncExternalStore(
    subscribeProfile,
    readProfileRaw,
    profileServerSnapshot,
  );
  const earnedMap = useMemo(() => parseProfile(raw).achievements, [raw]);
  const earned = Object.keys(earnedMap).length;

  const groups = useMemo(() => {
    const byGame = new Map<AchievementDef["game"], AchievementDef[]>();
    for (const a of ACHIEVEMENT_LIST) {
      const list = byGame.get(a.game) ?? [];
      list.push(a);
      byGame.set(a.game, list);
    }
    return [...byGame.entries()];
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-sub-alt"
          role="progressbar"
          aria-valuenow={earned}
          aria-valuemin={0}
          aria-valuemax={ACHIEVEMENT_LIST.length}
          aria-label="Achievements earned"
        >
          <div
            className="h-full bg-accent transition-[width] duration-500"
            style={{ width: `${(earned / ACHIEVEMENT_LIST.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-accent">
          {earned} / {ACHIEVEMENT_LIST.length}
        </span>
      </div>

      {groups.map(([game, list]) => {
        const accent =
          game === "site"
            ? undefined
            : GAME_DEFINITIONS[game as GameId]?.accent;
        return (
          <section
            key={game}
            style={accent ? ({ ["--accent" as string]: accent }) : undefined}
          >
            <h2 className="mb-3 flex items-baseline gap-2 font-mono text-lg font-bold text-foreground">
              {game === "site" ? (
                GAME_LABELS[game]
              ) : (
                <Link href={`/games/${game}`} className="hover:text-accent">
                  {GAME_LABELS[game]}
                </Link>
              )}
              <span className="font-mono text-xs font-normal text-sub">
                {list.filter((a) => earnedMap[a.id]).length}/{list.length}
              </span>
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {list.map((a) => {
                const got = Boolean(earnedMap[a.id]);
                // A secret stays nameless until earned, but its existence is
                // shown -- a hidden count with no placeholder reads as a bug.
                const hidden = a.secret && !got;
                return (
                  <li
                    key={a.id}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                      got
                        ? "border-accent/50 bg-accent/5"
                        : "border-border bg-sub-alt/20",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        got ? "bg-accent text-background" : "bg-sub-alt text-sub",
                      )}
                      aria-hidden="true"
                    >
                      {got ? <Check size={13} /> : <Lock size={12} />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-foreground">
                        {hidden ? "Hidden achievement" : a.name}
                      </p>
                      <p className="text-xs leading-snug text-sub">
                        {hidden
                          ? "Keep playing to reveal this one."
                          : a.description}
                      </p>
                      {got && (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-accent">
                          Earned {new Date(earnedMap[a.id]).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

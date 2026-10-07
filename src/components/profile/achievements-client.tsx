"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Lock, Swords } from "lucide-react";
import {
  profileServerSnapshot,
  parseProfile,
  readProfileRaw,
  subscribeProfile,
} from "@/lib/profile/player-profile";
import {
  ACHIEVEMENT_LIST,

  getAchievementGameLinkState,
  type AchievementDef,
} from "@/lib/profile/achievements";
import { GAME_DEFINITIONS, type GameId } from "@/lib/games/game-types";
import { LESSON_ACHIEVEMENT_LIST, computeLessonAchievements } from "@/lib/lessons/lesson-achievements";
import { useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { cn } from "@/lib/utils/cn";

// Two categories (Lessons, Games), not one long page of every achievement at
// once -- the overview shows just a count per category, and only the one you
// click renders its actual grid. Client-side view state rather than two
// routes: there's nothing here worth a separate URL, and switching stays
// instant.
type View = "overview" | "lessons" | "games";

export function AchievementsClient() {
  const [view, setView] = useState<View>("overview");

  const raw = useSyncExternalStore(subscribeProfile, readProfileRaw, profileServerSnapshot);
  const earnedMap = useMemo(() => parseProfile(raw).achievements, [raw]);
  const gameEarnedCount = Object.keys(earnedMap).length;

  const units = useLessonProgressStore((s) => s.units);
  const lessonEarned = useMemo(() => computeLessonAchievements(units), [units]);
  const lessonEarnedCount = Object.values(lessonEarned).filter(Boolean).length;

  if (view === "overview") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryCard
          icon={<GraduationCap size={22} />}
          title="Lessons"
          earned={lessonEarnedCount}
          total={LESSON_ACHIEVEMENT_LIST.length}
          onClick={() => setView("lessons")}
        />
        <CategoryCard
          icon={<Swords size={22} />}
          title="Games"
          earned={gameEarnedCount}
          total={ACHIEVEMENT_LIST.length}
          onClick={() => setView("games")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => setView("overview")}
        className="flex items-center gap-1.5 self-start font-mono text-xs text-sub transition-colors hover:text-foreground"
      >
        <ArrowLeft size={13} aria-hidden="true" />
        All categories
      </button>

      {view === "lessons" ? (
        <LessonAchievements earnedMap={lessonEarned} />
      ) : (
        <GameAchievements earnedMap={earnedMap} />
      )}
    </div>
  );
}

function CategoryCard({
  icon,
  title,
  earned,
  total,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  earned: number;
  total: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-4 rounded-2xl border border-border p-6 text-left transition-colors hover:border-accent"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">{icon}</span>
      <div>
        <h2 className="font-mono text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 font-mono text-sm text-sub">
          {earned} / {total} earned
        </p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-sub-alt">
        <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${(earned / total) * 100}%` }} />
      </div>
      <span className="flex items-center gap-1 font-mono text-xs text-sub transition-colors group-hover:text-accent">
        View achievements
        <ArrowRight size={12} aria-hidden="true" />
      </span>
    </button>
  );
}

function LessonAchievements({ earnedMap }: { earnedMap: Record<string, boolean> }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {LESSON_ACHIEVEMENT_LIST.map((a) => (
        <AchievementCard key={a.id} name={a.name} description={a.description} got={earnedMap[a.id] ?? false} />
      ))}
    </ul>
  );
}

function GameAchievements({ earnedMap }: { earnedMap: Record<string, string> }) {
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
      {groups.map(([game, list]) => {
        const accent = game === "site" ? undefined : GAME_DEFINITIONS[game as GameId]?.accent;
        return (
          <section key={game} style={accent ? ({ ["--accent" as string]: accent }) : undefined}>
            <h2 className="mb-3 flex items-baseline gap-2 font-mono text-lg font-bold text-foreground">
              {(() => {
                const linkState = getAchievementGameLinkState(game as AchievementDef["game"]);
                if (!linkState.href) {
                  return <span>{linkState.label}</span>;
                }
                return (
                  <Link href={linkState.href} className="hover:text-accent">
                    {linkState.label}
                  </Link>
                );
              })()}
              <span className="font-mono text-xs font-normal text-sub">
                {list.filter((a) => earnedMap[a.id]).length}/{list.length}
              </span>
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {list.map((a) => {
                const got = Boolean(earnedMap[a.id]);
                const hidden = a.secret && !got;
                return (
                  <AchievementCard
                    key={a.id}
                    name={hidden ? "Hidden achievement" : a.name}
                    description={hidden ? "Keep playing to reveal this one." : a.description}
                    got={got}
                    earnedAt={got ? earnedMap[a.id] : undefined}
                  />
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function AchievementCard({
  name,
  description,
  got,
  earnedAt,
}: {
  name: string;
  description: string;
  got: boolean;
  earnedAt?: string;
}) {
  return (
    <li
      className={cn(
        "theme-transition flex items-start gap-3 rounded-xl border p-3 transition-colors",
        got ? "border-accent/50 bg-accent/5" : "border-border bg-sub-alt/20",
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
        <p className="font-mono text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs leading-snug text-sub">{description}</p>
        {earnedAt !== undefined && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-accent">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </li>
  );
}

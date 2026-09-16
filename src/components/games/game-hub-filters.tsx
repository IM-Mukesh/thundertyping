"use client";

import { useMemo, useState } from "react";
import { Gamepad2, Grid3x3, Swords, Flag, Brain } from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { GameHubCard } from "@/components/games/game-hub-card";
import { cn } from "@/lib/utils/cn";

type Category = GameDefinition["category"];
type Filter = "all" | Category;
type Sort = "featured" | "name" | "shortest";

const TABS: { id: Filter; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Games", icon: <Grid3x3 size={13} /> },
  { id: "RPG", label: "RPG", icon: <Swords size={13} /> },
  { id: "Action", label: "Action", icon: <Gamepad2 size={13} /> },
  { id: "Racing", label: "Racing", icon: <Flag size={13} /> },
  { id: "Strategy", label: "Strategy", icon: <Brain size={13} /> },
  { id: "Arcade", label: "Arcade", icon: <Gamepad2 size={13} /> },
];

/**
 * Filter tabs and the card grid.
 *
 * Filtering happens client-side over a list the server already rendered, so
 * every game is in the initial HTML and stays indexable — a crawler never
 * clicks a tab. The alternative, fetching per tab, would hide nine games from
 * search for no gain on a list this small.
 */
export function GameHubFilters({
  games,
  art,
  characters,
}: {
  games: GameDefinition[];
  art: Record<string, string | null>;
  /** Cut-out foreground sprites, keyed by game id. Absent for the older six. */
  characters: Record<string, string | null>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("featured");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: games.length };
    for (const g of games) map[g.category] = (map[g.category] ?? 0) + 1;
    return map;
  }, [games]);

  const visible = useMemo(() => {
    const list = games.filter((g) => filter === "all" || g.category === filter);
    const sorted = [...list];
    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "shortest") {
      // Sort by the first number in the duration label: "2-5 min" -> 2.
      const mins = (g: GameDefinition) => parseInt(g.duration, 10) || 99;
      sorted.sort((a, b) => mins(a) - mins(b));
    } else {
      sorted.sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
      );
    }
    return sorted;
  }, [games, filter, sort]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Filter games by category"
          className="flex flex-wrap gap-1.5"
        >
          {TABS.filter((t) => t.id === "all" || counts[t.id]).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-mono text-xs transition-colors sm:min-h-9",
                  active
                    ? "bg-accent text-background"
                    : "bg-sub-alt text-sub hover:text-foreground",
                )}
              >
                {tab.icon}
                {tab.label}
                <span className={cn("tabular-nums", active ? "opacity-80" : "opacity-60")}>
                  ({counts[tab.id] ?? 0})
                </span>
              </button>
            );
          })}
        </div>

        <label className="ml-auto flex items-center gap-2 font-mono text-xs text-sub">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="min-h-11 rounded-lg border border-border bg-sub-alt px-2 font-mono text-xs text-foreground sm:min-h-9"
          >
            <option value="featured">Featured</option>
            <option value="name">Name</option>
            <option value="shortest">Shortest run</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((game, i) => (
          <GameHubCard
            key={game.id}
            game={game}
            art={art[game.id] ?? null}
            character={characters[game.id] ?? null}
            priority={i < 4}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="py-12 text-center font-mono text-sm text-sub">
          No games in that category yet.
        </p>
      )}
    </>
  );
}

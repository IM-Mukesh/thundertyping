"use client";

import { useMemo, useState } from "react";
import { Gamepad2, Grid3x3, Swords, Flag, Brain } from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { GameHubCard } from "@/components/games/game-hub-card";
import { SortControl } from "@/components/games/sort-control";
import { useGameSearchQuery } from "@/lib/games/game-search-store";
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
  const searchQuery = useGameSearchQuery();

  // Counts stay against the full list, not the search results -- the tabs
  // answer "how many games are in this category", not "how many currently
  // match", so they don't flicker between two different meanings as you type.
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: games.length };
    for (const g of games) map[g.category] = (map[g.category] ?? 0) + 1;
    return map;
  }, [games]);

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = games.filter((g) => {
      if (filter !== "all" && g.category !== filter) return false;
      if (!q) return true;
      return g.name.toLowerCase().includes(q) || g.tagline.toLowerCase().includes(q);
    });
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
  }, [games, filter, sort, searchQuery]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-2">
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
                  "group/tab relative flex min-h-11 items-center gap-1.5 rounded-lg border px-3",
                  "font-display text-[11px] uppercase tracking-wider transition-all duration-200 sm:min-h-9",
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border/60 bg-sub-alt/40 text-sub hover:border-accent/50 hover:text-foreground",
                )}
                style={
                  active
                    ? {
                        boxShadow:
                          "0 0 18px -6px color-mix(in srgb, var(--accent) 70%, transparent)",
                      }
                    : undefined
                }
              >
                {tab.icon}
                {tab.label}
                <span
                  className={cn(
                    "rounded px-1 font-display text-[10px] tabular-nums",
                    active ? "bg-accent/25 text-accent" : "bg-border/40 text-sub",
                  )}
                >
                  {counts[tab.id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto">
          <SortControl
            value={sort}
            onChange={setSort}
            options={[
              { id: "featured", label: "Featured" },
              { id: "name", label: "Name" },
              { id: "shortest", label: "Shortest run" },
            ]}
          />
        </div>
      </div>

      <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          // Row gap is deliberately much larger than the column gap. At full
          // hover the character stands ~330px tall against a 232px art box, so
          // roughly 100px of it rises above the card. The row gap is what keeps
          // that from landing on the card above.
          // The big row gap only earns its space where a character can rise
          // into it. Touch has no hover, so on one column it is dead space.
          "gap-x-6 gap-y-6 sm:gap-y-28",
        )}>
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
          {searchQuery.trim() ? `No games match "${searchQuery.trim()}".` : "No games in that category yet."}
        </p>
      )}
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Gamepad2, Grid3x3, Swords, Flag, Brain, Search, X } from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { GameHubCard } from "@/components/games/game-hub-card";
import { MobileGamesHub } from "@/components/games/mobile-games-hub";
import { SortControl } from "@/components/games/sort-control";
import { GameSearchBar } from "@/components/games/game-search-bar";
import { setGameSearchQuery, useGameSearchQuery } from "@/lib/games/game-search-store";
import { getDictionary } from "@/lib/i18n/dictionaries";
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
 * Filter tabs, search toolbar, and the interactive card grid.
 *
 * Filtering and searching happen client-side over the complete list the server
 * rendered, ensuring every game remains in the initial HTML and indexable by
 * crawlers.
 *
 * Search is relocated from the global header directly into this catalogue toolbar,
 * forming a cohesive command bar alongside category filters and sort controls.
 */
export function GameHubFilters({
  games,
  art,
  characters,
  locale = "en",
}: {
  games: GameDefinition[];
  art: Record<string, string | null>;
  /** Cut-out foreground sprites, keyed by game id. Absent for the older six. */
  characters: Record<string, string | null>;
  locale?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("featured");
  const searchQuery = useGameSearchQuery();
  const dict = getDictionary(locale);
  const searchPlaceholder = dict.header?.searchGames || "Search games...";

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
      return (
        g.name.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
      );
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
    // Always place upcoming/in-development games at the very end of any sort
    sorted.sort(
      (a, b) => Number(Boolean(a.upcoming)) - Number(Boolean(b.upcoming)),
    );
    return sorted;
  }, [games, filter, sort, searchQuery]);

  return (
    <>
      {/* MOBILE EXPERIENCE (< sm): 3D Featured Showcase + Dedicated Search & Rail */}
      <div className="block sm:hidden">
        <MobileGamesHub
          games={games}
          art={art}
          characters={characters}
          selectedCategory={filter}
          onSelectCategory={setFilter}
          counts={counts}
          searchQuery={searchQuery}
          onSearchChange={setGameSearchQuery}
          sort={sort}
          onSelectSort={setSort}
          searchPlaceholder={searchPlaceholder}
        />
      </div>

      {/* TABLET / DESKTOP EXPERIENCE (>= sm): Cohesive Toolbar, Sort & Interactive Grid */}
      <div className="hidden sm:block">
        {/* Cohesive Catalogue Command Bar */}
        <div className="mb-6 sm:mb-8 rounded-xl border border-border-subtle bg-surface/50 p-2 sm:p-2.5 backdrop-blur-xs transition-colors shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input — Order 1 on all viewports */}
            <div className="order-1 w-full sm:w-60 lg:w-64 xl:w-72 shrink-0">
              <GameSearchBar
                value={searchQuery}
                onChange={setGameSearchQuery}
                placeholder={searchPlaceholder}
              />
            </div>

            {/* Category Tabs — Order 3 on tablet (wrapped under search/sort), Order 2 on desktop */}
            <div
              role="tablist"
              aria-label="Filter games by category"
              className="order-3 sm:order-3 lg:order-2 flex w-full lg:w-auto items-center gap-1.5 overflow-x-auto pb-0.5 lg:pb-0 no-scrollbar sm:flex-wrap lg:flex-nowrap"
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
                      "group/tab relative flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3",
                      "font-display text-[11px] uppercase tracking-wider transition-all duration-200",
                      active
                        ? "border-accent bg-accent/15 text-accent shadow-xs"
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
                    <span>{tab.label}</span>
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

            {/* Sort Control — Order 2 on tablet (aligned right next to search), Order 3 on desktop */}
            <div className="order-2 sm:order-2 lg:order-3 flex items-center justify-end shrink-0 sm:ml-auto lg:ml-0">
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
        </div>

        {/* Active Filter & Match Summary */}
        {searchQuery.trim() && (
          <div className="mb-4 flex items-center justify-between px-1 font-mono text-xs text-sub">
            <span>
              Showing <span className="font-semibold text-foreground">{visible.length}</span> {visible.length === 1 ? "game" : "games"} matching &ldquo;<span className="text-accent">{searchQuery.trim()}</span>&rdquo;
              {filter !== "all" && (
                <> in <span className="text-foreground">{filter}</span></>
              )}
            </span>
            <button
              type="button"
              onClick={() => setGameSearchQuery("")}
              className="text-accent hover:underline text-[11px] cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Game Cards Grid */}
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            // Row gap is deliberately much larger than the column gap. At full
            // hover the character stands ~330px tall against a 232px art box, so
            // roughly 100px of it rises above the card. The row gap is what keeps
            // that from landing on the card above.
            "gap-x-6 gap-y-6 sm:gap-y-28",
          )}
        >
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

        {/* Informative Empty State */}
        {visible.length === 0 && (
          <div className="my-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-surface/30 p-8 sm:p-12 text-center backdrop-blur-xs">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border/80 bg-sub-alt/40 text-sub">
              <Search size={22} className="text-sub" aria-hidden="true" />
            </div>
            <h3 className="font-display text-base font-bold uppercase tracking-wide text-foreground">
              No games found
            </h3>
            <p className="mt-1.5 max-w-md font-sans text-xs sm:text-sm text-sub">
              {searchQuery.trim() && filter !== "all"
                ? `No games match "${searchQuery.trim()}" in the ${filter} category.`
                : searchQuery.trim()
                  ? `No games match "${searchQuery.trim()}". Check your spelling or try different keywords.`
                  : `No games currently available in ${filter}.`}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setGameSearchQuery("")}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/15 px-3.5 font-display text-xs font-semibold uppercase tracking-wider text-accent transition-colors hover:bg-accent/25 cursor-pointer"
                >
                  <X size={13} aria-hidden="true" />
                  Clear search
                </button>
              )}
              {filter !== "all" && (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-sub-alt/50 px-3.5 font-display text-xs font-semibold uppercase tracking-wider text-sub transition-colors hover:border-accent hover:text-foreground cursor-pointer"
                >
                  View all games
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

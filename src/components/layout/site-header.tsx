"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Gamepad2, GraduationCap, Search, Trophy, User, Zap } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { emitTestReset } from "@/lib/typing-engine/reset-bus";
import { LevelBadge } from "@/components/layout/level-badge";
import { setGameSearchQuery, useGameSearchQuery } from "@/lib/games/game-search-store";
import { cn } from "@/lib/utils/cn";

/**
 * Site header, built to the reference design: a wordmark, pill navigation with
 * icons, and a level badge on the right.
 *
 * Deliberately absent: Leaderboard and Shop. Both appear in the reference, and
 * both would need a backend that does not exist — a nav entry leading to a
 * placeholder is worse than one that is not there.
 */

const NAV = [
  { href: "/lessons", label: "Lessons", icon: GraduationCap, always: true },
  { href: "/games", label: "Games", icon: Gamepad2, always: true },
  { href: "/profile", label: "Profile", icon: User, always: true },
  // Adding Lessons as a fourth always-visible icon reopened the 375px
  // budget this header is built to: wordmark + 4 icons + the theme button
  // measured to 415px, 40px over. Achievements gives way on narrow screens
  // for that reason -- it's in the footer link row (every page), so it
  // costs a narrow-screen icon, not a route. About was dropped from the
  // header entirely (not just narrow screens): it's low-frequency, already
  // in the footer on every page, and the header reads cleaner without a
  // fifth destination competing with the four people actually reach for.
  { href: "/achievements", label: "Achievements", icon: Trophy, always: false },
];

function GameSearchInput() {
  // Local state for the input's own value (so typing feels instant even if a
  // future subscriber debounces), mirrored into the shared store on every
  // keystroke -- the grid on /games reads that store directly.
  const storedQuery = useGameSearchQuery();
  const [value, setValue] = useState(storedQuery);

  // Leaving /games clears the shared query, so a later visit starts fresh
  // instead of silently re-applying a filter from a previous session.
  useEffect(() => {
    return () => setGameSearchQuery("");
  }, []);

  return (
    <label className="relative hidden min-w-0 flex-1 max-w-56 items-center lg:flex">
      <Search size={14} className="pointer-events-none absolute left-3 text-sub" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setGameSearchQuery(e.target.value);
        }}
        placeholder="Search games..."
        aria-label="Search games"
        className="h-9 w-full rounded-lg border border-border bg-sub-alt/40 pl-9 pr-3 font-mono text-xs text-foreground outline-none placeholder:text-sub focus:border-accent"
      />
    </label>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const onGamesPage = pathname === "/games";

  return (
    <header className="flex items-center justify-between gap-1.5 px-2 py-4 sm:gap-3 sm:px-8">
      <Link
        href="/"
        onClick={() => {
          // Link alone is a no-op when already on "/" (no navigation occurs,
          // so a finished/mid-test view never resets) - explicitly signal
          // the typing test to restart in that case.
          if (pathname === "/") emitTestReset();
        }}
        className="flex shrink-0 items-center gap-2"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-background sm:h-8 sm:w-8"
        >
          <Zap size={17} strokeWidth={2.5} />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-sm font-extrabold uppercase tracking-tight text-foreground sm:text-lg">
            Thunder<span className="text-accent">typing</span>
          </span>
          <span className="hidden font-display text-[8px] uppercase tracking-[0.3em] text-sub sm:block">
            Type · Play · Improve
          </span>
        </span>
      </Link>

      <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1">
        {NAV.map(({ href, label, icon: Icon, always }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg font-display text-[11px] font-medium uppercase tracking-wider transition-colors sm:min-h-9 sm:min-w-0 sm:px-3",
                always ? "flex" : "hidden sm:flex",
                active
                  ? "bg-accent/15 text-accent"
                  : "text-sub hover:bg-sub-alt hover:text-foreground",
              )}
            >
              <Icon size={15} aria-hidden="true" />
              {/* One label element, not two. It is visually hidden on narrow
                  screens -- where four labels will not fit beside the wordmark
                  -- but stays in the accessibility tree at every size. */}
              <span className="sr-only sm:not-sr-only">{label}</span>
            </Link>
          );
        })}
        {onGamesPage && <GameSearchInput />}
        <ThemeSwitcher />
        <LevelBadge />
      </nav>
    </header>
  );
}

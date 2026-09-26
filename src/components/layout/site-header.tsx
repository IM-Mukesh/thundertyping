"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Gamepad2, GraduationCap, Menu, Search, User } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { MoreMenu } from "@/components/layout/more-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LanguageSelector } from "@/components/typing-test/language-selector";
import { emitTestReset } from "@/lib/typing-engine/reset-bus";
import { LevelBadge } from "@/components/layout/level-badge";
import { setGameSearchQuery, useGameSearchQuery } from "@/lib/games/game-search-store";
import { cn } from "@/lib/utils/cn";

/**
 * Site header, built to the reference design: a wordmark, pill navigation with
 * icons, a level badge, and a responsive hamburger drawer on mobile.
 */

const NAV = [
  { href: "/lessons", label: "Lessons", icon: GraduationCap },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/profile", label: "Profile", icon: User },
];

function GameSearchInput() {
  const storedQuery = useGameSearchQuery();
  const [value, setValue] = useState(storedQuery);

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const toggleMobileNav = useCallback(() => setMobileNavOpen((prev) => !prev), []);

  return (
    <>
      <header className="flex items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-8 sm:py-4">
        <Link
          href="/"
          onClick={() => {
            if (pathname === "/") emitTestReset();
          }}
          className="flex shrink-0 items-center gap-2"
        >
          <Image
            src="/brand/hero-mark-icon.png"
            alt=""
            width={32}
            height={32}
            priority
            className="h-7 w-7 shrink-0 object-contain sm:h-8 sm:w-8"
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-sm font-extrabold uppercase tracking-tight text-foreground sm:text-lg">
              Hero<span className="text-accent">typing</span>
            </span>
            <span className="hidden font-display text-[8px] uppercase tracking-[0.3em] text-sub sm:block">
              Type · Play · Improve
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex min-w-0 items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 font-display text-[11px] font-medium uppercase tracking-wider transition-colors",
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-sub hover:bg-sub-alt hover:text-foreground",
                )}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
          {onGamesPage && <GameSearchInput />}
          <MoreMenu />
          <ThemeSwitcher />
          <LevelBadge />
        </nav>

        {/* Mobile Actions: LevelBadge + LanguageSelector + Hamburger Button */}
        <div className="flex sm:hidden items-center gap-1.5">
          <LevelBadge showOnMobile />
          <LanguageSelector compact />
          <button
            ref={hamburgerRef}
            id="mobile-nav-trigger"
            type="button"
            onClick={toggleMobileNav}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation-dialog"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-sub-alt/30 text-sub transition-colors hover:border-accent hover:text-foreground active:scale-95 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={closeMobileNav} triggerRef={hamburgerRef} />
    </>
  );
}

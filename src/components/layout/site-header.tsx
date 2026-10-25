"use client";
import { getDictionary } from "@/lib/i18n/dictionaries";

import { useCallback, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Gamepad2, GraduationCap, Menu, User } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { MoreMenu } from "@/components/layout/more-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { emitTestReset } from "@/lib/typing-engine/reset-bus";
import { LevelBadge } from "@/components/layout/level-badge";
import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { cn } from "@/lib/utils/cn";

/**
 * Site header, built to the reference design: a wordmark, pill navigation with
 * icons, a level badge, and a responsive hamburger drawer on mobile.
 */

export function SiteHeader({ locale = "en" }: { locale?: string }) { 
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const toggleMobileNav = useCallback(() => setMobileNavOpen((prev) => !prev), []);
  const dict = getDictionary(locale);

  const homeHref = !locale || locale === "en" ? "/" : `/${locale}`;
  const localizedNav = [
    { href: "/lessons", label: dict.nav.lessons, icon: GraduationCap },
    { href: "/games", label: dict.nav.games, icon: Gamepad2 },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border-subtle bg-background/85 px-3 py-2.5 backdrop-blur-md transition-colors sm:gap-4 sm:px-8 sm:py-3">
        <Link
          href={homeHref}
          onClick={() => {
            if (pathname === homeHref || pathname === "/") emitTestReset();
          }}
          className="group flex shrink-0 items-center gap-2.5"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-1 rounded-full bg-accent-glow opacity-0 blur-xs transition-opacity duration-300 group-hover:opacity-60" />
            <Image
              src="/brand/hero-mark-icon.png"
              alt=""
              width={32}
              height={32}
              priority
              className="relative h-7 w-7 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105 sm:h-8 sm:w-8"
            />
          </div>
          <span className="flex flex-col leading-none">
            <span className="font-display text-sm font-extrabold uppercase tracking-tight text-foreground transition-colors group-hover:text-foreground sm:text-lg">
              Hero<span className="text-accent">typing</span>
            </span>
            <span className="hidden font-display text-[8px] uppercase tracking-[0.3em] text-sub transition-colors group-hover:text-accent sm:block">
              Type · Play · Improve
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden md:flex min-w-0 items-center gap-1.5">
          {localizedNav.map(({ href, label, icon: Icon }) => {
            // Because Next.js doesn't rewrite href natively in Link, we check both /locale/href and /href
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 font-display text-[11px] font-medium uppercase tracking-wider transition-all duration-150",
                  active
                    ? "border border-accent/40 bg-accent-subtle text-accent shadow-xs"
                    : "border border-transparent text-sub hover:border-border-subtle hover:bg-surface-elevated hover:text-foreground",
                )}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
          <MoreMenu locale={locale} />
          <ThemeSwitcher />
          <LevelBadge />
          <UserAccountMenu />
        </nav>

        {/* Mobile Actions: level badge + hamburger button. Typing language is
            owned by the homepage test settings, not the global header. */}
        <div className="flex md:hidden items-center gap-1.5">
          <LevelBadge showOnMobile />
          <button
            ref={hamburgerRef}
            id="mobile-nav-trigger"
            type="button"
            onClick={toggleMobileNav}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation-dialog"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-subtle bg-surface text-sub transition-all duration-150 hover:border-accent hover:text-foreground active:scale-95 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={closeMobileNav} triggerRef={hamburgerRef} />
    </>
  );
}

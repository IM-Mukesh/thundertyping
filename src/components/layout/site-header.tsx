"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { emitTestReset } from "@/lib/typing-engine/reset-bus";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <Link
        href="/"
        onClick={() => {
          // Link alone is a no-op when already on "/" (no navigation occurs,
          // so a finished/mid-test view never resets) - explicitly signal
          // the typing test to restart in that case.
          if (pathname === "/") emitTestReset();
        }}
        className="flex items-center gap-1 text-lg font-semibold tracking-tight text-foreground"
      >
        <span className="text-accent">Thunder</span>Typing
      </Link>
      <nav className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/games"
          className="flex min-h-11 items-center px-2 text-sm text-sub transition-colors hover:text-foreground sm:min-h-0"
        >
          Games
        </Link>
        <Link
          href="/achievements"
          className="hidden min-h-11 items-center px-2 text-sm text-sub transition-colors hover:text-foreground sm:flex sm:min-h-0"
        >
          Achievements
        </Link>
        <Link
          href="/profile"
          className="flex min-h-11 items-center px-2 text-sm text-sub transition-colors hover:text-foreground sm:min-h-0"
        >
          Profile
        </Link>
        <Link
          href="/about"
          className="hidden min-h-11 items-center px-2 text-sm text-sub transition-colors hover:text-foreground sm:flex sm:min-h-0"
        >
          About
        </Link>
        <ThemeSwitcher />
      </nav>
    </header>
  );
}

import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <Link
        href="/"
        className="flex items-center gap-1 text-lg font-semibold tracking-tight text-foreground"
      >
        <span className="text-accent">Thunder</span>Typing
      </Link>
      <nav className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/about"
          className="px-2 text-sm text-sub transition-colors hover:text-foreground"
        >
          About
        </Link>
        <ThemeSwitcher />
      </nav>
    </header>
  );
}

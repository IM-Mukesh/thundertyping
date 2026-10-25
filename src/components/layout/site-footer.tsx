"use client";

import Link from "next/link";
import { AdSlot } from "@/components/layout/ad-slot";
import { SITE_NAME } from "@/lib/seo/constants";
import { useIsTestRunning } from "@/lib/typing-engine/test-status-store";
import { cn } from "@/lib/utils/cn";
import { getDictionary } from "@/lib/i18n/dictionaries";

// While a test is running, it smoothly fades to opacity-0 without collapsing height
// so there is zero layout jump or scrolling disruption during typing.
// When displaying results or while idle, it stays fully visible.
export function SiteFooter({ locale = "en" }: { locale?: string }) {
  const isRunning = useIsTestRunning();
  const dict = getDictionary(locale);
  const prefix = locale === "en" ? "" : `/${locale}`;

  return (
    <div
      data-running={isRunning}
      aria-hidden={isRunning || undefined}
      inert={isRunning ? true : undefined}
      className={cn(
        "mt-auto transition-opacity duration-300 ease-in-out",
        isRunning ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      <footer className="flex flex-col items-center gap-3 sm:gap-3.5 px-6 py-3.5 sm:py-4 sm:px-10">
          <AdSlot placementId="footer-leaderboard" format="horizontal" />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-sub/80 text-center">
            <span className="text-sub font-medium">Typing Tests:</span>
            <Link href="/guides/english-typing-test-and-practice" className="transition-colors hover:text-foreground">
              English
            </Link>
            <span className="text-border">·</span>
            <Link href="/guides/spanish-typing-test-and-practice" className="transition-colors hover:text-foreground">
              Español
            </Link>
            <span className="text-border">·</span>
            <Link href="/guides/german-typing-test-and-practice" className="transition-colors hover:text-foreground">
              Deutsch
            </Link>
            <span className="text-border">·</span>
            <Link href="/guides/portuguese-typing-test-and-practice" className="transition-colors hover:text-foreground">
              Português
            </Link>
            <span className="text-border">·</span>
            <Link href="/guides/hindi-typing-test-and-practice" className="transition-colors hover:text-foreground">
              हिन्दी
            </Link>
            <span className="text-border">·</span>
            <Link href="/guides/chinese-typing-test-and-practice" className="transition-colors hover:text-foreground">
              中文
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-sub sm:gap-6 text-center">
            <span>
              &copy; {new Date().getFullYear()} {SITE_NAME}
            </span>
            <Link href={`${prefix}/about`} className="py-1 transition-colors hover:text-foreground">
              {dict.footer.about}
            </Link>
            <Link href={`${prefix}/games`} className="py-1 transition-colors hover:text-foreground">
              {dict.nav.games}
            </Link>
            <Link href={`${prefix}/lessons`} className="py-1 transition-colors hover:text-foreground">
              {dict.nav.lessons}
            </Link>
            <Link href="/practice/weak-keys" className="py-1 transition-colors hover:text-foreground">
              Weak Keys
            </Link>
            <Link href="/practice/accuracy" className="py-1 transition-colors hover:text-foreground">
              Accuracy Lab
            </Link>
            <Link href={`${prefix}/vocabulary`} className="py-1 transition-colors hover:text-foreground">
              {dict.nav.vocabulary}
            </Link>
            <Link
              href={`${prefix}/achievements`}
              className="py-1 transition-colors hover:text-foreground"
            >
              {dict.footer.achievements}
            </Link>
            <Link
              href={`${prefix}/guides`}
              className="py-1 transition-colors hover:text-foreground"
            >
              {dict.footer.guides}
            </Link>
            <Link href={`${prefix}/privacy`} className="py-1 transition-colors hover:text-foreground">
              {dict.footer.privacy}
            </Link>
            <Link href={`${prefix}/terms`} className="py-1 transition-colors hover:text-foreground">
              {dict.footer.terms}
            </Link>
          </div>
        </footer>
    </div>
  );
}

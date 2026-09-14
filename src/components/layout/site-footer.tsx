import Link from "next/link";
import { AdSlot } from "@/components/layout/ad-slot";
import { SITE_NAME } from "@/lib/seo/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-6 px-6 py-10 sm:px-10">
      <AdSlot id="footer-leaderboard" format="horizontal" />
      <div className="flex flex-col items-center gap-2 text-xs text-sub sm:flex-row sm:gap-6">
        <span>
          &copy; {new Date().getFullYear()} {SITE_NAME}
        </span>
        <Link href="/about" className="transition-colors hover:text-foreground">
          About
        </Link>
        <Link href="/privacy" className="transition-colors hover:text-foreground">
          Privacy
        </Link>
      </div>
    </footer>
  );
}

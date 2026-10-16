import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export interface AuthorBoxProps {
  lastUpdated?: string;
  publishedDate?: string;
  className?: string;
}

export function AuthorBox({ lastUpdated, publishedDate, className = "" }: AuthorBoxProps) {
  return (
    <div
      className={`my-6 flex flex-col gap-4 rounded-xl border border-border bg-sub-alt/20 p-5 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-accent/40 bg-sub-alt/40">
          <Image
            src="/brand/hero-mark-icon.png"
            alt="Mukesh, Founder of HeroTyping"
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Mukesh</span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-accent">
              <ShieldCheck size={13} aria-hidden="true" />
              Founder &amp; Developer
            </span>
          </div>
          <p className="mt-0.5 text-xs text-sub leading-relaxed max-w-xl">
            Mukesh is the founder and developer of HeroTyping, building accessible, ad-free typing practice tools and
            games with evidence-backed training methods.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border/50 pt-3 text-[11px] text-sub sm:border-t-0 sm:pt-0">
        {publishedDate && (
          <span className="font-mono">
            Published: <time dateTime={publishedDate}>{publishedDate}</time>
          </span>
        )}
        {lastUpdated && (
          <span className="font-mono">
            Updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
          </span>
        )}
        <Link
          href="/about#editorial-policy"
          className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
        >
          Editorial Policy
        </Link>
      </div>
    </div>
  );
}

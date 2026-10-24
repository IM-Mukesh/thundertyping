"use client";

import { useState } from "react";
import { useIsTestRunning } from "@/lib/typing-engine/test-status-store";
import { HomepageFeatureNav } from "@/components/layout/homepage-feature-nav";
import { HomepageSeoContent } from "@/components/layout/homepage-seo-content";
import { cn } from "@/lib/utils/cn";

function ChevronSvg({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="7"
      viewBox="0 0 14 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-accent stroke-current", className)}
      aria-hidden="true"
    >
      <path
        d="M1 1L7 6L13 1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomepageExploreSection({ locale = "en" }: { locale?: string } = {}) {
  const isRunning = useIsTestRunning();
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevIsRunning, setPrevIsRunning] = useState(isRunning);

  // Automatically close expanded SEO resources as soon as typing begins
  if (isRunning !== prevIsRunning) {
    setPrevIsRunning(isRunning);
    if (isRunning && isExpanded) {
      setIsExpanded(false);
    }
  }

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      data-running={isRunning}
      aria-hidden={isRunning || undefined}
      inert={isRunning ? true : undefined}
      className={cn(
        "flex w-full flex-col items-center gap-2.5 sm:gap-3 transition-opacity duration-300 ease-in-out mt-1.5 sm:mt-2.5",
        isRunning ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      {/* 4 Feature Navigation shortcuts */}
      <HomepageFeatureNav />

      {/* Single Animated 3-Chevron Interactive Disclosure Control */}
      <button
        type="button"
        id="explore-resources-trigger"
        aria-expanded={isExpanded}
        aria-controls="homepage-seo-resources"
        onClick={toggleExpanded}
        className="group relative flex flex-col items-center justify-center gap-1.5 py-1.5 px-4 rounded-xl text-sub transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer select-none mt-1.5 sm:mt-2"
      >
        <span className="font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sub group-hover:text-accent transition-colors">
          {isExpanded ? "Collapse typing resources" : "Explore typing resources"}
        </span>

        {/* 3 Vertically Arranged Chevrons with Cascading Wave Animation */}
        <div
          className={cn(
            "flex flex-col items-center gap-[3px] transition-transform duration-300",
            isExpanded && "rotate-180",
          )}
          aria-hidden="true"
        >
          <span className={cn("inline-flex", !isExpanded && "animate-chevron-wave-1")}>
            <ChevronSvg />
          </span>
          <span className={cn("inline-flex", !isExpanded && "animate-chevron-wave-2")}>
            <ChevronSvg />
          </span>
          <span className={cn("inline-flex", !isExpanded && "animate-chevron-wave-3")}>
            <ChevronSvg />
          </span>
        </div>
      </button>

      {/* SEO Content: Present in SSR DOM, Visually Collapsed via CSS Grid */}
      <div
        id="homepage-seo-resources"
        role="region"
        aria-labelledby="explore-resources-trigger"
        inert={!isExpanded ? true : undefined}
        className={cn(
          "grid w-full transition-[grid-template-rows,opacity] duration-500 ease-in-out",
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none",
        )}
      >
        <div className="overflow-hidden min-h-0">
          <HomepageSeoContent locale={locale} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";

export type AdFormat = "horizontal" | "rectangle" | "vertical";

const DIMENSIONS: Record<AdFormat, { width: number; height: number }> = {
  horizontal: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
  vertical: { width: 160, height: 600 },
};

interface AdSlotProps {
  id: string;
  format: AdFormat;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Renders a real AdSense unit once NEXT_PUBLIC_ADSENSE_CLIENT_ID is set.
 * Until then, renders a visible placeholder box (dashed border, labeled with
 * the format and dimensions) so every placement can be reviewed in place
 * before the AdSense account is approved -- explicitly requested, this
 * supersedes an earlier version of this component that rendered nothing at
 * all pre-approval.
 *
 * Every placement stays in the tree at its call site, so switching the whole
 * site on is one environment variable and no code change.
 */
export function AdSlot({ id, format, className }: AdSlotProps) {
  const { width, height } = DIMENSIONS[format];
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!adsenseClientId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense loader script not present yet
    }
  }, [adsenseClientId]);

  if (!adsenseClientId) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "flex w-full items-center justify-center rounded-lg border border-dashed border-border bg-sub-alt/30 font-mono text-[11px] uppercase tracking-wider text-sub",
          className,
        )}
        style={{ maxWidth: width, minHeight: height }}
      >
        Ad · {width}×{height}
      </div>
    );
  }

  return (
    <ins
      className={cn("adsbygoogle block w-full", className)}
      style={{ maxWidth: width, minHeight: height }}
      data-ad-client={adsenseClientId}
      data-ad-slot={id}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

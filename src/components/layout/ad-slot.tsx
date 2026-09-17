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
 * Renders a real AdSense unit once NEXT_PUBLIC_ADSENSE_CLIENT_ID is set, and
 * nothing at all until then.
 *
 * Every placement stays in the tree at its call site, so switching the whole
 * site on is one environment variable and no code change. Until the account is
 * approved there is nothing to show, and a dashed "Ad space" box on every page
 * makes a finished product look unfinished -- which is worse than the layout
 * shift it was there to prevent. When ads do turn on, the slots reserve their
 * height again via the `style` below.
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

  if (!adsenseClientId) return null;

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

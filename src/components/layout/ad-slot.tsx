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
 * Until then, renders nothing -- commented out (via this early return, not
 * by removing call sites) until the site is approved for ads. Every
 * placement stays in the tree at its call site either way, so switching the
 * whole site on later is one environment variable and no code change.
 *
 * (Earlier this rendered a visible dashed-border placeholder pre-approval,
 * for reviewing placements in place -- reverted at the site owner's request
 * now that placements are already settled.)
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
    return null;
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

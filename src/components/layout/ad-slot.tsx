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
 * Reserves ad space now (fixed min-height avoids future CLS) and renders a
 * placeholder until NEXT_PUBLIC_ADSENSE_CLIENT_ID is configured, at which
 * point it swaps in a real AdSense unit with no call-site changes.
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
        data-ad-placeholder={id}
        className={cn(
          "mx-auto flex w-full items-center justify-center rounded-md border border-dashed border-border text-xs text-sub",
          className,
        )}
        style={{ maxWidth: width, minHeight: height }}
      >
        Ad space
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

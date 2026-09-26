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
  /** Internal placement identifier for DOM id/layout tracking (e.g. "footer-leaderboard"). NEVER sent as data-ad-slot. */
  id?: string;
  /** Explicit alias for internal placement identifier. */
  placementId?: string;
  /** Actual AdSense numeric unit slot ID (e.g. "1234567890"), if configured. NEVER invent a fake ID. */
  slotId?: string;
  format: AdFormat;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Validates that an AdSense slot ID is genuinely a numeric string.
 * Internal placement keys like "footer-leaderboard" are explicitly rejected.
 */
function isValidAdSenseSlotId(slotId?: string): boolean {
  if (!slotId) return false;
  return /^\d+$/.test(slotId.trim());
}

/**
 * Renders a real AdSense unit once NEXT_PUBLIC_ADSENSE_CLIENT_ID is set.
 * Until then, renders nothing -- commented out (via this early return, not
 * by removing call sites) until the site is approved for ads. Every
 * placement stays in the tree at its call site either way, so switching the
 * whole site on later is one environment variable and no code change.
 *
 * NOTE ON ENVIRONMENT VARIABLES:
 * In Next.js, public environment variables prefixed with NEXT_PUBLIC_ are
 * inlined into the client bundle at BUILD TIME. Values required in production
 * must be present during `next build` / deployment.
 */
export function AdSlot({ id, placementId, slotId, format, className }: AdSlotProps) {
  const { width, height } = DIMENSIONS[format];
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const internalKey = placementId ?? id;
  const validSlot = isValidAdSenseSlotId(slotId) ? slotId?.trim() : undefined;

  useEffect(() => {
    if (!adsenseClientId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense loader script not present yet or already initialized
    }
  }, [adsenseClientId]);

  if (!adsenseClientId) {
    return null;
  }

  return (
    <ins
      id={internalKey ? `ad-placement-${internalKey}` : undefined}
      className={cn("adsbygoogle block w-full", className)}
      style={{ maxWidth: width, minHeight: height }}
      data-ad-client={adsenseClientId}
      {...(validSlot ? { "data-ad-slot": validSlot } : {})}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

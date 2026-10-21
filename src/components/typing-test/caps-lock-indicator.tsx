"use client";

import { useEffect, useState } from "react";
import { getCapsLockState } from "@/lib/typing-engine/caps-lock";
import { cn } from "@/lib/utils/cn";

export interface CapsLockIndicatorProps {
  className?: string;
}

export function CapsLockIndicator({ className }: CapsLockIndicatorProps) {
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  useEffect(() => {
    const handleKeyboardEvent = (event: KeyboardEvent) => {
      setIsCapsLockOn(getCapsLockState(event));
    };

    window.addEventListener("keydown", handleKeyboardEvent, true);
    window.addEventListener("keyup", handleKeyboardEvent, true);

    return () => {
      window.removeEventListener("keydown", handleKeyboardEvent, true);
      window.removeEventListener("keyup", handleKeyboardEvent, true);
    };
  }, []);

  if (!isCapsLockOn) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-medium text-accent",
        className,
      )}
    >
      Caps Lock is on
    </span>
  );
}

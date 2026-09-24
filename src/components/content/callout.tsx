import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface CalloutProps {
  label?: string;
  children: ReactNode;
  className?: string;
}

/** A bordered box for a quick-answer, formula, or worked-example block that should stand apart from surrounding prose -- same card language as the rest of the site (border-border, bg-sub-alt/20, rounded-xl). */
export function Callout({ label, children, className }: CalloutProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-sub-alt/20 p-4 sm:p-5", className)}>
      {label && (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-accent">{label}</p>
      )}
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-sub [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, LayoutGrid, Trophy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// The header's primary pills (Lessons, Games, Profile) are budget-constrained
// to a documented 375px width -- see the comment above NAV in
// site-header.tsx. Every other destination lives here instead, behind one
// icon that costs the same width no matter how long this list grows. Adding
// a new feature page (a new game mode's own route, a future hub, etc.) means
// appending one entry here, not adding another header icon.
const MORE_LINKS = [
  { href: "/vocabulary", label: "Vocabulary", icon: BookOpen },
  { href: "/achievements", label: "Achievements", icon: Trophy },
];

export function MoreMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative">
      {/* Hidden below `sm:` — same trade this trigger's own links used to
          make individually (Achievements gave way on narrow screens; both
          Achievements and Vocabulary still reach mobile users through the
          footer link row on every page). The header's icon row is measured
          to a hard 375px budget (see NAV in site-header.tsx); adding this as
          an always-visible icon reopened that overflow. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="More pages"
        aria-expanded={open}
        aria-haspopup="true"
        className="hidden h-9 w-9 items-center justify-center rounded-md text-sub transition-colors hover:bg-sub-alt hover:text-foreground sm:flex"
      >
        <LayoutGrid size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              aria-label="More pages"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-11 z-50 flex w-44 flex-col gap-0.5 rounded-lg border border-border bg-background p-1.5 shadow-lg sm:top-10"
            >
              {MORE_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-sub-alt",
                      active ? "text-accent" : "text-sub",
                    )}
                  >
                    <Icon size={15} className="shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

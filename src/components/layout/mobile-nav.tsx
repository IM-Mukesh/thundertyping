"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Check,
  Gamepad2,
  Globe,
  GraduationCap,
  Keyboard,
  Library,
  Trophy,
  User,
  X,
} from "lucide-react";
import { THEMES } from "@/components/theme/themes";
import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import {
  levelProgress,
  parseProfile,
  profileServerSnapshot,
  readProfileRaw,
  subscribeProfile,
} from "@/lib/profile/player-profile";
import { emitTestReset } from "@/lib/typing-engine/reset-bus";
import { GAME_LIST } from "@/lib/games/game-types";
import { GUIDE_REGISTRY } from "@/lib/guides/guide-registry";
import { cn } from "@/lib/utils/cn";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | HTMLElement | null>;
}

const PRIMARY_LINKS = [
  {
    href: "/",
    label: "Typing Test",
    badge: "Speed & Accuracy",
    icon: Keyboard,
    isHome: true,
  },
  {
    href: "/lessons",
    label: "Lessons",
    badge: "28 Units",
    icon: GraduationCap,
  },
  {
    href: "/games",
    label: "Arcade Games",
    badge: `${GAME_LIST.length} Games`,
    icon: Gamepad2,
  },
  {
    href: "/vocabulary",
    label: "Vocabulary",
    badge: "3 Tiers",
    icon: BookOpen,
  },
  {
    href: "/guides",
    label: "Guides & Tools",
    badge: `${GUIDE_REGISTRY.length} Guides`,
    icon: Library,
  },
  {
    href: "/profile",
    label: "Player Profile",
    badge: "Stats & Streaks",
    icon: User,
  },
  {
    href: "/achievements",
    label: "Achievements",
    badge: "Milestones",
    icon: Trophy,
  },
];

export function MobileNav({ open, onClose, triggerRef }: MobileNavProps) {
  const pathname = usePathname();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const raw = useSyncExternalStore(
    subscribeProfile,
    readProfileRaw,
    profileServerSnapshot,
  );
  const profile = useMemo(() => parseProfile(raw), [raw]);
  const { level, fraction } = levelProgress(profile.xp);

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Close only when the user actually navigates to a different route
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Focus management: move focus into drawer on open, restore focus to trigger on close
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const frame = requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef?.current?.focus();
    }
  }, [open, triggerRef]);

  // Lock body scroll, handle Escape key, and trap Tab focus while mobile nav is open
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const container = drawerRef.current;
        if (!container) return;

        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !container.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !container.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Ensure body scroll is always restored even if unmounted while open
  useEffect(() => {
    const trigger = triggerRef?.current;
    return () => {
      document.body.style.overflow = "";
      if (wasOpenRef.current) {
        trigger?.focus();
      }
    };
  }, [triggerRef]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            id="mobile-navigation-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-heading"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative z-10 ml-auto flex h-full w-[85%] max-w-sm flex-col border-l border-border bg-background p-5 shadow-2xl overflow-y-auto"
          >
            <h2 id="mobile-nav-heading" className="sr-only">Navigation Menu</h2>

            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-extrabold uppercase tracking-tight text-foreground">
                  Hero<span className="text-accent">typing</span>
                </span>
                {profile.xp > 0 && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 font-display text-[10px] font-bold text-accent">
                    Lv {level}
                  </span>
                )}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-sub transition-colors hover:bg-sub-alt hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Profile XP Progress (if player has XP) */}
            {profile.xp > 0 && (
              <div className="theme-transition mt-3 rounded-xl border border-border/70 bg-sub-alt/20 p-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-foreground font-bold">Level {level}</span>
                  <span className="text-accent tabular-nums text-[11px]">
                    {profile.xp.toLocaleString()} XP
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sub-alt">
                  <div
                    className="h-full bg-accent transition-[width] duration-300"
                    style={{ width: `${fraction * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Account / Sign In State */}
            <div className="mt-3">
              <UserAccountMenu isMobile />
            </div>

            {/* Nav Links */}
            <nav aria-label="Mobile navigation" className="mt-4 flex flex-col gap-1">
              {PRIMARY_LINKS.map(
                ({ href, label, badge, icon: Icon, isHome }) => {
                  const active =
                    href === "/"
                      ? pathname === "/"
                      : pathname === href || pathname.startsWith(`${href}/`);

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => {
                        if (isHome && pathname === "/") {
                          emitTestReset();
                        }
                        onClose();
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3.5 py-3 transition-colors",
                        active
                          ? "bg-accent/15 text-accent font-semibold"
                          : "text-sub hover:bg-sub-alt hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={active ? "text-accent" : "text-sub"} aria-hidden="true" />
                        <span className="font-display text-sm uppercase tracking-wide">
                          {label}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-sub">
                        {badge}
                      </span>
                    </Link>
                  );
                },
              )}
            </nav>

            {/* Theme Selector Section */}
            <div className="mt-6 border-t border-border pt-4">
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-sub">
                Theme
              </span>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {THEMES.map((t) => {
                  const isCurrent = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-2.5 py-2 font-mono text-xs transition-colors",
                        isCurrent
                          ? "border-accent bg-accent/10 text-accent font-bold"
                          : "border-border/60 bg-sub-alt/30 text-sub hover:border-border hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-black/20"
                          style={{ backgroundColor: t.swatch.accent }}
                          aria-hidden="true"
                        />
                        {t.label}
                      </span>
                      {isCurrent && <Check size={12} className="text-accent" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Section */}
            <div className="mt-4 border-t border-border pt-4">
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-sub">
                Language
              </span>
              <div className="theme-transition mt-2 flex items-center justify-between rounded-lg border border-border/60 bg-sub-alt/30 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 font-mono text-foreground">
                  <Globe size={14} className="text-accent" aria-hidden="true" />
                  English
                </span>
                <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">Active</span>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-auto border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between text-xs text-sub">
                <Link
                  href="/about"
                  onClick={onClose}
                  className="py-1 transition-colors hover:text-foreground"
                >
                  About
                </Link>
                <Link
                  href="/privacy"
                  onClick={onClose}
                  className="py-1 transition-colors hover:text-foreground"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  onClick={onClose}
                  className="py-1 transition-colors hover:text-foreground"
                >
                  Terms
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, User as UserIcon, CheckCircle2, Trophy, GraduationCap, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils/cn";

export function UserAccountMenu({ isMobile = false }: { isMobile?: boolean }) {
  const { user, profile, isLoading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-lg bg-sub-alt/40",
          isMobile ? "h-11 w-full" : "h-9 w-20"
        )}
      />
    );
  }

  // Guest State -> Sign In CTA
  if (!user) {
    if (isMobile) {
      return (
        <Link
          href="/auth/login"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 font-display text-xs font-bold uppercase tracking-wider text-background shadow-sm hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <LogIn size={16} aria-hidden="true" />
          <span>Sign In / Sync</span>
        </Link>
      );
    }

    return (
      <Link
        href="/auth/login"
        className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 font-display text-[11px] font-semibold uppercase tracking-wider text-accent transition-all hover:bg-accent hover:text-background active:scale-95"
      >
        <LogIn size={14} aria-hidden="true" />
        <span>Sign In</span>
      </Link>
    );
  }

  // Authenticated State
  const displayName =
    profile?.display_name ||
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "Typist";
  const initial = (displayName[0] || "U").toUpperCase();

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-sub-alt/20 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 font-display text-sm font-bold text-accent">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-xs font-semibold text-foreground">
              {displayName}
            </div>
            <div className="truncate text-[10px] text-sub">
              {user.email}
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
            <CheckCircle2 size={10} /> Synced
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-1 border-t border-border/50 pt-2">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-sub hover:bg-sub-alt hover:text-foreground"
          >
            <UserIcon size={14} /> Profile & Stats
          </Link>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/");
              router.refresh();
            }}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex min-h-9 items-center gap-2 rounded-lg border border-border bg-sub-alt/30 px-2.5 transition-colors hover:border-accent hover:bg-sub-alt/60 active:scale-95"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 font-display text-[10px] font-bold text-accent">
          {initial}
        </div>
        <span className="max-w-24 truncate font-display text-[11px] font-medium text-foreground">
          {displayName}
        </span>
        <ChevronDown size={12} className={cn("text-sub transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-background/95 p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="border-b border-border/60 px-3 py-2">
            <div className="truncate font-display text-xs font-bold text-foreground">
              {displayName}
            </div>
            <div className="truncate text-[10px] text-sub">{user.email}</div>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle2 size={12} />
              <span>Cloud Sync Active</span>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sub transition-colors hover:bg-sub-alt hover:text-foreground"
            >
              <UserIcon size={14} className="text-sub" />
              <span>Profile & History</span>
            </Link>
            <Link
              href="/lessons"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sub transition-colors hover:bg-sub-alt hover:text-foreground"
            >
              <GraduationCap size={14} className="text-sub" />
              <span>Lesson Progress</span>
            </Link>
            <Link
              href="/games"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sub transition-colors hover:bg-sub-alt hover:text-foreground"
            >
              <Trophy size={14} className="text-sub" />
              <span>Arcade Scores</span>
            </Link>
          </div>

          <div className="border-t border-border/60 pt-1">
            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await signOut();
                router.push("/");
                router.refresh();
              }}
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-400 transition-colors hover:bg-rose-500/10"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

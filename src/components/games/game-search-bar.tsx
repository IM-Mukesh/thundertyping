"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface GameSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  autoFocus?: boolean;
}

/**
 * Premium, futuristic game search control for the Games catalogue toolbar.
 *
 * Designed with restrained sci-fi styling, tactile hover/focus states,
 * accessible keyboard handling (Escape to clear, Enter prevented from accidental
 * triggers), and full theme-token compatibility across all 20 HeroTyping themes.
 */
export function GameSearchBar({
  value,
  onChange,
  placeholder = "Search games...",
  className,
  id = "games-catalogue-search",
  autoFocus = false,
}: GameSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "group relative flex min-w-0 flex-1 items-center transition-colors",
        className,
      )}
    >
      <Search
        size={14}
        className={cn(
          "pointer-events-none absolute left-3 z-10 transition-colors duration-150",
          value.trim()
            ? "text-accent"
            : "text-sub group-focus-within:text-accent",
        )}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            e.stopPropagation();
            handleClear();
          } else if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "h-10 sm:h-9 w-full rounded-lg border border-border/70 bg-sub-alt/40 pl-9 pr-8",
          "font-mono text-xs text-foreground placeholder:text-sub outline-none",
          "transition-all duration-150 hover:border-border hover:bg-sub-alt/60",
          "focus:border-accent focus:bg-surface-elevated/80 focus:ring-1 focus:ring-accent/30",
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
        )}
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          title="Clear search"
          className={cn(
            "absolute right-2 z-10 flex h-6 w-6 items-center justify-center rounded",
            "text-sub transition-colors hover:bg-border/40 hover:text-foreground",
            "active:scale-95 focus-visible:outline-2 focus-visible:outline-accent",
          )}
        >
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

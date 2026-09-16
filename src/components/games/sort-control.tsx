"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Sort control styled as part of the HUD.
 *
 * A native <select> renders as an OS widget — grey, system-fonted, and
 * completely outside the interface language of the rest of the page. This is a
 * button plus a listbox instead, but it keeps the behaviour people expect from
 * a select: arrow keys move through options, Enter and Space choose, Escape
 * closes, Home and End jump to the ends, and focus returns to the trigger.
 */

export interface SortOption<T extends string> {
  id: T;
  label: string;
}

export function SortControl<T extends string>({
  value,
  options,
  onChange,
  label = "Sort by",
}: {
  value: T;
  options: readonly SortOption<T>[];
  onChange: (v: T) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const current = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onDocPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, options, value]);

  const choose = (id: T) => {
    onChange(id);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        return (next + options.length) % options.length;
      });
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[activeIndex].id);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          // Seeded here rather than in an effect: opening is the event that
          // decides which option starts highlighted.
          setActiveIndex(Math.max(0, options.findIndex((o) => o.id === value)));
          setOpen((o) => !o);
        }}
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-lg border px-3 font-display text-[11px] uppercase tracking-wider transition-colors sm:min-h-9",
          open
            ? "border-accent text-accent"
            : "border-border text-sub hover:border-accent/60 hover:text-foreground",
        )}
      >
        <ArrowUpDown size={13} aria-hidden="true" />
        <span className="text-sub">{label}</span>
        <span className="text-foreground">{current.label}</span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onListKey}
          ref={(el) => el?.focus()}
          className="absolute right-0 z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-lg border border-accent/50 bg-background/95 py-1 backdrop-blur-sm"
          style={{
            boxShadow:
              "0 0 28px -6px color-mix(in srgb, var(--accent) 50%, transparent)",
          }}
        >
          {options.map((o, i) => {
            const selected = o.id === value;
            return (
              <li
                key={o.id}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActiveIndex(i)}
                onClick={() => choose(o.id)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2 px-3 font-display text-[11px] uppercase tracking-wider transition-colors sm:min-h-9",
                  i === activeIndex ? "bg-accent/15 text-accent" : "text-sub",
                )}
              >
                <Check
                  size={12}
                  aria-hidden="true"
                  className={selected ? "opacity-100" : "opacity-0"}
                />
                {o.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { cn } from "@/lib/utils/cn";

interface GameInfoPanelProps {
  game: GameDefinition;
  others: GameDefinition[];
}

/**
 * The "how to play" content, behind an info button instead of parked at the
 * bottom of the page.
 *
 * The panel's content is **always rendered** and hidden with CSS rather than
 * conditionally mounted. That matters: this prose is the indexed long-form
 * content for the route, and markup that only appears after a click is
 * unreliable for crawlers, whereas content present in the DOM but visually
 * hidden behind a toggle is indexed normally. So no `{open && ...}` here —
 * visibility is opacity plus pointer-events, and the heading stays a real h2.
 */
export function GameInfoPanel({ game, others }: GameInfoPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`How to play ${game.name}`}
        title={`How to play ${game.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 text-accent transition-colors hover:bg-accent hover:text-background"
      >
        <Info size={16} />
      </button>

      {/* Backdrop. Kept mounted so the panel it reveals stays in the DOM. */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        id={panelId}
        role="dialog"
        aria-modal={open}
        aria-label={`How to play ${game.name}`}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[82vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-b-0 border-border bg-background p-6 transition-all duration-300 ease-out sm:bottom-auto sm:top-1/2 sm:max-h-[80vh] sm:-translate-y-1/2 sm:rounded-2xl sm:border-b sm:p-8",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-8 opacity-0 sm:translate-y-[calc(-50%+2rem)]",
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-mono text-xl font-bold tracking-tight text-foreground">
            How to play {game.name} well
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sub transition-colors hover:bg-sub-alt hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <ul className="mb-6 flex flex-col gap-2 rounded-xl border border-border bg-sub-alt/30 p-4">
          {game.rules.map((rule) => (
            <li key={rule} className="flex gap-2.5 text-sm text-sub">
              <span aria-hidden="true" className="mt-0.5 text-accent">
                &bull;
              </span>
              {rule}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-4 text-sm leading-relaxed text-sub">
          {game.about.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}

          <p>
            When you want a measured score instead of a run,{" "}
            <Link href="/" className="text-accent underline underline-offset-2">
              take the typing speed test
            </Link>
            . For technique rather than practice, read{" "}
            <Link
              href="/guides/how-to-improve-typing-speed"
              className="text-accent underline underline-offset-2"
            >
              how to improve your typing speed
            </Link>
            .
          </p>

          {others.length > 0 && (
            <p>
              Other games:{" "}
              {others.map((other, i) => (
                <span key={other.id}>
                  {i > 0 && ", "}
                  <Link
                    href={`/games/${other.id}`}
                    className="text-accent underline underline-offset-2"
                  >
                    {other.name}
                  </Link>
                </span>
              ))}
              .
            </p>
          )}
        </div>
      </div>
    </>
  );
}

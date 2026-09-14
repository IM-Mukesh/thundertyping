import type { Metadata } from "next";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { GAME_LIST } from "@/lib/games/game-types";

export const metadata: Metadata = {
  title: "Typing Games",
  description:
    "Free typing games that build real speed and accuracy — clear falling words before they hit the floor, or survive as long as you can in an accelerating word rain. No sign-up required.",
  alternates: { canonical: "/games" },
};

export default function GamesHubPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Typing Games
        </h1>
        <p className="text-sm text-sub sm:text-base">
          Practice that doesn&apos;t feel like practice. Both games use the same word list as the
          main test, so the speed you build here is the speed you&apos;ll measure there.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GAME_LIST.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="group flex flex-col gap-3 rounded-xl border border-border p-5 transition-colors hover:border-accent/50"
          >
            <span className="flex items-center gap-2 text-accent">
              <Gamepad2 size={18} />
              <span className="font-semibold text-foreground group-hover:text-accent">{game.name}</span>
            </span>
            <p className="text-sm text-sub">{game.tagline}</p>
            <ul className="flex flex-col gap-1 text-xs text-sub/80">
              {game.rules.slice(0, 2).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </Link>
        ))}
      </div>

      <p className="text-sm text-sub">
        Prefer to measure rather than play?{" "}
        <Link href="/" className="text-accent underline underline-offset-2">
          Take the typing speed test
        </Link>
        , or read{" "}
        <Link
          href="/guides/how-to-improve-typing-speed"
          className="text-accent underline underline-offset-2"
        >
          how to improve your typing speed
        </Link>
        .
      </p>
    </div>
  );
}

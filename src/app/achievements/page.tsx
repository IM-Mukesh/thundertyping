import type { Metadata } from "next";
import Link from "next/link";
import { AchievementsClient } from "@/components/profile/achievements-client";
import { ACHIEVEMENT_LIST } from "@/lib/profile/achievements";
import { AdSlot } from "@/components/layout/ad-slot";

export const metadata: Metadata = {
  title: "Achievements",
  description:
    "Every achievement across ThunderTyping's typing games — survive fifteen waves, beat a ghost at perfect accuracy, defeat the Void King. No sign-up required.",
  alternates: { canonical: "/achievements" },
};

export default function AchievementsPage() {
  const visible = ACHIEVEMENT_LIST.filter((a) => !a.secret);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Achievements
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-sub">
          {ACHIEVEMENT_LIST.length} to earn across{" "}
          <Link href="/games" className="text-accent underline underline-offset-2">
            four games
          </Link>
          . Progress is stored on this device — no account, nothing uploaded.
          A few are hidden until you find them.
        </p>
      </header>

      {/* The list is server-rendered so it is indexable; the client component
          only paints which ones are earned. A crawler sees every achievement
          name and description, which is real content for the route. */}
      <AchievementsClient />

      <noscript>
        <ul className="flex flex-col gap-2">
          {visible.map((a) => (
            <li key={a.id} className="rounded-lg border border-border p-3">
              <p className="font-mono text-sm text-foreground">{a.name}</p>
              <p className="text-xs text-sub">{a.description}</p>
            </li>
          ))}
        </ul>
      </noscript>

      <AdSlot id="achievements-footer" format="horizontal" />
    </div>
  );
}

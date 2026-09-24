import type { Metadata } from "next";
import { AchievementsClient } from "@/components/profile/achievements-client";
import { ACHIEVEMENT_LIST } from "@/lib/profile/achievements";
import { LESSON_ACHIEVEMENT_LIST } from "@/lib/lessons/lesson-achievements";

const TOTAL_COUNT = ACHIEVEMENT_LIST.length + LESSON_ACHIEVEMENT_LIST.length;

export const metadata: Metadata = {
  title: "Achievements",
  description:
    "Every achievement across HeroTyping's lessons and typing games — survive fifteen waves, beat a ghost at perfect accuracy, master the full keyboard. No sign-up required.",
  alternates: { canonical: "/achievements" },
};

export default function AchievementsPage() {
  const visibleGameAchievements = ACHIEVEMENT_LIST.filter((a) => !a.secret);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Achievements
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-sub">
          {TOTAL_COUNT} to earn across Lessons and Games. Progress is stored on this device — no
          account, nothing uploaded. A few game achievements are hidden until you find them.
        </p>
      </header>

      {/* Two categories, one open at a time -- see the comment on
          AchievementsClient for why. That means the individual achievement
          names/descriptions are behind a click rather than in the initial
          server HTML; the noscript block below is what keeps them present
          and indexable regardless. */}
      <AchievementsClient />

      <noscript>
        <ul className="flex flex-col gap-2">
          {LESSON_ACHIEVEMENT_LIST.map((a) => (
            <li key={a.id} className="rounded-lg border border-border p-3">
              <p className="font-mono text-sm text-foreground">{a.name}</p>
              <p className="text-xs text-sub">{a.description}</p>
            </li>
          ))}
          {visibleGameAchievements.map((a) => (
            <li key={a.id} className="rounded-lg border border-border p-3">
              <p className="font-mono text-sm text-foreground">{a.name}</p>
              <p className="text-xs text-sub">{a.description}</p>
            </li>
          ))}
        </ul>
      </noscript>

      {/* No ad slot of its own -- SiteFooter (every route) already carries
          one directly below this page's content, so a second one here just
          stacked two identical boxes back to back. Same fix as ContentPage. */}
    </div>
  );
}

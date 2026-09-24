import type { Metadata } from "next";
import { PracticeClient } from "@/components/lessons/practice-client";
import { AdSlot } from "@/components/layout/ad-slot";
import { pageMetadata } from "@/lib/seo/metadata";

// Title is plain here (no manual "— HeroTyping") because the root layout's
// title template ("%s | HeroTyping") already appends the brand name -- this
// page previously duplicated it into "Weak Key Drill — HeroTyping | HeroTyping".
export const metadata: Metadata = pageMetadata({
  title: "Weak Key Drill",
  description: "A short, targeted drill for the specific keys giving you trouble, built from your own lesson history.",
  path: "/lessons/practice",
});

export default function PracticePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
        <div className="mb-6 flex w-full flex-col items-center gap-1 text-center">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
            Weak key drill
          </h1>
        </div>

        <PracticeClient />

        <div className="mt-14 w-full">
          <AdSlot id="lessons-practice-below-board" format="horizontal" />
        </div>
      </div>
    </div>
  );
}

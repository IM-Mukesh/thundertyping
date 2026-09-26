import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "How to Type Without Looking at the Keyboard (Day-by-Day Plan)",
  description:
    "A concrete, day-by-day plan for breaking the habit of looking down while typing — exactly what to practice each day, not just \"practice more.\"",
  path: "/guides/how-to-type-without-looking-at-the-keyboard",
});

const PUBLISHED = "2026-09-24";
const UPDATED = "2026-09-24";

const PLAN = [
  {
    when: "Day 1",
    focus: "Find home row by feel alone",
    detail:
      "Rest fingers on A S D F / J K L ;. Close your eyes or look away, then find the F and J bumps by touch, lift off, and find them again. Repeat until it's boring. This is the one skill everything else depends on.",
  },
  {
    when: "Days 2–3",
    focus: "Home row only, no full words yet",
    detail:
      "Type sequences of only the eight home-row letters (asdfjkl; in any order) without looking. Mistakes are fine — the goal is resisting the glance down, not accuracy yet.",
  },
  {
    when: "Days 4–7",
    focus: "Extend one row at a time",
    detail:
      "Add the top row, then the bottom row, each on its own for a day before combining with home row. Keep sessions short (10–15 minutes) — this is the highest-friction week, and short sessions prevent it from turning into frustrated hunting.",
  },
  {
    when: "Week 2",
    focus: "Real short words, still no looking",
    detail:
      "Switch to common short words (\"the\", \"and\", \"for\") built entirely from keys you've covered. When you feel the urge to look, pause instead of peeking — a half-second pause costs far less than the glance-down habit does long term.",
  },
  {
    when: "Week 3",
    focus: "Full sentences at a slow, deliberate pace",
    detail:
      "Move to full sentences with normal punctuation. Speed is not the goal this week — staying eyes-up for an entire sentence without a single glance down is the actual milestone.",
  },
  {
    when: "Week 4",
    focus: "Normal-length tests, tracked",
    detail:
      "Take a full typing test without looking down at all, even if it feels slow. Compare your accuracy and consistency week over week rather than chasing WPM yet — WPM catches up once the no-look habit is solid.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why do I keep looking at the keyboard even though I know where the keys are?",
    answer:
      "Looking down is usually a confidence habit, not a knowledge gap — you likely do know most key locations already, but glance to confirm before committing. Confirming is what needs to be unlearned, and it fades fastest when you practice pausing instead of peeking, rather than trying to eliminate mistakes entirely.",
    plainAnswer:
      "Looking down is usually a confidence habit, not a knowledge gap. Practice pausing instead of peeking to unlearn it.",
  },
  {
    question: "Should I cover my hands or the keyboard while practicing?",
    answer:
      "It can help during the earliest days specifically because it removes the option to cheat, but it isn't necessary — simply committing to keep your eyes on the screen and resisting the glance works for most people, and doesn't require extra setup.",
    plainAnswer:
      "It can help in the earliest days by removing the option to cheat, but isn't necessary if you can commit to keeping your eyes on the screen.",
  },
  {
    question: "How do I fix a mistake without looking down?",
    answer:
      "Use Backspace by feel — it's a fixed key in a fixed location, just like any other, and the same muscle-memory principle applies. Delete back to the error using the keyboard alone, then retype; resist the urge to look down just because something went wrong.",
    plainAnswer:
      "Use Backspace by feel like any other key, delete back to the error, and retype without looking down.",
  },
  {
    question: "I keep making more mistakes when I stop looking. Is that normal?",
    answer:
      "Yes, and it's temporary. Accuracy typically dips for the first one to two weeks of deliberately not looking, because you're relying on muscle memory that isn't fully built yet. This is expected friction, not a sign it isn't working — accuracy recovers and then exceeds where it started once the habit sets in.",
    plainAnswer:
      "Yes, and it's temporary — accuracy typically dips for one to two weeks before recovering past where it started.",
  },
];

export default function HowToTypeWithoutLookingPage() {
  const schema = buildArticleSchema({
    headline: "How to Type Without Looking at the Keyboard",
    description:
      "A day-by-day plan for breaking the habit of looking down while typing.",
    path: "/guides/how-to-type-without-looking-at-the-keyboard",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="How to Type Without Looking at the Keyboard"
        subtitle={"Not “just practice” — here’s exactly what to do, day by day."}
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          {
            name: "How to Type Without Looking at the Keyboard",
            path: "/guides/how-to-type-without-looking-at-the-keyboard",
          },
        ]}
        toc={[
          { id: "the-plan", label: "The day-by-day plan" },
          { id: "fj-bumps", label: "Use the F and J bumps" },
          { id: "mistakes", label: "When you make a mistake" },
          { id: "transitioning", label: "Transitioning from hunt-and-peck" },
          { id: "know-improving", label: "How to know you're improving" },
        ]}
        hasFaq
      >
        <Callout label="Quick answer">
          <p>
            Breaking the look-down habit is a sequence, not a single decision: lock in home row by
            feel first, extend one row at a time, then move to real words and sentences — each
            stage before the next, over roughly four weeks of short daily sessions. Trying to skip
            straight to full sentences without looking is why most attempts fail.
          </p>
        </Callout>

        <p>
          Looking down becomes a habit for a simple reason: it works, in the short term. Every
          glance confirms a key location and avoids a mistake right now, which is exactly why the
          habit is so hard to break through willpower alone — it&apos;s reinforced every single
          time you do it. The fix isn&apos;t &ldquo;try harder not to look.&rdquo; It&apos;s
          replacing the glance with a more reliable source of confidence: muscle memory, built in
          a specific order.
        </p>

        <h2 id="the-plan">The day-by-day plan</h2>
        <div className="flex flex-col gap-3">
          {PLAN.map((step) => (
            <div key={step.when} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {step.when}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{step.focus}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{step.detail}</p>
            </div>
          ))}
        </div>

        <h2 id="fj-bumps">Use the F and J bumps as your anchor</h2>
        <p>
          Almost every keyboard has a small raised bump on <code>F</code> and <code>J</code> —
          feel for it every time you return your hands to the keyboard, before typing anything.
          This single habit does more to eliminate looking down than any other single tip, because
          it gives your hands a reliable, always-available reference point that doesn&apos;t
          require your eyes at all.
        </p>

        <h2 id="mistakes">What to do when you make a mistake</h2>
        <p>
          Resist the instinct to look down the moment something feels wrong. Use{" "}
          <code>Backspace</code> by feel — it&apos;s in a fixed location, just like any letter key
          — delete back to the error, and retype. Looking down &ldquo;just this once&rdquo; to fix
          a mistake resets the habit you&apos;re trying to build almost as much as typing an
          entire sentence while looking.
        </p>

        <h2 id="transitioning">Transitioning from hunt-and-peck</h2>
        <p>
          If you currently type by finding keys visually with two or four fingers, expect the
          first week to feel like a genuine regression — you will type slower than your old
          method. That&apos;s expected, not a sign it isn&apos;t working: your old method already
          has years of practice behind it, and the new one has days. The ceiling on the new method
          is simply much higher once it&apos;s built, because it doesn&apos;t require visual
          search at all.
        </p>

        <h2 id="know-improving">How to know you&apos;re actually improving</h2>
        <ul>
          <li>You can find home row after looking away, without a false start</li>
          <li>You catch yourself starting to glance down, and stop, rather than completing the glance</li>
          <li>Short common words come out correctly without conscious finger-by-finger thought</li>
          <li>Your accuracy on no-look sessions is climbing week over week, even if slowly</li>
        </ul>
        <p>
          WPM is the wrong metric to watch during this specific transition — it will likely dip
          before it recovers. Once the no-look habit is genuinely automatic,{" "}
          <Link href="/guides/how-to-improve-typing-speed">how to improve your typing speed</Link>{" "}
          picks up from there. In the meantime, <Link href="/lessons">structured lessons</Link>{" "}
          run this exact progression with an on-screen hand diagram, and{" "}
          <Link href="/">a typing test</Link> lets you check your accuracy trend without judgment.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

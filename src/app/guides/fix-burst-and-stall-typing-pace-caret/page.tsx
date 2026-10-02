import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Why Your Typing Speed Stalls (and How a Pace Caret Fixes It)",
  description:
    "Stuck at the same WPM for weeks? Burst-and-stall typing is usually the cause. Here's the math behind why it plateaus speed, and a pace-caret routine that fixes it.",
  path: "/guides/fix-burst-and-stall-typing-pace-caret",
});

const PUBLISHED = "2026-10-02";

const FAQ_ITEMS = [
  {
    question: "How do I know if my plateau is a pacing problem or something else?",
    answer:
      "Check your consistency score on your HeroTyping results screen. If it's sitting well below 75% while your peak speed during the test looks fine, burst-and-stall pacing is very likely your main bottleneck. If consistency is already high and you're still stuck, the cause is more likely accuracy, unfamiliar vocabulary, or finger technique rather than pacing -- see the full plateau diagnostic guide below.",
    plainAnswer: "A low consistency score alongside a decent peak speed points to pacing as the cause; if consistency is already high, look elsewhere.",
  },
  {
    question: "What percentage below my average should I set the pace caret to?",
    answer:
      "Somewhere around 5 to 10 percent under your current typical speed is a reasonable starting point. The goal isn't to feel slow -- it's to set a target you can beat smoothly, without a single dead stop, so you build the habit of continuous typing before pushing speed back up.",
    plainAnswer: "About 5-10% under your current average is a good starting target.",
  },
  {
    question: "Will typing slower on purpose actually make me type faster overall?",
    answer:
      "Yes, because of simple arithmetic: a typist who stalls for even a second or two loses far more average speed than a burst of extra-fast typing can win back. A steady typist at a moderate pace reliably beats a bursty typist with a higher peak speed, because the stalls drag the average down more than the bursts raise it.",
    plainAnswer: "Yes -- eliminating dead stops helps your average speed more than typing in fast bursts does.",
  },
  {
    question: "How long until I see a difference?",
    answer:
      "Most people notice their consistency score improving within a handful of sessions -- often before their raw WPM moves at all. That's the expected order: smoother pacing shows up first, and the speed increase follows once steady typing becomes the default rather than something you have to think about.",
    plainAnswer: "Consistency usually improves within a few sessions, with speed gains following shortly after.",
  },
];

export default function FixBurstAndStallTypingPaceCaretPage() {
  const schema = buildArticleSchema({
    headline: "Why Your Typing Speed Stalls (and How a Pace Caret Fixes It)",
    description:
      "Stuck at the same WPM for weeks? Burst-and-stall typing is usually the cause. Here's the math behind why it plateaus speed, and a pace-caret routine that fixes it.",
    path: "/guides/fix-burst-and-stall-typing-pace-caret",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Why Your Typing Speed Stalls (and How to Fix It)"
        subtitle="Burst-and-stall typing is the single most common reason speed stops improving -- here's the math behind it and a pace-caret routine that fixes it."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Improve Your Typing", path: "/guides/improve-your-typing" },
          { name: "Why Your Typing Speed Stalls", path: "/guides/fix-burst-and-stall-typing-pace-caret" },
        ]}
        toc={[
          { id: "the-symptom", label: "The symptom: sprint, then freeze" },
          { id: "the-math", label: "The math behind why it plateaus speed" },
          { id: "the-fix", label: "The fix: pace slightly under your average" },
          { id: "one-week-routine", label: "A one-week pace caret routine" },
          { id: "how-to-tell", label: "How to tell it's working" },
        ]}
        hasFaq
      >
        <Callout label="The pattern">
          <p>
            Sprinting through easy words, then freezing on a hard one or a typo, so your average typing speed never
            actually moves even though your peak speed is fine. This is called burst-and-stall typing, and it&apos;s
            the most common reason a WPM stays flat for weeks of practice.
          </p>
        </Callout>

        <h2 id="the-symptom">The Symptom: Sprint, Then Freeze</h2>
        <p>
          If this sounds familiar, you&apos;ve probably experienced it already: you fly through short, common words
          like <em>the</em>, <em>and</em>, <em>it</em> at well above your average pace, then hit an unfamiliar word,
          a number, or a bit of punctuation and your hands stop completely for half a second or more while your eyes
          catch up. Then you sprint again. Repeat for the rest of the test.
        </p>
        <p>
          It <em>feels</em> fast, because the bursts are genuinely fast. But the final number on the results screen
          never reflects that -- it stays stubbornly flat, test after test, no matter how much you practice. This
          isn&apos;t covered in depth here -- for the full diagnostic across every common plateau cause, see{" "}
          <Link href="/guides/how-to-break-a-typing-speed-plateau">the typing speed plateau guide</Link>. This page
          is specifically about pacing, and specifically about the one tool that fixes it.
        </p>

        <Image
          src="/guides/improve-your-typing/fix-burst-and-stall-typing-pace-caret/burst-and-stall-waveform.webp"
          alt="A jagged, erratic speed line representing burst-and-stall typing next to a smooth, steady target pace line"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="the-math">The Math Behind Why It Plateaus Speed</h2>
        <p>
          Here&apos;s the arithmetic that explains why bursts never make up for stalls. Say you type at a genuinely
          fast 90 WPM for 3 seconds, then freeze completely (0 WPM) for 2 seconds:
        </p>
        <ul>
          <li>3 seconds at 90 WPM covers roughly 4.5 words worth of characters.</li>
          <li>2 seconds at 0 WPM covers nothing.</li>
          <li>Averaged over that whole 5-second span, your effective speed works out to about 54 WPM.</li>
        </ul>
        <p>
          Now compare that to a typist who never bursts at all, typing a steady, unremarkable 65 WPM with zero
          pauses. They finish meaningfully ahead of the burst-and-stall typist, despite never once hitting a speed
          anywhere close to 90 WPM. The dead stop costs far more than the sprint earns back -- that imbalance is the
          entire reason this pattern plateaus speed no matter how fast the bursts get.
        </p>
        <p>
          Your consistency score on HeroTyping&apos;s results screen measures exactly this: how evenly your typing
          speed held across the test, second by second. A low consistency score alongside a decent peak speed is
          the signature of burst-and-stall typing.
        </p>

        <h2 id="the-fix">The Fix: Set a Pace Target Slightly Under Your Average</h2>
        <p>
          The counterintuitive part of the fix is that you deliberately set your pace caret target a little{" "}
          <em>below</em> your current average speed, not above it. The goal for this routine isn&apos;t to go faster
          -- it&apos;s to go exactly that speed without ever stopping. That reframes what you&apos;re optimizing for
          during the test: instead of &quot;type as fast as possible,&quot; the job becomes &quot;never let the
          ghost catch me,&quot; which is a much easier, calmer thing to hold onto while typing than an abstract
          speed goal.
        </p>

        <h2 id="one-week-routine">A One-Week Pace Caret Routine</h2>
        <ol>
          <li>
            Find your current average: run a normal test on <Link href="/">HeroTyping</Link> with the pace caret
            off, note the net WPM.
          </li>
          <li>Open Test Settings, set Pace Caret to Custom, and enter a number 5-10% below that average.</li>
          <li>
            Run 10 minutes of short tests at that target, every day, for a week. The only goal is staying ahead of
            the ghost the whole way through -- not beating it by a lot, just not letting it catch you.
          </li>
          <li>
            Once a session goes by with the ghost never catching up even once, raise the target by a few WPM and
            repeat.
          </li>
        </ol>

        <h2 id="how-to-tell">How to Tell It&apos;s Working</h2>
        <p>
          Watch your consistency score before your WPM. It should climb first -- often within just a few sessions --
          with your actual typing speed following once steady, uninterrupted typing stops requiring conscious effort
          and becomes your default. If you track both, you&apos;ll typically see consistency move noticeably before
          the headline WPM number does, which is the correct order and a sign the fix is actually working rather
          than a coincidence.
        </p>

        <Callout label="Next step">
          <p>
            Once your pacing smooths out, <Link href="/guides/beat-your-personal-best-typing-speed">racing your own
            personal best</Link> is the natural next step -- or run a quick test on{" "}
            <Link href="/">HeroTyping</Link> right now with a custom pace caret set just under your average.
          </p>
        </Callout>

        <FaqSection items={FAQ_ITEMS} />
      </GuideLayout>
    </>
  );
}

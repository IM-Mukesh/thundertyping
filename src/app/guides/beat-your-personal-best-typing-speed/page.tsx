import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Beat Your Personal Best Typing Speed: A Step-by-Step Method That Works",
  description:
    "How to actually beat your typing speed PB instead of hoping it happens: a step-by-step method using HeroTyping's pace caret to race your own best score.",
  path: "/guides/beat-your-personal-best-typing-speed",
});

const PUBLISHED = "2026-10-02";

const FAQ_ITEMS = [
  {
    question: "Does my personal best reset if I change test settings?",
    answer:
      "No, but it does track separately per configuration. HeroTyping stores a personal best for each combination of mode, duration or word count, and punctuation/number settings -- so your 25-word PB and your 60-second PB are two different numbers, and both stay intact when you switch between them.",
    plainAnswer: "It doesn't reset -- each test mode and length keeps its own separate personal best.",
  },
  {
    question: "What if I don't have a personal best yet?",
    answer:
      "Run one test in the mode you care about with the pace caret off. Whatever you score becomes your first personal best automatically, and from your next test onward you can turn on PB mode and start racing it.",
    plainAnswer: "Run one test first -- your first result automatically becomes your starting personal best.",
  },
  {
    question: "Can I race my personal best from a different word count or duration?",
    answer:
      "Not directly -- the pace caret's PB mode always races the best for whatever mode you're currently running. If you want to compare across different test lengths, use the custom WPM mode and manually set it to the speed you want to chase instead.",
    plainAnswer: "No, PB mode only races the best for your current exact settings. Use custom mode to chase a speed from a different test length.",
  },
  {
    question: "Is it bad if the ghost caret beats me every single time?",
    answer:
      "It means your target is currently set above what you can consistently produce, not that something is wrong. If several sessions in a row end with the ghost consistently far ahead, drop to a custom target a few WPM below your PB, win there a few times, then step back up.",
    plainAnswer: "It just means the target is a bit too high right now -- drop to a slightly lower custom target and build back up.",
  },
];

export default function BeatYourPersonalBestTypingSpeedPage() {
  const schema = buildArticleSchema({
    headline: "Beat Your Personal Best Typing Speed: A Step-by-Step Method That Works",
    description:
      "How to actually beat your typing speed PB instead of hoping it happens: a step-by-step method using HeroTyping's pace caret to race your own best score.",
    path: "/guides/beat-your-personal-best-typing-speed",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Beat Your Personal Best Typing Speed"
        subtitle="A step-by-step method for actually beating your typing speed PB, instead of just hoping a faster run happens eventually."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Improve Your Typing", path: "/guides/improve-your-typing" },
          { name: "Beat Your Personal Best Typing Speed", path: "/guides/beat-your-personal-best-typing-speed" },
        ]}
        toc={[
          { id: "why-racing-yourself-works", label: "Why racing your past self works" },
          { id: "step-by-step", label: "Step-by-step: turning on PB mode" },
          { id: "reading-the-race", label: "What it looks like when you're winning or losing" },
          { id: "first-week-plan", label: "A realistic first-week plan" },
          { id: "the-accuracy-trap", label: "The one mistake that ruins this" },
        ]}
        hasFaq
      >
        <Callout label="Core idea">
          <p>
            Your personal best is proof you can already type that fast -- the only open question is whether you can
            do it again. That makes it the single most motivating speed target there is: not a made-up number, a
            result you&apos;ve personally produced.
          </p>
        </Callout>

        <h2 id="why-racing-yourself-works">Why Racing Your Past Self Works Better Than Racing a Number</h2>
        <p>
          Most advice for increasing typing speed boils down to &quot;practice more,&quot; which is true but useless
          on its own -- it doesn&apos;t tell you what to actually do differently during a session. Racing your own
          personal best does, because it hands you a concrete, achievable target: a speed you have already hit at
          least once, under the same conditions you&apos;re typing in right now.
        </p>
        <p>
          Compare that to a round-number goal like &quot;I want to type 80 WPM&quot; picked out of thin air. If
          you&apos;ve never actually produced 80 WPM, chasing it from session one is just guessing. Your personal
          best has no such problem -- it&apos;s evidence, not ambition.
        </p>

        <Image
          src="/guides/improve-your-typing/beat-your-personal-best-typing-speed/race-your-pb-hero.webp"
          alt="Two parallel race-lane style progress bars representing a typist's current run and their personal best pace"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="step-by-step">Step-by-Step: Turning On PB Mode</h2>
        <ol>
          <li>
            Open <Link href="/">HeroTyping</Link> and set up the exact test you want to beat your record on --
            mode, word count or duration, punctuation and numbers if you use them.
          </li>
          <li>Open Test Settings and set <strong>Pace Caret</strong> to <strong>Your PB</strong>.</li>
          <li>
            Start typing. A second, dimmer cursor appears and moves at precisely your tracked best for this exact
            configuration.
          </li>
          <li>
            Finish the test. If your real cursor crossed the finish line ahead of the ghost, you have a new personal
            best -- HeroTyping flags it on the results screen automatically.
          </li>
        </ol>

        <h2 id="reading-the-race">What It Looks Like When You&apos;re Winning (or Losing)</h2>
        <p>
          If the ghost caret pulls ahead of your real typing position mid-test, that&apos;s information, not a
          verdict -- you&apos;re behind your own best pace <em>right now</em>, with time left to adjust. The wrong
          response is panicking and typing recklessly to catch up, which usually produces more mistakes and actually
          costs you speed. The better response is easing into your normal rhythm and letting the gap close
          naturally over the remaining words.
        </p>
        <p>
          If your real cursor is pulling ahead instead, you&apos;re on track for a new best. Resist the urge to
          celebrate mid-sentence and lose focus -- the last few words of a test are exactly where a lapse in
          attention erases a lead you spent the whole test building.
        </p>

        <h2 id="first-week-plan">A Realistic First-Week Plan</h2>
        <p>Three short sessions, not one marathon:</p>
        <ul>
          <li>
            <strong>Day 1:</strong> Run your usual test (say, 25 words) with PB mode on. Just see where you land
            against your existing best -- no pressure to beat it yet.
          </li>
          <li>
            <strong>Day 3:</strong> Same mode, PB mode still on. By now you&apos;ll have a feel for where in the test
            you tend to fall behind the ghost -- usually a specific kind of word, not the whole test evenly.
          </li>
          <li>
            <strong>Day 5–7:</strong> Keep racing the same PB. Most people see their first genuine new best somewhere
            in this window, once the pacing itself stops feeling unfamiliar.
          </li>
        </ul>

        <h2 id="the-accuracy-trap">The One Mistake That Ruins This</h2>
        <p>
          Chasing the ghost too hard, at the cost of accuracy, backfires specifically because of how net WPM is
          scored: a word typed with even one mistake contributes nothing toward your speed, even if every other
          letter was correct and fast. Racing recklessly and mistyping three words to save half a second on each one
          is a net loss, not a win. See <Link href="/guides/net-wpm-vs-gross-wpm">how net vs. gross WPM is
          calculated</Link> for exactly why a single typo costs a whole word&apos;s credit.
        </p>
        <p>
          The typists who reliably beat their own personal bests aren&apos;t the ones who panic-sprint when they
          fall behind -- they&apos;re the ones who stay accurate and let small, repeatable speed gains compound over
          many sessions.
        </p>

        <Callout label="Next step">
          <p>
            Once you&apos;ve beaten the same PB a few times, it&apos;s worth setting a bigger target on purpose --
            see <Link href="/guides/how-to-set-a-typing-speed-goal">how to set a typing speed goal</Link> for a
            method that doesn&apos;t just leave it to chance.
          </p>
        </Callout>

        <FaqSection items={FAQ_ITEMS} />
      </GuideLayout>
    </>
  );
}

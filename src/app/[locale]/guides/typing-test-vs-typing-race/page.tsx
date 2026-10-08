import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Typing Test vs. Typing Race: Why Racing Your Own Best Score Builds Real Speed",
  description:
    "Multiplayer typing races, plain timed tests, and pace-caret practice compared honestly -- what each is actually good for, and which builds real typing speed fastest.",
  path: "/guides/typing-test-vs-typing-race",
});

const PUBLISHED = "2026-10-02";

const FAQ_ITEMS = [
  {
    question: "Is a pace caret the same thing as a ghost replay?",
    answer:
      "Close, but not identical. A ghost replay typically re-plays a recording of a specific past run, keystroke for keystroke. A pace caret is simpler: it just moves at a steady target speed (your personal best or a custom number) without replaying the exact keystrokes of any one session.",
    plainAnswer: "Similar idea, but a pace caret moves at a steady target speed rather than replaying an exact past run.",
  },
  {
    question: "Can I use both multiplayer races and a pace caret in the same practice routine?",
    answer:
      "Yes, and for most people that combination works better than either alone. Use pace-caret practice for deliberate, measurable improvement on your own weaknesses, and multiplayer races for fun, motivation, and testing your speed under real competitive pressure.",
    plainAnswer: "Yes -- they serve different purposes and complement each other well.",
  },
  {
    question: "Does HeroTyping have multiplayer races too?",
    answer:
      "HeroTyping's core focus is the free typing speed test itself, typing games, and structured practice -- including the pace caret feature covered on this page. Check the games section for the current lineup of typing games built around speed and accuracy.",
    plainAnswer: "Check the games section for HeroTyping's current typing games lineup.",
  },
  {
    question: "Which is better for a total beginner?",
    answer:
      "Neither, really -- start with untimed, pressure-free practice to build accurate muscle memory first. Racing anything, real opponents or a pace caret, before your fingers know the keyboard mostly just teaches panic. Add pacing tools once your accuracy is already solid.",
    plainAnswer: "Start with untimed practice to build accuracy first, then add racing or pacing tools later.",
  },
];

export default function TypingTestVsTypingRacePage() {
  const schema = buildArticleSchema({
    headline: "Typing Test vs. Typing Race: Why Racing Your Own Best Score Builds Real Speed",
    description:
      "Multiplayer typing races, plain timed tests, and pace-caret practice compared honestly -- what each is actually good for, and which builds real typing speed fastest.",
    path: "/guides/typing-test-vs-typing-race",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Typing Test vs. Typing Race"
        subtitle="Multiplayer races, plain timed tests, and pace-caret practice, compared honestly -- what each is actually good for."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Improve Your Typing", path: "/guides/improve-your-typing" },
          { name: "Typing Test vs. Typing Race", path: "/guides/typing-test-vs-typing-race" },
        ]}
        toc={[
          { id: "three-ways", label: "Three ways people practice typing speed" },
          { id: "multiplayer-races", label: "Multiplayer typing races" },
          { id: "plain-tests", label: "Plain, untimed or timed tests" },
          { id: "pace-caret-practice", label: "Pace caret practice" },
          { id: "the-verdict", label: "The verdict" },
          { id: "is-there-an-alternative", label: "Looking for a free pace caret?" },
        ]}
        hasFaq
      >
        <h2 id="three-ways">Three Ways People Practice Typing Speed</h2>
        <p>
          Most typing practice falls into one of three categories: racing other people in real time, taking a plain
          typing test with no pacing tool at all, or practicing against a pace caret that races your own past
          performance. Each has a genuine use case. None of them is objectively &quot;the best&quot; for everyone --
          here&apos;s an honest comparison of what each one is actually good for.
        </p>

        <Image
          src="/guides/improve-your-typing/typing-test-vs-typing-race/three-practice-methods-hero.webp"
          alt="Three parallel glowing lanes representing multiplayer racing, plain timed testing, and solo pace-caret practice"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="multiplayer-races">Multiplayer Typing Races</h2>
        <p>
          Live multiplayer typing races pit you against real people in real time. The appeal is obvious: it&apos;s
          genuinely fun, socially engaging, and the adrenaline of a close race is motivating in a way solo practice
          rarely is.
        </p>
        <p>
          The real limitation is less obvious: you&apos;re racing a stranger&apos;s skill level, not your own. If
          your opponent is much faster than you, the race teaches you very little beyond &quot;I lost&quot; -- there
          was never a realistic chance of winning, so there&apos;s no useful feedback about your own pacing. If
          they&apos;re much slower, you coast and learn just as little. The matchup, not your actual weaknesses,
          decides what the race teaches you.
        </p>

        <h2 id="plain-tests">Plain, Untimed or Timed Tests</h2>
        <p>
          A standard typing test with no pacing tool at all -- just type, get a number at the end -- has its own
          clear advantage: zero pressure. It&apos;s the right choice for learning a new keyboard layout, practicing
          unfamiliar vocabulary, or simply warming up before a session, where racing anything would just add
          friction to what should be low-stakes repetition.
        </p>
        <p>
          The limitation is that it gives you no feedback loop <em>during</em> the test at all. You only find out
          how you did once it&apos;s over, by which point there&apos;s nothing left to adjust. For simple
          progress-tracking over days and weeks this is fine; for actively improving pacing within a single session,
          it does nothing.
        </p>

        <h2 id="pace-caret-practice">Pace Caret Practice</h2>
        <p>
          A pace caret splits the difference in a specific way: it gives you the same real-time, mid-test feedback a
          race gives you, but the target is always exactly calibrated to <em>you</em> -- your own personal best, or
          a custom goal you set yourself -- rather than whoever happened to join the same multiplayer room. See{" "}
          <Link href="/guides/improve-typing-speed-with-ghost-caret">what a pace caret is</Link> for the full
          explanation if you haven&apos;t used one.
        </p>
        <p>
          The honest limitation: it&apos;s less inherently fun and social than racing real people. It&apos;s a
          training tool, not a game -- effective specifically because the target is always meaningful to your own
          progress, not because it&apos;s thrilling.
        </p>

        <h2 id="the-verdict">The Verdict</h2>
        <p>
          These three aren&apos;t really competing with each other -- they&apos;re suited to different moments. Use
          multiplayer races for fun, motivation, and testing your speed under real competitive pressure. Use plain
          tests for low-stakes practice and simple progress tracking. Use pace-caret practice specifically when you
          want deliberate, measurable improvement on your own weaknesses -- fixing{" "}
          <Link href="/guides/fix-burst-and-stall-typing-pace-caret">inconsistent pacing</Link>, or working toward{" "}
          <Link href="/guides/how-to-set-a-typing-speed-goal">a specific speed goal</Link>. Most serious typists
          genuinely benefit from rotating between all three rather than picking just one forever.
        </p>

        <h2 id="is-there-an-alternative">Looking for a Free Pace Caret?</h2>
        <p>
          HeroTyping has the same core mechanic -- a second cursor that races either your tracked personal best or
          any custom WPM you choose -- free, with no sign-up required. It isn&apos;t a clone of any other site; it&apos;s
          HeroTyping&apos;s own implementation of an idea a handful of typing test sites have independently settled
          on because it genuinely works.
        </p>

        <Callout label="Try it">
          <p>
            Run a free typing test on <Link href="/">HeroTyping</Link> with the pace caret turned on, then try a
            multiplayer-style typing game to compare how each one feels.
          </p>
        </Callout>

        <FaqSection items={FAQ_ITEMS} />
      </GuideLayout>
    </>
  );
}

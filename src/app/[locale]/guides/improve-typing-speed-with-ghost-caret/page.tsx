import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Improve Your Typing Speed With a Ghost Caret That Races You in Real Time",
  description:
    "What a pace caret (ghost caret) is, how it's different from your real cursor, and how to use it on a free typing speed test to improve faster than practicing blind.",
  path: "/guides/improve-typing-speed-with-ghost-caret",
});

const PUBLISHED = "2026-10-02";

const FAQ_ITEMS = [
  {
    question: "Does the pace caret affect my WPM or accuracy score?",
    answer:
      "No. The pace caret is rendered independently of HeroTyping's scoring engine -- it reads your elapsed time and word list to decide where to draw a second cursor, but it never writes back into your correct-keystroke count, accuracy, or consistency. You can turn it on or off mid-session without it touching a single number on your results screen.",
    plainAnswer: "No -- it's purely visual and has zero effect on your WPM, accuracy, or consistency score.",
  },
  {
    question: "Can I set the pace caret to my own average instead of my best?",
    answer:
      "HeroTyping's pace caret currently supports two targets: your personal best for the current mode and configuration, or any custom WPM you choose. If you want to race something close to your typical pace rather than your peak, set a custom target a few WPM below your best -- that approximates an 'average' target without needing a separate tracked stat.",
    plainAnswer: "Not a tracked average directly, but you can set a custom WPM close to your typical speed as a stand-in.",
  },
  {
    question: "What's a good pace caret target if I don't know my typing speed yet?",
    answer:
      "Run one normal typing test first with the pace caret off, note your net WPM, then turn the pace caret on and set a custom target 5 to 10 percent above that number. Racing a target you've never hit before from the first session usually just feels discouraging -- a small, achievable stretch works better.",
    plainAnswer: "Take one test without it first to find your baseline, then set your first pace caret target just slightly above that.",
  },
  {
    question: "Does every typing test site have a pace caret?",
    answer:
      "No. It's a feature a handful of typing test sites have built, each with its own name for it (pace caret, ghost caret, target cursor). HeroTyping's version races either your tracked personal best or a custom WPM, is free, and doesn't require an account to use.",
    plainAnswer: "No, it's a feature only some sites have. HeroTyping has it, free, no account required.",
  },
];

export default function ImproveTypingSpeedWithGhostCaretPage() {
  const schema = buildArticleSchema({
    headline: "Improve Your Typing Speed With a Ghost Caret That Races You in Real Time",
    description:
      "What a pace caret (ghost caret) is, how it's different from your real cursor, and how to use it on a free typing speed test to improve faster than practicing blind.",
    path: "/guides/improve-typing-speed-with-ghost-caret",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Improve Your Typing Speed With a Ghost Caret"
        subtitle="A second, visually distinct cursor that races you at a target speed in real time -- here's what it is and how to use one to actually get faster."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Improve Your Typing", path: "/guides/improve-your-typing" },
          { name: "Improve Typing Speed With a Ghost Caret", path: "/guides/improve-typing-speed-with-ghost-caret" },
        ]}
        toc={[
          { id: "the-feedback-problem", label: "The problem with testing your typing speed" },
          { id: "what-a-pace-caret-is", label: "What a pace caret actually is" },
          { id: "how-its-different", label: "How it's different from your real caret" },
          { id: "three-targets", label: "Three ways to set your target" },
          { id: "why-real-time-wins", label: "Why real-time feedback beats a final score" },
          { id: "how-to-turn-it-on", label: "How to turn it on" },
        ]}
        hasFaq
      >
        <Callout label="In short">
          <p>
            A pace caret (also called a ghost caret) is a second cursor on a typing test that moves at a fixed
            target speed, independent of what you&apos;re actually typing. You watch both cursors at once: if the
            ghost pulls ahead, you&apos;re behind pace right now; if your real cursor is ahead, you&apos;re on track.
            HeroTyping added one that can race either your own personal best or any custom WPM you choose.
          </p>
        </Callout>

        <Image
          src="/guides/improve-your-typing/improve-typing-speed-with-ghost-caret/pace-caret-hero.webp"
          alt="Two cursors on a typing test word stream -- a solid gold caret marking the real typing position and a translucent ghost caret further ahead"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="the-feedback-problem">The Problem With Every Normal Typing Speed Test</h2>
        <p>
          Take a typing test the ordinary way and you get exactly one piece of feedback: a number, after you&apos;re
          already finished. You find out your words per minute, your accuracy, maybe a consistency score -- all of
          it arrives after the fact. While you were actually typing, you had no idea whether you were on pace for a
          good result or quietly falling behind until the last word.
        </p>
        <p>
          That delay is the whole problem. If you don&apos;t know you&apos;re slowing down until the results screen,
          you can&apos;t do anything about it <em>during</em> the test that would have mattered. You just see the
          number, shrug, and run another test the same way.
        </p>

        <h2 id="what-a-pace-caret-is">What a Pace Caret Actually Is</h2>
        <p>
          A pace caret fixes this by giving you a second cursor that moves at a steady, predetermined speed,
          completely independent of your real keystrokes. Pick a target -- say, 55 WPM -- and that ghost cursor
          advances through the word list at exactly 55 WPM for the whole test, regardless of how fast or slow you
          actually type.
        </p>
        <p>
          Your real typing position is still there too, moving normally as you type. So for the entire test you can
          see both: where you actually are, and where a typist holding your target pace would be right now. The gap
          between the two cursors is your feedback, live, not after the test ends.
        </p>

        <h2 id="how-its-different">How It&apos;s Different From Your Real Caret</h2>
        <p>
          HeroTyping renders the two cursors with deliberately different styling so they&apos;re never confused: your
          real typing position is a solid, bright cursor in your theme&apos;s accent color, and the pace caret is a
          dimmer, translucent bar that trails or leads it. Each one moves independently -- your real caret only
          advances when you actually type a correct character, the pace caret advances purely on elapsed time.
        </p>
        <p>
          Because they&apos;re visually distinct, you can tell at a glance which one is ahead without having to think
          about it mid-sentence. That matters: anything that requires you to stop and interpret a number while
          you&apos;re typing defeats the point. A pace caret works because reading &quot;is the dim cursor ahead of
          the bright one&quot; takes no more attention than noticing a word you&apos;re about to mistype.
        </p>

        <h2 id="three-targets">Three Ways to Set Your Target</h2>
        <p>HeroTyping&apos;s pace caret has three modes, switchable from Test Settings on any typing test:</p>
        <ul>
          <li>
            <strong>Off.</strong> The default. No second cursor, test behaves exactly like a normal typing speed test.
          </li>
          <li>
            <strong>Race your personal best.</strong> The ghost caret moves at your tracked PB for the exact mode and
            settings you&apos;re currently running -- a 25-word test has its own PB separate from a 60-second test,
            so the target always matches what you&apos;re actually doing.
          </li>
          <li>
            <strong>Custom WPM.</strong> Pick any number. Useful for easing into a new target gradually, or for
            racing a specific speed a job posting or class requires rather than your own history.
          </li>
        </ul>

        <h2 id="why-real-time-wins">Why Real-Time Feedback Beats a Final Score</h2>
        <p>
          The appeal of a pace caret isn&apos;t novelty, it&apos;s timing. A results screen tells you what already
          happened -- useful for tracking progress over days and weeks, but useless for correcting course in the
          moment. A pace caret tells you what&apos;s happening <em>right now</em>, while there&apos;s still time to
          change something: ease off a reckless sprint that&apos;s about to cause a typo, or pick up the pace on an
          easy stretch of short words.
        </p>
        <p>
          It also reframes what &quot;doing well&quot; means mid-test. Instead of vaguely trying to &quot;type fast,&quot;
          your actual job becomes simple and concrete: don&apos;t let the ghost get ahead. That&apos;s a much easier
          thing for your brain to track while your fingers are busy than an abstract speed goal.
        </p>

        <h2 id="how-to-turn-it-on">How to Turn It On</h2>
        <ol>
          <li>
            Open <Link href="/">HeroTyping</Link> and click <strong>Test Settings</strong> (or find the pace caret
            controls directly in the config bar on desktop).
          </li>
          <li>Under Pace Caret, choose <strong>Your PB</strong> to race your personal best, or <strong>Custom</strong> to set a specific WPM.</li>
          <li>Start typing normally -- the ghost caret appears automatically once the test begins.</li>
        </ol>
        <p>
          It&apos;s free and doesn&apos;t require an account. If you&apos;re chasing a specific number, pair this
          with <Link href="/guides/how-to-set-a-typing-speed-goal">setting a real typing speed goal</Link>; if your
          results already feel fast-but-erratic, <Link href="/guides/fix-burst-and-stall-typing-pace-caret">a pace
          caret set slightly under your average</Link> is specifically good at smoothing that out.
        </p>

        <Callout label="Try it now">
          <p>
            Run a real typing speed test on <Link href="/">HeroTyping</Link> right now with the pace caret turned
            on -- it takes less time to set up than reading the rest of this sentence.
          </p>
        </Callout>

        <FaqSection items={FAQ_ITEMS} />
      </GuideLayout>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/content-page";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/seo/constants";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: `About ${SITE_NAME}`,
  description: `${SITE_NAME} is a free typing speed test, plus structured lessons, typing games, and vocabulary practice. Instant guest practice with optional cloud sync.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <ContentPage title={`About ${SITE_NAME}`}>
      <p>
        {SITE_NAME} started as a free, fast typing speed test — pick a mode, start typing, and see
        your words per minute, accuracy, and consistency the moment you finish, no account or
        sign-up required. It&apos;s grown into a fuller practice platform since: structured{" "}
        <Link href="/lessons">typing lessons</Link> from the home row up, targeted{" "}
        <Link href="/lessons/practice">weak-key practice</Link> once the lessons know where you
        struggle, a catalog of 9 arcade <Link href="/games">typing games</Link> (including Typebound,
        Type Before Death, Ghost Racer, Fruit Fury, Falling Words, Word Rain, Word Blaster, Boss Battle, and Combo Rush),{" "}
        <Link href="/vocabulary">vocabulary practice</Link>, and a comprehensive library of{" "}
        <Link href="/guides">guides</Link> on technique and what the numbers actually mean.
      </p>

      <h2>How your stats are calculated</h2>
      <p>
        <strong>Words per minute (WPM)</strong> is measured using standard net WPM: it counts all attempted characters (including spaces), divides by five (the standard word length) to create standardized words, and subtracts any uncorrected errors before dividing by the minutes elapsed. <strong>Raw WPM</strong> counts every keystroke, correct or not, so it reflects your maximum output speed before mistake penalties are factored in. See the{" "}
        <Link href="/guides/net-wpm-vs-gross-wpm">WPM calculation guide</Link> for the full
        breakdown, including why a single uncorrected typo can cost a whole word&apos;s credit.
      </p>
      <p>
        <strong>Accuracy</strong> is the share of keystrokes that were correct.{" "}
        <strong>Consistency</strong> measures how steady your speed was throughout the test — a
        high score means your pace stayed even, rather than swinging between bursts and stalls.
      </p>

      <h2>Instant guest practice &amp; optional cloud sync</h2>
      <p>
        {SITE_NAME} is built to work instantly without mandatory sign-up. As a guest, your settings,
        custom configurations, and personal bests are stored locally in your own browser (using <code>localStorage</code>).
        For typists who choose to create an account, profile stats, lesson progress, game scores, and personal bests
        sync securely to your account so you can track your journey across multiple devices. See the{" "}
        <Link href="/privacy">Privacy Policy</Link> for details.
      </p>

      <h2>Contact & Feedback</h2>
      <p>
        Have questions, curriculum feedback, bug reports, or classroom inquiries? You can reach the
        team directly at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>What&apos;s next</h2>
      <p>
        {SITE_NAME} is under active development. Additional languages and more content across
        lessons, games and vocabulary are on the roadmap.
      </p>
    </ContentPage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/content-page";
import { SITE_NAME } from "@/lib/seo/constants";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: `About ${SITE_NAME}`,
  description: `${SITE_NAME} is a free typing speed test, plus structured lessons, typing games, and vocabulary practice. No sign-up, nothing sent to a server.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <ContentPage title={`About ${SITE_NAME}`}>
      <p>
        {SITE_NAME} started as a free, fast typing speed test — pick a mode, start typing, and see
        your words per minute, accuracy, and consistency the moment you finish, no account or
        sign-up required. It&apos;s grown into a fuller practice platform since: structured{" "}
        <Link href="/lessons">typing lessons</Link> from the home row up, a set of{" "}
        <Link href="/games">typing games</Link>, <Link href="/vocabulary">vocabulary practice</Link>, and a
        handful of <Link href="/guides">guides</Link> on technique and what the numbers actually mean.
      </p>

      <h2>How your stats are calculated</h2>
      <p>
        <strong>Words per minute (WPM)</strong> counts every correctly typed character, divides by
        five (the standard word length used by typing tests), and divides again by the minutes
        elapsed. <strong>Raw WPM</strong> uses the same formula but counts every keystroke,
        correct or not, so it reflects your typing speed before mistakes are factored in.
      </p>
      <p>
        <strong>Accuracy</strong> is the share of keystrokes that were correct.{" "}
        <strong>Consistency</strong> measures how steady your speed was throughout the test — a
        high score means your pace stayed even, rather than swinging between bursts and stalls.
      </p>

      <h2>Why there&apos;s no sign-up</h2>
      <p>
        {SITE_NAME} is built to work instantly, for anyone. Your settings and personal bests are
        saved only in your own browser (using <code>localStorage</code>) — they never leave your
        device, and clearing your browser data clears them for good. See the{" "}
        <Link href="/privacy">Privacy Policy</Link> for details.
      </p>

      <h2>What&apos;s next</h2>
      <p>
        {SITE_NAME} is under active development. Additional languages and more content across
        lessons, games and vocabulary are on the roadmap.
      </p>
    </ContentPage>
  );
}

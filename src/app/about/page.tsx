import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_NAME} is a free, no-sign-up typing speed test. Learn how WPM, accuracy, and consistency are calculated, and why nothing you type is sent to a server.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage title={`About ${SITE_NAME}`}>
      <p>
        {SITE_NAME} is a free, fast typing speed test. Pick a mode, start typing, and see your
        words per minute, accuracy, and consistency the moment you finish — no account, no
        sign-up, no waiting.
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
        <a href="/privacy">Privacy Policy</a> for details.
      </p>

      <h2>What&apos;s next</h2>
      <p>
        {SITE_NAME} is under active development. More languages, additional typing games, and
        multiplayer races are on the roadmap.
      </p>
    </ContentPage>
  );
}

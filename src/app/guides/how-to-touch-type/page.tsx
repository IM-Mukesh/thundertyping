import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/content-page";
import { buildArticleSchema } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "How to Touch Type",
  description:
    "The actual finger-to-key map for touch typing, row by row, plus a practice progression that builds it in the right order instead of skipping straight to full sentences.",
  alternates: { canonical: "/guides/how-to-touch-type" },
};

const PUBLISHED = "2026-09-24";

export default function HowToTouchTypePage() {
  const schema = buildArticleSchema({
    headline: "How to Touch Type",
    description:
      "The finger-to-key map for touch typing, row by row, and a practice progression that builds it in order.",
    path: "/guides/how-to-touch-type",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ContentPage
        title="How to Touch Type"
        subtitle="The finger map first, speed later — touch typing is a position habit, not a speed drill."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "How to Touch Type", path: "/guides/how-to-touch-type" },
        ]}
      >
        <p>
          Touch typing means one thing specifically: every key has one assigned finger, and that finger reaches for
          it and returns to the same resting spot every time, without your eyes checking where your hands are. It
          isn&apos;t about speed at first — it&apos;s a positional habit, and like any habit it&apos;s built by
          repetition in a fixed order, not by trying to type a whole sentence correctly on day one.
        </p>

        <h2>Start with the home row</h2>
        <p>
          Rest your left index, middle, ring and pinky fingers on <code>F</code>, <code>D</code>, <code>S</code> and{" "}
          <code>A</code>. Rest your right index, middle, ring and pinky on <code>J</code>, <code>K</code>,{" "}
          <code>L</code> and <code>;</code>. Both thumbs sit on the space bar. On almost every physical keyboard,{" "}
          <code>F</code> and <code>J</code> have a small raised bump — that&apos;s how you find home row by touch
          alone, without looking down. Every other key is reached by moving one finger out from its home key and
          back, never by shifting your whole hand.
        </p>

        <h2>The full finger map</h2>
        <p>Each finger owns a fixed column of keys across all three main rows:</p>
        <ul>
          <li>
            <strong>Left pinky:</strong> <code>Q A Z</code>
          </li>
          <li>
            <strong>Left ring:</strong> <code>W S X</code>
          </li>
          <li>
            <strong>Left middle:</strong> <code>E D C</code>
          </li>
          <li>
            <strong>Left index:</strong> <code>R F V</code> and <code>T G B</code> (the index fingers each cover two
            columns, not one)
          </li>
          <li>
            <strong>Right index:</strong> <code>U J M</code> and <code>Y H N</code>
          </li>
          <li>
            <strong>Right middle:</strong> <code>I K ,</code>
          </li>
          <li>
            <strong>Right ring:</strong> <code>O L .</code>
          </li>
          <li>
            <strong>Right pinky:</strong> <code>P ; /</code>
          </li>
          <li>
            <strong>Thumbs:</strong> space bar
          </li>
        </ul>
        <p>
          This is the exact map HeroTyping&apos;s{" "}
          <Link href="/lessons">on-screen keyboard and hand diagram</Link> highlight live while you type, so you can
          check your hand against it in real time instead of memorizing a chart in isolation.
        </p>

        <h2>A practice progression that doesn&apos;t skip steps</h2>
        <p>
          Trying to touch type a full sentence before your fingers know eight keys by feel is why most self-taught
          attempts stall. The order that actually works:
        </p>
        <ul>
          <li>Left hand home row alone (A S D F), until it&apos;s automatic</li>
          <li>Right hand home row alone (J K L ;), same standard</li>
          <li>Both hands combined on the home row</li>
          <li>Top row, then bottom row, each hand separately before combining</li>
          <li>Numbers, then real words, then full sentences with punctuation</li>
        </ul>
        <p>
          That&apos;s the exact sequence <Link href="/lessons">HeroTyping&apos;s typing lessons</Link> follow, with
          the finger diagram fading out as you stop needing it — guided practice first, then independent practice
          once a stage feels automatic rather than effortful.
        </p>

        <h2>Common mistakes when you&apos;re learning</h2>
        <ul>
          <li>
            <strong>Looking down to check.</strong> Every glance costs more time than the keystroke it was checking,
            and it delays the muscle memory you&apos;re actually trying to build.
          </li>
          <li>
            <strong>Reaching with the wrong finger because it&apos;s faster right now.</strong> It feels faster in the
            moment and guarantees you&apos;ll still be looking at the keyboard in six months. Use the assigned finger
            even when it&apos;s slower at first.
          </li>
          <li>
            <strong>Not returning to home row.</strong> The resting position is what makes every subsequent reach
            predictable. Skipping it turns touch typing back into hunting.
          </li>
          <li>
            <strong>Jumping straight to speed drills.</strong> Speed is what accuracy turns into once a movement is
            automatic — it&apos;s not a separate skill to practice before the movement is solid.
          </li>
        </ul>

        <h2>Once it&apos;s automatic</h2>
        <p>
          You&apos;ll know touch typing has actually taken hold when you can type a sentence without thinking about
          where your fingers are at all. From there,{" "}
          <Link href="/guides/how-to-improve-typing-speed">how to improve your typing speed</Link> covers what
          actually raises your WPM once the positions themselves are no longer the bottleneck. Or just{" "}
          <Link href="/">take a typing test</Link> and see where you land.
        </p>
      </ContentPage>
    </>
  );
}

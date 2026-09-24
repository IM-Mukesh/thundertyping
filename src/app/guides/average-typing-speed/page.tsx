import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/content-page";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Average Typing Speed by Context (WPM Benchmarks)",
  description:
    "What counts as a good typing speed, broken down by context: casual, office work, programming, transcription, and competitive typing — with honest ranges, not a single made-up number.",
  alternates: { canonical: "/guides/average-typing-speed" },
};

const PUBLISHED = "2026-09-15";

export default function AverageTypingSpeedPage() {
  const schema = buildArticleSchema({
    headline: "Average Typing Speed by Context (WPM Benchmarks)",
    description:
      "Typing speed benchmarks by context — casual, office, programming, transcription, competitive — with honest ranges instead of one number.",
    path: "/guides/average-typing-speed",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ContentPage
        title="Average Typing Speed by Context"
        subtitle="&ldquo;Good&rdquo; typing speed depends entirely on what you're comparing it to."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Average Typing Speed by Context", path: "/guides/average-typing-speed" },
        ]}
      >
        <p>
          &ldquo;What&apos;s a good WPM?&rdquo; doesn&apos;t have one honest answer — it depends
          entirely on who you&apos;re comparing yourself to. A number that&apos;s impressive for
          casual typing is unremarkable for a professional transcriptionist, and competitive
          typists operate in a range that would be a career-defining skill anywhere else. The
          ranges below are the commonly cited bands for each context; treat them as orientation,
          not a certificate.
        </p>

        <h2>By context</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Context</th>
              <th className="py-2 font-medium text-foreground">Typical range (WPM)</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            <tr>
              <td className="py-2 pr-4">General population, casual typing</td>
              <td className="py-2">30&ndash;45</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Average office / knowledge worker</td>
              <td className="py-2">40&ndash;65</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Professional typist / data entry</td>
              <td className="py-2">60&ndash;80</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Programmer (sustained, real code)</td>
              <td className="py-2">40&ndash;70</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Transcriptionist / court reporter</td>
              <td className="py-2">75&ndash;100+</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Competitive typist (top percentile)</td>
              <td className="py-2">120&ndash;150+</td>
            </tr>
          </tbody>
        </table>
        <p>
          These are broad, widely-cited bands rather than results from a single controlled study
          — typing-speed research uses inconsistent test lengths, text difficulty, and error
          penalties, so exact figures vary by source. Use them as a rough compass, not a
          leaderboard.
        </p>

        <h2>Why programmers often type &ldquo;slower&rdquo; than expected</h2>
        <p>
          Programmer WPM looks low next to office-worker WPM, and that&apos;s not a skill gap —
          it&apos;s a different task. Code isn&apos;t prose: it&apos;s dense with punctuation,
          symbols, and pauses to think about what to write next, all of which a raw-prose WPM
          test doesn&apos;t measure. A programmer who tests at 55 WPM on plain text may still type
          code faster, in practical terms, than someone who tests higher but hesitates constantly
          over unfamiliar symbols and indentation.
        </p>

        <h2>Why these numbers vary so much between sources</h2>
        <ul>
          <li>
            <strong>Test length.</strong> Short bursts (15&ndash;30s) tend to read higher than
            sustained multi-minute tests, since fatigue and error-correction haven&apos;t caught
            up yet.
          </li>
          <li>
            <strong>Text difficulty.</strong> Common English words are faster to type than
            random text, numbers, or unfamiliar punctuation — comparing scores from different
            text sources isn&apos;t really comparing the same thing.
          </li>
          <li>
            <strong>Net vs. raw WPM.</strong> Raw WPM ignores mistakes; net WPM (the number that
            actually matters) subtracts them. A score reported without saying which one it is
            can&apos;t be compared fairly to another score — {SITE_NAME} always shows both,
            separately, on the results screen. See{" "}
            <Link href="/guides/net-wpm-vs-gross-wpm">net WPM vs. gross WPM</Link> for the full
            breakdown.
          </li>
        </ul>

        <h2>What actually matters more than the number</h2>
        <p>
          A single WPM score is a snapshot, not a skill level — it swings with the text, your
          focus, and even the time of day. Consistency (how even your pace is across an entire
          test, not just your peak burst) and accuracy are better long-term signals of real
          ability than any one result. {SITE_NAME} tracks both alongside WPM on every results
          screen for exactly this reason: chasing a single peak number tends to encourage
          exactly the rushed, error-prone typing that slows you down in practice. If you want to
          actually move your baseline rather than just your best run, start with{" "}
          <Link href="/guides/how-to-improve-typing-speed">how to improve your typing speed</Link>{" "}
          — accuracy first, speed follows.
        </p>

        <h2>Test yourself</h2>
        <p>
          Numbers on a page are easy to skim past. <Link href="/">Take a typing test</Link> under
          the same conditions a few times (same duration, similar text type) before comparing
          your result to any of the ranges above — a single test tells you less than a short
          streak of them. Still building up to these ranges?{" "}
          <Link href="/lessons">Typing lessons</Link> start from the home row, and{" "}
          <Link href="/games">typing games</Link> keep practice time from feeling like a chore.
        </p>
      </ContentPage>
    </>
  );
}

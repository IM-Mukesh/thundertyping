import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { SourceList } from "@/components/content/source-list";
import { TypingCalculator } from "@/components/tools/typing-calculator";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = pageMetadata({
  title: "WPM, CPM & KPH Calculator (With Formulas Explained)",
  description:
    "Calculate WPM, CPM and KPH from a typing test, or convert freely between all three. Every formula shown, worked examples included, no sign-up.",
  path: "/guides/wpm-cpm-kph-calculator",
});

const PUBLISHED = "2026-09-25";
const UPDATED = "2026-09-25";

const MISTAKES = [
  {
    mistake: "Comparing a WPM score to a KPH requirement without converting",
    fix: "They're different units measuring the same thing. A job posting asking for 8,000 KPH is asking for about 27 WPM, not a separate, higher bar — always convert to compare.",
  },
  {
    mistake: "Reporting gross WPM as if it were net WPM",
    fix: "Gross counts every keystroke, mistakes included; net counts only what was typed correctly. The two can differ by 10+ WPM on an error-prone run, so always say which one you mean.",
  },
  {
    mistake: "Using a 15-second burst to estimate a full working shift's output",
    fix: "Short bursts run faster than sustained typing — fatigue and re-reading eat into a longer session. A 5-minute or longer sample is far closer to a real, sustained rate.",
  },
  {
    mistake: "Treating CPM as if it includes only correct characters",
    fix: "CPM here (and in almost every calculator) is raw character throughput, not accuracy-adjusted — it's the character-level version of gross WPM, not net.",
  },
];

const FAQ_ITEMS = [
  {
    question: "How do I convert WPM to KPH?",
    answer:
      "Multiply WPM by 300. That's because a \"word\" is a standardized 5 characters, and there are 60 minutes in an hour, so WPM × 5 × 60 = WPM × 300. 40 WPM is 12,000 KPH; 60 WPM is 18,000 KPH.",
    plainAnswer: "Multiply WPM by 300 (5 characters per word × 60 minutes per hour).",
  },
  {
    question: "How do I convert CPM to WPM?",
    answer:
      "Divide CPM by 5. CPM is the raw character rate; a \"word\" is defined as exactly 5 characters for measurement purposes, so dividing by 5 converts one into the other directly.",
    plainAnswer: "Divide CPM by 5.",
  },
  {
    question: "Is a higher KPH always better than a lower one?",
    answer:
      "Only if accuracy holds up. KPH here measures raw throughput, the same way gross WPM does — a very high KPH with a high error rate isn't actually more useful output than a moderate KPH typed accurately. Check accuracy alongside it, not instead of it.",
    plainAnswer: "Only if accuracy holds up — KPH alone doesn't account for errors, the same way gross WPM doesn't.",
  },
  {
    question: "Why does this calculator's net WPM differ slightly from another site's?",
    answer:
      "Some sites subtract a flat error penalty from gross WPM instead of simply excluding incorrect characters from the count (the method used here and in HeroTyping's own typing test). Both are legitimate, standard formulas, but they can produce different numbers for the identical run — see how WPM is calculated for a worked comparison.",
    plainAnswer:
      "Some sites use a gross-minus-penalty formula instead of a correct-characters-only formula. Both are standard, but they can disagree on the same run.",
  },
];

export default function WpmCpmKphCalculatorPage() {
  const schema = buildArticleSchema({
    headline: "WPM, CPM & KPH Calculator (With Formulas Explained)",
    description:
      "Calculate WPM, CPM and KPH from a typing test, or convert freely between all three, with every formula shown.",
    path: "/guides/wpm-cpm-kph-calculator",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="WPM, CPM & KPH Calculator"
        subtitle="Enter your numbers, see every formula work in real time — or just convert directly between the three units."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "WPM, CPM & KPH Calculator", path: "/guides/wpm-cpm-kph-calculator" },
        ]}
        toc={[
          { id: "calculator", label: "The calculator" },
          { id: "formulas", label: "The formulas" },
          { id: "worked-examples", label: "Worked examples" },
          { id: "gross-vs-net", label: "Gross vs. net WPM" },
          { id: "cpm-explained", label: "What CPM measures" },
          { id: "kph-explained", label: "What KPH measures" },
          { id: "conversions", label: "Conversion relationships" },
          { id: "mistakes", label: "Common mistakes" },
          { id: "methodology", label: "Methodology" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Quick answer">
          <p>
            WPM, CPM and KPH all measure the same underlying thing — how many characters you
            type per unit of time — at three different scales. <strong>CPM = WPM × 5</strong>.{" "}
            <strong>KPH = WPM × 300</strong>. The calculator below does the arithmetic; the
            sections after it explain exactly why those numbers are what they are.
          </p>
        </Callout>

        <h2 id="calculator">The calculator</h2>
        <p>
          Use whichever tab matches what you have. If you just finished a typing test, enter its
          raw numbers below. If you already have a WPM, CPM or KPH figure from somewhere else and
          just need it in another unit, use Quick convert — typing into any one field updates
          the other two immediately.
        </p>

        <TypingCalculator />

        <h2 id="formulas">The formulas</h2>
        <p>
          Every typing-speed figure ultimately comes from the same three raw numbers: how many
          characters were typed, how many of them were wrong, and how long it took. A{" "}
          <strong>word</strong>, for measurement purposes, is a standardized 5 characters —
          not a real dictionary word — which is what makes WPM comparable across completely
          different sentences.
        </p>
        <Callout label="Gross WPM">
          <p className="font-mono text-sm text-foreground">
            Gross WPM = (characters typed ÷ 5) ÷ minutes elapsed
          </p>
          <p>Counts every character, correct or not.</p>
        </Callout>
        <Callout label="Net WPM">
          <p className="font-mono text-sm text-foreground">
            Net WPM = (correct characters only ÷ 5) ÷ minutes elapsed
          </p>
          <p>Counts only what was typed correctly — the number {SITE_NAME} leads with everywhere.</p>
        </Callout>
        <Callout label="CPM">
          <p className="font-mono text-sm text-foreground">CPM = characters typed ÷ minutes elapsed</p>
          <p>The raw character rate, before it&apos;s normalized into 5-character words.</p>
        </Callout>
        <Callout label="KPH">
          <p className="font-mono text-sm text-foreground">KPH = CPM × 60, or WPM × 300</p>
          <p>The same character rate, scaled to a full hour — common on data-entry and government tests.</p>
        </Callout>

        <h2 id="worked-examples">Worked examples</h2>
        <p>
          A 1-minute test with 250 characters typed and 5 uncorrected errors: gross WPM is{" "}
          <code>(250 ÷ 5) ÷ 1 = 50</code>. Net WPM is{" "}
          <code>(245 ÷ 5) ÷ 1 = 49</code>. CPM is <code>250 ÷ 1 = 250</code>. KPH is{" "}
          <code>250 × 60 = 15,000</code>. All four numbers describe the exact same one-minute
          run — just at different scales and with a different treatment of the five mistakes.
          Try plugging these same numbers into the calculator above to see it match.
        </p>

        <h2 id="gross-vs-net">Gross WPM vs. net WPM</h2>
        <p>
          Gross WPM answers “how fast were your hands moving,” full stop — mistakes
          included. Net WPM answers “how fast could you produce correct text,” which is
          the number that matters for almost every real use. A typo you have to notice and fix
          costs real time that gross WPM doesn&apos;t account for. The full breakdown, including why
          two sites can disagree on net WPM specifically, is in{" "}
          <Link href="/guides/net-wpm-vs-gross-wpm">how WPM is calculated</Link>.
        </p>

        <h2 id="cpm-explained">What CPM measures</h2>
        <p>
          CPM (characters per minute) is WPM&apos;s more granular sibling — the same measurement,
          just not yet divided into 5-character “words.” It&apos;s most useful when the text
          itself isn&apos;t really prose: numeric entry, product codes, or any data-entry work where
          talking about “words” doesn&apos;t make much sense but counting characters still
          does.
        </p>

        <h2 id="kph-explained">What KPH measures</h2>
        <p>
          KPH (keystrokes per hour) is CPM scaled up to a full hour instead of a minute. It shows
          up most often in data-entry and government job postings, where an hourly throughput
          target is a more natural way to describe the job than a per-minute one. See{" "}
          <Link href="/guides/data-entry-typing-test">the data entry typing test guide</Link> for
          how real KPH requirements are typically framed.
        </p>

        <h2 id="conversions">Conversion relationships</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">From</th>
              <th className="py-2 pr-4 font-medium text-foreground">To</th>
              <th className="py-2 font-medium text-foreground">Formula</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            <tr>
              <td className="py-2 pr-4">WPM</td>
              <td className="py-2 pr-4">CPM</td>
              <td className="py-2 font-mono text-xs">CPM = WPM × 5</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">CPM</td>
              <td className="py-2 pr-4">WPM</td>
              <td className="py-2 font-mono text-xs">WPM = CPM ÷ 5</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">CPM</td>
              <td className="py-2 pr-4">KPH</td>
              <td className="py-2 font-mono text-xs">KPH = CPM × 60</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">KPH</td>
              <td className="py-2 pr-4">CPM</td>
              <td className="py-2 font-mono text-xs">CPM = KPH ÷ 60</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">WPM</td>
              <td className="py-2 pr-4">KPH</td>
              <td className="py-2 font-mono text-xs">KPH = WPM × 300</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">KPH</td>
              <td className="py-2 pr-4">WPM</td>
              <td className="py-2 font-mono text-xs">WPM = KPH ÷ 300</td>
            </tr>
          </tbody>
        </table>

        <h2 id="mistakes">Common mistakes</h2>
        <div className="flex flex-col gap-3">
          {MISTAKES.map((row) => (
            <div key={row.mistake} className="rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="text-sm font-medium text-foreground">{row.mistake}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{row.fix}</p>
            </div>
          ))}
        </div>

        <h2 id="methodology">Methodology</h2>
        <p>
          This calculator uses the same 5-characters-per-word convention and the same
          correct-characters-only net WPM formula as {SITE_NAME}&apos;s own typing test — nothing
          here is a separate, invented standard. Accuracy is calculated as correct characters
          divided by total characters typed, matching the number shown on every {SITE_NAME}{" "}
          results screen. Where a job posting or exam uses a different formula (some subtract a
          flat error penalty from gross WPM instead), that difference is explained above rather
          than silently papered over.
        </p>

        <p>
          Ready to generate your own numbers instead of hypothetical ones?{" "}
          <Link href="/">Take a typing test</Link>, work on the specific gap between your gross and
          net score with <Link href="/guides/how-to-improve-typing-accuracy">the accuracy guide</Link>,
          or start from the beginning with <Link href="/lessons">structured lessons</Link>.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label: "Words per minute — Wikipedia (standardized 5-character word convention)",
              href: "https://en.wikipedia.org/wiki/Words_per_minute",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

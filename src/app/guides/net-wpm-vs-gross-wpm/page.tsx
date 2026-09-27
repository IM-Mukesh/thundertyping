import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { SourceList } from "@/components/content/source-list";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = pageMetadata({
  title: "How Is WPM Calculated? Formula, Net vs. Gross, Worked Examples",
  description:
    "The exact WPM formula, worked examples for 30-second, 1-, 2-, and 5-minute tests, and why two typing sites can score the identical run differently.",
  path: "/guides/net-wpm-vs-gross-wpm",
});

const PUBLISHED = "2026-09-24";
const UPDATED = "2026-09-24";

const WORKED_EXAMPLES = [
  {
    duration: "30-second test",
    typed: "150 characters typed, 3 incorrect",
    minutes: "0.5 min",
    gross: "(150 ÷ 5) ÷ 0.5 = 60 WPM",
    net: "(147 ÷ 5) ÷ 0.5 = 58.8 → 59 WPM",
  },
  {
    duration: "1-minute test",
    typed: "250 characters typed, 5 incorrect",
    minutes: "1 min",
    gross: "(250 ÷ 5) ÷ 1 = 50 WPM",
    net: "(245 ÷ 5) ÷ 1 = 49 WPM",
  },
  {
    duration: "2-minute test",
    typed: "480 characters typed, 10 incorrect",
    minutes: "2 min",
    gross: "(480 ÷ 5) ÷ 2 = 48 WPM",
    net: "(470 ÷ 5) ÷ 2 = 47 WPM",
  },
  {
    duration: "5-minute test",
    typed: "1150 characters typed, 20 incorrect",
    minutes: "5 min",
    gross: "(1150 ÷ 5) ÷ 5 = 46 WPM",
    net: "(1130 ÷ 5) ÷ 5 = 45.2 → 45 WPM",
  },
];

const FAQ_ITEMS = [
  {
    question: "Does WPM include spaces?",
    answer:
      "Yes. A \"word\" in every WPM formula is a standardized 5-character unit, not a dictionary word — and that unit is counted from total characters typed, including spaces and punctuation. This is why WPM formulas divide by 5 in the first place: it normalizes long and short words to a comparable rate.",
    plainAnswer:
      "Yes — WPM uses a standardized 5-character \"word\" unit counted from total characters typed, including spaces and punctuation.",
  },
  {
    question: "Why does my WPM change every time I take the same test?",
    answer:
      "Small run-to-run variation is normal — reaction time, momentary hesitation, and even which random words appear all shift the result slightly. Look at a short streak of tests under the same conditions rather than any single score; a rising trend across several tests is more meaningful than one high or low outlier.",
    plainAnswer:
      "Small run-to-run variation is normal. Look at a streak of tests under the same conditions rather than any single score.",
  },
  {
    question: "What is CPM and how does it relate to WPM?",
    answer:
      "CPM (characters per minute) is the raw character-typing rate, before it's normalized into words. Since a \"word\" is standardized as 5 characters, CPM and WPM convert directly: WPM ≈ CPM ÷ 5, and CPM ≈ WPM × 5. CPM is more common in some data-entry and government typing tests, which is worth knowing if a job posting lists a CPM or KPH (keystrokes per hour) requirement instead of WPM.",
    plainAnswer:
      "CPM is the raw character rate before normalizing into 5-character words: WPM ≈ CPM ÷ 5, and CPM ≈ WPM × 5.",
  },
  {
    question: "Why do corrected mistakes still sometimes lower my WPM?",
    answer:
      "It depends on the formula a site uses. Some count every keystroke you made, including ones you later deleted, toward your total typing time even if the final text is correct — so a mistake you fixed still cost you the seconds it took to notice and correct it, even though the character itself doesn't appear in your final error count.",
    plainAnswer:
      "It depends on the formula. Some sites count the time spent on a keystroke you later deleted, even though the final corrected character doesn't appear as an error.",
  },
];

export default function NetVsGrossWpmPage() {
  const schema = buildArticleSchema({
    headline: "How Is WPM Calculated? Formula, Net vs. Gross, Worked Examples",
    description:
      "The exact WPM formula, worked examples, and why two typing sites can score the identical run differently.",
    path: "/guides/net-wpm-vs-gross-wpm",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="How Is WPM Calculated?"
        subtitle="The exact formula, worked examples, and why the same run can score differently on two different sites."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "How Is WPM Calculated?", path: "/guides/net-wpm-vs-gross-wpm" },
        ]}
        toc={[
          { id: "the-formula", label: "The formula" },
          { id: "not-just-one", label: "There isn’t just one formula" },
          { id: "worked-examples", label: "Worked examples by duration" },
          { id: "cpm", label: "CPM: the other unit" },
          { id: "the-gap", label: "Why the gap is worth watching" },
          { id: "which-to-trust", label: "Which one should you trust?" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Quick answer">
          <p>
            WPM = (characters typed ÷ 5) ÷ minutes elapsed. A &ldquo;word&rdquo; is a standardized
            5-character unit, not a real dictionary word. <strong>Gross WPM</strong> counts every
            character you typed, mistakes included. <strong>Net WPM</strong> counts only what you
            got right, and is the number that actually reflects what you can type — it&apos;s
            what {SITE_NAME} and most typing tests lead with.
          </p>
        </Callout>

        <p>
          Two typing sites can score the identical run differently, and it&apos;s rarely because
          one of them is wrong — they&apos;re usually just answering a different question, or
          using a different formula for the same question. Below is the exact math, worked
          examples at four common test lengths, and the real reason WPM numbers disagree between
          sites.
        </p>

        <h2 id="the-formula">The formula</h2>
        <Image
          src="/guides/typing-tests-tools/net-wpm-vs-gross-wpm/wpm-formula-gross-vs-net.webp"
          alt="Side-by-side comparison of the gross WPM formula and the net WPM formula"
          width={1448}
          height={1086}
          className="w-full rounded-xl border border-border"
        />
        <Callout label="Gross (raw) WPM">
          <p className="font-mono text-sm text-foreground">
            Gross WPM = (all characters typed ÷ 5) ÷ minutes elapsed
          </p>
          <p>
            Every keystroke counts, correct or not. This answers &ldquo;how fast were your hands
            moving,&rdquo; full stop — a run full of mistakes and a flawless run at the same
            physical pace report the same gross WPM.
          </p>
        </Callout>
        <Callout label="Net WPM">
          <p className="font-mono text-sm text-foreground">
            Net WPM = (correct characters only ÷ 5) ÷ minutes elapsed
          </p>
          <p>
            Only characters you typed correctly are counted — mistakes, including ones you never
            went back to fix, simply aren&apos;t counted toward your speed. This is the formula{" "}
            {SITE_NAME} uses everywhere: the main <Link href="/">typing test</Link>, every lesson
            result, and every game.
          </p>
        </Callout>

        <h2 id="not-just-one">There isn&apos;t just one &ldquo;net WPM&rdquo; formula</h2>
        <p>
          This is the part most typing-speed pages skip, and it&apos;s the real reason two
          legitimate sites can disagree even when both claim to report &ldquo;net WPM&rdquo;:
          there are two different formulas in common use, and they don&apos;t always agree.
        </p>
        <ul>
          <li>
            <strong>Correct-characters-only (what {SITE_NAME} uses):</strong> divide only the
            characters you got right by 5, then by minutes. Mistakes are simply excluded from the
            count.
          </li>
          <li>
            <strong>Gross-minus-error-penalty:</strong> calculate gross WPM first, then subtract
            (errors ÷ minutes) as a flat penalty. This is common on employment and certification
            tests.
          </li>
        </ul>
        <p>
          These can produce different results for the exact same run. Take a 1-minute test with
          500 characters typed and 5 uncorrected errors: gross WPM is (500 ÷ 5) ÷ 1 = 100.
          Correct-characters-only net WPM is (495 ÷ 5) ÷ 1 = 99. Gross-minus-penalty net WPM is
          100 − (5 ÷ 1) = 95. Same test, same typing, two different &ldquo;net&rdquo; scores —
          neither is wrong, they&apos;re just different formulas answering slightly different
          questions.
        </p>

        <h2 id="worked-examples">Worked examples by test duration</h2>
        <p>Using {SITE_NAME}&apos;s correct-characters-only formula throughout:</p>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Test</th>
              <th className="py-2 pr-4 font-medium text-foreground">Result</th>
              <th className="py-2 pr-4 font-medium text-foreground">Gross WPM</th>
              <th className="py-2 font-medium text-foreground">Net WPM</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {WORKED_EXAMPLES.map((row) => (
              <tr key={row.duration}>
                <td className="py-2 pr-4 whitespace-nowrap font-medium text-foreground">{row.duration}</td>
                <td className="py-2 pr-4">{row.typed}</td>
                <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap">{row.gross}</td>
                <td className="py-2 font-mono text-xs whitespace-nowrap">{row.net}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="cpm">CPM: the other common unit</h2>
        <p>
          Some tests — especially data-entry and government exams — report CPM (characters per
          minute) or KPH (keystrokes per hour) instead of WPM. Since a &ldquo;word&rdquo; is
          standardized at 5 characters, the conversion is direct: <code>WPM ≈ CPM ÷ 5</code> and{" "}
          <code>CPM ≈ WPM × 5</code>. KPH is simply CPM × 60, so <code>KPH ≈ WPM × 300</code>. See{" "}
          <Link href="/guides/data-entry-typing-test">the data entry typing test guide</Link> for
          how these show up in real job listings.
        </p>

        <h2 id="the-gap">Why the gross/net gap is worth watching</h2>
        <p>
          The distance between your gross and net WPM is a more honest signal than either number
          alone. A small, consistent gap means your hand speed and your accuracy are roughly
          matched — you&apos;re not leaving speed on the table by making avoidable mistakes. A
          large gap means your hands are moving faster than your accuracy can back up, and the fix
          isn&apos;t typing faster — it&apos;s{" "}
          <Link href="/guides/how-to-improve-typing-speed">slowing down until the gap closes</Link>,
          which almost always raises net WPM within a few sessions.
        </p>

        <h2 id="which-to-trust">Which one should you trust?</h2>
        <p>
          For almost every real use — writing an email, taking notes, chatting — net WPM is the
          number that describes what you can actually do, because a typo you have to notice and
          fix costs real time gross WPM doesn&apos;t account for. Gross WPM is mainly useful as a
          ceiling: it&apos;s roughly the net WPM you could reach if your accuracy caught up to
          your hand speed. If you want to know where either number should reasonably sit,{" "}
          <Link href="/guides/average-typing-speed">what is a good typing speed</Link> has real
          ranges instead of one made-up target.
        </p>

        <p>
          Curious what your own gap looks like? <Link href="/">Take a typing test</Link> — the
          results screen shows both numbers side by side, not just one. Already have raw numbers
          from a test and just want the math done for you? Use the{" "}
          <Link href="/guides/wpm-cpm-kph-calculator">WPM, CPM &amp; KPH calculator</Link>.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label: "Typing.com — How WPM and accuracy are calculated",
              href: "https://support.typing.com/en/articles/9048321",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

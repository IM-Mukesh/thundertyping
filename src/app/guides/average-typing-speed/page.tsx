import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { SourceList } from "@/components/content/source-list";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = pageMetadata({
  title: "Average Typing Speed: What Is a Good WPM?",
  description:
    "Average typing speed explained with honest WPM ranges by skill level and context, plus 20–120 WPM benchmarks, accuracy guidance, and a real test.",
  path: "/guides/average-typing-speed",
});

const PUBLISHED = "2026-09-15";
const UPDATED = "October 5, 2026";

const LEVELS = [
  { label: "Beginner", range: "Under 20 WPM", note: "Still locating keys; hunt-and-peck or very early touch typing." },
  { label: "Developing", range: "20–35 WPM", note: "Home row is familiar; full keyboard still requires some looking." },
  { label: "Intermediate", range: "35–50 WPM", note: "Comfortable everyday typing — most casual and office typists land here." },
  { label: "Proficient", range: "50–70 WPM", note: "Fast enough that typing rarely bottlenecks writing speed." },
  { label: "Advanced", range: "70–100 WPM", note: "Professional-level — data entry, transcription, career typists." },
  { label: "Competitive", range: "100+ WPM", note: "Top percentile; typing-competition and speed-test leaderboard territory." },
];

const IS_X_GOOD: { wpm: string; verdict: string }[] = [
  { wpm: "Is 20 WPM good?", verdict: "A normal early-learning pace, but slow for everyday adult typing. Treat it as a baseline while you build key familiarity and accurate finger paths." },
  { wpm: "Is 30 WPM good?", verdict: "A usable beginner-to-developing speed. You can handle short messages and simple work, but visual searching or corrections may still interrupt the flow." },
  { wpm: "Is 40 WPM good?", verdict: "Solidly average for casual and general office typing — comfortable for everyday writing and messaging, below professional data-entry benchmarks." },
  { wpm: "Is 50 WPM good?", verdict: "Above the general average and squarely typical for an experienced office worker; typing stops being the bottleneck for most writing tasks." },
  { wpm: "Is 60 WPM good?", verdict: "A strong, professional-level speed — meets or exceeds most entry-level data-entry and administrative job requirements." },
  { wpm: "Is 70 WPM good?", verdict: "Fast for sustained ordinary typing. At this level, accuracy and consistency usually matter more than trying to force another short-burst peak." },
  { wpm: "Is 80 WPM good?", verdict: "Genuinely fast — in the range of experienced transcriptionists and career typists, well above the vast majority of typists." },
  { wpm: "Is 90 WPM good?", verdict: "Exceptional for everyday typing and a demanding sustained pace. Compare it with accuracy and test length before calling it your baseline." },
  { wpm: "Is 100 WPM good?", verdict: "Elite for sustained typing — approaching the fastest individuals in large-scale studies, and a realistic ceiling for most people only with dedicated practice." },
  { wpm: "Is 120 WPM good?", verdict: "Outstanding. It is closer to competitive or highly trained performance than an ordinary workplace expectation, especially when held with high accuracy." },
];

const CONTEXT_TABLE = [
  { context: "General population, casual typing", range: "30–45" },
  { context: "Average office / knowledge worker", range: "40–65" },
  { context: "Professional typist / data entry", range: "60–80" },
  { context: "Programmer (sustained, real code)", range: "40–70" },
  { context: "Transcriptionist / court reporter", range: "75–100+" },
  { context: "Competitive typist (top percentile)", range: "120–150+" },
];

const FAQ_ITEMS = [
  {
    question: "What is a good typing speed overall?",
    answer:
      "For everyday use, 40–65 WPM is a comfortable, widely-typical range for adults who type regularly. The largest keystroke study to date (168,000 volunteers, 136 million keystrokes) found an average of 52 WPM — a genuinely useful reference point, though real-world \"good\" still depends heavily on what you're comparing it to.",
    plainAnswer:
      "For everyday use, 40–65 WPM is typical. The largest keystroke study to date found an average of 52 WPM across 168,000 volunteers.",
  },
  {
    question: "Does a good typing speed include accuracy?",
    answer:
      "It should. A high WPM with frequent uncorrected errors isn't actually a fast typist — it's a fast typist of wrong text. Most typing tests, including HeroTyping's, report net WPM (which already subtracts errors) specifically so the number reflects usable output, not raw hand speed.",
    plainAnswer:
      "Yes — a high WPM with frequent errors isn't genuinely fast. Net WPM, which subtracts errors, is the more meaningful number.",
  },
  {
    question: "Why does my typing speed vary between different tests and sites?",
    answer:
      "Test length, text difficulty, and whether a site reports gross or net WPM all change the number for the exact same underlying skill. See net WPM vs. gross WPM for the full breakdown of why two legitimate tests can disagree.",
    plainAnswer:
      "Test length, text difficulty, and whether a site reports gross or net WPM all change the number for the same underlying skill.",
  },
  {
    question: "Is typing speed more important than accuracy?",
    answer:
      "No — accuracy is the better predictor of real-world usefulness. A typist who is fast but constantly correcting mistakes usually produces finished text slower than a more accurate typist at a moderate pace, once correction time is counted.",
    plainAnswer:
      "No — accuracy is the better predictor of real-world usefulness, since correcting mistakes costs more time than moderate extra speed saves.",
  },
];

export default function AverageTypingSpeedPage() {
  const schema = buildArticleSchema({
    headline: "Average Typing Speed: What Is a Good WPM?",
    description:
      "What counts as a good typing speed, by skill level and by context, with sourced ranges instead of one made-up number.",
    path: "/guides/average-typing-speed",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <GuideLayout
        title="Average Typing Speed: What Is a Good WPM?"
        subtitle="&ldquo;Good&rdquo; depends entirely on what you're comparing it to — here are honest ranges, not a certificate."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Average Typing Speed", path: "/guides/average-typing-speed" },
        ]}
        toc={[
          { id: "by-skill-level", label: "By skill level" },
          { id: "is-my-wpm-good", label: "“Is my WPM good?”" },
          { id: "by-context", label: "By context" },
          { id: "by-age", label: "By age and learning stage" },
          { id: "largest-study", label: "What the largest typing study found" },
          { id: "programmers", label: "Why programmers type “slower”" },
          { id: "accuracy", label: "Accuracy matters as much as the number" },
          { id: "why-vary", label: "Why these numbers vary" },
          { id: "what-matters", label: "What actually matters more" },
          { id: "test-yourself", label: "Test yourself" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Quick answer">
          <p>
            For general adult typing, <strong>40–65 WPM</strong> is a useful orientation range, and a
            large 2018 keystroke study measured an average of <strong>52 WPM</strong> across 168,000
            volunteers. Above 70 WPM is genuinely fast; above 100 WPM is elite. But the single
            number matters less than accuracy alongside it — a fast, error-prone typist is
            usually slower in practice than an accurate, moderate one.
          </p>
        </Callout>

        <p>
          &ldquo;What&apos;s a good WPM?&rdquo; doesn&apos;t have one honest answer — it depends
          entirely on who you&apos;re comparing yourself to. A number that&apos;s impressive for
          casual typing is unremarkable for a professional data-entry role, and competitive
          typists operate in a range that would be a career-defining skill anywhere else. The
          ranges below are practical, commonly-cited bands, not a universal scientific standard.
        </p>

        <h2 id="by-skill-level">By skill level</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Level</th>
              <th className="py-2 pr-4 font-medium text-foreground">WPM range</th>
              <th className="py-2 font-medium text-foreground">What it looks like</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {LEVELS.map((row) => (
              <tr key={row.label}>
                <td className="py-2 pr-4 font-medium text-foreground">{row.label}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{row.range}</td>
                <td className="py-2">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-sub/80">
          These are practical ranges for orientation, not a scientific classification — real
          typists overlap between adjacent bands constantly.
        </p>

        <h2 id="is-my-wpm-good">&ldquo;Is my WPM good?&rdquo;</h2>
        <div className="flex flex-col gap-3">
          {IS_X_GOOD.map((row) => (
            <div key={row.wpm} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="text-sm font-medium text-foreground">{row.wpm}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{row.verdict}</p>
            </div>
          ))}
        </div>

        <h2 id="by-context">By context</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Context</th>
              <th className="py-2 font-medium text-foreground">Typical range (WPM)</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {CONTEXT_TABLE.map((row) => (
              <tr key={row.context}>
                <td className="py-2 pr-4">{row.context}</td>
                <td className="py-2">{row.range}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          These are broad, widely-cited bands rather than results from a single controlled study
          — typing-speed research uses inconsistent test lengths, text difficulty, and error
          penalties, so exact figures vary by source. Use them as a rough compass, not a
          leaderboard. Looking for specific hiring benchmarks? See{" "}
          <Link href="/guides/data-entry-typing-test">the data entry typing test guide</Link> or our{" "}
          <Link href="/guides/911-dispatcher-typing-test">911 dispatcher typing test guide</Link> for emergency communications standards.
        </p>

        <h2 id="by-age">By age and learning stage</h2>
        <p>
          Age is a poor standalone predictor of typing speed. Keyboard access, previous instruction,
          language, motor development, and the type of text being tested all matter. For classroom
          planning, published grade-level guidance is more useful than pretending there is one
          population average for every eight-year-old or every adult. Our separate{" "}
          <Link href="/guides/typing-speed-by-age">typing speed by age guide</Link> keeps those
          educational bands and their limitations together.
        </p>
        <div className="grid gap-3 sm:grid-cols-3" aria-label="Typing speed comparison by learning stage">
          {[
            ["Learning", "Under 20 WPM", "Key location and accuracy are still the main goal."],
            ["Everyday", "40–65 WPM", "A practical range for regular adult prose typing."],
            ["Professional", "70+ WPM", "Fast sustained output, provided accuracy remains high."],
          ].map(([label, range, note]) => (
            <div key={label} className="rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">{label}</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{range}</p>
              <p className="mt-1 text-xs leading-relaxed text-sub">{note}</p>
            </div>
          ))}
        </div>

        <h2 id="largest-study">What the largest typing study found</h2>
        <p>
          In 2018, researchers from Aalto University and Cambridge published a large typing study:
          136 million keystrokes from 168,000 volunteers typing randomized sentences online. The
          reported average was <strong>52 WPM</strong>, and the fastest users in the study reached
          about <strong>120 WPM</strong>. It is useful evidence, not a universal population norm:
          participants volunteered for an online test, and the task measured transcription rather
          than composing original prose. See the sources below for the study and methodology.
        </p>

        <h2 id="programmers">Why programmers often type &ldquo;slower&rdquo; than expected</h2>
        <p>
          Programmer WPM looks low next to office-worker WPM, and that&apos;s not a skill gap —
          it&apos;s a different task. Code isn&apos;t prose: it&apos;s dense with punctuation,
          symbols, and pauses to think about what to write next, all of which a raw-prose WPM
          test doesn&apos;t measure. A programmer who tests at 55 WPM on plain text may still type
          code faster, in practical terms, than someone who tests higher but hesitates constantly
          over unfamiliar symbols and indentation.
        </p>

        <h2 id="accuracy">Accuracy matters as much as the number</h2>
        <p>
          A WPM score without its accuracy is only half the picture. Two typists at 60 WPM are not
          equally skilled if one holds 98% accuracy and the other holds 88% — the second one is
          spending real time on corrections that the raw number doesn&apos;t show. {SITE_NAME}{" "}
          reports accuracy and consistency alongside WPM on every results screen for this reason.
          Read <Link href="/guides/typing-accuracy">what the accuracy percentage means</Link> and
          then use <Link href="/guides/how-to-improve-typing-accuracy">the accuracy training guide</Link>{" "}
          if your score is lagging behind your speed.
        </p>

        <h2 id="why-vary">Why these numbers vary so much between sources</h2>
        <ul>
          <li>
            <strong>Test length.</strong> Short bursts (15&ndash;30s) tend to read higher than
            sustained multi-minute tests, since fatigue and error-correction haven&apos;t caught
            up yet. See <Link href="/guides/typing-test-duration-guide">which test duration to use</Link>.
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
            <Link href="/guides/net-wpm-vs-gross-wpm">how WPM is calculated</Link> for the full
            breakdown.
          </li>
        </ul>

        <h2 id="what-matters">What actually matters more than the number</h2>
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

        <h2 id="test-yourself">Test yourself</h2>
        <p>
          Numbers on a page are easy to skim past. <Link href="/">Take a typing test</Link> under
          the same conditions a few times (same duration, similar text type) before comparing
          your result to any of the ranges above — a single test tells you less than a short
          streak of them. Still building up to these ranges?{" "}
          <Link href="/lessons">Typing lessons</Link> start from the home row, and{" "}
          <Link href="/games">typing games</Link> keep practice time from feeling like a chore.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
            label:
              "Dhakal, Feit, Kristensson & Oulasvirta — \"Observations on Typing from 136 Million Keystrokes on a Website\" (Aalto University / CHI 2018)",
            href: "https://userinterfaces.aalto.fi/136Mkeystrokes/",
          },
          {
            label: "University of Cambridge — What makes a faster typist? (summary of the 136-million-keystroke study)",
            href: "https://www.cam.ac.uk/research/news/what-makes-a-faster-typist",
          },
        ]}
        />

        <p className="text-xs text-sub/70">Last reviewed {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

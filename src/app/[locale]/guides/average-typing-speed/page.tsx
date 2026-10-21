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
  title: "Average Typing Speed: What is a Good WPM?",
  description:
    "Explore average typing speed benchmarks (52 WPM study mean), workplace expectations across common roles, and why accuracy matters more than raw speed.",
  path: "/guides/average-typing-speed",
});

const PUBLISHED = "2026-09-15";
const UPDATED = "2026-10-20";

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
      "For everyday writing, 40–65 WPM is a comfortable, typical range for adults who type regularly. An extensive study by Dhakal et al. (ACM CHI 2018) of 168,000 online volunteers found an observed sample mean of 52 WPM in a sentence-copying task. While motivated online test-takers often type slightly faster than the general population, it serves as a reliable benchmark. What counts as 'good' ultimately depends on your specific role and accuracy.",
    plainAnswer:
      "For everyday writing, 40–65 WPM is typical. The 2018 Dhakal et al. keystroke study found an observed mean of 52 WPM across 168,000 online test-takers.",
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
    dateModified: UPDATED,
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
            For regular adult typing, <strong>40–65 WPM</strong> is a practical orientation range. The
            largest empirical keystroke study (Dhakal et al., 2018) recorded a sample mean of <strong>52 WPM</strong> across
            168,000 online test-takers performing sentence transcription, though broader general-population averages
            often sit closer to 35–45 WPM. Above 70 WPM is genuinely fast for continuous typing; above 100 WPM
            is competitive. Crucially, speed without accuracy is counterproductive — a steady 50 WPM typist at 98% accuracy
            outproduces an erratic 70 WPM typist who has to fix constant mistakes.
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
          These figures—including the commonly cited ranges of <strong>40–55 WPM</strong> for general
          office work, <strong>60–80 WPM</strong> for specialized data entry or medical transcription, and{" "}
          <strong>90+ WPM</strong> for advanced or competitive typists—are practical industry orientation
          benchmarks, not universal hiring guarantees. Employment requirements vary substantially by
          organization, assessment platform, and error penalties. For detailed role requirements, see{" "}
          <Link href="/guides/data-entry-typing-test">the data entry typing test guide</Link> or our{" "}
          <Link href="/guides/911-dispatcher-typing-test">911 dispatcher typing test guide</Link>.
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
            ["Professional", "60–90 WPM", "Cambridge typing evaluations observe that professionally trained typists typically sustain 60–90 WPM."],
          ].map(([label, range, note]) => (
            <div key={label} className="rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">{label}</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{range}</p>
              <p className="mt-1 text-xs leading-relaxed text-sub">{note}</p>
            </div>
          ))}
        </div>

        <h2 id="largest-study">What the largest typing study found (and its limitations)</h2>
        <p>
          In 2018, researchers Vivek Dhakal, Anna Feit, Per Ola Kristensson, and Antti Oulasvirta
          (Aalto University and the University of Cambridge) published{" "}
          <em>Observations on Typing from 136 Million Keystrokes on a Website</em> at the ACM CHI Conference.
          Analyzing keystroke logs from 168,000 unconstrained volunteers across more than 200 countries
          on TypingMaster (typingmaster.com), the researchers observed a sample mean speed of{" "}
          <strong>51.6 WPM</strong> (commonly rounded to ~52 WPM) with an average uncorrected error rate of 1.5%.
        </p>
        <p>
          While this provides one of the largest empirical datasets on keyboard dynamics, interpreting
          the findings requires understanding the study&apos;s methodology and population constraints:
        </p>
        <ul className="space-y-2 text-sm leading-relaxed text-sub">
          <li>
            <strong className="text-foreground">Volunteer Self-Selection:</strong> Participants voluntarily took an online test.
            Self-selected online test-takers skew toward individuals with higher computer usage, keyboard familiarity,
            and personal interest in testing their speed. Casual general-population typing averages across all computer
            users are widely estimated closer to 35–45 WPM.
          </li>
          <li>
            <strong className="text-foreground">Task Type (Sentence Transcription):</strong> The test measured sentence
            copying from screen prompts. This is a transcription task, which differs substantially from spontaneous
            composition (drafting emails or essays), technical coding, or numeric entry where planning and cognitive pauses
            dominate total time.
          </li>
          <li>
            <strong className="text-foreground">Study Cohort Percentiles:</strong> Within this online volunteer group,
            the median (50th percentile) was approximately 52 WPM, the 75th percentile was approximately 65 WPM, and the 95th
            percentile reached approximately 90+ WPM. These percentiles describe this specific testing sample rather than
            a universal global census.
          </li>
          <li>
            <strong className="text-foreground">Rollover &amp; Technique:</strong> The study found that rollover typing
            (initiating a keystroke before releasing the previous key) was the strongest mechanical factor in high speed.
            Interestingly, strict 10-finger touch typing was not required to achieve fast speeds—many participants achieved
            60–80+ WPM using adaptive 6-to-8 finger techniques with consistent key mapping.
          </li>
        </ul>

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
            up yet. See <Link href="/guides/typing-test-duration-guide">which test duration to use</Link>{" "}
            or compare your endurance across our dedicated{" "}
            <Link href="/typing-test/30-seconds">30-second</Link>,{" "}
            <Link href="/typing-test/1-minute">1-minute</Link>,{" "}
            <Link href="/typing-test/3-minute">3-minute</Link>, and{" "}
            <Link href="/typing-test/5-minute">5-minute typing tests</Link>.
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
          Numbers on a page are easy to skim past. <Link href="/typing-test/1-minute">Take a 1-minute typing test</Link> under
          the same conditions a few times (same duration, similar text type) before comparing
          your result to any of the ranges above — a single test tells you less than a short
          streak of them. You can also <Link href="/guides/wpm-cpm-kph-calculator">convert your WPM to CPM and KPH</Link> to check requirements for specific administrative roles.
        </p>
        <p>
          Still building up to these ranges?{" "}
          <Link href="/lessons">Typing lessons</Link> start from the home row, and{" "}
          <Link href="/games">typing games</Link> keep practice time from feeling like a chore.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label:
                "Dhakal, Feit, Kristensson & Oulasvirta — \"Observations on Typing from 136 Million Keystrokes on a Website\" (ACM CHI 2018, DOI: 10.1145/3173574.3174220)",
              href: "https://doi.org/10.1145/3173574.3174220",
            },
            {
              label:
                "Aalto University User Interfaces Group — 136 Million Keystrokes Project Overview & Publication Page",
              href: "https://userinterfaces.aalto.fi/136Mkeystrokes/",
            },
            {
              label: "University of Cambridge — What makes a faster typist? (Research news summary of the 136M study)",
              href: "https://www.cam.ac.uk/research/news/what-makes-a-faster-typist",
            },
          ]}
        />

        <p className="text-xs text-sub">Last reviewed {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

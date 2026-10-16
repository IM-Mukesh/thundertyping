import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { SourceList } from "@/components/content/source-list";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = pageMetadata({
  title: "English Typing Test & Practice Guide",
  description:
    "Complete guide to English typing tests: standard 5-character WPM calculation, word pool difficulty effects, punctuation reaches, and tiered practice passages.",
  path: "/guides/english-typing-test-and-practice",
});

const PUBLISHED = "2026-09-24";
const UPDATED = "2026-10-13";

const EXAMPLES = [
  {
    level: "Beginner (20–35 WPM Target)",
    note: "High-frequency Anglo-Saxon roots, short words, minimal punctuation.",
    text: "The sun was warm and the wind was soft. We sat by the calm blue lake and did not say a word for a long time while the birds sang in the trees.",
  },
  {
    level: "Intermediate (40–60 WPM Target)",
    note: "Mixed syllable counts, comma-linked clauses, capital letters, and standard prose cadence.",
    text: "Even though the morning meeting ran twenty minutes late, everyone stayed remarkably focused. By the time the presentation concluded, our quarterly development roadmap felt concrete instead of rushed.",
  },
  {
    level: "Advanced (65–90 WPM Target)",
    note: "Polysyllabic vocabulary, semicolons, em-dashes, numbers, and Latinate word roots.",
    text: "By 2031, the architectural committee's third legislative proposal — revised twice, and still fiercely debated — had accumulated 47 formal objections, yet none fundamentally undermined its core infrastructural premise.",
  },
  {
    level: "Technical & Coding Prose (Specialized Target)",
    note: "CamelCase identifiers, brackets, numeric constants, and symbolic syntax.",
    text: "export async function handleStreamPayload(req: Request, maxRetries = 3): Promise<StreamResponse> { const { sessionToken } = await parseAuthHeaders(req.headers); return initDispatcher({ token: sessionToken, timeoutMs: 4500 }); }",
  },
];

const SPEED_BENCHMARKS = [
  { tier: "Beginner", range: "20–35 WPM", context: "Hunt-and-peck typists or students beginning touch typing muscle memory." },
  { tier: "Average Adult", range: "40–45 WPM", context: "Standard everyday typing speed for casual computer users." },
  { tier: "Productive Office", range: "50–65 WPM", context: "Typical requirement for administrative, legal, customer support, and managerial roles." },
  { tier: "Advanced Touch Typist", range: "70–85 WPM", context: "Typists with full muscle memory, comfortable across numbers and punctuation." },
  { tier: "Expert / Competitive", range: "90–120+ WPM", context: "Top 2% of typists, software engineers, and transcription specialists." },
];

const FAQ_ITEMS = [
  {
    question: "What does an English typing test actually measure?",
    answer:
      "An English typing test measures transcription speed and accuracy under standardized conditions. It measures how quickly your brain perceives visual word units (orthographic mapping) and translates them into finger movements across home row, top row, and bottom row keys. Transcription speed is distinct from composition speed, because composition includes cognitive pauses for phrasing and brainstorming.",
    plainAnswer:
      "Transcription speed (WPM) and keystroke accuracy on standard English text, measured over a set countdown or word count.",
  },
  {
    question: "How is English WPM mathematically calculated?",
    answer:
      "In standard typing metrics, one 'word' is universally defined as exactly five keystrokes, including spaces and punctuation. Gross WPM is calculated as (Total Keystrokes / 5) / Minutes. Net WPM subtracts uncorrected errors: Net WPM = Gross WPM - (Uncorrected Errors / Minutes). This prevents short words like 'is' or 'a' from artificially distorting speed comparisons against longer words like 'extraordinary'.",
    plainAnswer:
      "One standard word equals 5 keystrokes. Gross WPM = (Keystrokes / 5) / Minutes. Net WPM subtracts error penalties per minute.",
  },
  {
    question: "Why do my WPM results vary dramatically across different typing sites?",
    answer:
      "Test results vary because of three factors: word pool composition, test duration, and scoring rules. Sites using restricted high-frequency word pools (such as the top 200 words) frequently yield noticeably higher speed scores than tests drawing from natural literature, technical prose, or news articles with irregular syllable lengths and punctuation hurdles. Furthermore, 15-second sprint tests typically read higher than 60-second or 5-minute tests where finger fatigue and focus stamina play a role.",
    plainAnswer:
      "Differences in word pool difficulty (common 200 words vs. natural prose), test length, and whether gross or net WPM is calculated.",
  },
  {
    question: "How can I improve my English typing speed from 40 to 70 WPM?",
    answer:
      "To break through the 40–50 WPM plateau: 1) Stop looking down at the keyboard entirely to force cerebellar muscle memory; 2) Use opposite-hand Shift keying for capital letters; 3) Prioritize 96%+ accuracy over raw speed, as backspacing destroys rhythm; 4) Train weak keys identified by diagnostic tools; and 5) Practice high-frequency English bigrams and trigrams (th, he, in, er, an, re, nd, on).",
    plainAnswer:
      "Commit to blind touch typing, use opposite-hand Shift keys, stabilize 96%+ accuracy, and practice 15 minutes daily on natural prose.",
  },
];

export default function EnglishTypingTestPage() {
  const schema = buildArticleSchema({
    headline: "English Typing Test & Practice: What It Measures, Formulas & Drills",
    description:
      "Comprehensive guide to English typing tests: standard 5-character WPM calculation, word pool difficulty effects, punctuation reaches, and tiered practice passages.",
    path: "/guides/english-typing-test-and-practice",
    datePublished: PUBLISHED,
    inLanguage: "en",
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        lang="en"
        title="English Typing Test & Practice"
        subtitle="The definitive guide to English typing tests: standardized 5-keystroke metrics, word frequency mechanics, punctuation hurdles, and structured practice routines."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "English Typing Test & Practice", path: "/guides/english-typing-test-and-practice" },
        ]}
        toc={[
          { id: "what-it-measures", label: "What it measures" },
          { id: "wpm-formula", label: "The 5-keystroke formula" },
          { id: "benchmarks", label: "Speed benchmarks" },
          { id: "word-pools-vs-prose", label: "Word pools vs. real prose" },
          { id: "punctuation-and-shift", label: "Punctuation & Shift mechanics" },
          { id: "practice-passages", label: "Tiered practice passages" },
          { id: "deliberate-practice", label: "Deliberate practice roadmap" },
        ]}
        hasFaq
      >
        <Callout label="Core Summary">
          <p>
            An English typing test measures your ability to transcribe standard prose into digital text accurately and swiftly.
            Standard typing speed is calculated using the five-character word formula (including spaces and punctuation).
            Scores earned on simplified 200-word pools do not reflect real-world writing speed; true proficiency requires practicing
            natural prose, capital letters, and punctuation.
          </p>
        </Callout>

        <p>
          Whether preparing for a professional certification, a coding interview, an administrative employment exam,
          or personal productivity, the English typing test remains the universal benchmark of digital fluency.
          However, understanding what your score actually represents—and how to intentionally improve it—requires looking
          beyond simple speed numbers.
        </p>

        <h2 id="what-it-measures">What an English typing test measures</h2>
        <p>
          High-performance typing platforms like {SITE_NAME} measure three distinct dimensions of motor and cognitive execution:
        </p>
        <ul>
          <li>
            <strong>Speed (WPM & CPM):</strong> Words Per Minute (WPM) and Characters Per Minute (CPM) measure raw throughput.
            In English, CPM divided by 5 yields standard WPM. Learn the full distinction in our{" "}
            <Link href="/guides/net-wpm-vs-gross-wpm">Net WPM vs. Gross WPM guide</Link>.
          </li>
          <li>
            <strong>Keystroke Accuracy (%):</strong> The percentage of total submitted keystrokes that were correct on the first attempt.
            Accuracy below 95% indicates that the typist is rushing ahead of motor control, forcing frequent backspaces that severely penalize net output.
          </li>
          <li>
            <strong>Pacing Consistency (%):</strong> The mathematical variance in inter-keystroke intervals (IKIs). A smooth, rhythmic pace
            of 60 WPM causes far less physical strain and error bursts than an erratic typist alternating between 90 WPM surges and stalls.
          </li>
        </ul>

        <h2 id="wpm-formula">The 5-keystroke standard word formula</h2>
        <p>
          Because words in English vary from one letter (&ldquo;a&rdquo;, &ldquo;I&rdquo;) to over a dozen (&ldquo;infrastructure&rdquo;,
          &ldquo;unquestionably&rdquo;), typing tests cannot simply count spaces. Instead, the international standard defines:
        </p>
        <div className="rounded-xl border border-border bg-sub-alt/30 p-4 font-mono text-xs leading-relaxed sm:text-sm">
          <p className="font-semibold text-accent">Standard Formulas:</p>
          <p className="mt-1">Gross WPM = (Total Keystrokes / 5) / Elapsed Minutes</p>
          <p className="mt-1">Net WPM = Gross WPM - (Uncorrected Errors / Elapsed Minutes)</p>
          <p className="mt-1">Accuracy = (Correct Keystrokes / Total Keystrokes) &times; 100%</p>
        </div>
        <p className="mt-3">
          To convert dynamically between WPM, CPM, and data entry keystrokes per hour, use our{" "}
          <Link href="/guides/wpm-cpm-kph-calculator">live WPM & CPM calculator</Link>.
        </p>

        <h2 id="benchmarks">English typing speed benchmarks</h2>
        <p>
          How does your typing speed compare to standard populations? Based on large-scale educational and workplace assessments:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-sub font-mono uppercase">
                <th className="py-2.5 pr-4">Proficiency Tier</th>
                <th className="py-2.5 pr-4">Speed Range</th>
                <th className="py-2.5">Typical Application & Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {SPEED_BENCHMARKS.map((b) => (
                <tr key={b.tier} className="hover:bg-sub-alt/20">
                  <td className="py-2.5 pr-4 font-semibold text-foreground">{b.tier}</td>
                  <td className="py-2.5 pr-4 font-mono text-accent">{b.range}</td>
                  <td className="py-2.5 text-foreground/80">{b.context}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-sub">
          For demographic details across age groups and professions, see our detailed{" "}
          <Link href="/guides/average-typing-speed">Average Typing Speed benchmark guide</Link>.
        </p>

        <h2 id="word-pools-vs-prose">Word frequency pools vs. natural prose</h2>
        <p>
          A common pitfall in typing training is relying exclusively on artificial tests that loop through the &ldquo;English 200&rdquo;
          most frequent words (such as &ldquo;the&rdquo;, &ldquo;and&rdquo;, &ldquo;that&rdquo;, &ldquo;with&rdquo;). While excellent for
          initial beginner warmup, these pools create an illusion of speed:
        </p>
        <ul>
          <li>
            <strong>High-frequency words</strong> consist mostly of 3-to-5 letter alternating-hand patterns that can be memorized
            as entire motor chunks (chording).
          </li>
          <li>
            <strong>Real English prose</strong> includes irregular multisyllabic words, Latin and Greek roots, proper nouns, numbers,
            and punctuation that force your visual processing to scan ahead.
          </li>
          <li>
            Typists who achieve 90 WPM on 200-word pools often drop to 65 WPM when tested on standard journalistic or technical prose.
          </li>
        </ul>
        <p>
          To build real orthographic stamina, practice on HeroTyping&apos;s curated{" "}
          <Link href="/vocabulary">1,300-word vocabulary trainer</Link> with audio pronunciation definitions, or paste your own documents into
          the <Link href="/typing-test/custom-text">custom text typing test</Link>.
        </p>

        <h2 id="punctuation-and-shift">Punctuation & Shift mechanics</h2>
        <p>
          The most frequent cause of sudden stalls in English typing tests is the reach for punctuation marks and capital letters:
        </p>
        <ul>
          <li>
            <strong>The Opposite-Hand Shift Rule:</strong> Never press Shift and a letter key with the same hand. If the letter is on
            the left hand (e.g., &lsquo;A&rsquo;, &lsquo;E&rsquo;, &lsquo;T&rsquo;), hold the right Shift key with your right pinky. If the letter
            is on the right hand (e.g., &lsquo;O&rsquo;, &lsquo;P&rsquo;, &lsquo;L&rsquo;), use the left Shift. Same-hand shifting distorts your hand
            position and triggers immediate errors on the following letter.
          </li>
          <li>
            <strong>Punctuation Anchors:</strong> Periods and commas sit on the bottom row under your right ring and middle fingers.
            Practice downward curls without lifting your palm off the desk. Review our{" "}
            <Link href="/guides/punctuation-typing-practice">punctuation typing guide</Link> for targeted drills.
          </li>
        </ul>

        <h2 id="practice-passages">Tiered practice passages by level</h2>
        <p>
          Read through these curated passages to evaluate the structural differences between beginner, intermediate, advanced,
          and technical text:
        </p>
        <div className="flex flex-col gap-3.5">
          {EXAMPLES.map((example) => (
            <div key={example.level} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {example.level}
              </p>
              <p className="mt-1 text-xs text-sub/80">{example.note}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground font-mono bg-bg/50 p-2.5 rounded-lg border border-border/40">
                {example.text}
              </p>
            </div>
          ))}
        </div>

        <h2 id="deliberate-practice">Deliberate practice roadmap</h2>
        <p>
          Don&apos;t just repeat tests passively. Apply structured motor learning principles:
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-foreground/90">
          <li>
            <strong>Warm Up with Physical Stretches:</strong> Complete 60 seconds of tendon-glide and extensor stretches before typing
            (see <Link href="/guides/typing-stretches-and-hand-warmups">typing stretches guide</Link>).
          </li>
          <li>
            <strong>Isolate Difficult Keys:</strong> Use our <Link href="/practice/weak-keys">Weak-Key Practice Lab</Link> to eliminate
            hesitation on specific fingers (especially pinkies and ring fingers).
          </li>
          <li>
            <strong>Set Pace Carets:</strong> Enable the ghost caret on the <Link href="/">HeroTyping test engine</Link> at 5 WPM above
            your current baseline to encourage forward visual scanning without rushing.
          </li>
          <li>
            <strong>Benchmark Weekly:</strong> Take a standardized{" "}
            <Link href="/typing-test/1-minute">1-minute typing test</Link> once per week under quiet conditions to track authentic gains.
          </li>
        </ol>

        <h2 id="multilingual-typing-guides">International &amp; Multilingual Typing Guides</h2>
        <p>
          HeroTyping supports native international keyboard layouts and scripts. Explore our dedicated language guides:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4">
          <Link
            href="/guides/spanish-typing-test-and-practice"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">Spanish (Español)</div>
            <div className="text-xs text-sub mt-1">ISO Spanish layout, tilde accents (á, é, í, ó, ú), and inverted marks (¿, ¡).</div>
          </Link>
          <Link
            href="/guides/german-typing-test-and-practice"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">German (Deutsch)</div>
            <div className="text-xs text-sub mt-1">QWERTZ layout, umlauts (ä, ö, ü), and Eszett (ß) 10-finger placement.</div>
          </Link>
          <Link
            href="/guides/portuguese-typing-test-and-practice"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">Portuguese (Português)</div>
            <div className="text-xs text-sub mt-1">ABNT2 Brazilian and Portuguese layouts, dedicated ç key, and dead-key tildes.</div>
          </Link>
          <Link
            href="/guides/hindi-typing-test-and-practice"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground">Hindi (हिन्दी)</div>
            <div className="text-xs text-sub mt-1">InScript &amp; Remington layouts, Devanagari Unicode graphemes, and halant conjuncts.</div>
          </Link>
          <Link
            href="/guides/chinese-typing-test-and-practice"
            className="p-3.5 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block sm:col-span-2"
          >
            <div className="text-sm font-semibold text-foreground">Chinese (中文 - 拼音)</div>
            <div className="text-xs text-sub mt-1">Pinyin IME composition sessions, Quanpin vs. Shuangpin efficiency, and CPM speed standards.</div>
          </Link>
        </div>

        <FaqSection items={FAQ_ITEMS} />

        
        <SourceList
          sources={[
          {
                    "label": "ANSI INCITS 154-1988 — \"Office Machines and Supplies - Alphanumeric Machines - Keyboard Arrangement\" (American National Standards Institute)",
                    "href": "https://webstore.ansi.org/"
          },
          {
                    "label": "Dhakal, Feit, Kristensson & Oulasvirta — \"Observations on Typing from 136 Million Keystrokes on a Website\" (Aalto University / CHI 2018)",
                    "href": "https://userinterfaces.aalto.fi/136Mkeystrokes/"
          }
]}
        />

        <p className="text-xs text-sub">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

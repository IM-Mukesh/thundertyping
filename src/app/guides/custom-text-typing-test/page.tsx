import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { SourceList } from "@/components/content/source-list";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "How to Practice Typing With Your Own Text & Code: Custom Test Guide",
  description:
    "Learn how to practice typing your own custom text, code snippets, legal briefs, and study material. Formatting tips, workflow advice, and tool setup.",
  path: "/guides/custom-text-typing-test",
});

const PUBLISHED = "2026-09-27";

const USE_CASE_BENCHMARKS = [
  {
    profession: "Software Developers & Engineers",
    customContent: "Python functions, SQL queries, HTML/CSS tags, JavaScript arrow syntax",
    biomechanicalBenefit: "Builds specialized muscle memory for brackets, braces, camelCase, and underscores without looking.",
  },
  {
    profession: "Medical Scribes & Transcribers",
    customContent: "Pharmacological names, anatomical terms, clinical patient histories",
    biomechanicalBenefit: "Automates multi-syllabic Latinate roots and complex medical terminology.",
  },
  {
    profession: "Legal Assistants & Paralegals",
    customContent: "Statute citations, court filings, contractual clauses, legal definitions",
    biomechanicalBenefit: "Eliminates hesitation around formal formatting, section symbols, and archaic phrasing.",
  },
  {
    profession: "Students & Language Learners",
    customContent: "Lecture summaries, essay drafts, flashcard definitions, literature excerpts",
    biomechanicalBenefit: "Combines dual-coding memory retention: typing notes letter-by-letter reinforces active recall.",
  },
];

const FAQ_ITEMS = [
  {
    question: "How do I load my own text into HeroTyping?",
    answer:
      "Visit the dedicated Custom Text Typing Test (/typing-test/custom-text) or click 'Custom' on the homepage toolbar. A modal window will appear. Paste or type your desired text (up to 2,000 characters) into the box and click 'Apply Text'. The speed test will immediately load your custom content with live WPM and accuracy tracking.",
    plainAnswer:
      "Open the Custom Text Typing Test (/typing-test/custom-text) or click 'Custom' on the homepage toolbar, paste your text (up to 2,000 characters), and click 'Apply Text'.",
  },
  {
    question: "Does HeroTyping calculate Net WPM and accuracy accurately for custom text?",
    answer:
      "Yes. The typing engine applies the exact same standardized 5-characters-per-word Net WPM formula and accuracy calculations to custom text as it does to standard tests. Capital letters, numbers, and punctuation are scored with full fidelity.",
    plainAnswer:
      "Yes. Custom text uses the exact same rigorous Net WPM scoring formula as standard tests, including punctuation and capitalization.",
  },
  {
    question: "What happens if I paste text with newlines or tabs?",
    answer:
      "The custom text parser cleans and normalizes whitespace, converting line breaks and tabs into natural word breaks so you can type continuously without unexpected cursor traps.",
    plainAnswer:
      "Whitespace and newlines are cleanly normalized so your text flows seamlessly without formatting glitches.",
  },
  {
    question: "Why does typing code feel so much slower than typing normal English?",
    answer:
      "Standard English prose relies on predictable word chunks (like 'the', 'tion', 'ing'). Code syntax, by contrast, contains frequent non-alphabetic characters (like '{', '}', '=>', ';', '_') that require pinky reaches and dual Shift key presses, completely breaking standard English rhythm. Drilling code in Custom Mode is the fastest way to bridge this gap.",
    plainAnswer:
      "Code contains frequent brackets, symbols, and camelCase that interrupt standard English word flow. Drilling code in Custom Mode builds targeted syntax speed.",
  },
];

const SOURCES: never[] = [];

export default function CustomTextTypingTestPage() {
  const schema = buildArticleSchema({
    headline: "How to Practice Typing With Your Own Text & Code: Custom Test Guide",
    description:
      "Learn how to practice typing your own custom text, code snippets, legal briefs, and study material. Formatting tips, workflow advice, and tool setup.",
    path: "/guides/custom-text-typing-test",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="How to Practice Typing With Your Own Text & Code"
        subtitle="A practical guide to training with real-world material: programming syntax, medical notes, legal documents, or study excerpts."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Tests & Tools", path: "/guides/typing-tests-tools" },
          { name: "Custom Text Guide", path: "/guides/custom-text-typing-test" },
        ]}
        toc={[
          { id: "why-custom-text-matters", label: "Why custom text practice matters" },
          { id: "specialized-professions", label: "Domain-specific use cases" },
          { id: "how-to-use-custom-mode", label: "How to use Custom Mode in HeroTyping" },
          { id: "formatting-guidelines", label: "Text formatting best practices" },
          { id: "dual-coding-study-technique", label: "The dual-coding study method" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Interactive tool available">
          <p>
            Looking to start typing your passage immediately? Open our dedicated{" "}
            <Link href="/typing-test/custom-text" className="font-semibold text-accent underline underline-offset-4">
              Custom Text Typing Test
            </Link>{" "}
            tool to paste up to 2,000 characters and practice with instant keystroke scoring. Below is our comprehensive
            guide on structuring custom text drills, syntax practice, and study sessions.
          </p>
        </Callout>

        <Image
          src="/guides/typing-tests-tools/custom-text-typing-test/custom-text-typing-workflow.webp"
          alt="Custom text typing workflow showing pasting code, legal briefs, and medical terms into HeroTyping"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="why-custom-text-matters">Why Custom Text Practice Beats Generic Tests</h2>
        <p>
          Most online typing tests evaluate you on simple everyday English words: <em>the, about, could, people, time</em>.
          While this is great for building initial finger agility, it does not prepare you for the actual text you type
          at your job or in your studies.
        </p>
        <p>
          If you are a programmer, 40% of your daily keystrokes are brackets, braces, underscores, and camelCase syntax.
          If you are a medical transcriber, you type complex pharmaceutical names like <em>acetaminophen</em> and{" "}
          <em>hydrochlorothiazide</em>. If you are a legal assistant, you type citations, Roman numerals, and formal
          clauses.
        </p>
        <p>
          Practicing generic English will never automate the specialized muscle memory required for these domains. Custom
          text practice allows you to bridge the gap between abstract typing tests and real-world workplace productivity.
        </p>

        <h2 id="specialized-professions">Domain-Specific Use Cases</h2>
        <p>
          Review how professionals across industries use custom text tests to build career-specific typing velocity:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Domain / Role</th>
                <th className="p-3 font-semibold text-foreground">Example Custom Input</th>
                <th className="p-3 font-semibold text-foreground">Biomechanical &amp; Speed Payoff</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {USE_CASE_BENCHMARKS.map((item) => (
                <tr key={item.profession} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.profession}</td>
                  <td className="p-3 font-mono text-xs text-sub">{item.customContent}</td>
                  <td className="p-3 text-foreground/85 text-xs">{item.biomechanicalBenefit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="how-to-use-custom-mode">How to Use Custom Mode in HeroTyping</h2>
        <p>
          Loading your own material into HeroTyping takes less than ten seconds:
        </p>

        <ol>
          <li>
            Open the dedicated <Link href="/typing-test/custom-text">Custom Text Typing Test</Link>, or click on{" "}
            <strong>Custom</strong> in the mode toolbar on the <Link href="/">HeroTyping Home Page</Link>.
          </li>
          <li>
            A dedicated modal window opens. Paste your snippet into the text area. You can enter up to 2,000 characters
            at once.
          </li>
          <li>
            Click <strong>Apply Text</strong>.
          </li>
          <li>
            Start typing immediately! The test runs with live character tracking, instantaneous WPM calculation, and
            detailed post-test accuracy analytics.
          </li>
        </ol>

        <h2 id="formatting-guidelines">Text Formatting Best Practices</h2>
        <p>
          To ensure smooth practice runs without formatting issues:
        </p>
        <ul>
          <li>
            <strong>Keep snippets between 100 and 300 words:</strong> Pasting a full 2,000-character block is supported,
            but 150-word chunks provide the cleanest balance of stamina and feedback.
          </li>
          <li>
            <strong>Use standard ASCII characters:</strong> Standard quotes (<code>&quot;</code> and <code>&apos;</code>)
            and standard hyphens ensure predictable keystroke verification.
          </li>
          <li>
            <strong>Test incrementally:</strong> If drilling code, start with short 5-line functions before pasting
            complex multi-nested classes.
          </li>
        </ul>

        <h2 id="dual-coding-study-technique">The Dual-Coding Study Technique for Students</h2>
        <p>
          Custom text typing is also one of the most effective study hacks for students preparing for exams.
        </p>
        <p>
          In cognitive psychology, the <strong>Dual-Coding Theory</strong> demonstrates that processing information
          through multiple sensorimotor modalities (reading visually while simultaneously executing tactile finger
          movements) dramatically improves retention compared to passive reading alone.
        </p>
        <p>
          Paste your biology definitions, history dates, or foreign language vocabulary into HeroTyping&apos;s custom
          test mode. Typing your notes at speed forces active cognitive recall and engraves the material into long-term
          memory.
        </p>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}

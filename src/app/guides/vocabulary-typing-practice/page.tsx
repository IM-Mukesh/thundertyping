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
  title: "Vocabulary Typing Practice: Learn New Words and Build Speed Simultaneously",
  description:
    "Combine touch typing practice with English vocabulary expansion. Explore orthographic mapping, pronunciation audio, and HeroTyping's 1,300-word vocabulary engine.",
  path: "/guides/vocabulary-typing-practice",
});

const PUBLISHED = "2026-09-27";

const VOCAB_TIERS = [
  {
    tier: "Easy Tier (650 Words)",
    targetAudience: "Developing typists, ESL learners, middle-school students",
    linguisticCharacteristics: "Common 4- to 7-letter words with transparent phonetics and high frequency.",
    exampleWords: "anchor, blossom, candid, gentle, humble, journey, nimble, puzzle",
  },
  {
    tier: "Medium Tier (390 Words)",
    targetAudience: "High school students, college prep, everyday professionals",
    linguisticCharacteristics: "Latinate roots, common academic prefixes (sub-, trans-, inter-), and abstract nouns.",
    exampleWords: "adversity, benevolent, diligent, fluctuate, intuitive, pragmatic, resilient",
  },
  {
    tier: "Hard Tier (260 Words)",
    targetAudience: "Advanced writers, GRE/SAT test takers, avid readers",
    linguisticCharacteristics: "Sophisticated literary vocabulary, multi-syllabic Greek/Latin etymology, rare spellings.",
    exampleWords: "anachronism, cacophony, ephemeral, obfuscate, ubiquitous, vicarious",
  },
];

const FAQ_ITEMS = [
  {
    question: "How does typing words help you memorize their definitions?",
    answer:
      "In cognitive neuroscience, this phenomenon is explained by 'Orthographic Mapping'. When you read a word passively, your brain skims its overall visual shape. When you type that word letter-by-letter while reading its definition and hearing its pronunciation, you engage three distinct neural channels: visual, auditory, and motor. This multi-sensory encoding significantly accelerates vocabulary retention.",
    plainAnswer:
      "Typing a word letter-by-letter while viewing its definition and hearing pronunciation creates multi-sensory memory traces that dramatically improve recall.",
  },
  {
    question: "Why does HeroTyping include speech pronunciation in Vocabulary Mode?",
    answer:
      "Phonological awareness is vital for vocabulary acquisition. Hearing the correct acoustic pronunciation while your fingers type the spelling synchronizes the brain's auditory cortex with motor execution, preventing spelling confusion on words with silent letters or irregular vowel blends.",
    plainAnswer:
      "Hearing words spoken aloud connects the acoustic sound to the physical spelling, reinforcing accurate spelling and pronunciation.",
  },
  {
    question: "Can beginners use Vocabulary Mode, or is it only for fast typists?",
    answer:
      "Beginners can absolutely use Vocabulary Mode. HeroTyping divides its 1,300-word pool into three distinct tiers: Easy, Medium, and Hard. Beginners can start with the Easy tier (650 words) to practice simple words with clear spellings before advancing to academic terminology.",
    plainAnswer:
      "Beginners are encouraged to start with the Easy tier (650 accessible words) and progress to harder academic terms as confidence grows.",
  },
  {
    question: "How is Vocabulary Mode scored compared to standard speed tests?",
    answer:
      "Vocabulary Mode evaluates word-by-word completion. A word advances once it is typed cleanly, with errors highlighted immediately on the active word. This emphasizes orthographic accuracy and comprehension over frantic, blind speed.",
    plainAnswer:
      "It focuses on clean word-by-word spelling and comprehension, ensuring you truly understand and master each word.",
  },
];

const SOURCES = [
  {
    title: "Orthographic Mapping in the Acquisition of Sight Word Reading and Spelling",
    author: "Ehri, L. C. (Scientific Studies of Reading, 2014)",
    url: "https://doi.org/10.1080/10888438.2013.819356",
  },
  {
    title: "The Role of Phonological and Orthographic Representations in Word Recognition",
    author: "Perfetti, C. A. (Reading and Writing: An Interdisciplinary Journal, 1992)",
    url: "https://doi.org/10.1007/BF01027471",
  },
  {
    title: "Motor Memory and Lexical Representation in High-Speed Typing",
    author: "Crump, M. J., & Logan, G. D. (Psychological Science, 2010)",
    url: "https://doi.org/10.1177/0956797610383437",
  },
];

export default function VocabularyTypingPracticePage() {
  const schema = buildArticleSchema({
    headline: "Vocabulary Typing Practice: Learn New Words and Build Speed Simultaneously",
    description:
      "Combine touch typing practice with English vocabulary expansion. Explore orthographic mapping, pronunciation audio, and HeroTyping's 1,300-word vocabulary engine.",
    path: "/guides/vocabulary-typing-practice",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Vocabulary Typing Practice"
        subtitle="Expand your English lexicon, master complex spellings, and build typing speed through multi-sensory orthographic mapping."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Practice", path: "/guides/typing-practice" },
          { name: "Vocabulary Practice", path: "/guides/vocabulary-typing-practice" },
        ]}
        toc={[
          { id: "beyond-elementary-words", label: "Beyond elementary word pools" },
          { id: "orthographic-mapping", label: "The science of orthographic mapping" },
          { id: "vocabulary-tiers-table", label: "HeroTyping's 3 vocabulary tiers" },
          { id: "audio-speech-synthesis", label: "The role of pronunciation audio" },
          { id: "how-to-start", label: "Starting your vocabulary training" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Dual benefit">
          <p>
            Why spend practice time typing meaningless sentences like &quot;the quick brown fox&quot; over and over?
            With <strong>Vocabulary Typing Practice</strong>, every minute of keyboard training expands your real-world
            English vocabulary, reinforces SAT/GRE-level words, and builds spelling automaticity through audio and definitions.
          </p>
        </Callout>

        <Image
          src="/guides/typing-practice/vocabulary-typing-practice/vocabulary-orthographic-mapping.webp"
          alt="Multi-sensory orthographic mapping diagram showing visual, acoustic, and tactile encoding during vocabulary typing"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="beyond-elementary-words">Beyond Elementary Word Pools</h2>
        <p>
          Most typing software relies on a narrow pool of 200 common English words: <em>and, but, for, with, this, that</em>.
          While this is great for building initial finger agility, it creates a narrow comfort zone.
        </p>
        <p>
          In professional work, academic essays, and literature, real communication uses nuanced, multi-syllabic words:
          <em>pragmatic, meticulous, quintessential, ambiguous</em>. When typists who practice only simple words encounter
          these complex terms, their speed collapses because their fingers have never encoded those specific morphological
          syllables.
        </p>
        <p>
          Vocabulary typing practice bridges this gap: it turns keyboard drills into an intellectual exercise that enriches
          your vocabulary while training your hands.
        </p>

        <h2 id="orthographic-mapping">The Science of Orthographic Mapping</h2>
        <p>
          How does typing a word letter-by-letter help you remember what it means and how to spell it?
        </p>
        <p>
          In literacy research, <strong>Orthographic Mapping</strong> is the cognitive process by which the brain connects
          a word&apos;s spelling (orthography), sound (phonology), and meaning (semantics) into a permanent sight-word
          representation in the Visual Word Form Area (VWFA) of the left hemisphere.
        </p>
        <p>
          When you type in HeroTyping&apos;s Vocabulary Mode:
        </p>
        <ul>
          <li><strong>Visual Channel:</strong> You see the word and its concise dictionary definition displayed prominently.</li>
          <li><strong>Auditory Channel:</strong> Built-in text-to-speech audio pronounces the word aloud.</li>
          <li><strong>Kinesthetic Channel:</strong> Your fingers physically execute each character in sequence.</li>
        </ul>
        <p>
          This triple-layer encoding creates exceptionally strong memory traces, allowing you to master spelling and
          definitions simultaneously.
        </p>

        <h2 id="vocabulary-tiers-table">HeroTyping&apos;s 1,300-Word Curriculum Tiers</h2>
        <p>
          HeroTyping features a hand-curated vocabulary engine containing 1,300 unique English words divided into three
          balanced difficulty tiers:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Difficulty Tier</th>
                <th className="p-3 font-semibold text-foreground">Target Audience</th>
                <th className="p-3 font-semibold text-foreground">Linguistic Characteristics</th>
                <th className="p-3 font-semibold text-foreground">Sample Words</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {VOCAB_TIERS.map((item) => (
                <tr key={item.tier} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.tier}</td>
                  <td className="p-3 text-sub text-xs">{item.targetAudience}</td>
                  <td className="p-3 text-foreground/85 text-xs">{item.linguisticCharacteristics}</td>
                  <td className="p-3 font-mono text-accent text-xs">{item.exampleWords}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="audio-speech-synthesis">The Role of Pronunciation Audio</h2>
        <p>
          English spelling is notoriously irregular: words like <em>epitome</em>, <em>paradigm</em>, and <em>hyperbole</em>{" "}
          are frequently mispronounced by people who have only encountered them in print.
        </p>
        <p>
          HeroTyping solves this by integrating browser speech synthesis. As each new word appears on screen, you can
          listen to its native pronunciation at the press of a button. Hearing the acoustic cadence while your fingers
          strike the keys guarantees that you learn both how to write the word and how to pronounce it with confidence in
          meetings or presentations.
        </p>

        <h2 id="how-to-start">Starting Your Vocabulary Training Today</h2>
        <p>
          Adding vocabulary training to your daily routine takes just one click:
        </p>

        <ol>
          <li>
            Visit the dedicated <Link href="/vocabulary">HeroTyping Vocabulary Mode</Link>.
          </li>
          <li>
            Select your desired tier (Easy, Medium, or Hard) and choose your target word count per round (10, 25, or 50 words).
          </li>
          <li>
            Type each word cleanly. Watch the definition card and listen to the audio feedback.
          </li>
          <li>
            Review your post-round summary to see newly mastered words, accuracy percentages, and pronunciation audio logs.
          </li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Hindi Typing Test Online: InScript, Mangal Font & Speed Practice Guide",
  description:
    "Master Hindi typing online: InScript keyboard layout (Mangal font), Kruti Dev comparison, virama halant rules, SSC CGL DEST and CPCT exam speed benchmarks.",
  path: "/guides/hindi-typing-test-and-practice",
});

const PUBLISHED = "2026-10-13";
const UPDATED = "2026-10-13";

const EXAMPLES_HI = [
  {
    level: "Beginner (15–25 WPM Target / 75–125 CPM)",
    note: "सरल शब्द, बुनियादी मात्राएं (आ, ई, उ), बिना कठिन संयुक्त अक्षरों के।",
    text: "आज सुबह का सूरज बहुत चमकदार था। सभी लोग नदी के किनारे शांति से बैठकर मीठे पानी का आनंद ले रहे थे।",
  },
  {
    level: "Intermediate (25–35 WPM Target / 125–175 CPM)",
    note: "अनुस्वार, विसर्ग, छोटी-इ की मात्रा, संयुक्त वर्ण और मानक विराम चिह्न।",
    text: "यद्यपि तकनीकी विकास ने हमारे दैनिक जीवन को अत्यधिक सुगम बना दिया है, तथापि निरंतर अभ्यास और एकाग्रता के बिना किसी भी कौशल में प्रवीणता प्राप्त करना संभव नहीं है।",
  },
  {
    level: "Government Exam Benchmark (35–50+ WPM / 175–250+ CPM)",
    note: "प्रशासनिक शब्दावली, हलंत युक्त संयुक्ताक्षर (क्ष, त्र, ज्ञ, श्र), सरकारी परीक्षा मानक।",
    text: "कर्मचारी चयन आयोग (SSC) की डाटा एंट्री दक्षता परीक्षा (DEST) के अनुसार, प्रत्येक अभ्यर्थी को निर्धारित समय सीमा के भीतर कम से कम 95% शुद्धता के साथ संपूर्ण गद्यांश का टंकण अनिवार्य रूप से पूर्ण करना होगा!",
  },
];

const EXAM_BENCHMARKS = [
  { exam: "SSC CGL (Tier II DEST)", speed: "27 WPM (135 CPM)", criteria: "2000 key depressions in 15 minutes, maximum 5% to 7% allowable error." },
  { exam: "SSC CHSL (LDC / JSA)", speed: "30 WPM (150 CPM)", criteria: "9000 key depressions per hour (15-minute test duration) on InScript or Remington." },
  { exam: "MP CPCT (Hindi Section)", speed: "20 WPM (Qualifying)", criteria: "20 to 25 WPM scores 50%, 30+ WPM earns higher grade certification." },
  { exam: "High Court RO / ARO / Clerk", speed: "30–35 WPM (175 CPM)", criteria: "Strict evaluation: backspace often disabled, zero tolerance for incorrect matras." },
  { exam: "State LDC / Subordinate Services", speed: "25–30 WPM (150 CPM)", criteria: "Conducted predominantly using Unicode Mangal InScript or Kruti Dev 010." },
];

const FAQ_ITEMS = [
  {
    question: "What is the difference between InScript and Kruti Dev layout for Hindi typing?",
    answer:
      "InScript is the official standardized keyboard layout developed by the Government of India for all Indian scripts and runs on Unicode (commonly called Mangal Font). It is logically arranged: vowels on the left hand, consonants on the right hand. Kruti Dev is a legacy non-Unicode typewriter layout that maps English QWERTY keys to Hindi glyphs. Modern central examinations (such as SSC, Railways, and central ministries) mandate InScript/Unicode, while some state judicial exams still permit Kruti Dev.",
    plainAnswer:
      "InScript is the official Unicode standard (vowels on left, consonants on right). Kruti Dev is a legacy typewriter font mapping.",
  },
  {
    question: "How do you type conjunct characters like क्ष, त्र, ज्ञ, and श्र in InScript?",
    answer:
      "In InScript layout, conjunct consonants are created using the virama/halant (the 'd' key in QWERTY): \n1. क्ष = क + ् + ष (k + d + <)\n2. त्र = त + ् + र (l + d + j)\n3. ज्ञ = ज + ् + ञ (p + d + })\n4. श्र = श + ् + र (M + d + j)\nHeroTyping natively tracks Devanagari grapheme cluster boundaries so uncommitted halants do not trigger false typing errors.",
    plainAnswer:
      "Press the first consonant, press the halant ('d' key in InScript), then press the second consonant.",
  },
  {
    question: "How is Hindi typing speed calculated in Words Per Minute (WPM)?",
    answer:
      "In standardized government exams, one word in Hindi is defined as five keystrokes (key depressions), including spaces and punctuation marks. Net WPM is calculated as Gross WPM minus error penalties. For example, if you complete 1,500 keystrokes in 10 minutes with 10 word errors: Gross WPM = (1500 / 5) / 10 = 30 WPM; Net WPM = 30 - (10 / 10) = 29 WPM.",
    plainAnswer:
      "5 key depressions equal 1 word. Net WPM = (Keystrokes / 5 / Minutes) minus error deductions.",
  },
  {
    question: "Can I take the Hindi typing test online for free on HeroTyping?",
    answer:
      "Yes. HeroTyping features a fully functional Hindi typing test engine with real Devanagari vocabulary, quotes, and custom text support. You can launch it directly by opening HeroTyping with the Hindi language setting or via https://www.herotyping.com/?language=hi.",
    plainAnswer:
      "Yes, open HeroTyping and select Hindi, or navigate directly to herotyping.com/?language=hi.",
  },
];

export default function HindiTypingTestPage() {
  const schema = buildArticleSchema({
    headline: "Hindi Typing Test Online: InScript, Mangal Font & Speed Practice Guide",
    description:
      "Complete Hindi typing guide: InScript layout (Mangal font), Kruti Dev differences, virama halant rules, SSC CGL DEST and CPCT exam speed benchmarks.",
    path: "/guides/hindi-typing-test-and-practice",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Hindi Typing Test & Practice (इन्स्क्रिप्ट व मंगल फ़ॉन्ट)"
        subtitle="Master Devanagari touch typing online: InScript keyboard mechanics, Kruti Dev comparisons, virama and matra rules, and benchmarks for SSC, CPCT, and High Court exams."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Hindi Typing Test (InScript)", path: "/guides/hindi-typing-test-and-practice" },
        ]}
        toc={[
          { id: "what-is-hindi-typing", label: "What is Hindi Typing?" },
          { id: "inscript-vs-krutidev", label: "InScript vs. Kruti Dev" },
          { id: "inscript-mechanics", label: "InScript Finger Layout" },
          { id: "matra-and-halant", label: "Matra & Halant Rules" },
          { id: "govt-exam-benchmarks", label: "Govt Exam Benchmarks" },
          { id: "practice-passages", label: "Practice Passages" },
          { id: "start-practicing", label: "Start Practicing on HeroTyping" },
        ]}
        hasFaq
      >
        <Callout label="Core Summary">
          <p>
            A standardized Hindi typing test evaluates your speed in <strong>Words Per Minute (WPM)</strong> and{" "}
            <strong>Characters Per Minute (CPM)</strong> on Devanagari script. Most Indian central and state government recruitment exams
            (SSC, CPCT, Railways, High Courts) mandate the official <strong>InScript layout (Mangal Font / Unicode)</strong>.
            Achieving 30–35 WPM requires mastering Devanagari matras and halant conjuncts without looking down.
          </p>
        </Callout>

        <p>
          In India, typing in Hindi is not merely a productivity skill—it is an essential career requirement for hundreds of thousands
          of aspirants preparing for government competitive examinations, judicial clerkships, state secretariats, and bilingual data entry roles.
          Understanding keyboard architecture and Unicode mechanics is the fastest way to progress from hunt-and-peck typing to exam-ready speeds.
        </p>

        <h2 id="what-is-hindi-typing">What is a Hindi typing test?</h2>
        <p>
          Unlike Latin script typing where each keystroke directly produces a distinct stand-alone letter, typing in Devanagari involves
          combining base consonants with dependent vowel signs (*matras*) and conjunct forms (*samyuktakshar*):
        </p>
        <ul>
          <li>
            <strong>Gross & Net WPM:</strong> In Indian examinations, 5 key depressions (strokes) equal one standard word.
            Net WPM strictly subtracts uncorrected character omissions and spelling errors. Convert your figures instantly in our{" "}
            <Link href="/guides/wpm-cpm-kph-calculator">live WPM & CPM calculator</Link>.
          </li>
          <li>
            <strong>Accuracy Standard:</strong> Government evaluation criteria typically enforce a minimum of 95% accuracy.
            A candidate typing at 40 WPM with 88% accuracy will be disqualified, whereas a steady typist at 32 WPM with 98% accuracy passes comfortably.
          </li>
          <li>
            <strong>Unicode Grapheme Integrity:</strong> HeroTyping&apos;s engine implements modern grapheme cluster parsing, ensuring
            that composite characters (such as <em>कि</em> or <em>ट्र</em>) are evaluated accurately as cohesive linguistic units.
          </li>
        </ul>

        <h2 id="inscript-vs-krutidev">InScript (Mangal Font) vs. Kruti Dev: Which should you learn?</h2>
        <p>
          One of the biggest dilemmas facing Hindi typing aspirants is choosing between InScript and Kruti Dev:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-sub font-mono uppercase">
                <th className="py-2.5 pr-4">Feature</th>
                <th className="py-2.5 pr-4">InScript (Mangal Font / Unicode)</th>
                <th className="py-2.5">Kruti Dev (Remington Layout)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-sub-alt/20">
                <td className="py-2.5 pr-4 font-semibold text-foreground">Standardization</td>
                <td className="py-2.5 pr-4 text-accent">Official Govt of India Standard (Department of IT)</td>
                <td className="py-2.5 text-foreground/80">Proprietary legacy font mapping from typewriter era</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="py-2.5 pr-4 font-semibold text-foreground">Exam Acceptance</td>
                <td className="py-2.5 pr-4 text-foreground/90">Mandatory for SSC CGL, CHSL, MP CPCT, Central Ministries</td>
                <td className="py-2.5 text-foreground/80">Accepted in UP High Court, Rajasthan LDC, older state bodies</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="py-2.5 pr-4 font-semibold text-foreground">Keyboard Logic</td>
                <td className="py-2.5 pr-4 text-foreground/90">Phonetic: Vowels on left hand, consonants on right hand</td>
                <td className="py-2.5 text-foreground/80">Arbitrary layout based on mechanical typewriters</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="py-2.5 pr-4 font-semibold text-foreground">Cross-Language</td>
                <td className="py-2.5 pr-4 text-foreground/90">Same layout works for Marathi, Sanskrit, Nepali, and all Indic scripts</td>
                <td className="py-2.5 text-foreground/80">Hindi only; completely incompatible with other Indian languages</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          <strong>Strategic Recommendation:</strong> If you are starting fresh, learn <strong>InScript</strong>. It is future-proof,
          native to all modern operating systems (Windows, macOS, Linux, Android) without installing third-party font packages,
          and universally supported across all major government recruitment bodies.
        </p>

        <h2 id="inscript-mechanics">InScript keyboard architecture & finger placement</h2>
        <p>
          The InScript layout is one of the most scientifically designed keyboards in the world:
        </p>
        <ul>
          <li>
            <strong>Left Hand Domain (Vowels & Matras):</strong> All independent vowels and dependent vowel signs are placed on the left side:
            Unshifted keys produce matras (<em>ा, ि, ी, ु, ू, े, ै, ो, ौ</em>); Shift combinations produce full vowels (<em>आ, इ, ई, उ, ऊ, ए, ऐ, ओ, औ</em>).
          </li>
          <li>
            <strong>Right Hand Domain (Consonants):</strong> Consonants are organized phonetically on the right side by varga:
            Gutturals (क, ख, ग, घ), Palatals (च, छ, ज, झ), Retroflexes (ट, ठ, ड, ढ), Dentals (त, थ, द, ध, न), and Labials (प, फ, ब, भ, म).
          </li>
          <li>
            <strong>Home Row Anchors:</strong> Left fingers rest on <em>ो, े, ्, ि</em>; right fingers rest on <em>प, र, क, त</em>.
            Explore finger assignments in our <Link href="/guides/touch-typing-finger-map">finger placement guide</Link>.
          </li>
        </ul>

        <h2 id="matra-and-halant">Matra & Halant rules (हलंत व मात्रा नियम)</h2>
        <p>
          Typing errors in Hindi typing tests overwhelmingly stem from hesitation during conjunct formation:
        </p>
        <ul>
          <li>
            <strong>Halant / Virama (्):</strong> Located on the <strong>D key</strong> (left index finger on QWERTY).
            The halant suppresses the inherent &lsquo;a&rsquo; vowel of a consonant. To type half-letters (like &lsquo;क्&rsquo; or &lsquo;न्&rsquo;),
            simply type the consonant followed by the halant key.
          </li>
          <li>
            <strong>Forming Compound Conjuncts:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>क + ् + ष = <strong>क्ष</strong> (k + d + &lt;)</li>
              <li>त + ् + र = <strong>त्र</strong> (l + d + j)</li>
              <li>ज + ् + ञ = <strong>ज्ञ</strong> (p + d + &#125;)</li>
              <li>श + ् + र = <strong>श्र</strong> (M + d + j)</li>
              <li>द + ् + य = <strong>द्य</strong> (o + d + /)</li>
            </ul>
          </li>
          <li>
            <strong>Anusvara (ं):</strong> Located on the <strong>X key</strong>. Always type the base consonant first, followed by the anusvara.
          </li>
          <li>
            <strong>Punctuation:</strong> The Devanagari full stop (Purna Viram <em>।</em>) is typed with <strong>Shift + A</strong>.
          </li>
        </ul>

        <h2 id="govt-exam-benchmarks">Major government exam typing benchmarks</h2>
        <p>
          Before taking an official recruitment test, verify your target benchmark:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-sub font-mono uppercase">
                <th className="py-2.5 pr-4">Examination</th>
                <th className="py-2.5 pr-4">Required Speed</th>
                <th className="py-2.5">Evaluation & Error Tolerance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {EXAM_BENCHMARKS.map((ex) => (
                <tr key={ex.exam} className="hover:bg-sub-alt/20">
                  <td className="py-2.5 pr-4 font-semibold text-foreground">{ex.exam}</td>
                  <td className="py-2.5 pr-4 font-mono text-accent">{ex.speed}</td>
                  <td className="py-2.5 text-foreground/80">{ex.criteria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="practice-passages">Tiered Hindi practice passages</h2>
        <p>
          Practice reading and transcribing these authentic Devanagari passages:
        </p>
        <div className="flex flex-col gap-3.5">
          {EXAMPLES_HI.map((ex) => (
            <div key={ex.level} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {ex.level}
              </p>
              <p className="mt-1 text-xs text-sub/80">{ex.note}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground font-mono bg-bg/50 p-2.5 rounded-lg border border-border/40">
                {ex.text}
              </p>
            </div>
          ))}
        </div>

        <h2 id="start-practicing">Start practicing on HeroTyping</h2>
        <p>
          HeroTyping offers an ad-free, high-performance environment designed for serious Hindi typing practice:
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-foreground/90">
          <li>
            <strong>Launch the Live Hindi Test:</strong> Open the{" "}
            <Link href="/?language=hi">HeroTyping Hindi Typing Test</Link> to start an instant 60-second test with native Devanagari words.
          </li>
          <li>
            <strong>Practice with Exam Paragraphs:</strong> Copy actual question papers into our{" "}
            <Link href="/typing-test/custom-text">Custom Text Typing Test</Link> to simulate real exam duration (10–15 minutes).
          </li>
          <li>
            <strong>Review Speed Metrics:</strong> Measure your true net throughput using the{" "}
            <Link href="/guides/net-wpm-vs-gross-wpm">Net WPM formula guide</Link>.
          </li>
          <li>
            <strong>Protect Your Hands:</strong> Daily prolonged typing for exams can lead to wrist fatigue. Do 2 minutes of hand warmups from our{" "}
            <Link href="/guides/typing-stretches-and-hand-warmups">typing stretches guide</Link>.
          </li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />

        <p className="text-xs text-sub">Last updated: {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

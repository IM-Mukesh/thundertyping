import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { SourceList } from "@/components/content/source-list";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Hindi Typing Test: हिंदी टाइपिंग टेस्ट",
  description:
    "हिंदी टाइपिंग टेस्ट ऑनलाइन: InScript कीबोर्ड लेआउट (मंगल फ़ॉन्ट), हलंत और मात्रा नियम, SSC CGL DEST व CPCT परीक्षा स्पीड और सटीकता अभ्यास गाइड।",
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
    text: "कर्मचारी चयन आयोग (SSC) की डाटा एंट्री दक्षता परीक्षा (DEST) और राज्य स्तरीय भर्ती परीक्षाओं के अनुसार, अभ्यर्थियों को निर्धारित समय सीमा के भीतर उच्च शुद्धता (आमतौर पर 93% से 95%+) के साथ संपूर्ण गद्यांश का टंकण पूर्ण करना होता है।",
  },
];

const EXAM_BENCHMARKS = [
  { exam: "SSC CGL (Tier II DEST)", speed: "27 WPM (135 CPM)", criteria: "2000 key depressions in 15 minutes, qualifying cut-offs typically allow 5% to 7% mistakes depending on category." },
  { exam: "SSC CHSL (LDC / JSA)", speed: "30 WPM (150 CPM)", criteria: "9000 key depressions per hour (15-minute test duration) on InScript or Remington." },
  { exam: "MP CPCT (Hindi Section)", speed: "20 WPM (Qualifying)", criteria: "20 to 25 WPM scores 50%, 30+ WPM earns higher grade certification." },
  { exam: "High Court RO / ARO / Clerk", speed: "30–35 WPM (175 CPM)", criteria: "Strict evaluation: backspace often disabled, zero tolerance for incorrect matras." },
  { exam: "State LDC / Subordinate Services", speed: "25–30 WPM (150 CPM)", criteria: "Conducted predominantly using Unicode Mangal InScript or Kruti Dev 010 according to specific notification." },
];

const FAQ_ITEMS = [
  {
    question: "हिंदी टाइपिंग में InScript और Kruti Dev में क्या अंतर है? (InScript vs Kruti Dev)",
    answer:
      "InScript भारत सरकार द्वारा विकसित मानकीकृत कीबोर्ड लेआउट है जो यूनिकोड (जैसे Mangal Font) पर आधारित है। इसमें बाएं हाथ पर स्वर (मात्राएं) और दाएं हाथ पर व्यंजन व्यवस्थित हैं। वहीं Kruti Dev एक गैर-यूनिकोड फॉन्ट लेआउट है जो अंग्रेजी QWERTY अक्षरों पर आधारित है। आधुनिक केंद्रीय परीक्षाएं (SSC, रेलवे, बैंकिंग) यूनिकोड InScript अनिवार्य करती हैं, जबकि कुछ राज्य स्तरीय अदालतें अभी भी Kruti Dev की अनुमति देती हैं।",
    plainAnswer:
      "InScript यूनिकोड मानक लेआउट है (स्वर बाएं, व्यंजन दाएं हाथ पर)। Kruti Dev पुराना टाइपराइटर फॉन्ट आधारित लेआउट है।",
  },
  {
    question: "InScript लेआउट में संयुक्त अक्षर (क्ष, त्र, ज्ञ, श्र) कैसे टाइप करें?",
    answer:
      "InScript लेआउट में संयुक्त अक्षर हलंत/विराम ('d' कुंजी) की सहायता से बनाए जाते हैं:\n1. क्ष = क + ् + ष (QWERTY: k + d + <)\n2. त्र = त + ् + र (QWERTY: l + d + j)\n3. ज्ञ = ज + ् + ञ (QWERTY: p + d + })\n4. श्र = श + ् + र (QWERTY: M + d + j)\nHeroTyping का टाइपिंग इंजन देवनागरी वर्ण समूहों (Grapheme clusters) को स्वाभाविक रूप से पहचानता है।",
    plainAnswer:
      "पहला व्यंजन टाइप करें, फिर हलंत ('d' कुंजी) दबाएं, और फिर दूसरा व्यंजन टाइप करें।",
  },
  {
    question: "सरकारी परीक्षाओं में हिंदी टाइपिंग स्पीड (WPM) की गणना कैसे होती है?",
    answer:
      "मानकीकृत सरकारी परीक्षाओं में 5 की-डिप्रेशन (स्पेस और विराम चिह्नों सहित) को 1 शब्द माना जाता है। ग्रॉस स्पीड = (कुल की-स्ट्रोक ÷ 5) ÷ मिनट। नेट स्पीड में अशुद्धियों का दंड घटाया जाता है। उदाहरण के लिए, 10 मिनट में 1500 की-स्ट्रोक और 10 त्रुटियों पर: ग्रॉस = 30 WPM, नेट = 29 WPM।",
    plainAnswer:
      "5 की-स्ट्रोक = 1 शब्द। नेट WPM = (कुल की-स्ट्रोक ÷ 5 ÷ मिनट) में से अशुद्धियों की कटौती।",
  },
  {
    question: "क्या HeroTyping पर हिंदी टाइपिंग टेस्ट पूरी तरह निःशुल्क है?",
    answer:
      "हाँ, HeroTyping पर हिंदी टाइपिंग टेस्ट, अभ्यास और शब्दावली पूरी तरह निःशुल्क और बिना किसी विज्ञापन या लॉगिन की बाध्यता के उपलब्ध है। आप सीधे https://www.herotyping.com/?language=hi पर जाकर तुरंत टेस्ट शुरू कर सकते हैं।",
    plainAnswer:
      "हाँ, HeroTyping पर हिंदी टाइपिंग टेस्ट पूरी तरह मुफ्त है। आप herotyping.com/?language=hi पर सीधे अभ्यास कर सकते हैं।",
  },
];

export default function HindiTypingTestPage() {
  const schema = buildArticleSchema({
    headline: "हिंदी टाइपिंग टेस्ट और अभ्यास (Hindi Typing Test Online): InScript व Mangal Font स्पीड गाइड",
    description:
      "हिंदी टाइपिंग टेस्ट ऑनलाइन: InScript कीबोर्ड लेआउट (मंगल फ़ॉन्ट), हलंत और मात्रा नियम, SSC CGL DEST व CPCT परीक्षा स्पीड और सटीकता अभ्यास गाइड।",
    path: "/guides/hindi-typing-test-and-practice",
    datePublished: PUBLISHED,
    inLanguage: "hi",
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        lang="hi"
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
          HeroTyping offers an ad-light, high-performance environment designed for serious Hindi typing practice:
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

        
        <SourceList
          sources={[
          {
                    "label": "Bureau of Indian Standards (IS 16350:2016) — \"Indian Language Keyboard Layout for Keyboards with English Lettering (InScript)\"",
                    "href": "https://www.bis.gov.in/"
          },
          {
                    "label": "Staff Selection Commission (SSC) — \"Typing and Data Entry Skill Test Standards for Combined Higher Secondary Level (CHSL)\"",
                    "href": "https://ssc.nic.in/"
          }
]}
        />

        <p className="text-xs text-sub">Last updated: {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

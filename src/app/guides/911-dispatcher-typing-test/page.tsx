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
  title: "911 Dispatcher Typing Test: Requirements, CritiCall & Practice",
  description:
    "Complete guide to the 911 dispatcher typing test and CritiCall examination: WPM requirements, audio transcription, data entry cross-referencing, and prep drills.",
  path: "/guides/911-dispatcher-typing-test",
});

const PUBLISHED = "2026-09-26";
const UPDATED = "2026-09-26";

const CRITICALL_STANDARDS = [
  {
    module: "Standard Prose Typing Test",
    passingRequirement: "35 to 45+ Net WPM",
    accuracyTarget: "95% to 98% minimum",
    description: "Timed 3 to 5-minute test assessing baseline typing speed and net accuracy on administrative text.",
  },
  {
    module: "Audio Data Entry (Audio-to-CAD)",
    passingRequirement: "35 to 40 WPM real-time",
    accuracyTarget: "98% minimum",
    description: "Listening to simulated 911 caller audio tapes and entering names, locations, and descriptions simultaneously into dispatch fields.",
  },
  {
    module: "Alphanumeric Cross-Referencing",
    passingRequirement: "3,500 to 5,000+ KPH",
    accuracyTarget: "95% minimum",
    description: "Rapidly matching and inputting mixed alphanumeric codes: VIN numbers, driver's licenses, license plates, and street numbers.",
  },
  {
    module: "Call Summarization & Priority",
    passingRequirement: "80% composite score",
    accuracyTarget: "No critical field omissions",
    description: "Synthesizing chaotic caller statements into concise, actionable dispatch summaries while determining unit dispatch priority.",
  },
];

const FAQ_ITEMS = [
  {
    question: "What WPM typing speed is required for a 911 dispatcher?",
    answer:
      "Many emergency communications agencies require a baseline typing speed between 35 and 45 Net WPM, though exact benchmarks vary by agency and jurisdiction. Passing the hiring test is not just about raw speed: candidate evaluations test your ability to type accurately while listening to emergency audio and inputting complex alphanumeric strings (addresses, license plates, phone numbers).",
    plainAnswer:
      "Many agencies require 35 to 45 Net WPM (varying by jurisdiction), alongside audio transcription and alphanumeric data-entry modules (3,500–5,000 KPH).",
  },
  {
    question: "What is the CritiCall test?",
    answer:
      "CritiCall is a widely used computerized pre-employment testing battery developed for public safety and 911 emergency communications centers. It assesses multitasking skills including audio data entry, reading comprehension, address cross-referencing, map reading, memory recall, and priority dispatch decision-making.",
    plainAnswer:
      "CritiCall is a standardized pre-employment testing battery used by many public safety agencies to test typing, audio transcription, memory recall, and data entry under pressure.",
  },
  {
    question: "Why do so many candidates fail the 911 dispatcher typing test?",
    answer:
      "Candidates usually fail not because they cannot type 40 WPM on a normal keyboard test, but because they struggle with audio multitasking. Typing while actively listening to frantic caller audio—or misplacing digits in 17-digit vehicle identification numbers (VINs)—triggers disqualifying error deductions.",
    plainAnswer:
      "Failure is rarely due to raw speed; it happens when candidates cannot type accurately while listening to audio or make errors entering addresses and numbers.",
  },
  {
    question: "How long should I prepare before taking the CritiCall examination?",
    answer:
      "We recommend 3 to 4 weeks of structured daily practice. Focus on blind typing (never looking at your hands), audio dictation drills, and top-row number/symbol speed using our data entry practice tools.",
    plainAnswer:
      "3 to 4 weeks of dedicated daily preparation, emphasizing blind typing, alphanumeric drills, and simultaneous audio listening.",
  },
];

export default function DispatcherTypingTestPage() {
  const schema = buildArticleSchema({
    headline: "911 Dispatcher Typing Test: Requirements, CritiCall & Practice",
    description:
      "Complete guide to the 911 dispatcher typing test and CritiCall examination: WPM requirements, audio transcription, data entry cross-referencing, and prep drills.",
    path: "/guides/911-dispatcher-typing-test",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <GuideLayout
        title="911 Dispatcher Typing Test: Requirements, CritiCall &amp; How to Pass"
        subtitle="The complete guide to public safety typing benchmarks, audio-to-CAD transcription, alphanumeric data entry, and passing the CritiCall exam."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          {
            name: "911 Dispatcher Typing Test",
            path: "/guides/911-dispatcher-typing-test",
          },
        ]}
        toc={[
          { id: "hero-image", label: "Emergency dispatch console" },
          { id: "why-unique", label: "Why 911 typing is different" },
          { id: "criticall-overview", label: "The CritiCall test modules" },
          { id: "passing-standards", label: "Agency passing standards table" },
          { id: "alphanumeric-drills", label: "Mastering addresses & numbers" },
          { id: "4-week-prep", label: "4-week dispatcher prep plan" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Agency Hiring Disclaimer">
          <p>
            Specific WPM cutoffs, computerized testing systems (such as CritiCall, TypingTest, or custom CAD simulations), and passing thresholds vary significantly by municipality, county, state/provincial agency, and dispatch center. Always consult the specific civil service job announcement or recruitment department for the exact testing requirements in your jurisdiction.
          </p>
        </Callout>

        <Callout label="Public Safety Accuracy Rule">
          <p>
            In civilian typing, a typo is a minor inconvenience. In 911 emergency dispatch,
            transposing two digits in an address or miskeying an apartment number delays first
            responders when seconds count. For this reason, <strong>net accuracy (95% to 98%+)</strong>{" "}
            and flawless alphanumeric entry carry far more weight in hiring decisions than raw,
            erratic WPM speed.
          </p>
        </Callout>

        <h2 id="hero-image">Emergency dispatch console</h2>
        <Image
          src="/guides/typing-work-study/911-dispatcher-typing-test/911-dispatcher-typing-test.webp"
          alt="High-tech 911 emergency dispatch command workstation with multi-monitor CAD screens, radio console, and keyboard"
          width={1200}
          height={675}
          className="mx-auto rounded-xl border border-border"
          priority
        />
        <p>
          Emergency communications dispatchers are the critical first link in public safety. Before
          police officers, firefighters, or paramedics arrive at a scene, a 911 operator has gathered
          the caller&apos;s location, verified the nature of the emergency, cross-referenced hazard databases,
          and dispatched units via a Computer-Aided Dispatch (CAD) console.
        </p>
        <p>
          To ensure candidates can handle high-stress data entry without freezing, many municipal,
          county, and state agencies administer rigorous pre-employment typing exams, frequently utilizing the{" "}
          <strong>CritiCall</strong> examination battery or agency-specific CAD simulations.
        </p>

        <h2 id="why-unique">Why 911 typing is fundamentally different from everyday typing</h2>
        <p>
          Taking a standard <Link href="/">typing test</Link> tests your ability to read printed text on
          a monitor and re-type it. A 911 dispatcher rarely does this.
        </p>
        <p>
          Instead, emergency typing demands three distinct neurological skills:
        </p>
        <ul>
          <li>
            <strong>Dichotic Listening &amp; Typing:</strong> You must listen to hysterical, sobbing,
            or whispering callers through a headset while simultaneously typing structured notes into
            CAD fields without interrupting the caller.
          </li>
          <li>
            <strong>Alphanumeric Precision:</strong> You will constantly enter complex sequences of
            mixed letters and numbers: license plates (e.g. <code>7XYZ491</code>), 17-character VINs,
            street addresses (e.g. <code>14022 N 84th Pl #3B</code>), and phone numbers.
          </li>
          <li>
            <strong>Multi-Window Navigation:</strong> Shifting instantly between form fields using the{" "}
            <code>Tab</code> key, arrow keys, and functional hotkeys rather than reaching for a mouse.
          </li>
        </ul>

        <h2 id="criticall-overview">The CritiCall test modules explained</h2>
        <p>
          Developed by Biddle Consulting Group, CritiCall tests real-world public safety competencies.
          The primary typing and data-entry sections include:
        </p>
        <ol>
          <li>
            <strong>Audio Data Entry:</strong> You hear simulated 911 calls over headphones. As the
            caller speaks, you must input the caller&apos;s name, address, phone number, and incident
            type into the correct CAD software boxes in real time.
          </li>
          <li>
            <strong>Cross-Referencing:</strong> You are given an address or name and must rapidly find
            the matching record in a side table, verify the jurisdiction, and key in the verified
            responding station.
          </li>
          <li>
            <strong>Data Entry (Ten-Key &amp; Alphanumeric):</strong> Timed entry of numeric and
            alphanumeric codes, scored strictly on keystrokes per hour (KPH). Review our{" "}
            <Link href="/guides/data-entry-typing-test">data entry typing test guide</Link> for detailed KPH conversions.
          </li>
          <li>
            <strong>Call Summarization:</strong> Listening to a short emergency call and typing a concise,
            factual 2-sentence summary without spelling or grammatical ambiguities.
          </li>
        </ol>

        <h2 id="passing-standards">Agency passing standards table</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Test Section</th>
              <th className="py-2 pr-4 font-medium text-foreground">Speed Benchmark</th>
              <th className="py-2 pr-4 font-medium text-foreground">Accuracy Threshold</th>
              <th className="py-2 font-medium text-foreground">Evaluation Scope</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {CRITICALL_STANDARDS.map((row) => (
              <tr key={row.module}>
                <td className="py-2 pr-4 font-medium text-foreground">{row.module}</td>
                <td className="py-2 pr-4 font-medium text-accent">{row.passingRequirement}</td>
                <td className="py-2 pr-4">{row.accuracyTarget}</td>
                <td className="py-2 text-xs">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="alphanumeric-drills">Mastering addresses &amp; top-row numbers</h2>
        <p>
          The most common reason capable typists score poorly on CritiCall is hesitation on the number
          row. When an applicant has to look down at their hands to find the &ldquo;7&rdquo; or the &ldquo;#&rdquo;
          symbol, their rhythm collapses and they fall behind the audio stream.
        </p>
        <p>
          To build automatic alphanumeric muscle memory:
        </p>
        <ul>
          <li>
            Master our dedicated guide on{" "}
            <Link href="/guides/how-to-type-numbers-and-symbols-without-looking">
              how to type numbers and symbols without looking
            </Link>.
          </li>
          <li>
            Anchor your index fingers to the <strong>F</strong> and <strong>J</strong> home keys and
            practice blind reaches to <strong>4, 5, 6, 7</strong> until you can enter any phone number
            with your eyes closed.
          </li>
          <li>
            Practice typing full address strings: &ldquo;742 Evergreen Terrace Apt 4B&rdquo; until you
            can switch between letters, numbers, and capital shifts without pausing.
          </li>
        </ul>

        <h2 id="4-week-prep">4-week dispatcher prep plan</h2>
        <ul>
          <li>
            <strong>Week 1 (Form &amp; Blind Typing):</strong> Take daily 5-minute typing tests on our{" "}
            <Link href="/guides/english-typing-test-and-practice">English practice modules</Link>.
            Enforce a strict 98% accuracy threshold. If you look down at the keyboard, restart the test.
          </li>
          <li>
            <strong>Week 2 (Numbers &amp; Ten-Key KPH):</strong> Spend 20 minutes daily on the top number
            row and numeric keypad. Calculate your KPH using our{" "}
            <Link href="/guides/wpm-cpm-kph-calculator">WPM, CPM &amp; KPH Calculator</Link> to ensure
            you exceed 4,000 KPH.
          </li>
          <li>
            <strong>Week 3 (Audio Multitasking):</strong> Put on headphones, play a news broadcast or
            podcast, and practice transcribing names, dates, and locations into a blank document in real
            time without pausing the audio.
          </li>
          <li>
            <strong>Week 4 (Simulated Pressure):</strong> Take full-length 5-minute tests under time
            constraints, ensuring your net WPM stays comfortably above 45 WPM even under stress.
          </li>
        </ul>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label: "Biddle Consulting Group — CritiCall Public Safety Dispatcher Pre-Employment Testing System",
              href: "https://criticall911.com/",
            },
            {
              label: "National Emergency Number Association (NENA) — Core Competencies and Minimum Training Standards for Public Safety Telecommunicators",
              href: "https://www.nena.org/",
            },
            {
              label: "Association of Public-Safety Communications Officials (APCO International) — Standards for 9-1-1 Telecommunicator Candidates",
              href: "https://www.apcointl.org/",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

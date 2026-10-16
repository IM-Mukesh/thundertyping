import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TypingTestClient } from "@/components/typing-test/typing-test-client";
import { localizedPageMetadata } from "@/lib/seo/metadata";
import { buildWebApplicationSchema, buildFaqSchema } from "@/lib/seo/json-ld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return localizedPageMetadata({
    locale,
    title: "5-Minute Typing Test — Stamina & Accuracy Test",
    description:
      "Take a free 5-minute typing test on HeroTyping. Measure sustained typing pace, consistency, and stamina over 300 seconds with live accuracy scoring.",
    path: "/typing-test/5-minute",
  });
}

const FAQ_ITEMS = [
  {
    question: "Why take a 5-minute typing test?",
    answer:
      "A 5-minute test measures true operational stamina, sustained focus, and unassisted error control over an extended duration, filtering out short lucky bursts.",
  },
  {
    question: "What typing speed is typical on a 5-minute test?",
    answer:
      "Typists commonly sustain 40 to 60 Net WPM on general prose. Sustaining speed for 300 seconds requires disciplined pacing and steady rhythm rather than sprinting.",
  },
  {
    question: "How should I manage finger fatigue during a 5-minute test?",
    answer:
      "Maintain proper ergonomic wrist alignment: keep your wrists floating neutral above the desk rather than resting on hard surfaces. Type with light keystrokes, avoid bottoming out mechanical switches with excessive force, and breathe steadily to keep shoulder and forearm muscles relaxed.",
  },
  {
    question: "How does uncorrected error deduction affect my 5-minute score?",
    answer:
      "In standard international scoring, every uncorrected error deducts one whole word (5 characters) from your gross word total. In a 5-minute test, just 10 uncorrected errors will slash your final score by 2 full WPM.",
  },
];

export default async function FiveMinuteTypingTestPage({ params }: { params?: Promise<{ locale: string }> }) {
  const resolvedParams = params ? await params : undefined;
  const locale = resolvedParams?.locale ?? "en";
  const path = locale === "en" ? "/typing-test/5-minute" : `/${locale}/typing-test/5-minute`;
  const appSchema = buildWebApplicationSchema({
    path,
    name: "5-Minute Typing Test — HeroTyping",
    description: "Measure sustained typing endurance, Net WPM, and accuracy over 300 seconds.",
  });
  const faqSchema = buildFaqSchema(FAQ_ITEMS);

  const breadcrumbs = [
    { name: "Typing Test", path: "/" },
    { name: "5-Minute Typing Test", path: "/typing-test/5-minute" },
  ];

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-4 sm:px-8 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 w-full">
          <Breadcrumbs items={breadcrumbs} locale={locale} />
        </div>

        {/* Page Header */}
        <header className="mb-6 flex w-full flex-col items-center text-center">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            5-Minute Typing Test
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sub sm:text-base">
            An extended duration test to evaluate typing stamina, pacing, and focus.
            Countdown begins automatically on your first keystroke.
          </p>
        </header>

        {/* Interactive Typing Test Tool */}
        <section aria-label="5-Minute Typing Test Tool" className="w-full">
          <TypingTestClient initialMode="time" initialTimeDuration={300} />
        </section>

        {/* Educational Content */}
        <article className="mt-14 flex w-full flex-col gap-10 text-left">
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Sustained Typing Speed &amp; Stamina Evaluation
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              The 5-minute typing test evaluates consistency and endurance over an extended typing window.
              While anyone can sustain an artificial sprint for 30 seconds, maintaining steady output for 300 seconds
              requires genuine muscle memory, postural discipline, and calm pacing.
            </p>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              On HeroTyping, your test is evaluated in real time using standard Net WPM formulas:
              <code className="mx-1 rounded bg-sub-alt/40 px-1.5 py-0.5 text-xs text-accent">Net WPM = ((All Characters / 5) - Uncorrected Errors) / 5.0</code>.
              This follows standard net words per minute calculation where each uncorrected mistake incurs a 1-WPM deduction.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Professional Employment Benchmarks (5-Minute Duration)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-border">
                <thead>
                  <tr className="bg-sub-alt/40 border-b border-border">
                    <th className="p-3 font-semibold text-foreground text-sm">Industry / Role</th>
                    <th className="p-3 font-semibold text-foreground text-sm">Passing Standard</th>
                    <th className="p-3 font-semibold text-foreground text-sm">Accuracy Threshold</th>
                    <th className="p-3 font-semibold text-foreground text-sm">Testing Agency Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border text-xs sm:text-sm">
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Civil Service &amp; Clerical</td>
                    <td className="p-3 text-sub">40 – 45 Net WPM</td>
                    <td className="p-3 text-sub">95%+</td>
                    <td className="p-3 text-sub">State and municipal government administrative examinations.</td>
                  </tr>
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">911 Public Safety Dispatch</td>
                    <td className="p-3 text-sub">45 – 55 Net WPM</td>
                    <td className="p-3 text-sub">96%+</td>
                    <td className="p-3 text-sub">CritiCall emergency communication entry test.</td>
                  </tr>
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Legal Secretary &amp; Paralegal</td>
                    <td className="p-3 text-sub">60 – 70 Net WPM</td>
                    <td className="p-3 text-sub">98%+</td>
                    <td className="p-3 text-sub">Litigation document production and court filing transcription.</td>
                  </tr>
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Medical Transcriptionist</td>
                    <td className="p-3 text-accent font-semibold">70 – 85+ Net WPM</td>
                    <td className="p-3 text-sub">99%+</td>
                    <td className="p-3 text-sub">Clinical dictation where typographical mistakes carry medical liability.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Explore All Standardized Typing Assessments
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
              <Link
                href="/typing-test/30-seconds"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">30-Second Typing Test</div>
                <div className="text-xs text-sub mt-1">Isolate peak reflex velocity and immediate word chunking.</div>
              </Link>
              <Link
                href="/typing-test/1-minute"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">1-Minute Typing Test</div>
                <div className="text-xs text-sub mt-1">The universal benchmark for daily progress tracking.</div>
              </Link>
              <Link
                href="/typing-test/3-minute"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">3-Minute Typing Test</div>
                <div className="text-xs text-sub mt-1">Mid-length test evaluating pacing consistency and rhythm.</div>
              </Link>
              <Link
                href="/typing-test/custom-text"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">Custom Text Typing Test</div>
                <div className="text-xs text-sub mt-1">Upload your own legal briefs, technical papers, or prose.</div>
              </Link>
            </div>
          </section>

          <section className="flex flex-col gap-4 border-t border-border pt-8">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Frequently Asked Questions
            </h2>
            <dl className="flex flex-col gap-6">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question} className="flex flex-col gap-1.5">
                  <dt className="text-sm font-semibold text-foreground sm:text-base">{item.question}</dt>
                  <dd className="text-xs leading-relaxed text-sub sm:text-sm">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        </article>
      </div>
    </div>
  );
}

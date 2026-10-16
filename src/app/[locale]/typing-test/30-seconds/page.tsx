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
    title: "30-Second Typing Test: Sprint Speed Check",
    description:
      "Take a fast 30-second typing test on HeroTyping. Measure your rapid sprint WPM, burst keystroke cadence, and immediate reflex accuracy in half a minute.",
    path: "/typing-test/30-seconds",
  });
}

const FAQ_ITEMS = [
  {
    question: "Why take a 30-second typing test instead of 1 minute?",
    answer:
      "A 30-second test isolates your maximum neuromotor burst speed and raw reflex execution without muscular fatigue. It is ideal for warming up, testing keyboard switches, and checking burst WPM before tackling longer benchmark runs.",
  },
  {
    question: "Is 30-second typing test speed usually higher than 1-minute speed?",
    answer:
      "Yes. Most typists score 5 to 10 WPM higher on a 30-second test because cognitive stamina, mental focus, and finger extensor fatigue have not yet begun to accumulate.",
  },
  {
    question: "What is a good score on a 30-second typing test?",
    answer:
      "A score between 40 and 60 Net WPM is average for everyday computer users. Speeds between 65 and 85 WPM represent strong proficiency, while 90+ WPM places you in the top 5% of typists.",
  },
  {
    question: "How is my 30-second score calculated?",
    answer:
      "HeroTyping counts all attempted characters, normalizes every 5 characters into one standard word, deducts uncorrected errors, and divides by 0.5 minutes (30 seconds) to compute your accurate Net WPM.",
  },
];

export default async function ThirtySecondsTypingTestPage({ params }: { params?: Promise<{ locale: string }> }) {
  const resolvedParams = params ? await params : undefined;
  const locale = resolvedParams?.locale ?? "en";
  const path = locale === "en" ? "/typing-test/30-seconds" : `/${locale}/typing-test/30-seconds`;
  const appSchema = buildWebApplicationSchema({
    path,
    name: "30-Second Typing Test — HeroTyping",
    description: "Measure your burst typing speed and accuracy in a rapid 30-second sprint test.",
  });
  const faqSchema = buildFaqSchema(FAQ_ITEMS);

  const breadcrumbs = [
    { name: "Typing Test", path: "/" },
    { name: "30-Second Typing Test", path: "/typing-test/30-seconds" },
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
            30-Second Typing Test
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sub sm:text-base">
            Test your sprint typing speed and burst accuracy over 30 seconds.
            Timer begins automatically when you type your first character.
          </p>
        </header>

        {/* Interactive Typing Test Tool */}
        <section aria-label="30-Second Typing Test Tool" className="w-full">
          <TypingTestClient initialMode="time" initialTimeDuration={30} />
        </section>

        {/* Explanatory Content */}
        <article className="mt-14 flex w-full flex-col gap-10 text-left">
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              What the 30-Second Sprint Test Evaluates
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              The 30-second typing test is a high-intensity sprint drill. Unlike multi-minute tests that evaluate
              muscular endurance and sustained pacing, a 30-second run measures your <strong>peak motor reflex speed</strong>—how
              rapidly your nervous system transforms visual word chunks into immediate finger strokes.
            </p>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              Because 30 seconds is too short for physical hand fatigue to develop, it provides an unclouded baseline
              of your raw keystroke mechanics. If your 30-second test is 75 WPM but your 5-minute score collapses to 45 WPM,
              you know your limitation is pacing stamina, not hand speed.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              30-Second Speed Benchmarks &amp; Percentiles
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-border">
                <thead>
                  <tr className="bg-sub-alt/40 border-b border-border">
                    <th className="p-3 font-semibold text-foreground text-sm">Skill Tier</th>
                    <th className="p-3 font-semibold text-foreground text-sm">30s Sprint WPM</th>
                    <th className="p-3 font-semibold text-foreground text-sm">Characteristics</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border text-xs sm:text-sm">
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Beginner</td>
                    <td className="p-3 text-sub">20 – 35 WPM</td>
                    <td className="p-3 text-sub">Letter-by-letter searching; frequent glances down at keyboard.</td>
                  </tr>
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Intermediate</td>
                    <td className="p-3 text-sub">40 – 55 WPM</td>
                    <td className="p-3 text-sub">Established home row placement; occasional stalls on punctuation or numbers.</td>
                  </tr>
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Proficient</td>
                    <td className="p-3 text-sub">60 – 75 WPM</td>
                    <td className="p-3 text-sub">Fluid word chording; consistent cadence across familiar vocabulary.</td>
                  </tr>
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Advanced</td>
                    <td className="p-3 text-accent font-semibold">80 – 100+ WPM</td>
                    <td className="p-3 text-sub">Subconscious touch typing; fingers move 2–3 words ahead of conscious thought.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Compare Other Test Durations
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              For comprehensive training, rotate through all standardized assessment durations:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
              <Link
                href="/typing-test/1-minute"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">1-Minute Typing Test</div>
                <div className="text-xs text-sub mt-1">The global standard benchmark test for everyday skill evaluation.</div>
              </Link>
              <Link
                href="/typing-test/3-minute"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">3-Minute Typing Test</div>
                <div className="text-xs text-sub mt-1">Medium-duration test evaluating consistent rhythm and mistake recovery.</div>
              </Link>
              <Link
                href="/typing-test/5-minute"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">5-Minute Typing Test</div>
                <div className="text-xs text-sub mt-1">Professional civil service and enterprise data entry exam benchmark.</div>
              </Link>
              <Link
                href="/typing-test/custom-text"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">Custom Text Typing Test</div>
                <div className="text-xs text-sub mt-1">Practice with your own documents, code snippets, or literature.</div>
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

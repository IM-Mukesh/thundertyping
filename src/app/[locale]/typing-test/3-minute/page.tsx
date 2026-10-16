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
    title: "3-Minute Typing Test: Endurance Speed Check",
    description:
      "Take a free 3-minute typing test on HeroTyping. Test your sustained typing pace, consistency, and typing endurance over 180 seconds with live accuracy scoring.",
    path: "/typing-test/3-minute",
  });
}

const FAQ_ITEMS = [
  {
    question: "What does a 3-minute typing test measure?",
    answer:
      "A 3-minute test measures sustained cognitive focus and typing cadence. It reveals whether you can maintain high accuracy without pacing burnout, hand strain, or sudden burst-and-stall speed drops.",
  },
  {
    question: "Why do typing test scores drop between minute 1 and minute 3?",
    answer:
      "Scores often drop by 5 to 10% on a 3-minute test due to muscular fatigue in forearm extensor tendons and micro-hesitations caused by accumulated typing errors. Consistent daily practice builds the physical stamina needed to maintain a flat velocity curve.",
  },
  {
    question: "What is an acceptable typing speed for a 3-minute test?",
    answer:
      "For corporate office workers and administrative roles, 45 to 60 Net WPM at 96%+ accuracy is standard. For paralegals, medical transcriptionists, and software engineers, 65 to 80+ Net WPM is expected.",
  },
  {
    question: "How should I pace myself during a 3-minute test?",
    answer:
      "Start 5 WPM below your peak speed during the first 30 seconds. Focus on rhythm and flawless accuracy. Once your fingers warm up and settle into the text flow, gently increase your tempo across minutes two and three.",
  },
];

export default async function ThreeMinuteTypingTestPage({ params }: { params?: Promise<{ locale: string }> }) {
  const resolvedParams = params ? await params : undefined;
  const locale = resolvedParams?.locale ?? "en";
  const path = locale === "en" ? "/typing-test/3-minute" : `/${locale}/typing-test/3-minute`;
  const appSchema = buildWebApplicationSchema({
    path,
    name: "3-Minute Typing Test — HeroTyping",
    description: "Measure your sustained typing endurance, Net WPM, and accuracy over 180 seconds.",
  });
  const faqSchema = buildFaqSchema(FAQ_ITEMS);

  const breadcrumbs = [
    { name: "Typing Test", path: "/" },
    { name: "3-Minute Typing Test", path: "/typing-test/3-minute" },
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
            3-Minute Typing Test
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sub sm:text-base">
            Evaluate your sustained typing rhythm and accuracy across a full 180-second session.
            Timer begins automatically when you press your first key.
          </p>
        </header>

        {/* Interactive Typing Test Tool */}
        <section aria-label="3-Minute Typing Test Tool" className="w-full">
          <TypingTestClient initialMode="time" initialTimeDuration={180} />
        </section>

        {/* Educational Content */}
        <article className="mt-14 flex w-full flex-col gap-10 text-left">
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Why 3 Minutes Reveals Your True Typing Consistency
            </h2>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              While a 30-second or 1-minute test evaluates short-burst capability, the 3-minute typing test evaluates
              <strong> mental endurance and motor stamina</strong>. In real workplace environments—drafting emails,
              authoring reports, or writing code—you rarely type in isolated 30-second sprints. You type continuously for
              several minutes at a time.
            </p>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              A 3-minute test exposes pacing flaws: typists who rush at the start frequently hit an error around 90 seconds,
              panic, and suffer an escalating spiral of typos that ruins their Net WPM. Maintaining a calm, metronomic cadence
              is the secret to conquering longer tests.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              3-Minute Pacing Benchmarks
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-border">
                <thead>
                  <tr className="bg-sub-alt/40 border-b border-border">
                    <th className="p-3 font-semibold text-foreground text-sm">Proficiency Level</th>
                    <th className="p-3 font-semibold text-foreground text-sm">3-Min Net WPM</th>
                    <th className="p-3 font-semibold text-foreground text-sm">Expected Accuracy</th>
                    <th className="p-3 font-semibold text-foreground text-sm">Workplace Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border text-xs sm:text-sm">
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Entry Level</td>
                    <td className="p-3 text-sub">30 – 40 WPM</td>
                    <td className="p-3 text-sub">94% – 96%</td>
                    <td className="p-3 text-sub">Basic administrative tasks and light data entry.</td>
                  </tr>
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Competent</td>
                    <td className="p-3 text-sub">45 – 60 WPM</td>
                    <td className="p-3 text-sub">96% – 98%</td>
                    <td className="p-3 text-sub">Standard corporate office requirement across most industries.</td>
                  </tr>
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Advanced</td>
                    <td className="p-3 text-sub">65 – 80 WPM</td>
                    <td className="p-3 text-sub">98%+</td>
                    <td className="p-3 text-sub">Software developers, copywriters, and legal assistants.</td>
                  </tr>
                  <tr className="hover:bg-sub-alt/20">
                    <td className="p-3 font-medium text-foreground">Mastery</td>
                    <td className="p-3 text-accent font-semibold">85 – 100+ WPM</td>
                    <td className="p-3 text-sub">99%+</td>
                    <td className="p-3 text-sub">Medical transcriptionists, executive secretaries, and competitive typists.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
              Rotate Across Standard Test Windows
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
              <Link
                href="/typing-test/30-seconds"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">30-Second Typing Test</div>
                <div className="text-xs text-sub mt-1">High-speed sprint check measuring raw finger reflex speed and reaction time.</div>
              </Link>
              <Link
                href="/typing-test/1-minute"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">1-Minute Typing Test</div>
                <div className="text-xs text-sub mt-1">Standardized assessment window for global skill benchmarking.</div>
              </Link>
              <Link
                href="/typing-test/5-minute"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">5-Minute Typing Test</div>
                <div className="text-xs text-sub mt-1">Extended test duration for measuring sustained typing endurance.</div>
              </Link>
              <Link
                href="/typing-test/custom-text"
                className="p-4 rounded-xl border border-border bg-sub-alt/20 hover:border-accent transition-colors block"
              >
                <div className="text-sm font-semibold text-foreground">Custom Text Typing Test</div>
                <div className="text-xs text-sub mt-1">Practice custom paragraphs, code files, or study material.</div>
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

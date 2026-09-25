import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { SourceList } from "@/components/content/source-list";
import { LESSON_LIST } from "@/lib/lessons/lesson-types";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = pageMetadata({
  title: "Free Typing Resources for Teachers (Curriculum, Plans, Activities)",
  description:
    "A free, no-signup typing curriculum for the classroom: a week-by-week lesson plan built from 28 real units, activities, assessment ideas, and honest benchmarks.",
  path: "/guides/typing-resources-for-teachers",
});

const PUBLISHED = "2026-09-25";
const UPDATED = "2026-09-25";

// Grouped straight from the real curriculum -- LESSON_LIST is the same
// source of truth the /lessons route and its unlock-gating logic use, so
// this plan can never list a unit that doesn't exist or drift out of the
// order students actually take it in.
const LESSONS_PER_WEEK = 3;
const WEEKLY_PLAN: { week: number; lessons: string[] }[] = [];
for (let i = 0; i < LESSON_LIST.length; i += LESSONS_PER_WEEK) {
  WEEKLY_PLAN.push({
    week: WEEKLY_PLAN.length + 1,
    lessons: LESSON_LIST.slice(i, i + LESSONS_PER_WEEK).map((l) => l.name),
  });
}

const GRADE_BENCHMARKS = [
  { band: "Grades 3–5", range: "15–25 WPM", note: "Should not be expected to type faster than the student can write by hand." },
  { band: "Grades 6–8", range: "25–40 WPM", note: "Accuracy matters more than speed at this stage — aim for 90%+ before chasing WPM." },
  { band: "Grades 9–12", range: "35–55 WPM", note: "Approaching typical adult casual-typing range by the end of high school." },
];

const ROUTINES = [
  { minutes: "10 minutes (daily bell-ringer)", plan: "One lesson step or one short accuracy-focused test. Consistent daily reps beat one long weekly session." },
  { minutes: "20 minutes (typing-block day)", plan: "Warm-up lesson step, a timed test, then five minutes of a typing game for a lower-pressure cooldown." },
  { minutes: "40–45 minutes (dedicated computer-lab period)", plan: "Two lesson steps, a longer timed test for the week's progress log, and vocabulary practice or a game for whatever time is left." },
];

const ACTIVITIES = [
  {
    title: "Baseline and re-test",
    detail:
      `Run a same-duration typing test on day one, log WPM and accuracy, then repeat it every 2–4 weeks under the same conditions. The comparison across tests over time tells you far more than any single score — see the typing test duration guide for which length to standardize on.`,
  },
  {
    title: "Accuracy-first practice days",
    detail:
      "One day a week, tell students their goal is a clean run, not a fast one — no score wins that day, only accuracy. This directly counters the instinct to rush that causes most classroom typing errors.",
  },
  {
    title: "Weak-key spotlight",
    detail:
      "After a test, have students note which specific letters or combinations tripped them up (not just their overall score) and spend the next short session drilling only those, using vocabulary practice or custom text on the typing test for unfamiliar words.",
  },
  {
    title: "Low-stakes typing races",
    detail:
      "Typing games turn practice time into something students choose to do rather than endure, without you needing to build or grade anything — useful as a reward block or a Friday cooldown.",
  },
  {
    title: "Whole-class finger-map check",
    detail:
      "Project the touch-typing finger map and have students find a few keys aloud together before a lesson — a two-minute warm-up that reinforces the finger assignments visually.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Does HeroTyping require student accounts or sign-up?",
    answer:
      `No. Every part of ${SITE_NAME} — lessons, tests, games, vocabulary practice — works with no account, and progress is saved only in each student's own browser (localStorage), not on a server. That also means there's no built-in class roster or teacher dashboard: tracking a class's progress currently means students self-report their own result screen (a screenshot, or a number copied into a shared log), not something the site centralizes for you.`,
    plainAnswer:
      "No sign-up anywhere on the site. Progress saves per-browser, not to a server, so there's no built-in class roster — students self-report results to you.",
  },
  {
    question: "What typing speed should my students be hitting?",
    answer:
      "There's no single official standard — state and district requirements vary, and many leave the exact number open. The ranges above are widely-cited classroom benchmarks compiled from keyboarding-rate research rather than a government mandate; treat them as a reasonable compass, and defer to your own school or district's stated requirements where they exist.",
    plainAnswer:
      "No single official standard exists. Use the ranges above as a general compass and defer to your school/district's own requirements where they exist.",
  },
  {
    question: "How long should a classroom typing test be?",
    answer:
      "A 1-minute test is a practical default for a quick weekly check; a longer test (3–5 minutes) gives a truer picture of sustained speed if you have the class time for it. See the typing test duration guide for the full trade-off.",
    plainAnswer: "1 minute for a quick weekly check; 3–5 minutes for a truer sustained-speed picture.",
  },
  {
    question: "Is this suitable for younger students?",
    answer:
      "The lessons start from locating individual home-row keys by feel, with no reading level assumed beyond recognizing letters — appropriate for most elementary classrooms. The games and vocabulary practice use everyday English words; review them yourself first if you want to confirm they fit your specific age group.",
    plainAnswer:
      "Lessons start from individual home-row keys with no advanced reading level required, suiting most elementary classrooms — review games/vocabulary yourself for your specific age group.",
  },
];

export default function TypingResourcesForTeachersPage() {
  const schema = buildArticleSchema({
    headline: "Free Typing Resources for Teachers",
    description:
      "A free, no-signup typing curriculum for the classroom: a week-by-week lesson plan, activities, assessment ideas, and honest benchmarks.",
    path: "/guides/typing-resources-for-teachers",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Free Typing Resources for Teachers"
        subtitle="A real curriculum built from 28 actual lessons, not a list of links — free, no accounts, nothing to grade."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Free Typing Resources for Teachers", path: "/guides/typing-resources-for-teachers" },
        ]}
        toc={[
          { id: "whats-here", label: "What's here" },
          { id: "weekly-plan", label: "Week-by-week plan" },
          { id: "routines", label: "Classroom routines" },
          { id: "activities", label: "Activities" },
          { id: "assessment", label: "Assessment ideas" },
          { id: "tracking", label: "Progress tracking" },
          { id: "benchmarks", label: "Speed benchmarks" },
          { id: "reference", label: "Printable reference" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Quick answer">
          <p>
            {SITE_NAME} has a free, 28-lesson touch-typing curriculum, typing tests, games, and
            vocabulary practice — no accounts, no cost, nothing to install. The plan below
            turns that into roughly a school term&apos;s worth of pacing, plus classroom activities and
            assessment ideas you can use starting today.
          </p>
        </Callout>

        <h2 id="whats-here">What&apos;s here</h2>
        <p>
          This isn&apos;t a links page. It&apos;s a suggested pace through {SITE_NAME}&apos;s real 28-unit
          curriculum, built directly from the same lesson list the site itself uses — so it
          never references a unit that&apos;s been renamed or doesn&apos;t exist — plus practical
          classroom activities, assessment framing, and honest speed benchmarks with their source
          named, not invented for this page.
        </p>

        <h2 id="weekly-plan">Week-by-week plan</h2>
        <p>
          Three lessons a week is a starting pace, not a rule — slower classes should simply
          spread this further, and faster ones can double up. Each lesson itself is broken into
          several graduated steps on the site, so “one lesson” is rarely a single
          five-minute activity.
        </p>
        <div className="flex flex-col gap-2">
          {WEEKLY_PLAN.map((row) => (
            <div key={row.week} className="rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                Week {row.week}
              </p>
              <p className="mt-1 text-sm text-sub">{row.lessons.join(" · ")}</p>
            </div>
          ))}
        </div>
        <p>
          Explore the full curriculum at <Link href="/lessons">/lessons</Link> — each unit
          shows an on-screen keyboard and hand diagram live while a student types, so the
          technique is reinforced during practice, not just explained beforehand.
        </p>

        <h2 id="routines">Classroom routines by time available</h2>
        <div className="flex flex-col gap-3">
          {ROUTINES.map((row) => (
            <div key={row.minutes} className="rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="text-sm font-medium text-foreground">{row.minutes}</p>
              <p className="mt-1 text-sm leading-relaxed text-sub">{row.plan}</p>
            </div>
          ))}
        </div>

        <h2 id="activities">Activities</h2>
        <div className="flex flex-col gap-3">
          {ACTIVITIES.map((row) => (
            <div key={row.title} className="rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="text-sm font-medium text-foreground">{row.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-sub">{row.detail}</p>
            </div>
          ))}
        </div>
        <p>
          <Link href="/games">Typing games</Link> and{" "}
          <Link href="/vocabulary">vocabulary practice</Link> both work well as the lower-pressure
          half of a session — real practice time that doesn&apos;t feel like a drill to a student.
        </p>

        <h2 id="assessment">Assessment ideas</h2>
        <p>
          Standardize on one test duration and one text type for the whole class so results are
          actually comparable to each other and to a student&apos;s own past scores — mixing a
          15-second test one week with a 5-minute test the next makes week-over-week comparison
          meaningless. See{" "}
          <Link href="/guides/typing-test-duration-guide">which typing test duration to use</Link>{" "}
          for the trade-offs between a quick check and a truer sustained-speed measurement. Track
          both WPM and accuracy, not WPM alone — a fast, error-heavy result isn&apos;t actually
          faster once correction time is counted; see{" "}
          <Link href="/guides/how-to-improve-typing-accuracy">the accuracy guide</Link> for what to
          do when a student&apos;s accuracy is lagging their speed.
        </p>

        <h2 id="tracking">Progress tracking</h2>
        <p>
          {SITE_NAME} has no accounts and no teacher dashboard — every result lives in the
          browser that produced it, not on a server. For a classroom, that means tracking is on
          your side: a simple shared spreadsheet where students log their own WPM/accuracy after
          each test works well, or have students screenshot their results screen as a quick,
          low-effort record. It&apos;s more manual than a built-in gradebook, but it also means nothing
          about a student&apos;s typing is collected or stored anywhere beyond their own device.
        </p>

        <h2 id="benchmarks">Speed benchmarks (use with caution)</h2>
        <p>
          There&apos;s no single official WPM standard for schools — state and district
          requirements vary, and many don&apos;t specify a number at all. The ranges below are
          widely-cited classroom benchmarks, compiled from keyboarding-rate research rather than a
          government or state mandate; treat them as orientation, not a grading rubric, and defer
          to your own school&apos;s requirements where they exist.
        </p>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Grade band</th>
              <th className="py-2 pr-4 font-medium text-foreground">Commonly cited range</th>
              <th className="py-2 font-medium text-foreground">Note</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {GRADE_BENCHMARKS.map((row) => (
              <tr key={row.band}>
                <td className="py-2 pr-4 font-medium text-foreground">{row.band}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{row.range}</td>
                <td className="py-2">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="reference">Printable reference</h2>
        <p>
          The <Link href="/guides/touch-typing-finger-map">touch-typing finger map</Link> includes
          two chart images sized to print or project — useful pinned up next to a lab computer
          or shown on a classroom screen during the first few lessons. The{" "}
          <Link href="/guides/wpm-cpm-kph-calculator">WPM/CPM/KPH calculator</Link> is also useful
          if you need to convert a district&apos;s typing requirement (often given in KPH) into the WPM
          number {SITE_NAME}&apos;s tests actually report.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label: "Typing.com — Classroom worksheets and printables",
              href: "https://www.typing.com/resources/printables-and-worksheets",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

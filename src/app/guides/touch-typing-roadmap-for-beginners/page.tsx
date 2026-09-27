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
  title: "A Complete Touch-Typing Roadmap for Beginners: From Zero to 60+ WPM",
  description:
    "A realistic, month-by-month roadmap for learning to touch type. Understand the 4 cognitive learning stages, milestone benchmarks, and practice schedules.",
  path: "/guides/touch-typing-roadmap-for-beginners",
});

const PUBLISHED = "2026-09-27";

const ROADMAP_STAGES = [
  {
    stage: "Month 1: The Mechanical Foundation",
    focus: "Anchoring, tactile finger placement, zero looking down, and learning all 26 alphabetic keys.",
    benchmark: "20–25 WPM at 95%+ Accuracy",
    timeCommitment: "15 minutes daily (7–8 hours total)",
    milestone: "Can type any everyday word slowly without ever glancing at your hands.",
  },
  {
    stage: "Month 2: Sub-Word Chunking",
    focus: "Common bigrams and trigrams (th, ing, ion, ed), basic punctuation, and consistent cadence.",
    benchmark: "35–45 WPM at 96%+ Accuracy",
    timeCommitment: "15–20 minutes daily (8–10 hours total)",
    milestone: "Typing speed catches up to your old hunt-and-peck speed, but with zero cognitive fatigue.",
  },
  {
    stage: "Month 3: Full Fluency & Numbers",
    focus: "Number row integration, capitals with dual Shift keys, code syntax, and longer paragraphs.",
    benchmark: "50–60 WPM at 97%+ Accuracy",
    timeCommitment: "15–20 minutes daily (8–10 hours total)",
    milestone: "Touch typing feels completely natural; you can type thoughts directly as you think them.",
  },
  {
    stage: "Month 4+: Mastery & Speed Endurance",
    focus: "High-speed flow, vocabulary expansion, stamina under 2- to 5-minute sustained typing runs.",
    benchmark: "65–80+ WPM at 98%+ Accuracy",
    timeCommitment: "10–15 minutes maintenance daily",
    milestone: "Typing exceeds average human speech speed; keyboard is an invisible extension of your mind.",
  },
];

const FAQ_ITEMS = [
  {
    question: "How long does it take an absolute beginner to learn to touch type?",
    answer:
      "Most adults learn the full keyboard without looking within 15 to 20 total hours of deliberate practice. Spread across 15 minutes a day, that translates to approximately 6 to 8 weeks to reach comfortable, confident 40 WPM touch typing.",
    plainAnswer:
      "With 15 minutes of daily practice, expect to achieve comfortable 40 WPM touch typing within 6 to 8 weeks (about 15 to 20 total practice hours).",
  },
  {
    question: "Will I get slower before I get faster?",
    answer:
      "Yes, absolutely. If you currently hunt-and-peck with two to four fingers at 35 WPM, switching to strict 10-finger touch typing will initially drop your speed to 12–18 WPM during week one. This temporary dip is completely normal: you are replacing an inefficient visual habit with an unconscious neuromuscular map.",
    plainAnswer:
      "Yes. Your speed will temporarily drop for the first 10 to 14 days as you rewire finger habits. By week four, your new touch typing will comfortably overtake your old speed.",
  },
  {
    question: "Is it possible to learn touch typing if I am an adult who has typed with bad habits for 10 years?",
    answer:
      "Yes. Adult neuroplasticity is more than capable of motor remapping. What adults struggle with is not brain adaptability, but the emotional frustration of typing slower during the initial two-week transition. Commit to strict technique for 14 days, and old habits will rapidly extinguish.",
    plainAnswer:
      "Yes. Adult brains adapt quickly to motor remapping. The only challenge is tolerating the initial speed drop without reverting to old hunt-and-peck shortcuts.",
  },
  {
    question: "What should I do if I keep looking down at the keyboard?",
    answer:
      "Place a light cloth or paper towel over your hands while practicing, or tilt your monitor slightly upward so your peripheral vision cannot catch your fingers. Focus your eyes entirely on the text on the screen. Whenever you feel lost, find the tactile bumps on 'F' and 'J' by feel alone rather than looking.",
    plainAnswer:
      "Cover your hands with a light cloth or look strictly at the screen. Use the physical bumps on F and J to re-center your hands by touch whenever you feel lost.",
  },
];

const SOURCES = [
  {
    title: "Stages of Learning and the Acquisition of Complex Perceptual Motor Skills",
    author: "Fitts, P. M., & Posner, M. I. (Human Performance, Brooks/Cole, 1967)",
    url: "https://psycnet.apa.org/record/1967-35012-000",
  },
  {
    title: "The Time Course of Perceptual and Motor Skill Learning",
    author: "Newell, K. M., & Rosenbloom, P. S. (Cognitive Skills and Their Acquisition, 1981)",
    url: "https://doi.org/10.1016/B978-0-89859-094-4.50006-2",
  },
  {
    title: "Neuroplasticity and Skill Learning in the Adult Human Motor Cortex",
    author: "Sanes, J. N., & Donoghue, J. P. (Annual Review of Neuroscience, 2000)",
    url: "https://doi.org/10.1146/annurev.neuro.23.1.393",
  },
];

export default function TouchTypingRoadmapForBeginnersPage() {
  const schema = buildArticleSchema({
    headline: "A Complete Touch-Typing Roadmap for Beginners: From Zero to 60+ WPM",
    description:
      "A realistic, month-by-month roadmap for learning to touch type. Understand the 4 cognitive learning stages, milestone benchmarks, and practice schedules.",
    path: "/guides/touch-typing-roadmap-for-beginners",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="A Complete Touch-Typing Roadmap for Beginners"
        subtitle="A realistic, milestone-driven progression path from hunting-and-pecking to fluent 60+ WPM touch typing."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Basics", path: "/guides/typing-basics" },
          { name: "Roadmap for Beginners", path: "/guides/touch-typing-roadmap-for-beginners" },
        ]}
        toc={[
          { id: "the-four-stages", label: "The four cognitive stages" },
          { id: "month-by-month-roadmap", label: "Month-by-month progression" },
          { id: "the-dip", label: "Surviving the initial speed dip" },
          { id: "hardware-and-ergonomics", label: "Essential ergonomics setup" },
          { id: "starting-your-journey", label: "How to begin today" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Realistic timeline">
          <p>
            Ignore claims that you can reach 100 WPM in one week. Genuine touch typing requires roughly 15 to 20 hours
            of distributed practice across 6 to 8 weeks to achieve effortless 40 to 50 WPM fluency without looking at
            the keyboard. Consistency beats binge practice every time.
          </p>
        </Callout>

        <Image
          src="/guides/typing-basics/touch-typing-roadmap-for-beginners/beginner-touch-typing-timeline.webp"
          alt="Four-month touch typing roadmap infographic showing milestone WPM targets and cognitive stages"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="the-four-stages">The Four Cognitive Stages of Touch Typing</h2>
        <p>
          In motor learning psychology, the landmark Fitts &amp; Posner model describes how complex physical skills
          transition from clumsy intellectual effort into unconscious automaticity. When learning to touch type,
          you will journey through four distinct stages:
        </p>

        <ol>
          <li>
            <strong>1. The Cognitive Stage (Week 1–2):</strong> Every keypress is a deliberate intellectual decision.
            You consciously remind yourself: <em>&quot;The letter R is typed by extending the left index finger
            upward and left from the F key.&quot;</em> Typing feels slow, mechanical, and mentally exhausting.
          </li>
          <li>
            <strong>2. The Associative Stage (Week 3–6):</strong> Gross errors decline sharply. You no longer think about
            individual finger movements; instead, you begin grouping letters into small clusters (like <em>th</em>,{" "}
            <em>er</em>, or <em>in</em>). Your hands start anticipating the next keystroke before the previous one
            finishes.
          </li>
          <li>
            <strong>3. The Autonomous Stage (Week 7–12):</strong> Typing becomes completely automated. You look at a word
            on screen, and your hands execute the full sequence without conscious intervention. Your mental energy is
            freed to focus on the content and meaning of your writing rather than the keyboard mechanics.
          </li>
          <li>
            <strong>4. The Flow Stage (Month 4+):</strong> You enter rhythmic flow states where keyboard interaction
            disappears entirely. Your fingers glide effortlessly at 60 to 80+ WPM with 98%+ accuracy across extended
            writing, coding, or communication sessions.
          </li>
        </ol>

        <h2 id="month-by-month-roadmap">The Month-by-Month Progression Roadmap</h2>
        <p>
          To maintain steady momentum and track whether your progress is on schedule, measure your performance against
          these monthly milestones:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Timeline Stage</th>
                <th className="p-3 font-semibold text-foreground">Core Training Focus</th>
                <th className="p-3 font-semibold text-foreground">Target Speed & Accuracy</th>
                <th className="p-3 font-semibold text-foreground">Qualitative Milestone</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {ROADMAP_STAGES.map((s) => (
                <tr key={s.stage} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{s.stage}</td>
                  <td className="p-3 text-foreground/85">{s.focus}</td>
                  <td className="p-3 font-mono text-xs text-accent">{s.benchmark}</td>
                  <td className="p-3 text-sub text-xs">{s.milestone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="the-dip">Surviving the Initial Speed Dip</h2>
        <p>
          The number one reason beginners give up on touch typing is the &quot;Learning Dip.&quot;
        </p>
        <p>
          Before starting touch typing, many people have spent years typing with an informal two- or four-finger
          &quot;hunt-and-peck&quot; style. They can often peck out emails at 30 to 40 WPM.
        </p>
        <p>
          When you force yourself to keep all ten fingers on the home row and never look down, your speed will
          immediately plummet to 15 WPM on Day 2. You will feel clumsy. You will feel an intense urge to look down
          at your keyboard just to finish an email quickly.
        </p>
        <p>
          <strong>You must resist this urge.</strong> The speed dip lasts only 10 to 14 days. If you revert to hunting
          and pecking during work hours, your brain never consolidates the new touch-typing pathways. Give yourself
          permission to type slowly for two weeks; the lifetime payoff of 70+ WPM typing is well worth the temporary
          patience.
        </p>

        <h2 id="hardware-and-ergonomics">Essential Ergonomics Setup</h2>
        <p>
          Good technique depends on a stable physical foundation. Before logging your practice sessions, verify your
          physical workspace:
        </p>

        <ul>
          <li>
            <strong>Elbows at 90–100 degrees:</strong> Your desk or chair height should allow your forearms to rest
            parallel to the floor or slope slightly downward toward the keyboard.
          </li>
          <li>
            <strong>Wrists floating, not planted:</strong> Never rest your wrists or palms flat against a hard desk while
            typing. Planting your wrists anchors your hands, forcing your fingers to stretch past their natural range of
            motion and compressing the carpal tunnel. See our comprehensive guide on{" "}
            <Link href="/guides/proper-typing-posture-and-ergonomics">Proper Typing Posture and Ergonomics</Link>.
          </li>
          <li>
            <strong>Display at eye level:</strong> Keep your monitor directly in front of you so your neck remains neutral.
            If your screen is too low, you will naturally look downward, which unconsciously invites your eyes to peek
            at your keyboard.
          </li>
        </ul>

        <h2 id="starting-your-journey">How to Begin Today in HeroTyping</h2>
        <p>
          Building a lifelong touch-typing habit is simple when you follow a structured system rather than random drills:
        </p>

        <ol>
          <li>
            Start with the structured curriculum: Explore the{" "}
            <Link href="/guides/touch-typing-lesson-order">Touch Typing Lesson Order</Link> or dive directly into{" "}
            <Link href="/lessons">HeroTyping Lessons</Link>.
          </li>
          <li>
            Commit to 15 minutes of practice every day. Check your{" "}
            <strong>Today&apos;s Training</strong> recommendation on your lesson dashboard.
          </li>
          <li>
            Once a week, take a standard 1-minute test on the <Link href="/">Speed Test</Link> to log your WPM benchmark
            and track your upward trendline over the months.
          </li>
        </ol>
        <p>
          For learners with handwriting fatigue, dysgraphia, or reading differences, see our specialized accommodations in{" "}
          <Link href="/guides/touch-typing-for-dyslexia-and-dysgraphia">touch typing for dyslexia and dysgraphia</Link>.
        </p>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}

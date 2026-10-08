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
  title: "How to Structure a Typing Practice Session: The 4-Phase System",
  description:
    "A structured, workout-style system for daily typing practice. Learn how to sequence physical warmups, precision drills, weak-key remediation, and speed tests.",
  path: "/guides/how-to-structure-typing-practice-session",
});

const PUBLISHED = "2026-09-27";

const SESSION_PHASES = [
  {
    phase: "Phase 1: Physical Warmup & Calibration",
    duration: "2 Minutes",
    focus: "Tendon glides, wrist circles, and 1 slow warmup test at 50% speed.",
    heroTool: "Typing Stretches Guide & Warmup Run on Speed Test",
  },
  {
    phase: "Phase 2: Curriculum Progression",
    duration: "5 Minutes",
    focus: "Deliberate skill acquisition: new finger reaches, row mastery, or punctuation exercises.",
    heroTool: "HeroTyping Lessons Dashboard (Target Lesson)",
  },
  {
    phase: "Phase 3: Weakness Remediation",
    duration: "5 Minutes",
    focus: "Targeting diagnosed bottleneck keys, troublesome bigrams, and accuracy recovery.",
    heroTool: "HeroTyping Weak-Key Practice Drill (/lessons/practice)",
  },
  {
    phase: "Phase 4: Cooldown & Evaluation",
    duration: "3 Minutes",
    focus: "One 60-second benchmark test or a 2-minute arcade typing game for flow integration.",
    heroTool: "HeroTyping Speed Test (60s) or Arcade Games",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why shouldn't I start my practice session with an all-out speed test?",
    answer:
      "Sprinting immediately with cold fingers strains forearm tendons and triggers early errors. Just as a sprinter warms up their hamstrings before running 100 meters, a typist needs 2 minutes of gentle finger stretches and slow typing to lubricate tendon sheaths and establish neural hand coordinates.",
    plainAnswer:
      "Sprinting with cold fingers causes tendon strain and sloppy mistakes. A 2-minute warmup prepares your hands and locks in clean accuracy.",
  },
  {
    question: "Should I do the exact same routine every single day?",
    answer:
      "Keep the 4-phase framework identical, but vary the content inside Phase 2 and Phase 3. On Monday, focus Phase 2 on number rows; on Tuesday, focus on punctuation; on Wednesday, focus on vocabulary. Rotating content prevents boredom while maintaining deliberate progressive overload.",
    plainAnswer:
      "Keep the 4-phase structure constant, but rotate the specific drills each day to build versatile full-keyboard mastery.",
  },
  {
    question: "What should I do if Phase 3 reveals severe accuracy drops?",
    answer:
      "If your accuracy in Phase 3 drops below 90%, cut Phase 4 (speed testing) entirely. Use those final 3 minutes for slow, deliberate metronome typing at 50% speed. Never finish a session on a flurry of frustrated mistakes; always end on a clean, rhythmic run.",
    plainAnswer:
      "If accuracy collapses, skip the speed test and spend the remaining minutes typing slowly to end the session on a clean, confident note.",
  },
  {
    question: "Can I replace Phase 4 with an arcade typing game?",
    answer:
      "Yes. An arcade game like Fruit Fury or Type Defender provides excellent cognitive flow and dynamic time pressure. It is a fantastic reward to end a focused practice session.",
    plainAnswer:
      "Yes. Playing an arcade typing game at the end of your session is an engaging way to test reflexes and integrate new skills.",
  },
];

const SOURCES: never[] = [];

export default function HowToStructureTypingPracticeSessionPage() {
  const schema = buildArticleSchema({
    headline: "How to Structure a Typing Practice Session: The 4-Phase System",
    description:
      "A structured, workout-style system for daily typing practice. Learn how to sequence physical warmups, precision drills, weak-key remediation, and speed tests.",
    path: "/guides/how-to-structure-typing-practice-session",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="How to Structure a Typing Practice Session"
        subtitle="A proven, 15-minute 4-phase training template that delivers continuous WPM gains without burnout."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Typing Practice", path: "/guides/typing-practice" },
          { name: "Structure a Practice Session", path: "/guides/how-to-structure-typing-practice-session" },
        ]}
        toc={[
          { id: "the-workout-model", label: "The athletic workout model" },
          { id: "four-phase-overview", label: "The 4-phase session structure" },
          { id: "phase-breakdown", label: "Detailed phase-by-phase execution" },
          { id: "avoiding-bad-habits", label: "Three common session mistakes" },
          { id: "herotyping-ecosystem", label: "Executing the session in HeroTyping" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Training structure">
          <p>
            Treat typing like an athletic workout. You would never walk into a gym, skip the warmup, attempt your
            maximum bench press immediately, and leave. Structuring your 15 minutes into four distinct phases—Warmup,
            Curriculum, Remediation, and Cooldown—doubles your learning rate.
          </p>
        </Callout>

        <Image
          src="/guides/typing-practice/how-to-structure-typing-practice-session/practice-session-block-architecture.webp"
          alt="Four-phase workout template for a 15-minute typing session: Warmup, Curriculum, Remediation, and Cooldown"
          width={1200}
          height={675}
          priority
          className="my-6 w-full rounded-xl border border-border shadow-sm"
        />

        <h2 id="the-workout-model">The Athletic Workout Model for Typing</h2>
        <p>
          Most people approach typing practice haphazardly: they open a website, take three random speed tests, make a
          bunch of errors, get frustrated, and close the tab.
        </p>
        <p>
          This unstructured approach yields agonizingly slow progress. You cannot build speed, accuracy, and endurance
          all at the same time in the same drill. Each of these attributes requires distinct cognitive conditions:
        </p>
        <ul>
          <li><strong>Warmup:</strong> Lubricates tendons and calibrates spatial coordinates.</li>
          <li><strong>Deliberate Curriculum:</strong> Expands your conscious motor map into new keys.</li>
          <li><strong>Remediation:</strong> Identifies and fixes your unique personal error patterns.</li>
          <li><strong>Cooldown:</strong> Integrates everything into natural, unconscious flow under time pressure.</li>
        </ul>

        <h2 id="four-phase-overview">The 4-Phase 15-Minute Session Structure</h2>
        <p>
          Here is how an optimal daily 15-minute typing workout is allocated:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">Phase</th>
                <th className="p-3 font-semibold text-foreground">Time</th>
                <th className="p-3 font-semibold text-foreground">Primary Training Objective</th>
                <th className="p-3 font-semibold text-foreground">Recommended HeroTyping Tool</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {SESSION_PHASES.map((p) => (
                <tr key={p.phase} className="hover:bg-sub-alt/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{p.phase}</td>
                  <td className="p-3 font-mono text-xs text-accent font-semibold">{p.duration}</td>
                  <td className="p-3 text-foreground/85 text-xs">{p.focus}</td>
                  <td className="p-3 text-sub text-xs">{p.heroTool}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="phase-breakdown">Detailed Phase-by-Phase Execution</h2>

        <h3>Phase 1: Warmup &amp; Calibration (2 Minutes)</h3>
        <p>
          Start with 60 seconds of gentle tendon glides and finger spreads. If your hands are cold, run them under warm
          water or rub your palms together. Then take one 60-second test on the <Link href="/">Speed Test</Link> at
          exactly 50% of your maximum speed. The goal is 100% accuracy and physical relaxation.
        </p>

        <h3>Phase 2: Curriculum Progression (5 Minutes)</h3>
        <p>
          Open <Link href="/lessons">HeroTyping Lessons</Link>. Work on your current active lesson module—whether that is
          top-row reaches, bottom-row curls, numbers, or punctuation. Focus entirely on clean finger mechanics and zero
          looking down.
        </p>

        <h3>Phase 3: Weakness Remediation (5 Minutes)</h3>
        <p>
          Switch directly to the <Link href="/lessons/practice">HeroTyping Weak-Key Practice Tool</Link>. This tool
          automatically analyzes your mistakes from Phase 2 and generates customized drills around the letters you missed.
          Drill those bigrams until your accuracy on problem letters exceeds 95%.
        </p>

        <h3>Phase 4: Cooldown &amp; Evaluation (3 Minutes)</h3>
        <p>
          Finish the session with a standard 1-minute test on the <Link href="/">Speed Test</Link> to log your daily
          benchmark, or spend 3 minutes playing an arcade game like Fruit Fury or Type Defender in{" "}
          <Link href="/games">HeroTyping Games</Link>.
        </p>

        <h2 id="avoiding-bad-habits">Three Common Session Mistakes to Avoid</h2>
        <ul>
          <li>
            <strong>Mistake 1: Testing instead of practicing.</strong> Spending all 15 minutes taking speed tests
            measures what you can already do without teaching your hands anything new.
          </li>
          <li>
            <strong>Mistake 2: Typing through fatigue.</strong> If your forearms feel tight or your concentration breaks,
            do not push through it. Stop the session.
          </li>
          <li>
            <strong>Mistake 3: Neglecting ergonomics.</strong> Practicing with bad posture or planted wrists locks in
            harmful biomechanical patterns. Review our{" "}
            <Link href="/guides/proper-typing-posture-and-ergonomics">Proper Typing Posture and Ergonomics</Link> guide.
          </li>
        </ul>

        <h2 id="herotyping-ecosystem">Executing the Session in HeroTyping</h2>
        <p>
          HeroTyping integrates all four phases into a seamless, unified platform:
        </p>
        <ol>
          <li>Warm up with tendon glides: <Link href="/guides/typing-stretches-and-hand-warmups">Typing Stretches</Link>.</li>
          <li>Work on structured modules: <Link href="/lessons">Curriculum Lessons</Link>.</li>
          <li>Fix problem keys: <Link href="/lessons/practice">Adaptive Weak-Key Practice</Link>.</li>
          <li>Evaluate daily progress: <Link href="/">Live Speed Test</Link>.</li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />
        <SourceList sources={SOURCES} />
      </GuideLayout>
    </>
  );
}

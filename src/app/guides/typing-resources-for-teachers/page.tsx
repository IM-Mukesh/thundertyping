import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { SourceList } from "@/components/content/source-list";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = pageMetadata({
  title: "Free Typing Resources for Teachers: Classroom Curriculum & Lesson Plans",
  description:
    "A free, no-signup touch-typing curriculum for educators: a 9-phase pedagogical progression across 28 units, classroom routines, star-based feedback, and honest benchmarks.",
  path: "/guides/typing-resources-for-teachers",
});

const PUBLISHED = "2026-09-25";
const UPDATED = "2026-09-28";

interface CurriculumPhase {
  phase: string;
  units: string;
  focus: string;
  classroomGoal: string;
}

const CURRICULUM_PHASES: CurriculumPhase[] = [
  {
    phase: "Phase 1: Home-Row Anchors & Outward Pairs",
    units: "Units 1–5",
    focus: "F & J index bumps, D & K middle fingers, S & L ring fingers, A & semicolon pinkies, G & H center reaches.",
    classroomGoal: "Students build tactile orientation on the physical anchor nibs and learn to return their hands to home position without looking down.",
  },
  {
    phase: "Phase 2: Home-Row Consolidation",
    units: "Unit 6",
    focus: "Consolidation drill across all 10 home keys with real English words (all, fall, salad, flask, glad, dash).",
    classroomGoal: "Locks in clean finger independence across both hands before introducing any reaches to other keyboard rows.",
  },
  {
    phase: "Phase 3: Top-Row Vertical Reaches",
    units: "Units 7–11",
    focus: "Symmetrical paired reaches: E & I vowels, R & U index reaches, T & Y center stretches, W & O ring reaches, Q & P pinkies.",
    classroomGoal: "Students extend fingers upward smoothly while keeping wrist posture stable and resting fingers anchored.",
  },
  {
    phase: "Phase 4: Upper-Deck & Home Consolidation",
    units: "Unit 12",
    focus: "Comprehensive review integrating all 20 home-row and top-row keys across natural words and common bigrams.",
    classroomGoal: "Eliminates hesitation when transitioning between rows, cementing fluid hand alternation.",
  },
  {
    phase: "Phase 5: Bottom-Row Curls & Punctuation",
    units: "Units 13–16",
    focus: "Downward finger flexion curls: V & M index, C & comma middle, X & period ring, Z & slash pinkies.",
    classroomGoal: "Develops controlled downward finger flexion without collapsing wrists onto the desk surface, adding sentence-ending punctuation.",
  },
  {
    phase: "Phase 6: Alphabet Complete Checkpoint",
    units: "Unit 17",
    focus: "B & N center stretches, unlocking all 26 letters of the English alphabet plus core punctuation.",
    classroomGoal: "Full alphabetic mastery milestone. Students can now type arbitrary English vocabulary by feel alone.",
  },
  {
    phase: "Phase 7: Shift Mechanics & Natural Sentences",
    units: "Unit 18",
    focus: "The opposite-hand Shift rule, sentence capitalization, commas, and natural punctuation rhythm.",
    classroomGoal: "Transitions students from isolated word drills into natural, capitalized English prose.",
  },
  {
    phase: "Phase 8: Number Row Paired Reaches",
    units: "Units 19–23",
    focus: "Two-row vertical reaches paired across hands: 4 & 7, 3 & 8, 2 & 9, 1 & 0, and 5 & 6 checkpoint.",
    classroomGoal: "Extends spatial coordination to the number row while anchoring the non-striking hand to prevent hand drift.",
  },
  {
    phase: "Phase 9: Practical Syntax, Stamina & Graduation",
    units: "Units 24–28",
    focus: "Symbols (! ? ' \" : -), top 200 bigram cadence, multi-paragraph stamina, code syntax, and the comprehensive graduation assessment.",
    classroomGoal: "Prepares learners for real-world high school and professional typing demands under variable time pressure.",
  },
];

const GRADE_BENCHMARKS = [
  {
    band: "Grades 3–5",
    range: "15–25 WPM",
    note: "Focus primarily on proper finger placement and blind touch technique. Keyboarding speed should not be expected to exceed handwriting speed.",
  },
  {
    band: "Grades 6–8",
    range: "25–40 WPM",
    note: "Prioritize consistent 90%+ accuracy over peak bursts. Fluent touch typing on the alphabet should become automatic before high school.",
  },
  {
    band: "Grades 9–12",
    range: "35–55 WPM",
    note: "Approaches typical adult casual-to-professional typing ranges. Students should handle full capitalization, numbers, and basic punctuation smoothly.",
  },
];

const ROUTINES = [
  {
    minutes: "10 minutes (Daily bell-ringer / Warm-up)",
    plan: "One focused lesson step or a targeted weak-key review. Daily 10-minute micro-sessions build muscle memory far more effectively than a single 50-minute weekly block.",
  },
  {
    minutes: "20 minutes (Dedicated typing block)",
    plan: "5 minutes of physical finger warmups, one curriculum lesson module, and 5 minutes on an arcade game (such as Fruit Fury) or a 1-minute speed test for a low-pressure cooldown.",
  },
  {
    minutes: "40–45 minutes (Full computer-lab period)",
    plan: "Warmup stretches, two curriculum lesson steps with result debriefs, 10 minutes in the targeted Practice Lab on diagnosed weak keys, a standardized 1-minute benchmark test, and vocabulary typing.",
  },
];

const ACTIVITIES = [
  {
    title: "Diagnostic placement at term start",
    detail:
      "Have students take the 60-second diagnostic placement assessment on the Lessons dashboard on day one. Students who already touch type comfortably can test out of basic home-row drills and start at their true skill level without unnecessary busywork.",
  },
  {
    title: "Accuracy-first challenge days",
    detail:
      "Dedicate one class period per week to pure accuracy: no WPM scores count, only runs with 96%+ accuracy. This counters the common classroom impulse to mash keys frantically and teaches students that speed naturally emerges from clean finger paths.",
  },
  {
    title: "Weak-key spotlight & remediation",
    detail:
      "When the lesson completion modal flags specific problem keys (such as confusing E and R or struggling with pinky reach to P), have students open the targeted Practice Lab (/lessons/practice) to drill those exact letters before attempting their next lesson.",
  },
  {
    title: "Low-stakes reflex games as reward blocks",
    detail:
      "Arcade typing games like Fruit Fury or Falling Words provide stress inoculation and dynamic time pressure. Use them as an engaging Friday reward or a 5-minute cooldown after intense precision drills.",
  },
  {
    title: "Whole-class finger-map calibration",
    detail:
      "Project the interactive touch-typing finger map on your whiteboard before class starts. Call out letters aloud and have students hold up the corresponding finger, cementing finger-to-key associations before their fingers touch the keyboard.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Does HeroTyping require student accounts, logins, or software installation?",
    answer:
      `No. Every part of ${SITE_NAME} — including the 28-unit lesson curriculum, diagnostic placement test, targeted practice lab, speed tests, vocabulary practice, and games — runs directly in any modern web browser with zero accounts, zero passwords, and no software installation.`,
    plainAnswer:
      "No accounts, logins, or installation needed. Everything runs in the browser for free.",
  },
  {
    question: "How can I track student progress without a centralized teacher dashboard?",
    answer:
      "Because HeroTyping operates with a strict privacy model, all student progress is saved locally in the browser (localStorage) rather than on a central database. In a classroom, teachers easily track progress by having students submit screenshots of their Lesson Completion Modal or dashboard stats bar, or by having students record their weekly WPM and star counts in a shared Google Sheet or spreadsheet log.",
    plainAnswer:
      "Progress is saved locally on each student's device. Teachers track results via student screenshots or a shared classroom spreadsheet log.",
  },
  {
    question: "How does the lesson star system work in the classroom?",
    answer:
      "Each lesson step awards 1 to 5 stars based on motor precision and cadence. Students need at least 60% accuracy (3+ stars) to pass and unlock the next step. Scoring below 60% earns 1 or 2 stars and gently prompts a retry with specific finger-placement feedback. Scores of 94%+ accuracy with 25+ WPM earn 5 stars. Remind students that stars are a formative learning signal to guide practice, not academic letter grades.",
    plainAnswer:
      "Students need 60% accuracy (3+ stars) to advance. Below 60% requires a retry with feedback. Stars represent practice milestones, not report-card grades.",
  },
  {
    question: "What typing speed standards should I hold students to?",
    answer:
      "No single federal or state standard dictates mandatory typing speeds. Benchmark ranges published in keyboarding education literature suggest roughly 15–25 WPM for upper elementary, 25–40 WPM for middle school, and 35–55 WPM for high school. Treat these as approximate reference ranges rather than rigid grading bars, and always prioritize accuracy and proper ergonomics over raw speed.",
    plainAnswer:
      "Use reference ranges (15–25 WPM elementary, 25–40 WPM middle school, 35–55 WPM high school) as guidance rather than strict grading criteria.",
  },
  {
    question: "Can students use HeroTyping on Chromebooks or tablets?",
    answer:
      "HeroTyping is fully optimized for Chromebooks and desktop computers with physical keyboards. While the site functions on tablets with responsive touch keyboards, learning touch typing requires physical tactile feedback and home-row bumps, so an external physical keyboard is strongly recommended for classroom instruction.",
    plainAnswer:
      "Chromebooks and computers with physical keyboards are ideal. Tablets work best with an attached physical keyboard for touch-typing feedback.",
  },
];

export default function TypingResourcesForTeachersPage() {
  const schema = buildArticleSchema({
    headline: "Free Typing Resources for Teachers: Classroom Curriculum & Lesson Plans",
    description:
      "A free, no-signup touch-typing curriculum for educators: a 9-phase pedagogical progression across 28 units, classroom routines, star-based feedback, and honest benchmarks.",
    path: "/guides/typing-resources-for-teachers",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Free Typing Resources for Teachers"
        subtitle="A practical, classroom-tested touch-typing curriculum built on 28 structured units — 100% free, private, with no student accounts to manage."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Free Typing Resources for Teachers", path: "/guides/typing-resources-for-teachers" },
        ]}
        toc={[
          { id: "overview", label: "Classroom curriculum overview" },
          { id: "pedagogy", label: "The small-key-group model" },
          { id: "curriculum-phases", label: "The 9 curriculum phases" },
          { id: "consolidation", label: "Why consolidation matters" },
          { id: "star-system", label: "Stars, retries & progression" },
          { id: "routines", label: "Classroom routines by time" },
          { id: "activities", label: "Engaging classroom activities" },
          { id: "tracking", label: "Tracking progress without logins" },
          { id: "benchmarks", label: "Grade-band speed benchmarks" },
          { id: "accommodations", label: "Accommodations & diverse learners" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Teacher summary">
          <p>
            {SITE_NAME} provides a free, structured 28-unit touch-typing curriculum, diagnostic placement testing,
            adaptive weak-key drills, timed tests, and skill games. There are no accounts to create, no rosters to
            manage, and no student data collected. The guide below explains the pedagogical structure and shows how
            to integrate it into 10-, 20-, or 45-minute classroom blocks.
          </p>
        </Callout>

        <h2 id="overview">Classroom Curriculum Overview</h2>
        <p>
          Teaching keyboarding in modern classrooms is often frustrating: commercial typing platforms require student
          accounts, show distracting advertisements, lock lessons behind paywalls, or rely on outdated methods that
          throw eight keys at a student on day one.
        </p>
        <p>
          HeroTyping was designed around a clean, research-backed instructional model. Rather than overwhelming students
          with entire keyboard rows at once, our curriculum introduces keys in small, symmetrical pairs across 28
          graduated units. Every lesson builds on previous keys cumulatively, reinforces tactile home-row anchoring,
          and validates student work through calm, formative star ratings.
        </p>

        <h2 id="pedagogy">The Small-Key-Group Model: Maximum Two Keys at a Time</h2>
        <p>
          The most important pedagogical decision in HeroTyping is that <strong>no unit ever introduces more than two new
          alphanumeric keys</strong>. In early units, keys are introduced in symmetrical, balanced pairs:
        </p>
        <ul>
          <li><strong>Unit 1:</strong> <code>F</code> (left index) and <code>J</code> (right index) — the tactile home-row anchor bumps.</li>
          <li><strong>Unit 2:</strong> <code>D</code> (left middle) and <code>K</code> (right middle).</li>
          <li><strong>Unit 3:</strong> <code>S</code> (left ring) and <code>L</code> (right ring).</li>
          <li><strong>Unit 4:</strong> <code>A</code> (left pinky) and <code>;</code> (right pinky).</li>
          <li><strong>Unit 5:</strong> <code>G</code> (left index reach) and <code>H</code> (right index reach).</li>
        </ul>
        <p>
          In classroom practice, this small-batch approach provides four immediate advantages:
        </p>
        <ol>
          <li>
            <strong>Low cognitive friction:</strong> Students only have to learn one physical reach per hand at a time.
            Working memory is not exhausted trying to remember where seven different letters live.
          </li>
          <li>
            <strong>Immediate tactile repetition:</strong> Because only two keys are new, students get dozens of quick,
            focused repetitions in the first two minutes, building muscle memory before fatigue sets in.
          </li>
          <li>
            <strong>Clear error attribution:</strong> When a student makes a mistake, both the student and the teacher
            instantly know which finger or reach slipped, making remediation obvious.
          </li>
          <li>
            <strong>Cumulative reinforcement:</strong> New keys are immediately woven into drills alongside all previously
            learned keys, ensuring earlier keys are never forgotten.
          </li>
        </ol>

        <h2 id="curriculum-phases">The 9 Curriculum Phases Across 28 Units</h2>
        <p>
          The 28 units in HeroTyping are organized across three broad skill tiers: Beginner (Units 1–17),
          Intermediate (Units 18–23), and Advanced (Units 24–28). Teachers can adapt this sequence to match their
          term schedule:
        </p>

        <div className="flex flex-col gap-3">
          {CURRICULUM_PHASES.map((cp) => (
            <div key={cp.phase} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-foreground text-sm">{cp.phase}</p>
                <span className="font-mono text-xs font-bold text-accent rounded bg-sub-alt px-2 py-0.5">
                  {cp.units}
                </span>
              </div>
              <p className="mt-1 text-xs text-sub leading-relaxed">
                <strong>Focus:</strong> {cp.focus}
              </p>
              <p className="mt-1 text-xs text-foreground/85 leading-relaxed">
                <strong>Classroom Goal:</strong> {cp.classroomGoal}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4">
          Students can explore the full curriculum directly on the{" "}
          <Link href="/lessons">HeroTyping Lessons Dashboard</Link>. Each drill features an interactive on-screen
          keyboard highlighting hand assignments in real time, helping students verify their finger positions without
          looking down at their desk.
        </p>

        <h2 id="consolidation">Why Periodic Consolidation Units Matter</h2>
        <p>
          A common pitfall in typing software is linear progression without review: Lesson 1 leads to Lesson 2, Lesson 3,
          and Lesson 4, but by Lesson 5 the student has already forgotten Lesson 1.
        </p>
        <p>
          HeroTyping intentionally inserts dedicated <strong>Consolidation Units</strong> throughout the curriculum:
        </p>
        <ul>
          <li><strong>Unit 6 (Home Row Mastery):</strong> No new keys. Students practice real English words formed exclusively from all ten home keys (such as <em>ask, dad, fall, salad, flask</em>).</li>
          <li><strong>Unit 12 (Top &amp; Home Rows):</strong> Consolidates 20 keys across natural bigrams and trigrams before introducing bottom-row reaches.</li>
          <li><strong>Unit 17 (Alphabet Complete):</strong> Unlocks B and N, verifying complete 26-letter keyboard fluency.</li>
          <li><strong>Unit 23 (Numbers Checkpoint):</strong> Unlocks 5 and 6, cementing full-width number row navigation.</li>
        </ul>
        <p>
          These consolidation stops give slower typists an opportunity to solidify their motor patterns and prevent the
          discouraging &quot;learned it yesterday, lost it today&quot; syndrome.
        </p>

        <h2 id="star-system">Formative Star Ratings, Retries, and the 60% Progression Gate</h2>
        <p>
          HeroTyping uses a calm, educational 1-to-5 star rating system designed to encourage deliberate effort:
        </p>
        <ul>
          <li>
            <strong>3 Stars (60%+ Accuracy):</strong> Universal progression standard. Students who meet or exceed 60%
            accuracy demonstrate sufficient motor control to unlock the next step and continue forward.
          </li>
          <li>
            <strong>1–2 Stars (&lt;60% Accuracy):</strong> Indicates that excessive mistakes occurred. The lesson completion
            modal opens calmly without sudden restarts, presents an honest mistake breakdown, highlights which specific
            keys caused trouble with finger-placement tips, and invites the student to try again.
          </li>
          <li>
            <strong>4 Stars (88%+ Accuracy):</strong> Reflects strong, controlled rhythm and clean finger coordination.
          </li>
          <li>
            <strong>5 Stars (94%+ Accuracy &amp; 25+ WPM):</strong> Represents mastery-level execution with high precision
            and confident cadence (or 98%+ accuracy for beginner lessons).
          </li>
        </ul>
        <p>
          <strong>Classroom guidance for teachers:</strong> Emphasize to students that stars are practice signals, not
          report-card grades. A 2-star run simply means the hands need another minute of calibration before moving on.
          HeroTyping never shows a broken &quot;0 star&quot; screen; every completed attempt receives constructive feedback.
        </p>

        <h2 id="routines">Classroom Routines by Time Available</h2>
        <p>
          Whether typing is a 10-minute bell-ringer or a dedicated 45-minute lab class, consistent structure helps
          students settle in quickly:
        </p>
        <div className="flex flex-col gap-3">
          {ROUTINES.map((row) => (
            <div key={row.minutes} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="text-sm font-medium text-foreground">{row.minutes}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{row.plan}</p>
            </div>
          ))}
        </div>

        <h2 id="activities">Engaging Classroom Activities</h2>
        <div className="flex flex-col gap-3">
          {ACTIVITIES.map((row) => (
            <div key={row.title} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="text-sm font-medium text-foreground">{row.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{row.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-sub">
          Pairing structured curriculum drills with <Link href="/games">typing games</Link> or{" "}
          <Link href="/vocabulary">vocabulary practice</Link> provides variety while keeping students engaged throughout
          longer lab periods.
        </p>

        <h2 id="tracking">Tracking Progress Without Logins or Accounts</h2>
        <p>
          HeroTyping does not require student email addresses, passwords, or roster uploads. All data is saved strictly
          on each student&apos;s device in their browser&apos;s local storage. This eliminates student privacy compliance
          headaches (such as COPPA or FERPA concerns), but requires a practical approach to classroom accountability:
        </p>
        <ul>
          <li>
            <strong>Classroom Spreadsheet Log:</strong> Create a simple shared sheet where students log their date,
            current unit number, best WPM, and star rating at the end of each session.
          </li>
          <li>
            <strong>Screenshot Submission:</strong> At milestone checkpoints (such as Unit 6 Home Row Mastery or Unit 17
            Alphabet Complete), have students take a screenshot of their completion modal and upload it to your learning
            management system (Google Classroom, Canvas, or Seesaw).
          </li>
          <li>
            <strong>JSON Progress Portability:</strong> Students can open the Data &amp; Privacy section on their
            Lessons Dashboard to export their complete progress history as a lightweight JSON file and import it if they
            switch computers in the lab.
          </li>
        </ul>

        <h2 id="benchmarks">Grade-Band Speed Benchmarks (Use as Guidelines)</h2>
        <p>
          There is no single official government standard for typing speed in schools. Educational guidelines vary
          significantly across districts. The ranges below are widely cited in keyboarding education research as realistic
          milestones when students practice with proper 10-finger touch technique:
        </p>
        <div className="overflow-x-auto my-4">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-sub-alt/30">
                <th className="py-2.5 px-3 font-medium text-foreground">Grade Band</th>
                <th className="py-2.5 px-3 font-medium text-foreground">Typical Target Range</th>
                <th className="py-2.5 px-3 font-medium text-foreground">Instructional Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {GRADE_BENCHMARKS.map((row) => (
                <tr key={row.band} className="hover:bg-sub-alt/10">
                  <td className="py-2.5 px-3 font-medium text-foreground">{row.band}</td>
                  <td className="py-2.5 px-3 font-mono text-accent whitespace-nowrap">{row.range}</td>
                  <td className="py-2.5 px-3 text-sub text-xs leading-relaxed">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-sub">
           Always evaluate speed alongside accuracy. A student typing at 22 WPM with 97% accuracy has a far stronger
           foundation than one typing at 35 WPM with 82% accuracy. For district requirements specified in strokes per hour,
           use our <Link href="/guides/wpm-cpm-kph-calculator">WPM/CPM/KPH Calculator</Link> to convert values instantly.
           For the source context and a fuller explanation of age and grade-level benchmarks, see{" "}
           <Link href="/guides/typing-speed-by-age">typing speed by age and learning stage</Link>.
        </p>

        <h2 id="accommodations">Accommodations &amp; Diverse Learners</h2>
        <p>
          Keyboarding offers significant benefits for students with dysgraphia, dyslexia, or motor planning differences
          by replacing the fine-motor fatigue of handwriting with predictable spatial coordinates. To support diverse
          learners in the computer lab:
        </p>
        <ul>
          <li>
            Keep sessions short (10–15 minutes) to avoid cognitive fatigue.
          </li>
          <li>
            Celebrate consistency and accuracy milestones rather than high-speed rankings.
          </li>
          <li>
            Allow students to adjust font size or use high-contrast themes via the theme switcher.
          </li>
        </ul>
        <p>
          For comprehensive teaching accommodations and multisensory strategies, consult our dedicated guide on{" "}
          <Link href="/guides/touch-typing-for-dyslexia-and-dysgraphia">
            touch typing for dyslexia and dysgraphia
          </Link>.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label: "National Business Education Association (NBEA) — Keyboarding Standards and Curriculum Guidelines",
              href: "https://nbea.org/",
            },
            {
              label: "Journal of Educational Computing Research — Elementary Touch Typing and Academic Achievement",
              href: "https://journals.sagepub.com/home/jec",
            },
            {
              label: "British Dyslexia Association — Assistive Technology and Touch Typing Interventions",
              href: "https://www.bdadyslexia.org.uk/",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

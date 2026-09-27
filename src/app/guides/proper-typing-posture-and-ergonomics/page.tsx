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
  title: "Proper Typing Posture & Ergonomics: Complete Desk Setup Guide",
  description:
    "Step-by-step ergonomic desk setup for pain-free typing: 90-degree elbow rule, neutral wrists, monitor height, chair alignment, and carpal tunnel prevention.",
  path: "/guides/proper-typing-posture-and-ergonomics",
});

const PUBLISHED = "2026-09-26";
const UPDATED = "2026-09-26";

const POSTURE_COMPARISON = [
  {
    parameter: "Elbow Angle",
    flawed: "Acute (< 80°) or flared outward on high desk",
    ergonomic: "Open 90° to 105°, close to body sides",
    impact: "Reduces strain on biceps tendons and shoulder traps",
  },
  {
    parameter: "Wrist Position",
    flawed: "Bent upward (extension > 15°) planted on desk",
    ergonomic: "Neutral straight line through forearm to knuckle",
    impact: "Cuts median nerve carpal tunnel pressure by over 50%",
  },
  {
    parameter: "Monitor Height",
    flawed: "Top bezel below chin level; laptop on desk",
    ergonomic: "Top third of screen at or slightly below eye line",
    impact: "Eliminates forward-head slump (prevents 30+ lbs cervical load)",
  },
  {
    parameter: "Foot Placement",
    flawed: "Dangling, tucked under seat, or crossed legs",
    ergonomic: "Flat on floor or on a stable angled footrest",
    impact: "Distributes weight evenly and stabilizes pelvis & lower back",
  },
  {
    parameter: "Shoulder Stance",
    flawed: "Hunched forward with elevated scapulae",
    ergonomic: "Depressed and relaxed naturally back and down",
    impact: "Relieves chronic tension headaches and upper back spasms",
  },
];

const FAQ_ITEMS = [
  {
    question: "Should I rest my wrists on a wrist rest while typing?",
    answer:
      "No. A wrist rest is meant for resting your palms during brief pauses between typing bursts, never while active keystrokes are occurring. Planting your wrists on a pad while typing compresses the carpal tunnel and forces your fingers to pivot via ulnar deviation rather than allowing your entire forearm to guide your hands.",
    plainAnswer:
      "No. A wrist rest is for resting your palms during pauses, never while actively typing. Planting your wrists during typing increases carpal tunnel pressure and restricts natural arm movement.",
  },
  {
    question: "Is a standing desk inherently better for typing posture?",
    answer:
      "A standing desk provides postural variation, but typing while standing introduces its own ergonomic pitfalls if your desk surface is too high or your wrists bend backwards. The key is maintaining neutral joint angles (90-100° elbows, straight wrists) whether sitting or standing.",
    plainAnswer:
      "Only if adjusted properly. Standing reduces prolonged sitting, but elbow and wrist angles must still remain neutral (90-100 degrees) to prevent repetitive strain.",
  },
  {
    question: "Why do my fingers tingle or go numb after typing for an hour?",
    answer:
      "Tingling or numbness in the thumb, index, and middle fingers is classic median nerve compression (carpal tunnel syndrome). Tingling in the ring and pinky fingers typically indicates ulnar nerve irritation at the elbow. Both are clear signals to adjust keyboard height, maintain neutral wrists, and incorporate regular microbreaks.",
    plainAnswer:
      "Tingling indicates nerve compression — median nerve for thumb/index/middle fingers, or ulnar nerve for the pinky and ring fingers. It signals an immediate need to correct wrist angles and take microbreaks.",
  },
  {
    question: "How far should my monitor be from my eyes?",
    answer:
      "Your screen should sit roughly an arm's length away (20 to 30 inches, or 50 to 75 cm). You should be able to touch the screen with the tips of your middle fingers when extending your arm straight ahead without leaning forward.",
    plainAnswer:
      "Roughly an arm's length away (20 to 30 inches). You should be able to brush the screen with your fingertips without leaning your torso forward.",
  },
];

export default function ProperTypingPosturePage() {
  const schema = buildArticleSchema({
    headline: "Proper Typing Posture & Ergonomics: Complete Desk Setup Guide",
    description:
      "Step-by-step ergonomic desk setup for pain-free typing: 90-degree elbow rule, neutral wrists, monitor height, chair alignment, and carpal tunnel prevention.",
    path: "/guides/proper-typing-posture-and-ergonomics",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <GuideLayout
        title="Proper Typing Posture & Ergonomics: Complete Desk Setup Guide"
        subtitle="How to align your chair, keyboard, and monitor to eliminate wrist strain, neck fatigue, and speed-limiting tension."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          {
            name: "Proper Typing Posture & Ergonomics",
            path: "/guides/proper-typing-posture-and-ergonomics",
          },
        ]}
        toc={[
          { id: "visual-setup", label: "The ideal ergonomic setup" },
          { id: "anatomical-cost", label: "The anatomical cost of bad posture" },
          { id: "5-point-checklist", label: "The 5-point alignment checklist" },
          { id: "posture-comparison", label: "Posture comparison table" },
          { id: "wrist-rest-myth", label: "The wrist rest myth" },
          { id: "microbreak-routine", label: "The 20-20-20 microbreak rule" },
          { id: "hardware-upgrades", label: "Ergonomic hardware priorities" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="The 90-100-110 Rule">
          <p>
            An ergonomic workstation isn&apos;t about sitting stiffly at a robotic right angle. The
            gold standard in clinical ergonomics is <strong>open, neutral angles</strong>: elbows at{" "}
            <strong>90° to 105°</strong>, hips at <strong>90° to 100°</strong>, and knees slightly
            below hips at <strong>90° to 105°</strong>. Your wrists must hover flat in line with your
            forearms—never flexed upward or anchored into the desk.
          </p>
        </Callout>

        <h2 id="visual-setup">The ideal ergonomic setup</h2>
        <Image
          src="/guides/typing-basics/proper-typing-posture-and-ergonomics/proper-typing-posture-and-ergonomics.webp"
          alt="Ergonomic typing workstation diagram showing correct posture, 90-degree elbow angle, and eye-level monitor height"
          width={1200}
          height={675}
          className="mx-auto rounded-xl border border-border"
          priority
        />
        <p>
          Most typists treat posture as an afterthought until forearm soreness, numb fingertips, or
          stabbing trapezius knots force a trip to the doctor. In reality, physical posture is the
          unbreakable ceiling of your typing performance. You cannot sustain 80 or 100 WPM on a{" "}
          <Link href="/">typing test</Link> if your muscles are fighting static fatigue, compressed
          nerve channels, and constant tension.
        </p>

        <h2 id="anatomical-cost">The anatomical cost of bad posture</h2>
        <p>
          When you lean forward toward a low monitor or reach upward to a high desk, three specific
          biomechanical breakdowns occur:
        </p>
        <ul>
          <li>
            <strong>Carpal Tunnel Pressure Spikes:</strong> Resting the heel of your palms on a desk
            while extending your wrists upward (dorsiflexion) increases fluid pressure inside the
            carpal tunnel by over 300%, pinching the median nerve and reducing tendon glide.
          </li>
          <li>
            <strong>Cervical Spine Overload:</strong> For every inch your head tilts forward past
            neutral balance, the effective load on your cervical spine increases by roughly 10
            pounds. A 3-inch &ldquo;turtle neck&rdquo; posture forces your neck muscles to support
            42+ pounds of continuous load.
          </li>
          <li>
            <strong>Ulnar Nerve Entrapment:</strong> Flaring your elbows out or resting them hard
            against sharp desk edges or hard armrests compresses the ulnar nerve at the cubital
            tunnel, triggering pinky finger weakness and forearm aches.
          </li>
        </ul>

        <h2 id="5-point-checklist">The 5-point ergonomic alignment checklist</h2>
        <ol>
          <li>
            <strong>1. Chair Height &amp; Pelvic Tilt:</strong> Adjust seat height so both feet rest
            completely flat on the floor. Your knees should sit level with or slightly below your
            hip joint (a 95° to 100° open angle). Sit all the way back against the lumbar support so
            your lower back maintains its natural inward lordotic curve.
          </li>
          <li>
            <strong>2. Elbow &amp; Forearm Position:</strong> Relax your shoulders. Let your upper
            arms hang naturally from your torso. Adjust armrests or desk height so your elbows bend
            at an open 90° to 105° angle. Your forearms should run roughly parallel to the floor or
            slope subtly downward toward the keys.
          </li>
          <li>
            <strong>3. Wrist Neutrality (The Hover Technique):</strong> Your wrist must form a
            straight line from your forearm to your third knuckle. It should never bend upward
            (extension), downward (flexion), or tilt side-to-side (ulnar deviation). Practice floating
            your palms above the keyboard, using your larger arm and shoulder muscles to guide your
            hands across keys rather than anchoring your wrists in place.
          </li>
          <li>
            <strong>4. Keyboard Angle &amp; Negative Tilt:</strong> If your desk allows, apply a
            slight <em>negative tilt</em> (the front of the keyboard is higher than the back). Most
            stock keyboard flip-out legs raise the back row, which perversely forces your wrists into
            harmful upward extension. Keep those legs folded flat.
          </li>
          <li>
            <strong>5. Monitor Height &amp; Distance:</strong> Position your display directly in
            front of you at arm&apos;s length (20 to 30 inches). Align the top border of the visible
            screen with your resting eyebrow line. When reading the middle or bottom of the screen,
            your gaze should lower 15° to 20° without your neck flexing forward.
          </li>
        </ol>

        <h2 id="posture-comparison">Posture comparison table</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Checkpoint</th>
              <th className="py-2 pr-4 font-medium text-foreground">Flawed Habit</th>
              <th className="py-2 pr-4 font-medium text-foreground">Ergonomic Standard</th>
              <th className="py-2 font-medium text-foreground">Biomechanical Benefit</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {POSTURE_COMPARISON.map((row) => (
              <tr key={row.parameter}>
                <td className="py-2 pr-4 font-medium text-foreground">{row.parameter}</td>
                <td className="py-2 pr-4 text-sub">{row.flawed}</td>
                <td className="py-2 pr-4 font-medium text-foreground">{row.ergonomic}</td>
                <td className="py-2">{row.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="wrist-rest-myth">The wrist rest myth: How most people misuse them</h2>
        <p>
          Contrary to widespread belief, wrist rests were never designed to support your wrists while
          you type. When you press the sensitive soft tissue on the underside of your wrist against a
          cushion while moving your fingers, you pinch the flexor tendons and the median nerve against
          the transverse carpal ligament.
        </p>
        <p>
          The correct technique is simple:
        </p>
        <ul>
          <li>
            <strong>While typing:</strong> Keep your hands and wrists floating freely in the air,
            gliding smoothly across the keyboard like a concert pianist.
          </li>
          <li>
            <strong>While pausing:</strong> Rest the fleshy palms of your hands (the hypothenar and
            thenar eminences at the base of the thumb and pinky)—not your delicate wrists—on the pad
            to unload shoulder tension during breaks.
          </li>
        </ul>

        <h2 id="microbreak-routine">The 20-20-20 microbreak rule for typists</h2>
        <p>
          Static muscle loading is just as damaging as excessive repetition. When you hold your arms
          in typing position for hours, intramuscular blood flow drops, depriving soft tissues of
          oxygen and accumulating lactic acid.
        </p>
        <p>
          Adopt the typist&apos;s microbreak rhythm:
        </p>
        <ul>
          <li>
            <strong>Every 20 minutes:</strong> Pause typing for 20 seconds.
          </li>
          <li>
            <strong>Drop your hands:</strong> Shake out your hands and let your arms dangle by your
            sides to let fresh arterial blood rush into your forearms.
          </li>
          <li>
            <strong>Refocus your eyes:</strong> Look at an object at least 20 feet away to relax the
            ciliary muscles in your eyes.
          </li>
          <li>
            <strong>Every 60 minutes:</strong> Stand up, walk for 2 minutes, and perform targeted{" "}
            <Link href="/guides/typing-stretches-and-hand-warmups">typing stretches and hand warmups</Link>.
          </li>
        </ul>

        <h2 id="hardware-upgrades">Ergonomic hardware priorities</h2>
        <p>
          If you spend more than four hours a day at a computer, your equipment should adapt to your
          body—not vice versa. Prioritize adjustments in this order:
        </p>
        <ol>
          <li>
            <strong>Keyboard Tray or Adjustable Desk:</strong> Standard 29-inch office desks are
            too tall for 85% of adults, forcing wrists into upward extension. A tray or desk that
            drops to 24–27 inches brings keys to natural resting elbow height.
          </li>
          <li>
            <strong>Split Ergonomic Keyboard:</strong> A split or contoured keyboard allows each
            half to angle outward (tenting and splay), matching the natural angle of your arms and
            completely eliminating ulnar wrist twist.
          </li>
          <li>
            <strong>Monitor Arm:</strong> Allows millimeter-precise adjustment of height and depth,
            ensuring your neck stays upright whether sitting tall or leaning gently back into your
            chair&apos;s support.
          </li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label: "Occupational Safety and Health Administration (OSHA) — Computer Workstations eTool & Ergonomics Checklist",
              href: "https://www.osha.gov/etools/computer-workstations",
            },
            {
              label: "Cornell University Ergonomics Web — 10 Guidelines for an Ergonomic Computer Workstation",
              href: "https://ergo.human.cornell.edu/ergoguide.html",
            },
            {
              label: "Mayo Clinic — Office Ergonomics: Your How-To Guide for Comfortable Computing",
              href: "https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/office-ergonomics/art-20047551",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

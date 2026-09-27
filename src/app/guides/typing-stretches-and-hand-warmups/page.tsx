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
  title: "8 Essential Typing Stretches & Hand Warmups for RSI & Wrist Pain",
  description:
    "Physical therapist-recommended typing warmups and tendon glides to help relieve wrist stiffness, support hand mobility, and reduce repetitive strain.",
  path: "/guides/typing-stretches-and-hand-warmups",
});

const PUBLISHED = "2026-09-26";
const UPDATED = "2026-09-26";

const STRETCHES = [
  {
    name: "1. Wrist Flexor Stretch",
    target: "Forearm flexor tendons, palm muscles, and wrist joint",
    duration: "Hold 20–30s per arm",
    instructions:
      "Extend your right arm straight in front of you with elbow locked and palm facing forward (fingers pointing up toward the ceiling). Use your left hand to gently draw your fingers and palm back toward your chest until you feel a comfortable stretch along the underside of your forearm. Breathe deeply; never pull to sharp pain.",
  },
  {
    name: "2. Wrist Extensor Stretch",
    target: "Extensor carpi radialis and ulnaris (top of the forearm)",
    duration: "Hold 20–30s per arm",
    instructions:
      "Extend your right arm forward, but drop your hand down so your palm faces your body (fingers pointing toward the floor). Gently grasp the back of your hand with your left hand and pull it back toward your torso. You should feel a relieving stretch across the top of your wrist and forearm.",
  },
  {
    name: "3. Tendon Gliding Sequence",
    target: "Deep & superficial finger flexor tendons through the carpal canal",
    duration: "5 repetitions per hand",
    instructions:
      "Cycle smoothly through five distinct hand shapes: 1) Straight fingers pointing up; 2) Hook fist (curl fingertips down to touch top pads); 3) Tabletop (bend knuckles 90° with fingers straight); 4) Straight fist (bend fingers flat against palm); 5) Full composite fist (tight fist with thumb wrapped outside). This maximizes fluid gliding through the carpal tunnel.",
  },
  {
    name: "4. Deep Prayer Stretch",
    target: "Bilateral wrist flexors, transverse carpal ligament",
    duration: "Hold 15–20s, 3 reps",
    instructions:
      "Place your palms together in front of your chest just beneath your chin in a prayer position. Keeping your palms firmly pressed together, slowly lower your hands toward your waist while raising your elbows outward until you feel a firm stretch across both wrists and forearms.",
  },
  {
    name: "5. Reverse Prayer Stretch",
    target: "Bilateral wrist extensors and dorsal retinaculum",
    duration: "Hold 15–20s, 3 reps",
    instructions:
      "Place the backs of your hands together in front of your chest with fingers pointing straight downward toward your navel. Gently press the backs of your wrists together while lifting your elbows slightly. This releases the extensor muscle sheath often overworked during rapid keying.",
  },
  {
    name: "6. Thumb Thenar & Webbing Release",
    target: "Opponens pollicis, abductor pollicis, spacebar stabilizers",
    duration: "Hold 15s per hand",
    instructions:
      "Extend your open palm. With your opposite hand, gently grasp your thumb and draw it outward and backward away from the palm. Use your opposite thumb to massage the fleshy muscle mound at the base of the thumb (the thenar eminence) in circular motions to melt away spacebar spasm.",
  },
  {
    name: "7. Active Finger Splay & Clench",
    target: "Lumbricals, interossei muscles, and extensor digitorum",
    duration: "10 repetitions, dynamic",
    instructions:
      "Open your hands wide, spreading your fingers as far apart as possible until you feel tension in the skin webs between each finger. Hold for 2 seconds, then squeeze both hands into a firm fist for 2 seconds. This activates the intrinsic hand musculature and restores fresh arterial blood circulation.",
  },
  {
    name: "8. Median Nerve Floss (Neurodynamic Glide)",
    target: "Median nerve mobility from cervical spine down to fingertip",
    duration: "8 smooth gliding cycles",
    instructions:
      "Stand tall. Extend your arm out to the side at shoulder height, elbow bent 90°, palm facing forward. Simultaneously tilt your head away from the arm while straightening your elbow and extending your wrist backward. As you return the arm to the bent starting position, tilt your head back to neutral. Never hold statically; glide smoothly like dental floss.",
  },
];

const ROUTINE_COMPARISON = [
  {
    phase: "Pre-Typing Warmup (3 Mins)",
    purpose: "Raise tissue temperature, lubricate joints, wake neuromuscular pathways",
    exercises: "Active Finger Splay, Gentle Wrist Circles, Dynamic Tendon Glides (Moves 3 & 7)",
    tempo: "Continuous, rhythmic motion without static holds",
  },
  {
    phase: "Intra-Session Microbreak (20 Secs)",
    purpose: "Flush metabolic waste, break static postural load, restore blood flow",
    exercises: "Arm shake-outs, Deep Prayer Stretch, Shoulder Rolls",
    tempo: "Brief, gentle pause every 20–30 minutes of continuous typing",
  },
  {
    phase: "Post-Typing Cool Down (5 Mins)",
    purpose: "Lengthen tight flexors, relieve carpal canal pressure, prevent stiffness",
    exercises: "Wrist Flexor & Extensor Holds, Thumb Release, Nerve Floss (Moves 1, 2, 6, 8)",
    tempo: "Deep, slow, static 20–30 second holds accompanied by full diaphragmatic breaths",
  },
];

const FAQ_ITEMS = [
  {
    question: "Should typing stretches hurt while performing them?",
    answer:
      "Never. Stretches should produce a gentle, relaxing sensation of muscular lengthening or tension release. If you experience sharp, shooting, electric, or throbbing pain, stop immediately. Those sensations suggest acute nerve impingement or tendon inflammation that requires clinical evaluation.",
    plainAnswer:
      "Never. Stretches should feel like gentle lengthening, not sharp or electric pain. Sharp pain indicates nerve or tendon irritation; stop immediately if you feel it.",
  },
  {
    question: "How often should I do typing hand warmups?",
    answer:
      "Spend 2 to 3 minutes warming up your hands and wrists before any intensive typing session, speed test, or workday. Throughout the day, take a 20-second microbreak every half hour to shake out your hands, and complete a thorough cool-down stretch when ending your work.",
    plainAnswer:
      "Warm up for 2 to 3 minutes before typing, take 20-second microbreaks every 30 minutes, and complete cool-down stretches at the end of your day.",
  },
  {
    question: "Can these exercises reverse Carpal Tunnel Syndrome or Repetitive Strain Injury (RSI)?",
    answer:
      "For mild to early-stage strain, tendon gliding and nerve flossing exercises have substantial clinical backing for reducing intra-carpal pressure and alleviating symptoms. However, if you have persistent numbness, muscle wasting at the base of the thumb, or pain that awakens you at night, you must consult an orthopedist or certified hand therapist.",
    plainAnswer:
      "They can significantly alleviate mild and early-stage strain by reducing carpal canal pressure. Advanced symptoms like persistent numbness or night pain require clinical diagnosis and care.",
  },
  {
    question: "Will stretching improve my typing speed?",
    answer:
      "Directly, warm muscles contract faster and with lower latency. Indirectly, eliminating stiffness and tension allows your fingers to move with greater fluid agility across keys, reducing hesitation and preventing the fatigue drop-off typical during long tests.",
    plainAnswer:
      "Yes. Warmed muscles have lower reaction latency, and relieving joint stiffness prevents the speed degradation that occurs after 20 to 30 minutes of typing.",
  },
];

export default function TypingStretchesPage() {
  const schema = buildArticleSchema({
    headline: "8 Essential Typing Stretches & Hand Warmups for RSI & Wrist Pain",
    description:
      "Physical therapist-recommended typing warmups and tendon glides to help relieve wrist stiffness, support hand mobility, and reduce repetitive strain.",
    path: "/guides/typing-stretches-and-hand-warmups",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <GuideLayout
        title="8 Essential Typing Stretches & Hand Warmups for RSI & Wrist Pain"
        subtitle="Physical therapist-approved tendon glides, nerve mobility drills, and targeted releases to keep your hands fast, fluid, and pain-free."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          {
            name: "Typing Stretches & Hand Warmups",
            path: "/guides/typing-stretches-and-hand-warmups",
          },
        ]}
        toc={[
          { id: "hero-image", label: "Mobility & tendon glides" },
          { id: "why-hands-hurt", label: "Why typing strains your hands" },
          { id: "the-8-stretches", label: "The 8 essential stretches" },
          { id: "routine-matrix", label: "Pre vs post typing routines" },
          { id: "clinical-warnings", label: "When to see a doctor" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Informational Disclaimer">
          <p>
            This guide provides general ergonomic and warmup exercises for educational purposes and is not a substitute for professional medical advice, diagnosis, or treatment. If you experience persistent wrist pain, tingling, numbness, or weakness, consult a qualified healthcare provider or certified hand therapist.
          </p>
        </Callout>

        <Callout label="Warmup First, Stretch Second">
          <p>
            Never aggressively pull on cold, stiff tendons right after waking up or stepping into a
            chilly room. Always start with <strong>dynamic warmups</strong> (finger splays and gentle
            circles) to pump warm blood through your wrists before performing deep static holds or
            jumping straight into a high-speed <Link href="/">typing test</Link>.
          </p>
        </Callout>

        <h2 id="hero-image">Mobility &amp; tendon glides</h2>
        <Image
          src="/guides/typing-practice/typing-stretches-and-hand-warmups/typing-stretches-and-hand-warmups.webp"
          alt="Diagram illustrating typing hand warmups, wrist mobility stretches, and carpal tendon gliding exercises"
          width={1200}
          height={675}
          className="mx-auto rounded-xl border border-border"
          priority
        />
        <p>
          High-performance typists, programmers, and writers execute between 15,000 and 40,000
          keystrokes in a single working day. No athlete would sprint for four hours without warming
          up, yet millions of keyboard workers subject their finger flexors to relentless rapid-fire
          contractions completely cold.
        </p>
        <p>
          Combined with <Link href="/guides/proper-typing-posture-and-ergonomics">proper typing posture and ergonomics</Link>,
          a disciplined daily mobility routine helps reduce the risk of repetitive strain injuries (RSI), tendonitis,
          and wrist discomfort while keeping your finger reaction times crisp.
        </p>

        <h2 id="why-hands-hurt">Why typing strains your hands: The biomechanics of RSI</h2>
        <p>
          Inside your wrist lies the <strong>carpal tunnel</strong>—a narrow, rigid passage of bones
          and ligaments roughly the width of a postage stamp. Squeezed through this tight space are
          nine long flexor tendons and the median nerve.
        </p>
        <p>
          When you type with bent wrists or hammer the keys with tense fingers:
        </p>
        <ul>
          <li>
            <strong>Friction &amp; Microtrauma:</strong> Tendons slide back and forth through their
            protective synovial sheaths thousands of times. Without regular gliding, microscopic
            tears and friction generate heat and fluid swelling (tenosynovitis).
          </li>
          <li>
            <strong>Ischemia:</strong> Continuous static muscle tension in the forearm restricts
            capillary blood flow, starving tissues of oxygen and allowing cellular waste to build up.
          </li>
          <li>
            <strong>Nerve Adhesion:</strong> Inflamed tissues adhere to the median and ulnar nerves,
            preventing them from sliding freely when you reach for outer keys.
          </li>
        </ul>

        <h2 id="the-8-stretches">The 8 essential typing stretches</h2>
        <div className="flex flex-col gap-5">
          {STRETCHES.map((item) => (
            <div key={item.name} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-2">
                <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
                <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                  {item.duration}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-sub">Target: {item.target}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{item.instructions}</p>
            </div>
          ))}
        </div>

        <h2 id="routine-matrix">Pre-typing vs. post-typing routine matrix</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Timing</th>
              <th className="py-2 pr-4 font-medium text-foreground">Physiological Goal</th>
              <th className="py-2 pr-4 font-medium text-foreground">Key Drills</th>
              <th className="py-2 font-medium text-foreground">Execution Protocol</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {ROUTINE_COMPARISON.map((row) => (
              <tr key={row.phase}>
                <td className="py-2 pr-4 font-medium text-foreground">{row.phase}</td>
                <td className="py-2 pr-4">{row.purpose}</td>
                <td className="py-2 pr-4 text-xs">{row.exercises}</td>
                <td className="py-2 text-xs">{row.tempo}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="clinical-warnings">When to stop and consult a physician</h2>
        <p>
          Stretching is preventive maintenance; it is not a cure for acute structural pathology.
          Schedule an evaluation with a physical therapist, hand specialist, or physician if you
          experience any of the following &ldquo;red flag&rdquo; symptoms:
        </p>
        <ul>
          <li>
            <strong>Nocturnal symptoms:</strong> Waking up during the night with throbbing wrist pain
            or numb, &ldquo;dead&rdquo; hands that must be shaken out to regain sensation.
          </li>
          <li>
            <strong>Loss of motor control:</strong> Clumsiness, dropping coffee mugs or pens, or an
            inability to button a shirt.
          </li>
          <li>
            <strong>Thenar atrophy:</strong> Visible shrinkage or flattening of the muscle pad at
            the base of your thumb.
          </li>
          <li>
            <strong>Constant pins and needles:</strong> Tingling that persists for days even when you
            are completely resting from keyboard use.
          </li>
        </ul>
        <p>
          If your hands feel comfortable and loose, build accuracy and speed by testing your newly
          warmed-up fingers on our <Link href="/lessons">guided typing lessons</Link> or competing in{" "}
          <Link href="/games">arcade typing games</Link>.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label: "American Academy of Orthopaedic Surgeons (AAOS) — Carpal Tunnel Syndrome Clinical Guidelines & Exercises",
              href: "https://orthoinfo.aaos.org/en/diseases--conditions/carpal-tunnel-syndrome/",
            },
            {
              label: "Journal of Hand Therapy — Tendon and Nerve Gliding Exercises in the Conservative Management of Carpal Tunnel Syndrome",
              href: "https://www.jhandtherapy.org/article/S0894-1130(04)00021-9/abstract",
            },
            {
              label: "National Institute for Occupational Safety and Health (NIOSH) — Musculoskeletal Disorders and Workplace Factors",
              href: "https://www.cdc.gov/niosh/docs/97-141/",
            },
          ]}
        />

        <p className="text-xs text-sub/70">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

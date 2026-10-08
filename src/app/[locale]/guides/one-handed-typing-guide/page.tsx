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
  title: "One-Handed Typing Guide: Left & Right-Handed Layouts & Techniques",
  description:
    "Comprehensive guide to one-handed typing for stroke recovery, amputees, injury, or single-hand typing: Dvorak One-Handed, Half-QWERTY, and radial zone finger maps.",
  path: "/guides/one-handed-typing-guide",
});

const PUBLISHED = "2026-09-26";
const UPDATED = "2026-09-26";

const SYSTEM_COMPARISON = [
  {
    system: "Single-Hand QWERTY (Radial Stretch)",
    setup: "Zero setup — works on any standard keyboard immediately",
    learningCurve: "Moderate (1 to 2 weeks for 20 WPM)",
    fatigue: "Higher finger travel across wide keyboard rows",
    bestFor: "Temporary injury, cast or sprain, occasional one-handed typing",
  },
  {
    system: "Half-QWERTY (Mirror Spacebar)",
    setup: "Lightweight software script or hardware keyboard",
    learningCurve: "Very fast (few days, transfers existing QWERTY memory)",
    fatigue: "Extremely low — hand stays entirely within 5 columns",
    bestFor: "Former two-handed typists adapting to permanent single-hand use",
  },
  {
    system: "Dvorak One-Handed (Left or Right)",
    setup: "Built natively into Windows, macOS, and Linux OS settings",
    learningCurve: "Steep (4 to 8 weeks to rewire motor reflexes)",
    fatigue: "Minimal — mathematical layout optimization for single hand",
    bestFor: "Long-term professional speed, transcribers, data entry",
  },
];

const FAQ_ITEMS = [
  {
    question: "Can someone type fast with only one hand?",
    answer:
      "Yes. Proficient one-handed typists routinely achieve 40 to 60+ Net WPM on sustained prose. Many court reporters, programmers, and administrative professionals with hemiplegia or limb loss type fast enough that typing never bottlenecks their daily career productivity.",
    plainAnswer:
      "Yes. Speeds of 40 to 60+ WPM are fully achievable with dedicated practice, more than fast enough for all professional and academic demands.",
  },
  {
    question: "What is the Half-QWERTY mirror typing method?",
    answer:
      "Half-QWERTY relies on the concept of mirrored mapping. When you hold down the Spacebar, your hand types the 'mirror image' of the other half of the keyboard. For example, your left fingers on A-S-D-F instantly type semicolon-L-K-J. It allows experienced QWERTY typists to regain 70% of their speed within a single week.",
    plainAnswer:
      "Half-QWERTY lets one hand type the entire keyboard by holding the spacebar to mirror keys from the opposite side, leveraging your existing muscle memory.",
  },
  {
    question: "Is the Left-Hand or Right-Hand Dvorak layout better?",
    answer:
      "Both are engineered identically, placing high-frequency characters in the center cluster directly beneath your strongest fingers. Choose whichever hand is your functional or dominant hand. Both layouts are free and natively pre-installed in Windows, macOS, and Linux keyboards.",
    plainAnswer:
      "Both layouts are scientifically optimized. Pick whichever hand you are using; both are natively available inside all major operating systems.",
  },
  {
    question: "How do I type capital letters and shortcuts with one hand?",
    answer:
      "Enable 'Sticky Keys' in your operating system accessibility menu. This allows you to press Shift, Ctrl, or Alt, release it, and then press your target letter without contorting your fingers to hold both simultaneously.",
    plainAnswer:
      "Turn on 'Sticky Keys' in your OS accessibility settings so modifier keys (Shift, Ctrl, Alt) stay active until you press the next key, removing awkward hand contortions.",
  },
];

export default function OneHandedTypingGuidePage() {
  const schema = buildArticleSchema({
    headline: "One-Handed Typing Guide: Left & Right-Handed Layouts & Techniques",
    description:
      "Comprehensive guide to one-handed typing for stroke recovery, amputees, injury, or single-hand typing: Dvorak One-Handed, Half-QWERTY, and radial zone finger maps.",
    path: "/guides/one-handed-typing-guide",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <GuideLayout
        title="One-Handed Typing Guide: Left &amp; Right-Handed Layouts &amp; Techniques"
        subtitle="A complete adaptive roadmap for stroke survivors, amputees, and injured typists: Half-QWERTY, Dvorak one-handed, and radial touch zones."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          {
            name: "One-Handed Typing Guide",
            path: "/guides/one-handed-typing-guide",
          },
        ]}
        toc={[
          { id: "hero-image", label: "Adaptive one-handed design" },
          { id: "who-needs-this", label: "Who benefits from one-handed typing" },
          { id: "three-systems", label: "The three core typing systems" },
          { id: "half-qwerty-mirror", label: "Half-QWERTY: The mirror trick" },
          { id: "dvorak-one-hand", label: "Dvorak Left & Right layouts" },
          { id: "ergonomic-positioning", label: "Physical keyboard positioning" },
          { id: "accessibility-hacks", label: "Essential OS accessibility tweaks" },
        ]}
        hasFaq
        hasSources
      >
        <Callout label="Realistic Performance Expectations">
          <p>
            Losing the use of one hand—whether temporarily due to a fracture or permanently from stroke
            or limb difference—can feel overwhelming. But many users find that with
            proper adaptive techniques, <strong>speeds of 40 to 60 Net WPM</strong> are completely
            attainable, placing you right at the average of all two-handed adult keyboard users.
          </p>
        </Callout>

        <h2 id="hero-image">Adaptive one-handed design</h2>
        <Image
          src="/guides/typing-work-study/one-handed-typing-guide/one-handed-typing-guide.webp"
          alt="Adaptive single-handed typing keyboard layout showing radial finger zones and mirror-typing modifier integration"
          width={1200}
          height={675}
          className="mx-auto rounded-xl border border-border"
          priority
        />
        <p>
          Most of the digital world is designed around the assumption of two functioning hands typing in
          parallel. When that assumption breaks, conventional hunt-and-peck typing with one finger is
          exhausting, slow, and physically straining.
        </p>
        <p>
          Fortunately, assistive technology and biomechanics offer proven, systematic paths to regaining
          rapid, fluid, and comfortable typing with a single hand.
        </p>

        <h2 id="who-needs-this">Who benefits from one-handed typing?</h2>
        <p>
          One-handed typing techniques serve a diverse spectrum of users:
        </p>
        <ul>
          <li>
            <strong>Stroke Survivors &amp; Hemiplegia:</strong> Individuals relearning communication and
            workplace skills following neurological events.
          </li>
          <li>
            <strong>Upper-Limb Amputees &amp; Congenital Differences:</strong> Lifelong single-handed typists
            seeking maximum ergonomic speed.
          </li>
          <li>
            <strong>Temporary Injuries:</strong> Writers and programmers recovering from broken wrists,
            carpal tunnel surgeries, or rotator cuff tears.
          </li>
          <li>
            <strong>Multitasking Professionals:</strong> Field technicians, medical ultrasound operators,
            and CAD engineers who must keep one hand on instrumentation or mouse controls while entering data.
          </li>
        </ul>

        <h2 id="three-systems">The three core one-handed typing systems</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium text-foreground">Approach</th>
              <th className="py-2 pr-4 font-medium text-foreground">Setup Complexity</th>
              <th className="py-2 pr-4 font-medium text-foreground">Learning Curve</th>
              <th className="py-2 font-medium text-foreground">Ideal Application</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border">
            {SYSTEM_COMPARISON.map((row) => (
              <tr key={row.system}>
                <td className="py-2 pr-4 font-medium text-foreground">{row.system}</td>
                <td className="py-2 pr-4 text-xs">{row.setup}</td>
                <td className="py-2 pr-4 text-xs">{row.learningCurve}</td>
                <td className="py-2 text-xs font-medium text-accent">{row.bestFor}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="half-qwerty-mirror">Half-QWERTY: The mirror-image muscle memory shortcut</h2>
        <p>
          Pioneered by researcher Edgar Matias, <strong>Half-QWERTY</strong> is widely considered the
          fastest way for former two-handed typists to adapt to single-hand typing.
        </p>
        <p>
          <strong>How It Works:</strong> You place your single hand on its standard home row (e.g., your
          left hand on <code>A-S-D-F</code>). When you type normally, it outputs those keys. But when you{" "}
          <strong>hold down the Spacebar</strong> (acting as a modifier), your fingers mirror the opposite
          hand&apos;s keys:
        </p>
        <ul>
          <li><code>A</code> + Spacebar becomes <code>;</code></li>
          <li><code>S</code> + Spacebar becomes <code>L</code></li>
          <li><code>D</code> + Spacebar becomes <code>K</code></li>
          <li><code>F</code> + Spacebar becomes <code>J</code></li>
          <li><code>G</code> + Spacebar becomes <code>H</code></li>
        </ul>
        <p>
          Because the human motor cortex possesses symmetrical motor memory, your brain already knows which
          finger is responsible for which opposite key. Most adults achieve 30+ WPM within just 3 to 5 days
          of practice using free software emulators (like AutoHotkey scripts) or dedicated Half-QWERTY keyboards.
        </p>

        <h2 id="dvorak-one-hand">Dvorak Left-Hand &amp; Right-Hand layouts</h2>
        <p>
          If you are starting fresh or want the absolute highest ergonomic efficiency with zero modifier
          keys, consider the <strong>Dvorak One-Handed Layouts</strong>.
        </p>
        <p>
          Created by Dr. August Dvorak, these layouts cluster the most common vowels and consonants directly
          in the central home zone of the keyboard:
        </p>
        <ul>
          <li>
            <strong>Dvorak Left Hand:</strong> High-frequency keys (E, T, A, O, I, N, S) are placed directly
            under the left index, middle, and ring fingers. Reaches are minimized to just one column.
          </li>
          <li>
            <strong>Dvorak Right Hand:</strong> Mirrors the layout for the right hand.
          </li>
          <li>
            <strong>Zero Cost:</strong> Both layouts are pre-installed in Windows, macOS, iOS, Android, and
            Linux. You can enable them in your language and keyboard settings with one click.
          </li>
        </ul>

        <h2 id="ergonomic-positioning">Physical keyboard positioning &amp; desk angle</h2>
        <p>
          Typing with one hand on a flat, horizontal keyboard forces severe ulnar wrist deviation as you
          reach across to the far side of the board.
        </p>
        <p>
          Follow these critical physical setup rules:
        </p>
        <ol>
          <li>
            <strong>Rotate the Keyboard:</strong> Angle the keyboard at <strong>30° to 45°</strong> on your
            desk. If typing with your left hand, rotate the right side of the keyboard away from you. If typing
            with your right hand, rotate the left side away.
          </li>
          <li>
            <strong>Center the Hand:</strong> Do not center the whole keyboard in front of your chest. Align
            your functional hand and forearm directly with your shoulder line.
          </li>
          <li>
            <strong>Compact Form Factors:</strong> Use a tenkeyless (TKL) or 60% compact keyboard to bring
            the mouse or trackball closer to your hand, eliminating excessive reaching.
          </li>
        </ol>

        <h2 id="accessibility-hacks">Essential OS accessibility tweaks</h2>
        <p>
          To eliminate physical friction, activate these built-in operating system accessibility features
          immediately:
        </p>
        <ul>
          <li>
            <strong>Sticky Keys:</strong> Pressing <code>Shift</code>, <code>Ctrl</code>, or <code>Alt</code>{" "}
            locks the modifier until you strike the next character, allowing one-finger capitalization and
            shortcuts without awkward acrobatics.
          </li>
          <li>
            <strong>Filter Keys / Bounce Keys:</strong> Ignores brief, unintended double keypresses caused by
            tremors or motor spasms.
          </li>
          <li>
            <strong>Foot Pedals:</strong> Inexpensive USB foot switches can be mapped to <code>Shift</code>,{" "}
            <code>Enter</code>, or <code>Backspace</code>, offloading modifiers to your feet.
          </li>
        </ul>
        <p>
          Once your setup is configured, test your progress on our{" "}
          <Link href="/">typing tests</Link> and track your consistency over time. For complementary motor planning strategies and sensory accommodations, explore our guide on{" "}
          <Link href="/guides/touch-typing-for-dyslexia-and-dysgraphia">touch typing for dyslexia and dysgraphia</Link> or align your physical workspace using our{" "}
          <Link href="/guides/proper-typing-posture-and-ergonomics">proper typing posture and ergonomics guide</Link>.
        </p>

        <FaqSection items={FAQ_ITEMS} />

        <SourceList
          sources={[
            {
              label: "Matias, E., MacKenzie, I. S., & Buxton, W. — Half-QWERTY: Typing With One Hand Using Your Two-Handed Skills (CHI Conference)",
              href: "https://www.edgarmatias.com/papers/chi93/",
            },
            {
              label: "American Occupational Therapy Association (AOTA) — Assistive Technology Interventions for Upper-Extremity Impairments",
              href: "https://www.aota.org/",
            },
            {
              label: "Dvorak One-Handed Layout Documentation — Ergonomic Bigram Efficiency in Unilateral Typing",
              href: "https://www.dvorak-keyboard.com/",
            },
          ]}
        />

        <p className="text-xs text-sub">Last updated {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE_NAME } from "@/lib/seo/constants";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Typing Guides — Speed, Accuracy & Touch Typing",
  description:
    "Practical, honest guides to typing speed and technique -- what actually improves your WPM, and what a good typing speed looks like by context.",
  path: "/guides",
});

const GUIDES = [
  {
    href: "/guides/how-to-improve-typing-speed",
    title: "How to Improve Your Typing Speed",
    description:
      "A complete training system: fix accuracy first, find your weak keys, drill them, and climb from 20 WPM to 100+.",
  },
  {
    href: "/guides/average-typing-speed",
    title: "What Is a Good Typing Speed?",
    description:
      "WPM benchmarks by skill level and by context — casual, office, programming, data entry — with sourced ranges.",
  },
  {
    href: "/guides/net-wpm-vs-gross-wpm",
    title: "How Is WPM Calculated?",
    description: "The exact formula, worked examples, and why two typing sites can score the same run differently.",
  },
  {
    href: "/guides/wpm-cpm-kph-calculator",
    title: "WPM, CPM & KPH Calculator",
    description: "Calculate all three live from a test, or convert freely between them — every formula shown.",
  },
  {
    href: "/guides/how-to-touch-type",
    title: "How to Touch Type",
    description: "The full finger-to-key map, a practice progression that doesn't skip steps, and a realistic timeline.",
  },
  {
    href: "/guides/touch-typing-finger-map",
    title: "Touch-Typing Finger Map",
    description: "An interactive, hover-or-tap chart of every key and the finger that owns it, plus Shift and numbers.",
  },
  {
    href: "/guides/how-to-type-without-looking-at-the-keyboard",
    title: "How to Type Without Looking at the Keyboard",
    description: "A day-by-day plan for breaking the look-down habit — exactly what to practice, not \"just practice more.\"",
  },
  {
    href: "/guides/typing-practice-for-beginners",
    title: "Typing Practice for Beginners",
    description: "A real curriculum: exercises by category, routines from 5 to 30 minutes, and what to practice at each stage.",
  },
  {
    href: "/guides/how-to-improve-typing-accuracy",
    title: "How to Improve Typing Accuracy",
    description: "Why accuracy drops, a repeatable improvement system, and practical targets by skill stage.",
  },
  {
    href: "/guides/english-typing-test-and-practice",
    title: "English Typing Test & Practice",
    description: "What an English typing test measures, why results vary between sites, and passages by level.",
  },
  {
    href: "/guides/typing-test-duration-guide",
    title: "Which Typing Test Duration Should You Use?",
    description: "How 15-second to 10-minute tests differ, and which one fits practice, measurement, or exam prep.",
  },
  {
    href: "/guides/data-entry-typing-test",
    title: "Data Entry Typing Test",
    description: "What it measures, how KPH relates to WPM, and how to train for one.",
  },
  {
    href: "/guides/typing-resources-for-teachers",
    title: "Free Typing Resources for Teachers",
    description: "A week-by-week curriculum built from 28 real lessons, classroom activities, and assessment ideas.",
  },
];

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12 sm:px-10">
      <Breadcrumbs items={[{ name: "Guides", path: "/guides" }]} />
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Typing Guides</h1>
        <p className="text-sm text-foreground/85">
          Practical technique and honest benchmarks — not shortcuts. Written to be read once and actually used, not
          skimmed for keywords.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {GUIDES.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-sub-alt/20 p-5 transition-colors hover:border-accent"
          >
            <div className="flex flex-col gap-1">
              <h2 className="font-medium text-foreground">{guide.title}</h2>
              <p className="text-sm text-foreground/85">{guide.description}</p>
            </div>
            <ArrowRight
              size={16}
              className="mt-1 shrink-0 text-sub transition-transform group-hover:translate-x-1 group-hover:text-accent"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>

      <p className="max-w-2xl text-xs text-sub">
        Want to put any of this into practice right away?{" "}
        <Link href="/" className="text-accent underline underline-offset-2">
          Take a typing test
        </Link>
        , work through{" "}
        <Link href="/lessons" className="text-accent underline underline-offset-2">
          structured lessons
        </Link>{" "}
        from the home row up, keep it fun with a{" "}
        <Link href="/games" className="text-accent underline underline-offset-2">
          typing game
        </Link>
        , or build vocabulary with{" "}
        <Link href="/vocabulary" className="text-accent underline underline-offset-2">
          vocabulary practice
        </Link>
        . — {SITE_NAME}
      </p>
    </div>
  );
}

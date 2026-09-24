import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Typing Guides",
  description:
    "Practical, honest guides to typing speed and technique: what actually improves your WPM, and what a good typing speed really looks like by context.",
  alternates: { canonical: "/guides" },
};

const GUIDES = [
  {
    href: "/guides/how-to-improve-typing-speed",
    title: "How to Improve Your Typing Speed",
    description:
      "Fix accuracy before you chase speed, use all ten fingers, and the habits that quietly cap your WPM.",
  },
  {
    href: "/guides/average-typing-speed",
    title: "Average Typing Speed by Context",
    description:
      "What counts as a good typing speed for casual use, office work, programming, and competitive typing.",
  },
];

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Typing Guides</h1>
        <p className="text-sm text-sub">
          Practical technique and honest benchmarks — not shortcuts. Written to be read once and actually used, not
          skimmed for keywords.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {GUIDES.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-sub-alt/20 p-5 transition-colors hover:border-accent"
          >
            <div className="flex flex-col gap-1">
              <h2 className="font-medium text-foreground">{guide.title}</h2>
              <p className="text-sm text-sub">{guide.description}</p>
            </div>
            <ArrowRight
              size={16}
              className="shrink-0 text-sub transition-transform group-hover:translate-x-1 group-hover:text-accent"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>

      <p className="text-xs text-sub">
        Want to put any of this into practice right away?{" "}
        <Link href="/" className="text-accent underline underline-offset-2">
          Take a typing test
        </Link>
        , or work through{" "}
        <Link href="/lessons" className="text-accent underline underline-offset-2">
          structured lessons
        </Link>{" "}
        from the home row up. — {SITE_NAME}
      </p>
    </div>
  );
}

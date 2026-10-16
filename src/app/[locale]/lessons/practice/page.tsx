import type { Metadata } from "next";
import Link from "next/link";
import { PracticeClient } from "@/components/lessons/practice-client";
import { AdSlot } from "@/components/layout/ad-slot";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { pageMetadata } from "@/lib/seo/metadata";
import { buildWebApplicationSchema } from "@/lib/seo/json-ld";

export const metadata: Metadata = pageMetadata({
  title: "Typing Practice Lab: Weak Key Drills",
  description:
    "Target error-prone keys, build typing accuracy, and practice custom drills with adaptive sentence generation and real-time keystroke feedback.",
  path: "/lessons/practice",
});

export default async function PracticePage({
  params,
}: {
  params?: Promise<{ locale: string }>;
}) {
  const resolvedParams = params ? await params : undefined;
  const locale = resolvedParams?.locale ?? "en";
  const path = locale === "en" ? "/lessons/practice" : `/${locale}/lessons/practice`;

  const appSchema = buildWebApplicationSchema({
    path,
    name: "Typing Practice Lab — HeroTyping",
    description: "Adaptive typing drills for weak keys, accuracy stabilization, and trigram sequences.",
  });

  const breadcrumbs = [
    { name: "Lessons", path: "/lessons" },
    { name: "Practice Lab", path: "/lessons/practice" },
  ];

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
        <div className="mb-4 w-full">
          <Breadcrumbs items={breadcrumbs} locale={locale} />
        </div>

        <div className="mb-6 flex w-full flex-col items-center gap-2 text-center">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
            Targeted Practice Lab
          </h1>
          <p className="max-w-xl text-xs sm:text-sm text-sub">
            Reinforce difficult finger reaches and rebuild rhythm. For specialized drills, explore our dedicated{" "}
            <Link href="/practice/weak-keys" className="text-accent underline underline-offset-2">
              weak-key practice
            </Link>{" "}
            and{" "}
            <Link href="/practice/accuracy" className="text-accent underline underline-offset-2">
              accuracy drills
            </Link>
            .
          </p>
        </div>

        <PracticeClient />

        <div className="mt-14 w-full">
          <AdSlot id="lessons-practice-below-board" format="horizontal" />
        </div>
      </div>
    </div>
  );
}

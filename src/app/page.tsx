import type { Metadata } from "next";
import { TypingTestClient } from "@/components/typing-test/typing-test-client";
import { buildWebApplicationSchema } from "@/lib/seo/json-ld";
import { SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default function Home() {
  const schema = buildWebApplicationSchema();

  return (
    <div className="flex flex-1 flex-col items-center px-6 pb-16 pt-8 sm:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Free Online Typing Speed Test
        </h1>
        <p className="text-sm text-sub sm:text-base">
          Measure your words per minute and accuracy. No sign-up required.
        </p>
      </div>

      <div className="mt-12 w-full max-w-4xl">
        <TypingTestClient />
      </div>
    </div>
  );
}

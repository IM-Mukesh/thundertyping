import type { Metadata } from "next";
import { TypingTestClient } from "@/components/typing-test/typing-test-client";
import { PageIntro } from "@/components/layout/page-intro";
import { buildWebApplicationSchema } from "@/lib/seo/json-ld";
import { SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default function Home() {
  const schema = buildWebApplicationSchema();

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-10 pt-3 sm:px-10 sm:pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <PageIntro />

      <div className="mt-3 w-full max-w-6xl sm:mt-8">
        <TypingTestClient />
      </div>
    </div>
  );
}

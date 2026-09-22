import type { Metadata } from "next";
import { TypingTestClient } from "@/components/typing-test/typing-test-client";
import { PageIntro } from "@/components/layout/page-intro";
import { AdRail } from "@/components/layout/ad-rail";
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

      {/* grid-cols-1 below the breakpoint means the content is simply full
          width, exactly as before the rail existed. At the breakpoint, three
          columns appear -- two equal (1fr) side margins plus a middle column
          sized to the content -- which is what keeps the content column
          dead-centered in the viewport regardless of what's in the side
          columns. A flexbox row with a shrinkable content column doesn't
          give that guarantee: the content shrinks to fill whatever the rail
          leaves behind, which visibly pushes it off-center even when the
          rail itself renders nothing. The breakpoint (1760px) is chosen so
          the margin is wide enough to actually hold the rail rather than
          clipping it -- see AdRail. */}
      <div className="mt-3 grid w-full grid-cols-1 min-[1760px]:grid-cols-[1fr_auto_1fr] min-[1760px]:items-start sm:mt-8">
        <div aria-hidden="true" className="hidden min-[1760px]:block" />
        <div className="mx-auto w-full max-w-6xl">
          <TypingTestClient />
        </div>
        <div className="hidden min-[1760px]:flex min-[1760px]:justify-start min-[1760px]:pl-6">
          <AdRail id="home-rail" />
        </div>
      </div>
    </div>
  );
}

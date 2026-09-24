import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/content-page";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Net WPM vs. Gross WPM",
  description:
    "Why the exact same typing test run can report two very different WPM numbers depending on whether mistakes are subtracted — and which one actually tells you something useful.",
  alternates: { canonical: "/guides/net-wpm-vs-gross-wpm" },
};

const PUBLISHED = "2026-09-24";

export default function NetVsGrossWpmPage() {
  const schema = buildArticleSchema({
    headline: "Net WPM vs. Gross WPM",
    description:
      "Why the same typing test run can report different WPM numbers depending on whether mistakes are subtracted.",
    path: "/guides/net-wpm-vs-gross-wpm",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ContentPage
        title="Net WPM vs. Gross WPM"
        subtitle="Same run, different math — here's why the number changes depending on which one you're looking at."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Net WPM vs. Gross WPM", path: "/guides/net-wpm-vs-gross-wpm" },
        ]}
      >
        <p>
          Two typing sites can score the identical run differently, and it&apos;s rarely because one of them is
          wrong — they&apos;re usually just answering a different question. Typing speed is conventionally measured
          in five-character &ldquo;words&rdquo; per minute (a fixed unit, not actual dictionary words), but there are
          two ways to count which characters go into that total.
        </p>

        <h2>Gross (raw) WPM: every keystroke counts</h2>
        <p>
          Gross WPM — also called raw WPM — divides every character you typed, correct or not, by five, then by the
          minutes elapsed. It answers &ldquo;how fast were your hands moving,&rdquo; full stop. A run full of
          mistakes and a flawless run at the same physical pace report the same gross WPM, because gross WPM never
          looks at whether a keystroke was right.
        </p>

        <h2>Net WPM: only what you got right</h2>
        <p>
          Net WPM divides only your <em>correct</em> characters by five, then by minutes. Every mistake — including
          one you never went back to fix — simply isn&apos;t counted toward your speed. This is the number{" "}
          {SITE_NAME} leads with everywhere: on the main{" "}
          <Link href="/">typing test</Link>, on every lesson result, and on every game. Two runs at identical hand
          speed but different accuracy will show different net WPM, because net WPM is really asking &ldquo;how fast
          can you produce correct text,&rdquo; which is the number that actually matters outside of a typing test.
        </p>

        <h2>Why the gap between them is worth watching</h2>
        <p>
          The distance between your gross and net WPM is a more honest signal than either number alone. A small,
          consistent gap means your hand speed and your accuracy are roughly matched — you&apos;re not leaving speed
          on the table by making avoidable mistakes. A large gap means your hands are moving faster than your
          accuracy can back up, and the fix isn&apos;t typing faster — it&apos;s{" "}
          <Link href="/guides/how-to-improve-typing-speed">slowing down until the gap closes</Link>, which almost
          always raises net WPM within a few sessions.
        </p>

        <h2>Which one should you trust?</h2>
        <p>
          For almost every real use — writing an email, taking notes, chatting — net WPM is the number that
          describes what you can actually do, because a typo you have to notice and fix costs real time gross WPM
          doesn&apos;t account for. Gross WPM is mainly useful as a ceiling: it&apos;s roughly the net WPM you could
          reach if your accuracy caught up to your hand speed. If you want to know where either number should
          reasonably sit, <Link href="/guides/average-typing-speed">average typing speed by context</Link> has real
          ranges instead of one made-up target.
        </p>

        <p>
          Curious what your own gap looks like? <Link href="/">Take a typing test</Link> — the results screen shows
          both numbers side by side, not just one.
        </p>
      </ContentPage>
    </>
  );
}

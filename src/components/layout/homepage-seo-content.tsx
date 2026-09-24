import Link from "next/link";

/**
 * A small contextual footnote, not an article — the homepage is the product,
 * not an SEO landing page. Kept deliberately tiny (one heading, one short
 * paragraph, a few links) after an earlier three-section version visually
 * competed with the typing test itself. The detailed explanations still
 * exist, just on their own pages: /guides/average-typing-speed,
 * /guides/how-to-improve-typing-speed, /lessons, /vocabulary, /games.
 */
export function HomepageSeoContent() {
  return (
    <section className="mx-auto mt-14 w-full max-w-2xl text-center text-xs leading-relaxed text-sub">
      <h2 className="mb-1.5 font-display text-[11px] font-medium uppercase tracking-[0.2em] text-sub/80">
        Want more than a score?
      </h2>
      <p>
        See what counts as a{" "}
        <Link href="/guides/average-typing-speed" className="text-accent underline underline-offset-2">
          good typing speed
        </Link>
        , work through{" "}
        <Link href="/lessons" className="text-accent underline underline-offset-2">
          structured lessons
        </Link>
        , build vocabulary with{" "}
        <Link href="/vocabulary" className="text-accent underline underline-offset-2">
          typing practice
        </Link>
        , or keep it fun with{" "}
        <Link href="/games" className="text-accent underline underline-offset-2">
          typing games
        </Link>
        .
      </p>
    </section>
  );
}

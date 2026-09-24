import type { ReactNode } from "react";
import { buildFaqSchema } from "@/lib/seo/json-ld";

export interface FaqItem {
  question: string;
  /** Rendered answer -- can include <Link>s. */
  answer: ReactNode;
  /** Plain-text version for FAQPage schema, which doesn't support markup. Falls back to `answer` only if it's already a string. */
  plainAnswer?: string;
}

interface FaqSectionProps {
  items: FaqItem[];
  heading?: string;
}

/** Renders a visible FAQ block and emits matching FAQPage JSON-LD in one place, so the two never drift apart. */
export function FaqSection({ items, heading = "FAQ" }: FaqSectionProps) {
  const schema = buildFaqSchema(
    items.map((item) => ({
      question: item.question,
      answer: item.plainAnswer ?? (typeof item.answer === "string" ? item.answer : ""),
    })),
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <h2 id="faq">{heading}</h2>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </div>
    </>
  );
}

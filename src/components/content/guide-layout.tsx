import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { BreadcrumbItem } from "@/lib/seo/json-ld";

export interface TocItem {
  id: string;
  label: string;
}

interface GuideLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbItems: BreadcrumbItem[];
  /** Section ids/labels for the sticky on-page nav -- each id must match a heading's id in `children`. Omit "FAQ" / "Sources" -- they're appended automatically when present. */
  toc: TocItem[];
  hasFaq?: boolean;
  hasSources?: boolean;
  children: ReactNode;
}

// A wider, two-column shell for long-form guide pages specifically (not
// reused by /about, /privacy, etc. via ContentPage) -- an 800px reading
// column plus a sticky table of contents, so a guide's now-substantial
// length fills the page on a wide screen instead of leaving a narrow
// column stranded in a sea of empty margin. Collapses to a single column
// below 1150px; the TOC is a nice-to-have, not load-bearing content.
//
// Widths were tuned by eye against a 24"+ monitor specifically: the earlier
// 1040px/760px pairing left a wide dead gutter outside the container on a
// big screen without actually widening the TOC. 1180px/800px both grows the
// reading column a little and gives the TOC roughly 40% more usable width,
// so the extra space goes somewhere legible instead of just being margin.
export function GuideLayout({ title, subtitle, breadcrumbItems, toc, hasFaq, hasSources, children }: GuideLayoutProps) {
  const fullToc: TocItem[] = [
    ...toc,
    ...(hasFaq ? [{ id: "faq", label: "FAQ" }] : []),
    ...(hasSources ? [{ id: "sources", label: "Sources & references" }] : []),
  ];

  return (
    <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-8 px-4 py-8 sm:px-10 sm:py-12 min-[1150px]:grid-cols-[minmax(0,800px)_1fr]">
      <div className="flex min-w-0 flex-col gap-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {subtitle && <p className="text-sm text-foreground/85">{subtitle}</p>}
        </div>
        <div
          className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/90
            [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2
            [&_h2]:mt-4 [&_h2]:scroll-mt-24 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground
            [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground
            [&_li]:ml-4 [&_li]:list-disc
            [&_ol_li]:list-decimal
            [&_strong]:font-medium [&_strong]:text-foreground
            [&_code]:rounded [&_code]:bg-sub-alt/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground
            [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:max-w-full [&_table]:my-2
            [&_pre]:overflow-x-auto [&_pre]:max-w-full"
        >
          {children}
        </div>
      </div>

      {fullToc.length > 0 && (
        <aside className="hidden min-[1150px]:block">
          <nav aria-label="On this page" className="sticky top-8 flex flex-col gap-2 border-l border-border pl-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sub">On this page</p>
            {fullToc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-xs leading-snug text-sub transition-colors hover:text-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
      )}
    </div>
  );
}

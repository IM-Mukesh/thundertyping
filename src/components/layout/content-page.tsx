import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { BreadcrumbItem } from "@/lib/seo/json-ld";

interface ContentPageProps {
  title: string;
  subtitle?: string;
  /** Optional -- pages like /privacy or /terms have no meaningful trail and skip this. */
  breadcrumbItems?: BreadcrumbItem[];
  children: ReactNode;
}

// No ad slot of its own -- SiteFooter (rendered globally, on every route)
// already carries one right below this component's content, so a second one
// here just stacked two horizontal ad boxes back to back with nothing
// between them. That's genuinely covered already; "on every page" doesn't
// need a second placement on these specific ones.
export function ContentPage({ title, subtitle, breadcrumbItems, children }: ContentPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12 sm:px-10">
      {breadcrumbItems && <Breadcrumbs items={breadcrumbItems} />}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-sub">{subtitle}</p>}
      </div>
      <div
        className="flex flex-col gap-4 text-sm leading-relaxed text-sub
          [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2
          [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground
          [&_li]:ml-4 [&_li]:list-disc
          [&_strong]:font-medium [&_strong]:text-foreground"
      >
        {children}
      </div>
    </div>
  );
}

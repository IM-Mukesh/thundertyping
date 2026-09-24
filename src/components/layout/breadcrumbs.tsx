import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { buildBreadcrumbSchema, type BreadcrumbItem } from "@/lib/seo/json-ld";

/**
 * A visible breadcrumb trail plus its matching BreadcrumbList JSON-LD, kept
 * together so the two can never drift out of sync with each other. Plain
 * server component -- no interactivity, so no reason for a client boundary.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const trail: BreadcrumbItem[] = [{ name: "Home", path: "/" }, ...items];
  const schema = buildBreadcrumbSchema(items);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav aria-label="Breadcrumb" className="w-full">
        <ol className="flex flex-wrap items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-sub">
          {trail.map((item, i) => {
            const isLast = i === trail.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} className="text-sub/50" aria-hidden="true" />}
                {isLast ? (
                  <span aria-current="page" className="text-foreground">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.path} className="transition-colors hover:text-foreground">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

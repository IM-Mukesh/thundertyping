import Link from "next/link";
import { BookOpen, Gamepad2, GraduationCap, Library } from "lucide-react";

/**
 * Four compact links, not a content section -- icon + one-word label each,
 * no descriptions. This is navigation, not the "small feature/navigation
 * section" turning into another block of text. Sits between the test and
 * the tiny SEO footnote (HomepageSeoContent).
 */
const FEATURES = [
  { href: "/lessons", label: "Lessons", icon: GraduationCap },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/vocabulary", label: "Vocabulary", icon: BookOpen },
  { href: "/guides", label: "Guides", icon: Library },
];

export function HomepageFeatureNav() {
  return (
    <nav aria-label="Explore HeroTyping" className="mx-auto hidden w-full max-w-2xl grid-cols-2 gap-2 sm:grid sm:grid-cols-4">
      {FEATURES.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-sub-alt/20 px-3 py-2.5 text-xs font-medium text-sub transition-colors hover:border-accent hover:text-foreground"
        >
          <Icon size={14} className="shrink-0 text-accent" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

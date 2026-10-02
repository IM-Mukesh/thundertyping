import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo/metadata";

// page.tsx is a client component ("use client", for useAuth/useSearchParams),
// which can't export `metadata` itself -- Next.js only reads it from a
// Server Component. This layout exists purely to carry it.
//
// index: false, same as /profile: a sign-in form has no standalone search
// value and showing up in results for "herotyping login" would just send
// people to a form instead of the actual typing test. follow: true, same
// reasoning as /profile, so links elsewhere on the page still get crawled.
export const metadata: Metadata = pageMetadata({
  title: "Sign In",
  description: "Sign in to HeroTyping to sync your typing results and personal bests across devices.",
  path: "/auth/login",
  robots: { index: false, follow: true },
});

export default function AuthLoginLayout({ children }: { children: ReactNode }) {
  return children;
}

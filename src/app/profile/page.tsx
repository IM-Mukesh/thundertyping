import type { Metadata } from "next";
import { ProfileClient } from "@/components/profile/profile-client";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Your Profile",
  description:
    "Your typing progress across every HeroTyping game — level, XP, achievements, best scores and per-game statistics. Stored on your own device, no sign-up needed.",
  path: "/profile",
  robots: { index: false, follow: true },
});

export default function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Your profile
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-sub">
          Everything below is stored on this device. There is no account and
          nothing is uploaded, which means your progress is private — and also
          that it lives in this browser only. Clearing site data clears it.
        </p>
      </header>

      <ProfileClient />

      {/* No ad slot of its own -- SiteFooter (every route) already carries
          one directly below this page's content. Same fix as ContentPage. */}
    </div>
  );
}

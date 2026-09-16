import type { Metadata } from "next";
import { ProfileClient } from "@/components/profile/profile-client";
import { AdSlot } from "@/components/layout/ad-slot";

export const metadata: Metadata = {
  title: "Your Profile",
  description:
    "Your typing progress across every ThunderTyping game — level, XP, achievements, best scores and per-game statistics. Stored on your own device, no sign-up needed.",
  alternates: { canonical: "/profile" },
  // Nothing here is the same for two visitors, so there is nothing for a
  // crawler to usefully index -- but the route must still be reachable and
  // must not 404, so it is indexed shallowly rather than blocked outright.
  robots: { index: false, follow: true },
};

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

      <AdSlot id="profile-footer" format="horizontal" />
    </div>
  );
}

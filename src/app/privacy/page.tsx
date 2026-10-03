import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/seo/constants";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles your data: what's stored, where, and why.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy Policy" subtitle="Last updated: September 27, 2026">
      <p>
         {SITE_NAME} stores guest settings and progress locally. Signed-in accounts sync profile,
         lesson, game, and typing-result data to the service so it is available across sessions.
      </p>

      <h2>What we store</h2>
      <p>
         Guest test settings, vocabulary, lesson progress, and personal-best scores are saved in
         your browser&apos;s <code>localStorage</code>. Signed-in profile and gameplay progress is saved
         to your account. Clearing browser site data removes guest data, but does not remove cloud data.
      </p>
      <p>
        If you use the custom-text typing mode, the text you paste is held only in your
        browser&apos;s memory for that session and is not saved or uploaded anywhere.
      </p>

      <h2>Advertising</h2>
      <p>
        {SITE_NAME} does not currently serve any ads. When advertising (via Google AdSense) is
        introduced, Google and its partners may use cookies or similar technologies to serve and
        measure ads, as described in Google&apos;s own policies at{" "}
        <a href="https://policies.google.com/technologies/ads" rel="noopener noreferrer" target="_blank">
          policies.google.com/technologies/ads
        </a>
        . This page will be updated with full details before ads go live.
      </p>

      <h2>Analytics</h2>
      <p>
        {SITE_NAME} uses Google Analytics 4 (GA4) in production to collect anonymized usage
        statistics — including pageviews, session duration, general device type, and approximate
        geographic location (country/region) — to understand site traffic and improve our features.
      </p>
      <p>
        No personally identifiable information (PII), passwords, typed text, or individual keystrokes
        are ever sent to Google Analytics. Aggregate product interaction events (such as starting or
        completing a lesson, game, practice session, or typing test with summary speed and accuracy numbers)
        may be measured to evaluate curriculum and game engagement, but raw keystroke sequences and user-typed
        text remain strictly on your local device.
      </p>
      <p>
        You can block analytics tracking at any time by enabling standard browser content blockers
        (such as uBlock Origin), using browser privacy protections, or installing Google&apos;s official{" "}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          rel="noopener noreferrer"
          target="_blank"
        >
          Google Analytics Opt-out Browser Add-on
        </a>
        .
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If this policy changes — for example when advertising is introduced — this
        page will be updated and the &ldquo;last updated&rdquo; date above will change accordingly.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </ContentPage>
  );
}

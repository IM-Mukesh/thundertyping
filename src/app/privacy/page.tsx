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
        {SITE_NAME} is designed to work without collecting personal information. This page
        explains exactly what is and isn&apos;t stored, and will be updated if that ever changes.
      </p>

      <h2>What we store</h2>
      <p>
        {SITE_NAME} does not have user accounts and does not run its own server-side database.
        Your test settings (mode, duration, theme, and similar preferences) and personal-best
        scores are saved using your browser&apos;s <code>localStorage</code>. This data stays on
        your device — it is never transmitted to us or to any server, and clearing your browser&apos;s
        site data removes it completely.
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
        No personally identifiable information (PII), passwords, or keystroke contents are ever sent
        to Google Analytics. All keystroke data and typing performance metrics stay entirely within your
        browser.
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

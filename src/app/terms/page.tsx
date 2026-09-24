import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/seo/constants";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description: `The terms for using ${SITE_NAME}, a free typing speed test.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <ContentPage title="Terms of Use" subtitle="Last updated: September 14, 2026">
      <p>
        By using {SITE_NAME}, you agree to the terms below. If you don&apos;t agree, please don&apos;t use
        the site.
      </p>

      <h2>Using the service</h2>
      <p>
        {SITE_NAME} is provided free of charge for personal, non-commercial use. Please don&apos;t
        attempt to disrupt the service, scrape it at scale, or use automated tools to inflate
        typing results.
      </p>

      <h2>Your content</h2>
      <p>
        Text you enter into the custom-text typing mode belongs to you. It is processed entirely
        in your browser and is never uploaded to or stored on any server we control.
      </p>

      <h2>No warranty</h2>
      <p>
        {SITE_NAME} is provided &ldquo;as is,&rdquo; without warranties of any kind. We do not
        guarantee the service will be uninterrupted, error-free, or suitable for any particular
        purpose (including as an official measure of typing proficiency for employment or
        certification).
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE_NAME} and its operators are not liable for
        any damages arising from your use of, or inability to use, the service.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        These terms may be updated from time to time. Continued use of {SITE_NAME} after changes
        are posted means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </ContentPage>
  );
}

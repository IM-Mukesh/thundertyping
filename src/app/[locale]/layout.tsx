import type { Metadata } from "next";
import Script from "next/script";
import { Geist, JetBrains_Mono, Orbitron } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeInitScript } from "@/components/theme/theme-init-script";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AudioVolumeBridge } from "@/components/games/ui/audio-settings";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, IS_PREVIEW } from "@/lib/seo/constants";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/json-ld";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Display face for the arcade: logo, headings, card titles, buttons. Orbitron
// is wide and geometric, which is what gives the hub its game-poster feel --
// the body text stays on Geist because Orbitron is unreadable in paragraphs.
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  display: "swap",
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = (await import("@/lib/i18n/dictionaries")).getDictionary(locale);
  const title = `${SITE_NAME} — ${dict.home.title}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    openGraph: {
      title: title,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: SITE_DESCRIPTION,
    },
    ...((process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION)
      ? {
          verification: {
            google:
              process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
              process.env.GOOGLE_SITE_VERIFICATION,
          },
        }
      : {}),
    ...(IS_PREVIEW ? { robots: { index: false, follow: false } } : {}),
  };
}

// Loads AdSense's own script once, in the document head, only when a real
// client id is configured -- AdSlot's individual <ins> tags render nothing
// without this (they push to window.adsbygoogle, but nothing is listening
// until this script has run). Absent the env var, this renders nothing at
// all, same as every AdSlot -- the site stays exactly as it is today until
// someone sets NEXT_PUBLIC_ADSENSE_CLIENT_ID.
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

const organizationSchema = buildOrganizationSchema();
const webSiteSchema = buildWebSiteSchema();

export default async function RootLayout({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <html
      lang={locale || "en"}
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased ${orbitron.variable}`}
    >
      <head>
        <ThemeInitScript />
        {/* Sitewide identity, once, rather than duplicated per-route -- the
            homepage's own WebApplication schema covers the product itself. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
        {adsenseClientId && (
          <Script id="adsense" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`} crossOrigin="anonymous" strategy="afterInteractive" />
        )}
      </head>
      <body className="flex min-h-full flex-col">
        {/* Keyboard-accessible skip link for screen readers and keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:font-bold focus:text-background focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-foreground"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          {/* Carries stored volume settings into the audio mixer, which is a
              plain module rather than React state. Mounted once here so the
              slider reaches every game rather than only the one that set it. */}
          <AudioVolumeBridge />
          <AuthProvider>
            <SiteHeader locale={locale} />
            {/* min-h-0 lets a page opt into filling exactly the remaining
                viewport (see /games, which scrolls its own content instead of
                the document). A flex item defaults to min-height:auto, which
                refuses to shrink below its content and would push the body
                taller than the viewport no matter what the child does. Pages
                that simply grow are unaffected — they still expand the document
                and scroll normally. */}
            <main id="main-content" className="flex min-h-0 flex-1 flex-col">{children}</main>
            <SiteFooter locale={locale} />
          </AuthProvider>
        </ThemeProvider>
      </body>
      {/* Production only -- local/dev traffic would otherwise pollute real
          visitor data. Loaded via @next/third-parties, which fetches gtag.js
          after hydration and tracks client-side route changes automatically
          (History API pushState/popstate), so no manual pageview wiring is
          needed per-route. No PII is sent -- default pageview + IDs only. */}
      {process.env.NODE_ENV === "production" && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </html>
  );
}

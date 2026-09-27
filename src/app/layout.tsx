import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Orbitron } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AudioVolumeBridge } from "@/components/games/ui/audio-settings";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SITE_NAME, SITE_URL, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/seo/constants";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/json-ld";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
};

// Runs before hydration so a returning visitor's saved theme applies on
// first paint instead of flashing the default dark theme.
const THEME_INIT_SCRIPT = `(function(){try{var r=localStorage.getItem("thundertyping-settings");var t="dark";if(r){var p=JSON.parse(r);if(p&&p.state&&p.state.theme)t=p.state.theme;}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

// Loads AdSense's own script once, in the document head, only when a real
// client id is configured -- AdSlot's individual <ins> tags render nothing
// without this (they push to window.adsbygoogle, but nothing is listening
// until this script has run). Absent the env var, this renders nothing at
// all, same as every AdSlot -- the site stays exactly as it is today until
// someone sets NEXT_PUBLIC_ADSENSE_CLIENT_ID.
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

const organizationSchema = buildOrganizationSchema();
const webSiteSchema = buildWebSiteSchema();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased ${orbitron.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Sitewide identity, once, rather than duplicated per-route -- the
            homepage's own WebApplication schema covers the product itself. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
        {adsenseClientId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
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
          <SiteHeader />
          {/* min-h-0 lets a page opt into filling exactly the remaining
              viewport (see /games, which scrolls its own content instead of
              the document). A flex item defaults to min-height:auto, which
              refuses to shrink below its content and would push the body
              taller than the viewport no matter what the child does. Pages
              that simply grow are unaffected — they still expand the document
              and scroll normally. */}
          <main id="main-content" className="flex min-h-0 flex-1 flex-col">{children}</main>
          <SiteFooter />
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

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL, SITE_NAME, langOf, languageAlternates } from "@/lib/site";
import { LANGS, DEFAULT_LANG, dict, pathOf, returnToPickedLang } from "@/i18n/index.js";
import "../globals.css";

// Galmuri11 by Lee Minseo, SIL Open Font License 1.1 (see fonts/OFL.md)
const galmuri = localFont({
  src: [
    { path: "../fonts/Galmuri11.woff2", weight: "400" },
    { path: "../fonts/Galmuri11-Bold.woff2", weight: "700" },
  ],
  variable: "--font-galmuri",
  display: "swap",
});

// Search Console / Search Advisor ownership codes for application-three-zeta.vercel.app.
// They are public in the page anyway; a Vercel env var of the same name overrides them.
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION || "fQnTUYsAUbzHUCe5mnsMwIXGZmuvS3Oh0WcimPE66Hw";
const NAVER_SITE_VERIFICATION = process.env.NAVER_SITE_VERIFICATION || "a6ad3fc2da6ad4c919ff4f9a246bcdc08c6022a3";
const verificationOther: Record<string, string> = { "naver-site-verification": NAVER_SITE_VERIFICATION };

// one static page per language: / (Korean), /en, /ja, /zh; any other path is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang: lang === DEFAULT_LANG ? [] : [lang] }));
}

export async function generateMetadata({ params }: LayoutProps<"/[[...lang]]">): Promise<Metadata> {
  const lang = langOf((await params).lang);
  if (!lang) return {};
  const d = dict(lang), path = pathOf(lang);
  const image = { url: "/opengraph-image.png", width: 1200, height: 630, alt: d.site.imageAlt };
  return {
    metadataBase: new URL(SITE_URL),
    title: d.site.title,
    description: d.site.description,
    keywords: d.site.keywords,
    applicationName: SITE_NAME,
    alternates: { canonical: path, languages: languageAlternates() },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: {
      type: "website",
      locale: d.ogLocale,
      alternateLocale: LANGS.filter((l) => l !== lang).map((l) => dict(l).ogLocale),
      url: path,
      siteName: SITE_NAME,
      title: d.site.title,
      description: d.site.description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: d.site.title, description: d.site.description, images: [image] },
    verification: {
      google: GOOGLE_SITE_VERIFICATION,
      other: verificationOther,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0c0a12",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[[...lang]]">) {
  const lang = langOf((await params).lang);
  if (!lang) notFound();
  return (
    <html lang={dict(lang).htmlLang} className={galmuri.variable}>
      <head>
        {lang === DEFAULT_LANG && <script dangerouslySetInnerHTML={{ __html: returnToPickedLang }} />}
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

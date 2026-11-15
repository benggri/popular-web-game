import { notFound } from "next/navigation";
import EmberTail from "@/components/EmberTail";
import { SITE_URL, SITE_NAME, langOf } from "@/lib/site";
import { dict, pathOf } from "@/i18n/index.js";

export default async function Home({ params }: PageProps<"/[[...lang]]">) {
  const lang = langOf((await params).lang);
  if (!lang) notFound();
  const d = dict(lang);
  // Structured data so search engines know this page is a free browser game
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: SITE_NAME,
    alternateName: d.site.alternateName,
    url: SITE_URL + (pathOf(lang) === "/" ? "" : pathOf(lang)),
    description: d.site.description,
    image: `${SITE_URL}/opengraph-image.png`,
    inLanguage: d.htmlLang,
    genre: ["Action", "Roguelite", "Survivor"],
    gamePlatform: ["Web browser", "PC", "Mobile"],
    applicationCategory: "Game",
    operatingSystem: "Any",
    playMode: "SinglePlayer",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "KRW" },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <EmberTail lang={lang} />
    </>
  );
}

import EmberTail from "@/components/EmberTail";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// Structured data so search engines know this page is a free browser game
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: SITE_NAME,
  alternateName: "엠버 테일",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  image: `${SITE_URL}/opengraph-image.png`,
  inLanguage: "ko",
  genre: ["Action", "Roguelite", "Survivor"],
  gamePlatform: ["Web browser", "PC", "Mobile"],
  applicationCategory: "Game",
  operatingSystem: "Any",
  playMode: "SinglePlayer",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: 0, priceCurrency: "KRW" },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <EmberTail />
    </>
  );
}

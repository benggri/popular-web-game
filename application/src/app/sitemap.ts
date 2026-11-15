import type { MetadataRoute } from "next";
import { SITE_URL, languageAlternates } from "@/lib/site";
import { LANGS, pathOf } from "@/i18n/index.js";

const abs = (path: string) => (path === "/" ? SITE_URL : SITE_URL + path);

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(Object.entries(languageAlternates()).map(([hl, path]) => [hl, abs(path)]));
  return LANGS.map((lang) => ({
    url: abs(pathOf(lang)),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
    alternates: { languages },
  }));
}

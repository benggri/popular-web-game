// Facts about the site that metadata, robots, the sitemap and structured data all share.

import { LANGS, DEFAULT_LANG, dict, pathOf } from "@/i18n/index.js";

export const SITE_URL = "https://application-three-zeta.vercel.app";
export const SITE_NAME = "Ember Tail";

/** The language a route's optional `[[...lang]]` segment names: none is Korean, anything else unknown is null. */
export function langOf(segments: string[] | undefined): string | null {
  if (!segments?.length) return DEFAULT_LANG;
  const [code] = segments;
  return segments.length === 1 && code !== DEFAULT_LANG && LANGS.includes(code) ? code : null;
}

/** hreflang -> path for every language, plus x-default for everyone else. */
export function languageAlternates(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const lang of LANGS) out[dict(lang).htmlLang] = pathOf(lang);
  out["x-default"] = pathOf("en");
  return out;
}

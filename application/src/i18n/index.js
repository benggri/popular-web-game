// The four languages the site is served in. Korean lives at the root, the others under /<code>.

import ko from "./ko.js";
import en from "./en.js";
import ja from "./ja.js";
import zh from "./zh.js";

export const DEFAULT_LANG = "ko";
export const DICTS = { ko, en, ja, zh };
export const LANGS = Object.keys(DICTS);

export const isLang = (code) => Object.hasOwn(DICTS, code);

export const dict = (lang) => DICTS[isLang(lang) ? lang : DEFAULT_LANG];

/** The page path for a language: "/" for Korean, "/en" for English ... */
export const pathOf = (lang) => (lang === DEFAULT_LANG ? "/" : `/${lang}`);

// the game's strings follow the page it booted on
let current = dict(DEFAULT_LANG);

export function setLang(lang) {
  current = dict(lang);
}

/** The in-game strings (alerts, cards, shop) for the current language. */
export const tr = () => current.game;

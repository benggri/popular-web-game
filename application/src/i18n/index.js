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

/** localStorage key for the language a player picked on the title screen. */
export const LANG_KEY = "ember-tail-lang";

/** Remembers the player's pick, so a later visit to / goes straight back to it. */
export function rememberLang(lang) {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // blocked storage: the pick just isn't remembered
  }
}

/**
 * Inline script for the Korean root page: sends a player who picked another language back to it
 * before anything paints. Crawlers have no saved pick, so they always see the Korean page.
 */
export const returnToPickedLang = `try{var l=localStorage.getItem(${JSON.stringify(LANG_KEY)});if(${JSON.stringify(
  LANGS.filter((l) => l !== DEFAULT_LANG),
)}.indexOf(l)>=0)location.replace("/"+l)}catch(e){}`;

// the game's strings follow the page it booted on
let current = dict(DEFAULT_LANG);

export function setLang(lang) {
  current = dict(lang);
}

/** The in-game strings (alerts, cards, shop) for the current language. */
export const tr = () => current.game;

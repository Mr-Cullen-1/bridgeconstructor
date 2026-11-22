import { uz } from "./uz.js";
import { ru } from "./ru.js";
import { en } from "./en.js";

export const languages = ["uz", "ru", "en"];
const dictionaries = { uz, ru, en };

export const normalizeLang = (lang) => (languages.includes(lang) ? lang : "uz");

// Uzbek is the base dictionary, so any key missing from a translation still renders.
export function getDictionary(lang, overrides) {
  const code = normalizeLang(lang);
  return { ...uz, ...dictionaries[code], ...overrides?.[code] };
}

// Level names live in the level JSON (Uzbek); other languages are in `levelTexts`.
export const levelText = (level, t) => ({
  title: t.levelTexts?.[level.id]?.title ?? level.title,
  subtitle: t.levelTexts?.[level.id]?.subtitle ?? level.subtitle,
});

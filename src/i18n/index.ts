import { ptBR } from "./pt-BR";
import { en } from "./en";
import type { EditorTranslations, SupportedLocale } from "./types";

export * from "./types";
export { ptBR, en };

const translationsMap: Record<string, EditorTranslations> = {
  "pt-BR": ptBR,
  pt: ptBR,
  en: en,
  "en-US": en,
};

export function getTranslations(
  locale: SupportedLocale | string = "pt-BR",
  customOverrides?: Partial<EditorTranslations>,
): EditorTranslations {
  const base = translationsMap[locale] ?? ptBR;
  if (!customOverrides) return base;
  return { ...base, ...customOverrides };
}


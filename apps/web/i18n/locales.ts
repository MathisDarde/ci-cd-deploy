/** Supported languages. English is the default and has no URL prefix. */
export const LOCALES = [
  { code: 'en', language: 'en-US', name: 'English', file: 'en.json', pokeApiLanguageId: 9 },
  { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json', pokeApiLanguageId: 5 },
  { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json', pokeApiLanguageId: 7 },
  { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json', pokeApiLanguageId: 6 },
] as const

export type LocaleCode = (typeof LOCALES)[number]['code']

export const DEFAULT_LOCALE: LocaleCode = 'en'

/** URL prefix of a locale: '' for the default one. */
export function localePrefix(code: LocaleCode) {
  return code === DEFAULT_LOCALE ? '' : `/${code}`
}

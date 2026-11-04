import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'

export const DEFAULT_LOCALE = 'en'
const MESSAGES = { en, fr, es, de } satisfies Record<string, typeof en>

export type Locale = keyof typeof MESSAGES
export type ErrorKey = keyof typeof en.errors

export function isLocale(value: string): value is Locale {
  return Object.hasOwn(MESSAGES, value)
}

/**
 * Picks the best supported locale from an explicit `?lang=` value, then the
 * Accept-Language header ("fr-FR,fr;q=0.9,en;q=0.8"), then English.
 */
export function resolveLocale(
  lang: string | undefined,
  acceptLanguage: string | undefined,
): Locale {
  const explicit = lang?.toLowerCase()
  if (explicit && isLocale(explicit)) return explicit
  const candidates = (acceptLanguage ?? '')
    .split(',')
    .map(part => {
      const [tag = '', ...params] = part.trim().split(';')
      const q = params.map(p => p.trim()).find(p => p.startsWith('q='))
      return { language: (tag.split('-')[0] ?? '').toLowerCase(), q: q ? Number(q.slice(2)) : 1 }
    })
    .filter(c => c.language && !Number.isNaN(c.q) && c.q > 0)
    .sort((a, b) => b.q - a.q)
  const match = candidates.find(c => isLocale(c.language))
  return match ? (match.language as Locale) : DEFAULT_LOCALE
}

export function translateError(locale: Locale, key: ErrorKey): string {
  return MESSAGES[locale].errors[key]
}

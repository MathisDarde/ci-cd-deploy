import { describe, expect, it } from 'vitest'
import { resolveLocale } from '../src/i18n'

describe('resolveLocale', () => {
  it.each([
    [undefined, undefined, 'en'],
    [undefined, '', 'en'],
    [undefined, 'fr-FR,fr;q=0.9,en;q=0.8', 'fr'],
    [undefined, 'ja,de;q=0.5', 'de'],
    [undefined, 'en;q=0.3,es;q=0.9', 'es'],
    [undefined, 'it,pt', 'en'],
    [undefined, 'fr;q=0', 'en'],
    ['de', 'fr', 'de'],
    ['DE', undefined, 'de'],
    ['xx', 'es', 'es'],
  ])('lang=%s, Accept-Language=%s → %s', (lang, header, expected) => {
    expect(resolveLocale(lang, header)).toBe(expected)
  })
})

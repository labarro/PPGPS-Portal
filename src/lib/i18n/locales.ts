/**
 * Idiomas de conteúdo do portal.
 *
 * - `pt-BR` é o idioma padrão e o único exibido na UI pública no MVP.
 * - `en` é declarado desde a S01 para a V2, mas permanece oculto na UI pública.
 */
export type LocaleCode = 'pt-BR' | 'en'

export type LocaleDefinition = {
  code: LocaleCode
  label: string
  /** Se o idioma pode ser oferecido ao visitante na UI pública. */
  public: boolean
}

export const locales: readonly LocaleDefinition[] = [
  { code: 'pt-BR', label: 'Português (Brasil)', public: true },
  { code: 'en', label: 'English', public: false },
] as const

export const defaultLocale: LocaleCode = 'pt-BR'

export const publicLocales = (): LocaleCode[] =>
  locales.filter((locale) => locale.public).map((locale) => locale.code)

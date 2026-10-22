/**
 * Slugs de conteúdo (planejamento 9.3; AGENTS.md §5): português sem acentos, minúsculas,
 * palavras separadas por hífen. Alteração de slug publicado gera redirecionamento 301.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const SLUG_MAX_LENGTH = 80

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '')
}

export function validateSlug(value: unknown): true | string {
  if (typeof value !== 'string' || value.trim() === '') return 'Informe o endereço (slug).'
  if (value.length > SLUG_MAX_LENGTH) return `Use no máximo ${SLUG_MAX_LENGTH} caracteres.`
  if (!SLUG_PATTERN.test(value)) {
    return 'Use apenas letras minúsculas sem acento, números e hífens (ex.: promocao-da-saude).'
  }
  return true
}

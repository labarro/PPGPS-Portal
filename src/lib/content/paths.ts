/**
 * Rotas públicas das entidades da S03 (planejamento 9.2). Fonte única para links, sitemap,
 * redirecionamentos e pré-visualização.
 */
export const GROUP_BASE_PATH = '/o-grupo'
export const LINES_BASE_PATH = '/linhas'

/** Subpáginas fixas de "O grupo" (rotas próprias; `pages` com o mesmo slug as complementam). */
export const GROUP_SECTIONS = [
  { slug: '', label: 'Apresentação', href: GROUP_BASE_PATH },
  { slug: 'historico', label: 'Histórico', href: `${GROUP_BASE_PATH}/historico` },
  { slug: 'objetivos', label: 'Objetivos', href: `${GROUP_BASE_PATH}/objetivos` },
  {
    slug: 'referencias-institucionais',
    label: 'Referências institucionais',
    href: `${GROUP_BASE_PATH}/referencias-institucionais`,
  },
  { slug: 'contato', label: 'Contato', href: `${GROUP_BASE_PATH}/contato` },
] as const

export const FIXED_GROUP_SLUGS: readonly string[] = GROUP_SECTIONS.map((s) => s.slug).filter(
  Boolean,
)

export const researchLinePath = (slug: string): string => `${LINES_BASE_PATH}/${slug}`

export const pagePath = (slug: string): string => `${GROUP_BASE_PATH}/${slug}`

export type ContentCollection = 'research-lines' | 'pages'

export function pathForDocument(collection: ContentCollection, slug: string): string {
  return collection === 'research-lines' ? researchLinePath(slug) : pagePath(slug)
}

/**
 * Normaliza um caminho de requisição para comparação com `redirects.from`:
 * sem query/hash, sem barra final, minúsculas e decodificado.
 */
export function normalizePath(path: string): string {
  let clean = path.split(/[?#]/)[0] ?? ''
  try {
    clean = decodeURIComponent(clean)
  } catch {
    // Caminho com codificação inválida: compara como recebido.
  }
  clean = clean.trim().toLowerCase()
  if (!clean.startsWith('/')) clean = `/${clean}`
  if (clean.length > 1) clean = clean.replace(/\/+$/, '')
  return clean
}

/** Caminhos elegíveis a redirecionamento (somente conteúdo com slug editável). */
export function isRedirectCandidate(path: string): boolean {
  return /^\/(linhas|o-grupo)\/[^/]+\/?$/i.test(path)
}

/** URL externa de referência: http(s) somente (o espelho do DGP só responde em http). */
export function validateExternalUrl(value: unknown, { required = false } = {}): true | string {
  if (value == null || value === '') return required ? 'Informe o endereço.' : true
  if (typeof value !== 'string') return 'Endereço inválido.'
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return 'Use um endereço iniciado por https:// (ou http:// quando o site não oferecer https).'
    }
    return true
  } catch {
    return 'Endereço inválido. Ex.: https://www.exemplo.org'
  }
}

/** Destino de redirecionamento: caminho interno ("/linhas/x") ou URL http(s). */
export function validateRedirectTarget(value: unknown): true | string {
  if (typeof value !== 'string' || value.trim() === '') return 'Informe o destino.'
  const target = value.trim()
  if (target.startsWith('/') && !target.startsWith('//')) return true
  return validateExternalUrl(target, { required: true })
}

export function validateRedirectSource(value: unknown): true | string {
  if (typeof value !== 'string' || value.trim() === '') return 'Informe o caminho de origem.'
  const source = value.trim()
  if (!source.startsWith('/') || source.startsWith('//')) {
    return 'Use um caminho interno iniciado por "/" (ex.: /linhas/nome-antigo).'
  }
  if (/^\/(admin|api|_next)(\/|$)/i.test(source)) return 'Caminho reservado do sistema.'
  return true
}

/**
 * Rotas públicas das entidades da S03 e da S04 (planejamento 9.2). Fonte única para links,
 * sitemap, redirecionamentos e pré-visualização.
 */
export const GROUP_BASE_PATH = '/o-grupo'
export const LINES_BASE_PATH = '/linhas'
export const MEMBERS_BASE_PATH = '/integrantes'
export const BLOG_BASE_PATH = '/blog'
export const BLOG_RSS_PATH = '/blog/rss.xml'
export const BLOG_ATOM_PATH = '/blog/atom.xml'

/** Slugs reservados em /integrantes (rotas futuras de orientações e egressos, S07). */
export const RESERVED_PERSON_SLUGS: readonly string[] = ['orientacoes', 'egressos']

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

/**
 * S06 (RF-021): páginas legais em rotas de primeiro nível. O conteúdo é editável no CMS
 * (coleção `pages` com o mesmo slug); sem página publicada, a rota usa o texto padrão.
 */
export const LEGAL_PAGES = [
  { slug: 'privacidade', label: 'Privacidade', href: '/privacidade' },
  { slug: 'acessibilidade', label: 'Acessibilidade', href: '/acessibilidade' },
  { slug: 'sobre-o-portal', label: 'Sobre o portal', href: '/sobre-o-portal' },
] as const

export type LegalPageSlug = (typeof LEGAL_PAGES)[number]['slug']

export const LEGAL_PAGE_SLUGS: readonly string[] = LEGAL_PAGES.map((page) => page.slug)

export const isLegalPageSlug = (slug: string): slug is LegalPageSlug =>
  LEGAL_PAGE_SLUGS.includes(slug)

export const researchLinePath = (slug: string): string => `${LINES_BASE_PATH}/${slug}`

export const pagePath = (slug: string): string =>
  isLegalPageSlug(slug) ? `/${slug}` : `${GROUP_BASE_PATH}/${slug}`

export const personPath = (slug: string): string => `${MEMBERS_BASE_PATH}/${slug}`

/** S05: ensaios e taxonomia do blog. */
export const essayPath = (slug: string): string => `${BLOG_BASE_PATH}/${slug}`
export const categoryPath = (slug: string): string => `${BLOG_BASE_PATH}/categoria/${slug}`
export const tagPath = (slug: string): string => `${BLOG_BASE_PATH}/tag/${slug}`

export type ContentCollection =
  'research-lines' | 'pages' | 'people' | 'essays' | 'categories' | 'tags'

export function pathForDocument(collection: ContentCollection, slug: string): string {
  switch (collection) {
    case 'people':
      return personPath(slug)
    case 'research-lines':
      return researchLinePath(slug)
    case 'essays':
      return essayPath(slug)
    case 'categories':
      return categoryPath(slug)
    case 'tags':
      return tagPath(slug)
    default:
      return pagePath(slug)
  }
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
  return (
    /^\/(linhas|o-grupo|integrantes|blog)\/[^/]+\/?$/i.test(path) ||
    /^\/blog\/(categoria|tag)\/[^/]+\/?$/i.test(path)
  )
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

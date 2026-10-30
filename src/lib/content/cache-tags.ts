import {
  BLOG_BASE_PATH,
  essayPath,
  GROUP_BASE_PATH,
  LINES_BASE_PATH,
  MEMBERS_BASE_PATH,
  pagePath,
  personPath,
  researchLinePath,
} from './paths'

/**
 * Tags de cache dos dados públicos (planejamento 12.4). Cada leitura pública é marcada com as
 * tags abaixo; os hooks `afterChange`/`afterDelete` revalidam as tags e as rotas afetadas.
 */
export const CACHE_TAGS = {
  siteChrome: 'site-chrome',
  groupProfile: 'group-profile',
  homepage: 'homepage',
  researchLines: 'research-lines',
  pages: 'pages',
  people: 'people',
  essays: 'essays',
  essayTaxonomy: 'essay-taxonomy',
  sitemap: 'sitemap',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

export const researchLineTag = (slug: string) => `research-line:${slug}`
export const pageTag = (slug: string) => `page:${slug}`
export const personTag = (slug: string) => `person:${slug}`
export const essayTag = (slug: string) => `essay:${slug}`

export type RevalidationPlan = { tags: string[]; paths: { path: string; type?: 'layout' }[] }

const uniq = <T>(items: T[]): T[] => [...new Set(items)]

type SlugDoc = { slug?: string | null } | null | undefined

const slugsOf = (...docs: SlugDoc[]) =>
  uniq(docs.map((doc) => doc?.slug).filter((slug): slug is string => !!slug))

/**
 * O que revalidar quando uma entidade muda. Perfil do grupo: home, `/o-grupo/*`, linhas
 * (JSON-LD e rodapé) — o rodapé está no layout, logo revalida o layout inteiro.
 */
export function revalidationPlan(
  entity:
    | 'group-profile'
    | 'homepage'
    | 'research-lines'
    | 'pages'
    | 'site-chrome'
    | 'redirects'
    | 'people'
    | 'essays'
    | 'categories'
    | 'tags',
  doc?: SlugDoc,
  previousDoc?: SlugDoc,
): RevalidationPlan {
  switch (entity) {
    // S04: pessoas aparecem no diretório, no perfil, nas linhas, em /o-grupo (líderes, via
    // perfil do grupo) e na página inicial. Revogação de consentimento passa por aqui.
    case 'people': {
      const slugs = slugsOf(doc, previousDoc)
      return {
        tags: uniq([
          CACHE_TAGS.people,
          CACHE_TAGS.groupProfile,
          CACHE_TAGS.sitemap,
          ...slugs.map(personTag),
        ]),
        paths: [
          { path: '/' },
          { path: MEMBERS_BASE_PATH, type: 'layout' },
          { path: GROUP_BASE_PATH },
          { path: LINES_BASE_PATH, type: 'layout' },
          ...slugs.map((slug) => ({ path: personPath(slug) })),
        ],
      }
    }
    case 'group-profile':
      return {
        tags: [CACHE_TAGS.groupProfile, CACHE_TAGS.sitemap],
        paths: [{ path: '/', type: 'layout' }],
      }
    case 'site-chrome':
      return { tags: [CACHE_TAGS.siteChrome], paths: [{ path: '/', type: 'layout' }] }
    case 'homepage':
      return { tags: [CACHE_TAGS.homepage], paths: [{ path: '/' }] }
    case 'research-lines': {
      const slugs = slugsOf(doc, previousDoc)
      return {
        tags: uniq([CACHE_TAGS.researchLines, CACHE_TAGS.sitemap, ...slugs.map(researchLineTag)]),
        paths: [
          { path: '/' },
          { path: LINES_BASE_PATH },
          { path: GROUP_BASE_PATH },
          ...slugs.map((slug) => ({ path: researchLinePath(slug) })),
        ],
      }
    }
    case 'pages': {
      const slugs = slugsOf(doc, previousDoc)
      return {
        tags: uniq([CACHE_TAGS.pages, CACHE_TAGS.sitemap, ...slugs.map(pageTag)]),
        paths: [
          { path: GROUP_BASE_PATH, type: 'layout' },
          ...slugs.map((slug) => ({ path: pagePath(slug) })),
        ],
      }
    }
    // S05: ensaios aparecem no blog, na home (destaques), nos perfis dos autores, no RSS e no
    // sitemap; categorias e tags afetam as páginas de taxonomia e os rótulos dos ensaios.
    case 'essays': {
      const slugs = slugsOf(doc, previousDoc)
      return {
        tags: uniq([CACHE_TAGS.essays, CACHE_TAGS.sitemap, ...slugs.map(essayTag)]),
        paths: [
          { path: '/' },
          { path: BLOG_BASE_PATH, type: 'layout' },
          { path: MEMBERS_BASE_PATH, type: 'layout' },
          ...slugs.map((slug) => ({ path: essayPath(slug) })),
        ],
      }
    }
    case 'categories':
    case 'tags':
      return {
        tags: [CACHE_TAGS.essayTaxonomy, CACHE_TAGS.essays, CACHE_TAGS.sitemap],
        paths: [{ path: '/' }, { path: BLOG_BASE_PATH, type: 'layout' }],
      }
    case 'redirects':
      return { tags: [], paths: [] }
  }
}

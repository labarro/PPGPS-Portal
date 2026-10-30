import config from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

import { isAdminOrEditor } from '@/access'
import { defaultLocale } from '@/lib/i18n/locales'
import { buildDirectory, type DirectoryPerson } from '@/lib/people/directory'
import type {
  Category,
  Essay,
  GroupProfile,
  Homepage,
  Page,
  Person,
  ResearchLine,
  Tag,
  User,
} from '@/payload-types'

import { cachedRead } from './cache'
import { CACHE_TAGS, essayTag, pageTag, personTag, researchLineTag } from './cache-tags'
import { isLegalPageSlug, normalizePath } from './paths'
import { canViewPublic, essayListedWhere, essayPublicWhere } from './visibility'

/**
 * Leituras públicas via Local API em Server Components (AGENTS.md §4.5): sempre com
 * `overrideAccess: false`. O visitante é anônimo; no modo de pré-visualização (Draft Mode),
 * o usuário autenticado do painel (admin/editor) é repassado e rascunhos são incluídos —
 * nesse caso sem cache.
 */
type ReadContext = { draft: boolean; user: User | null }

const isBuildPhase = () => process.env.NEXT_PHASE === 'phase-production-build'

const getPayloadClient = (): Promise<Payload> => getPayload({ config })

export const getReadContext = cache(async (): Promise<ReadContext> => {
  if (isBuildPhase()) return { draft: false, user: null }
  const { isEnabled } = await draftMode()
  if (!isEnabled) return { draft: false, user: null }
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const editorial = user && isAdminOrEditor({ req: { user } }) ? (user as User) : null
  return editorial ? { draft: true, user: editorial } : { draft: false, user: null }
})

const baseArgs = (ctx: ReadContext) =>
  ({
    overrideAccess: false,
    locale: defaultLocale,
    draft: ctx.draft,
    ...(ctx.user ? { user: { ...ctx.user, collection: 'users' as const } } : {}),
  }) as const

async function read<T>(
  key: string[],
  tags: string[],
  fallback: T,
  fn: (payload: Payload, ctx: ReadContext) => Promise<T>,
): Promise<T> {
  if (isBuildPhase()) return fallback
  const ctx = await getReadContext()
  const run = async () => fn(await getPayloadClient(), ctx)
  try {
    return ctx.draft ? await run() : await cachedRead(key, tags, run)
  } catch (error) {
    console.error(`[site] Falha ao ler ${key.join('/')}.`, error)
    return fallback
  }
}

/** Perfil do grupo publicado (ou `null` se ainda não houver publicação). */
export const getGroupProfile = cache((): Promise<GroupProfile | null> =>
  read(['group-profile'], [CACHE_TAGS.groupProfile], null, async (payload, ctx) => {
    const doc = await payload.findGlobal({ slug: 'group-profile', depth: 1, ...baseArgs(ctx) })
    return doc && typeof doc.officialName === 'string' && doc.officialName ? doc : null
  }),
)

export const getHomepage = cache((): Promise<Homepage | null> =>
  read(['homepage'], [CACHE_TAGS.homepage], null, async (payload, ctx) => {
    const doc = await payload.findGlobal({ slug: 'homepage', depth: 0, ...baseArgs(ctx) })
    return doc && doc.updatedAt ? doc : null
  }),
)

export type ResearchLineSummary = Pick<
  ResearchLine,
  'id' | 'name' | 'slug' | 'summary' | 'order' | 'provisional' | 'updatedAt'
>

export const listResearchLines = cache((): Promise<ResearchLineSummary[]> =>
  read(['research-lines', 'list'], [CACHE_TAGS.researchLines], [], async (payload, ctx) => {
    const result = await payload.find({
      collection: 'research-lines',
      sort: 'order',
      limit: 50,
      depth: 0,
      pagination: false,
      select: {
        name: true,
        slug: true,
        summary: true,
        order: true,
        provisional: true,
        active: true,
        updatedAt: true,
      },
      ...(ctx.draft ? {} : { where: { active: { equals: true } } }),
      ...baseArgs(ctx),
    })
    return result.docs as ResearchLineSummary[]
  }),
)

export const getResearchLine = cache((slug: string): Promise<ResearchLine | null> =>
  read(
    ['research-lines', 'slug', slug],
    [CACHE_TAGS.researchLines, researchLineTag(slug)],
    null,
    async (payload, ctx) => {
      const result = await payload.find({
        collection: 'research-lines',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 1,
        ...baseArgs(ctx),
      })
      const doc = result.docs[0] ?? null
      // Fora da pré-visualização, aplica a mesma regra pública da coleção (defesa extra).
      if (doc && !ctx.draft && !canViewPublic('research-lines', doc)) return null
      return doc
    },
  ),
)

export const getPage = cache((slug: string): Promise<Page | null> =>
  read(['pages', 'slug', slug], [CACHE_TAGS.pages, pageTag(slug)], null, async (payload, ctx) => {
    const result = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      ...baseArgs(ctx),
    })
    const doc = result.docs[0] ?? null
    if (doc && !ctx.draft && !canViewPublic('pages', doc)) return null
    return doc
  }),
)

export type PageSummary = Pick<Page, 'id' | 'title' | 'slug' | 'summary' | 'updatedAt'>

export const listPages = cache((): Promise<PageSummary[]> =>
  read(['pages', 'list'], [CACHE_TAGS.pages], [], async (payload, ctx) => {
    const result = await payload.find({
      collection: 'pages',
      sort: 'title',
      limit: 100,
      depth: 0,
      pagination: false,
      select: { title: true, slug: true, summary: true, updatedAt: true },
      ...baseArgs(ctx),
    })
    // Páginas legais (S06) ficam no rodapé, não na navegação de "O grupo".
    return (result.docs as PageSummary[]).filter((page) => !isLegalPageSlug(page.slug))
  }),
)

/**
 * Diretório de integrantes (S04): SEMPRE como visitante anônimo — mesmo na pré-visualização —
 * para que nenhuma pessoa sem consentimento `public_profile` vigente apareça. O acesso da
 * coleção aplica `publicWhere('people')`; vínculos seguem a pessoa; a foto chega somente com
 * o escopo `photo` (hook `beforeRead`) e mídia liberada.
 */
const anonymousArgs = { overrideAccess: false, locale: defaultLocale, draft: false } as const

export const listDirectory = cache((): Promise<DirectoryPerson[]> =>
  isBuildPhase()
    ? Promise.resolve([])
    : cachedRead(['people', 'directory'], [CACHE_TAGS.people], async () => {
        const payload = await getPayloadClient()
        const [people, memberships] = await Promise.all([
          payload.find({
            collection: 'people',
            limit: 1000,
            depth: 1,
            pagination: false,
            select: { fullName: true, slug: true, shortBio: true, photo: true },
            ...anonymousArgs,
          }),
          payload.find({
            collection: 'memberships',
            limit: 5000,
            depth: 0,
            pagination: false,
            select: {
              person: true,
              role: true,
              trainingLevel: true,
              startDate: true,
              endDate: true,
              lines: true,
            },
            ...anonymousArgs,
          }),
        ])
        return buildDirectory(people.docs, memberships.docs)
      }).catch((error) => {
        console.error('[site] Falha ao ler o diretório de integrantes.', error)
        return []
      }),
)

/** Perfil público completo (sempre anônimo; 
ull sem consentimento vigente). */
export const getPerson = cache((slug: string): Promise<Person | null> =>
  isBuildPhase()
    ? Promise.resolve(null)
    : cachedRead(['people', 'slug', slug], [CACHE_TAGS.people, personTag(slug)], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'people',
          where: { slug: { equals: slug } },
          limit: 1,
          depth: 1,
          ...anonymousArgs,
        })
        return result.docs[0] ?? null
      }).catch((error) => {
        console.error(`[site] Falha ao ler o perfil ${slug}.`, error)
        return null
      }),
)

/**
 * Destino de redirecionamento para um caminho sem conteúdo. O proxy responde 301 antes da
 * página; esta consulta cobre a janela do cache do proxy (a página usa redirecionamento
 * permanente do Next). Leitura interna do servidor: a coleção não é pública.
 */
export async function findRedirectTarget(path: string): Promise<string | null> {
  if (isBuildPhase()) return null
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'redirects',
      where: { from: { equals: normalizePath(path) } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const target = result.docs[0]?.to?.url
    return typeof target === 'string' && target ? target : null
  } catch (error) {
    console.error('[site] Falha ao consultar redirecionamentos.', error)
    return null
  }
}

/** Dados do sitemap: SEMPRE como visitante anônimo (nunca rascunhos), mesmo em pré-visualização. */
export async function getSitemapEntries(): Promise<{
  profileUpdatedAt: string | null
  lines: { slug: string; updatedAt: string }[]
  pages: { slug: string; updatedAt: string }[]
  people: { slug: string; updatedAt: string }[]
  essays: { slug: string; updatedAt: string }[]
  categories: { slug: string; updatedAt: string }[]
  tags: { slug: string; updatedAt: string }[]
}> {
  const empty = {
    profileUpdatedAt: null,
    lines: [],
    pages: [],
    people: [],
    essays: [],
    categories: [],
    tags: [],
  }
  if (isBuildPhase()) return empty
  const epoch = await getEssayEpoch()
  return cachedRead(['sitemap', epoch], [CACHE_TAGS.sitemap], async () => {
    const payload = await getPayloadClient()
    const anon = { overrideAccess: false, locale: defaultLocale, draft: false } as const
    // S05: só ensaios listáveis (publicados e já alcançados pela data; nunca arquivados).
    const essays = await payload.find({
      collection: 'essays',
      where: essayListedWhere(new Date()),
      limit: 2000,
      depth: 1,
      pagination: false,
      select: { slug: true, updatedAt: true, category: true, tags: true },
      populate: { categories: { slug: true }, tags: { slug: true } },
      ...anon,
    })
    const taxonomy = (key: 'category' | 'tags') => {
      const bySlug = new Map<string, string>()
      for (const essay of essays.docs) {
        const raw = essay[key]
        const terms = (Array.isArray(raw) ? raw : [raw]) as (number | Category | Tag | null)[]
        for (const term of terms) {
          if (!term || typeof term !== 'object') continue
          const previous = bySlug.get(term.slug)
          if (!previous || previous < essay.updatedAt) bySlug.set(term.slug, essay.updatedAt)
        }
      }
      return [...bySlug].map(([slug, updatedAt]) => ({ slug, updatedAt }))
    }
    const [profile, lines, pages, people] = await Promise.all([
      payload.findGlobal({ slug: 'group-profile', depth: 0, ...anon }),
      payload.find({
        collection: 'research-lines',
        limit: 100,
        depth: 0,
        pagination: false,
        select: { slug: true, updatedAt: true, active: true, _status: true },
        ...anon,
      }),
      payload.find({
        collection: 'pages',
        limit: 500,
        depth: 0,
        pagination: false,
        select: { slug: true, updatedAt: true, _status: true },
        ...anon,
      }),
      // Pessoas: o acesso público já aplica canViewPublic (consentimento vigente).
      payload.find({
        collection: 'people',
        limit: 1000,
        depth: 0,
        pagination: false,
        select: { slug: true, updatedAt: true },
        ...anon,
      }),
    ])
    return {
      profileUpdatedAt: profile?.officialName ? (profile.updatedAt ?? null) : null,
      lines: lines.docs
        .filter((doc) => canViewPublic('research-lines', doc))
        .map((doc) => ({ slug: doc.slug, updatedAt: doc.updatedAt })),
      pages: pages.docs
        .filter((doc) => canViewPublic('pages', doc))
        .map((doc) => ({ slug: doc.slug, updatedAt: doc.updatedAt })),
      people: people.docs.map((doc) => ({ slug: doc.slug, updatedAt: doc.updatedAt })),
      essays: essays.docs.map((doc) => ({ slug: doc.slug, updatedAt: doc.updatedAt })),
      categories: taxonomy('category'),
      tags: taxonomy('tags'),
    }
  })
}

// ---------------------------------------------------------------------------------------------
// S05 — blog acadêmico. Listagens, RSS, sitemap e destaques: SEMPRE como visitante anônimo
// (nunca rascunhos, agendados futuros ou arquivados). A página do ensaio aceita a
// pré-visualização autenticada (Draft Mode) do coordenador/desenvolvedor.
// ---------------------------------------------------------------------------------------------

/**
 * "Época de publicação": a data de publicação mais recente já alcançada entre os ensaios em
 * estado público. Entra na chave do cache: quando um agendamento vence, a chave muda e as
 * listagens são recalculadas na hora — sem depender do job. Consulta interna (só uma data).
 */
export const getEssayEpoch = cache(async (): Promise<string> => {
  if (isBuildPhase()) return 'build'
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'essays',
      where: essayPublicWhere(new Date()),
      sort: '-publishedAt',
      limit: 1,
      depth: 0,
      pagination: false,
      select: { publishedAt: true },
      overrideAccess: true,
    })
    return result.docs[0]?.publishedAt ?? 'none'
  } catch (error) {
    console.error('[site] Falha ao ler a época de publicação dos ensaios.', error)
    return 'error'
  }
})

export type EssayAuthorSummary = {
  name: string
  role: 'author' | 'co_author' | 'guest'
  bio: string | null
  /** Somente quando a pessoa tem perfil público (consentimento vigente). */
  personSlug: string | null
}

export type EssayTerm = { id: number; name: string; slug: string }

export type EssayCover = {
  url: string
  alt: string
  width: number | null
  height: number | null
  credit: string | null
  caption: string | null
}

export type EssaySummary = {
  id: number
  title: string
  slug: string
  subtitle: string | null
  excerpt: string | null
  nature: Essay['nature']
  publishedAt: string | null
  revisedAt: string | null
  updatedAt: string
  readingTime: number
  category: EssayTerm | null
  tags: EssayTerm[]
  authors: EssayAuthorSummary[]
  cover: EssayCover | null
}

const SUMMARY_SELECT = {
  title: true,
  slug: true,
  subtitle: true,
  excerpt: true,
  nature: true,
  publishedAt: true,
  revisedAt: true,
  updatedAt: true,
  readingTime: true,
  category: true,
  tags: true,
  authors: true,
  cover: true,
} as const

const SUMMARY_POPULATE = {
  categories: { name: true, slug: true },
  tags: { name: true, slug: true },
  people: { fullName: true, slug: true },
  media: { url: true, alt: true, width: true, height: true, credit: true, caption: true },
} as const

const toTerm = (value: unknown): EssayTerm | null =>
  value && typeof value === 'object' && typeof (value as Category).slug === 'string'
    ? {
        id: (value as Category).id,
        name: (value as Category).name,
        slug: (value as Category).slug,
      }
    : null

export function toEssayCover(value: unknown): EssayCover | null {
  if (!value || typeof value !== 'object') return null
  const media = value as {
    url?: string | null
    alt?: string | null
    width?: number | null
    height?: number | null
    credit?: string | null
    caption?: string | null
  }
  if (!media.url || !media.alt) return null
  return {
    url: media.url,
    alt: media.alt,
    width: media.width ?? null,
    height: media.height ?? null,
    credit: media.credit ?? null,
    caption: media.caption ?? null,
  }
}

export function toEssayAuthors(authors: Essay['authors']): EssayAuthorSummary[] {
  return (authors ?? [])
    .map((author) => {
      const person = author.person && typeof author.person === 'object' ? author.person : null
      const name = author.name?.trim() || person?.fullName || ''
      return {
        name,
        role: author.role,
        bio: author.role === 'guest' ? (author.bio ?? null) : null,
        personSlug: person && typeof person.slug === 'string' ? person.slug : null,
      }
    })
    .filter((author) => author.name)
}

export function toEssaySummary(doc: Partial<Essay> & Pick<Essay, 'id'>): EssaySummary {
  return {
    id: doc.id,
    title: doc.title ?? '',
    slug: doc.slug ?? '',
    subtitle: doc.subtitle ?? null,
    excerpt: doc.excerpt ?? null,
    nature: doc.nature ?? 'reflective_essay',
    publishedAt: doc.publishedAt ?? null,
    revisedAt: doc.revisedAt ?? null,
    updatedAt: doc.updatedAt ?? '',
    readingTime: doc.readingTime ?? 1,
    category: toTerm(doc.category),
    tags: (doc.tags ?? []).map(toTerm).filter((term): term is EssayTerm => term !== null),
    authors: toEssayAuthors(doc.authors ?? []),
    cover: toEssayCover(doc.cover),
  }
}

export const ESSAYS_PER_PAGE = 12

export type EssayPage = {
  docs: EssaySummary[]
  page: number
  totalPages: number
  totalDocs: number
}

export type EssayListFilter = {
  page?: number
  limit?: number
  categoryId?: number
  tagId?: number
  personId?: number
  excludeId?: number
}

export const listEssays = cache(async (filter: EssayListFilter = {}): Promise<EssayPage> => {
  const empty: EssayPage = { docs: [], page: 1, totalPages: 0, totalDocs: 0 }
  if (isBuildPhase()) return empty
  const epoch = await getEssayEpoch()
  const page = Math.max(1, Math.floor(filter.page ?? 1))
  const limit = Math.min(Math.max(1, filter.limit ?? ESSAYS_PER_PAGE), 100)
  const key = [
    'essays',
    'list',
    epoch,
    `p${page}`,
    `l${limit}`,
    `c${filter.categoryId ?? ''}`,
    `t${filter.tagId ?? ''}`,
    `a${filter.personId ?? ''}`,
    `x${filter.excludeId ?? ''}`,
  ]
  return cachedRead(key, [CACHE_TAGS.essays, CACHE_TAGS.essayTaxonomy], async () => {
    const payload = await getPayloadClient()
    const conditions = [
      essayListedWhere(new Date()),
      ...(filter.categoryId ? [{ category: { equals: filter.categoryId } }] : []),
      ...(filter.tagId ? [{ tags: { in: [filter.tagId] } }] : []),
      ...(filter.personId ? [{ 'authors.person': { equals: filter.personId } }] : []),
      ...(filter.excludeId ? [{ id: { not_equals: filter.excludeId } }] : []),
    ]
    const result = await payload.find({
      collection: 'essays',
      where: { and: conditions },
      sort: '-publishedAt',
      page,
      limit,
      depth: 1,
      select: SUMMARY_SELECT,
      populate: SUMMARY_POPULATE,
      ...anonymousArgs,
    })
    return {
      docs: result.docs.map((doc) => toEssaySummary(doc as Essay)),
      page: result.page ?? page,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    }
  }).catch((error) => {
    console.error('[site] Falha ao listar ensaios.', error)
    return empty
  })
})

/** Destaques da home: fixados no global "Página inicial" (se listáveis) ou os 3 mais recentes. */
export const getFeaturedEssays = cache(
  async (pinned: (number | { id: number } | null | undefined)[] = []): Promise<EssaySummary[]> => {
    const ids = pinned
      .map((item) => (item && typeof item === 'object' ? item.id : item))
      .filter((id): id is number => typeof id === 'number')
    const recent = await listEssays({ limit: 3 })
    if (ids.length === 0 || isBuildPhase()) return recent.docs
    const epoch = await getEssayEpoch()
    const chosen = await cachedRead(
      ['essays', 'featured', epoch, ids.join('-')],
      [CACHE_TAGS.essays, CACHE_TAGS.essayTaxonomy],
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'essays',
          where: { and: [essayListedWhere(new Date()), { id: { in: ids } }] },
          limit: ids.length,
          depth: 1,
          pagination: false,
          select: SUMMARY_SELECT,
          populate: SUMMARY_POPULATE,
          ...anonymousArgs,
        })
        const byId = new Map(result.docs.map((doc) => [doc.id, toEssaySummary(doc as Essay)]))
        return ids.map((id) => byId.get(id)).filter((doc): doc is EssaySummary => !!doc)
      },
    ).catch(() => [] as EssaySummary[])
    // Completa com os mais recentes se algum fixado não estiver mais publicado.
    const extra = recent.docs.filter((doc) => !chosen.some((item) => item.id === doc.id))
    return [...chosen, ...extra].slice(0, 3)
  },
)

/** Ensaio completo pelo slug: público (inclusive arquivado, com aviso) ou rascunho na prévia. */
export const getEssay = cache(async (slug: string): Promise<Essay | null> => {
  if (isBuildPhase()) return null
  const epoch = await getEssayEpoch()
  return read(
    ['essays', 'slug', slug, epoch],
    [CACHE_TAGS.essays, CACHE_TAGS.essayTaxonomy, essayTag(slug)],
    null,
    async (payload, ctx) => {
      const result = await payload.find({
        collection: 'essays',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 2,
        populate: { people: { fullName: true, slug: true } },
        ...baseArgs(ctx),
      })
      const doc = result.docs[0] ?? null
      if (doc && !ctx.draft && !canViewPublic('essays', doc)) return null
      return doc
    },
  )
})

const taxonomyQuery = (collection: 'categories' | 'tags') =>
  cache(async (slug: string): Promise<(Category | Tag) | null> => {
    if (isBuildPhase()) return null
    return cachedRead([collection, 'slug', slug], [CACHE_TAGS.essayTaxonomy], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection,
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        ...anonymousArgs,
      })
      return (result.docs[0] as Category | Tag | undefined) ?? null
    }).catch(() => null)
  })

export const getCategory = taxonomyQuery('categories')
export const getTag = taxonomyQuery('tags')

/** Categorias (principais primeiro) para a navegação do blog. */
export const listCategories = cache(async (): Promise<Category[]> => {
  if (isBuildPhase()) return []
  return cachedRead(['categories', 'list'], [CACHE_TAGS.essayTaxonomy], async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'categories',
      sort: ['-primary', 'order', 'name'],
      limit: 100,
      depth: 0,
      pagination: false,
      ...anonymousArgs,
    })
    return result.docs
  }).catch(() => [])
})

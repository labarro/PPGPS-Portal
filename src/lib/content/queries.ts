import config from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

import { isAdminOrEditor } from '@/access'
import { defaultLocale } from '@/lib/i18n/locales'
import { buildDirectory, type DirectoryPerson } from '@/lib/people/directory'
import type { GroupProfile, Homepage, Page, Person, ResearchLine, User } from '@/payload-types'

import { cachedRead } from './cache'
import { CACHE_TAGS, pageTag, personTag, researchLineTag } from './cache-tags'
import { normalizePath } from './paths'
import { canViewPublic } from './visibility'

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
    return result.docs as PageSummary[]
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
}> {
  const empty = { profileUpdatedAt: null, lines: [], pages: [], people: [] }
  if (isBuildPhase()) return empty
  return cachedRead(['sitemap'], [CACHE_TAGS.sitemap], async () => {
    const payload = await getPayloadClient()
    const anon = { overrideAccess: false, locale: defaultLocale, draft: false } as const
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
    }
  })
}

/**
 * Seed de ensaios FICTÍCIOS (S05) — local, E2E, Lighthouse e previews. Idempotente: ensaios
 * já existentes (mesmo slug) são mantidos. BLOQUEADO em homologação e produção.
 *
 * Os estados (publicado, arquivado, agendado) são alcançados pelo MESMO serviço de transição
 * usado pelo painel — o seed não grava campos do fluxo diretamente. O "ator" é uma
 * identidade técnica em memória (sem conta no banco), registrada como "Carga fictícia".
 *
 * Uso: `pnpm seed:essays` (depois de `pnpm seed:content` e `pnpm seed:people`).
 */
import { createLocalReq, type Payload, type PayloadRequest } from 'payload'

import { transitionEssay } from '../../src/collections/Essays/transition'
import { CHECKLIST_ITEMS } from '../../src/lib/editorial/workflow'
import { resolveAppEnv } from '../../src/lib/env/app-env'
import {
  essayBody,
  essaysSeed,
  FAR_FUTURE_SCHEDULE,
  FICTITIOUS_ESSAY_NOTE,
  type SeedEssay,
  tagsSeed,
} from './data/essays'

const SEED_ACTOR = {
  id: null,
  name: 'Carga fictícia (seed)',
  email: null,
  roles: ['editor'],
  active: true,
  collection: 'users',
}

const fullChecklist = Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.name, true]))

export async function seedEssays(payload: Payload): Promise<{ created: string[]; kept: string[] }> {
  const env = resolveAppEnv(process.env.APP_ENV)
  if (env === 'production' || env === 'staging') {
    throw new Error(`Seed de ensaios fictícios bloqueado no ambiente "${env}".`)
  }
  const context = { skipRevalidation: true }

  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  const categoryId = new Map(categories.docs.map((doc) => [doc.slug, doc.id]))

  const tagId = new Map<string, number>()
  for (const tag of tagsSeed) {
    const existing = await payload.find({
      collection: 'tags',
      where: { slug: { equals: tag.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const doc =
      existing.docs[0] ??
      (await payload.create({ collection: 'tags', data: tag, overrideAccess: true, context }))
    tagId.set(tag.slug, doc.id)
  }

  const people = await payload.find({
    collection: 'people',
    limit: 200,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  const personId = new Map(people.docs.map((doc) => [doc.slug, doc.id]))

  const created: string[] = []
  const kept: string[] = []
  for (const essay of essaysSeed) {
    const existing = await payload.find({
      collection: 'essays',
      where: { slug: { equals: essay.slug } },
      draft: true,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      kept.push(essay.slug)
      continue
    }
    const category = categoryId.get(essay.category)
    if (!category) throw new Error(`Categoria "${essay.category}" ausente: rode pnpm seed:content.`)
    await createEssay(payload, essay, category, tagId, personId, context)
    created.push(essay.slug)
  }
  return { created, kept }
}

async function createEssay(
  payload: Payload,
  essay: SeedEssay,
  category: number,
  tagId: Map<string, number>,
  personId: Map<string, number>,
  context: Record<string, unknown>,
) {
  type AuthorRow = {
    role: 'author' | 'co_author' | 'guest'
    person?: number
    name?: string
    bio?: string | null
  }
  const authors = essay.authors.map((author): AuthorRow => {
    if (author.role === 'guest') return { role: 'guest', name: author.name, bio: author.bio }
    const id = personId.get(author.personSlug)
    // Sem a pessoa fictícia (seed:people não executado): registra só o nome como convidado.
    return id ? { role: author.role, person: id } : { role: 'guest', name: author.personSlug }
  })
  const doc = await payload.create({
    collection: 'essays',
    draft: true,
    data: {
      title: essay.title,
      slug: essay.slug,
      subtitle: essay.subtitle,
      excerpt: essay.excerpt,
      nature: essay.nature,
      developmentStage: 'essay',
      category,
      tags: essay.tags.map((slug) => tagId.get(slug)).filter((id): id is number => id != null),
      authors,
      references: essay.references,
      content: essayBody(essay.paragraphs) as never,
      internalNotes: FICTITIOUS_ESSAY_NOTE,
      checklist: fullChecklist,
    },
    overrideAccess: true,
    context,
  })
  if (essay.state === 'draft') return

  const req: PayloadRequest = await createLocalReq({ context: { ...context } }, payload)
  req.user = SEED_ACTOR as unknown as PayloadRequest['user']
  const step = (to: string, extra: { comment?: string; scheduledAt?: string } = {}) =>
    transitionEssay(req, { id: doc.id, to, ...extra })

  await step('in_review')
  await step('approved')
  if (essay.state === 'scheduled') {
    await step('scheduled', { scheduledAt: FAR_FUTURE_SCHEDULE })
    return
  }
  await step('published')
  if (essay.state === 'archived') await step('archived')
}

import { randomUUID } from 'node:crypto'

import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { getPayload, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { RichText } from '@/components/rich-text/rich-text'
import { publishDueEssays } from '@/collections/Essays/transition'
import { CACHE_TAGS, essayTag } from '@/lib/content/cache-tags'
import { CHECKLIST_ITEMS } from '@/lib/editorial/workflow'
import { authRateLimiter } from '@/lib/security/rate-limit'

import { cleanupAccounts, createAccount, type TestAccount } from '../helpers/fixtures'
import { TINY_PNG } from '../helpers/files'
import { expectNoLeak, publicCollectionSurfaces } from '../helpers/leak'
import { cleanupPeople } from '../helpers/people'
import { loginRest, restJson, uploadForm } from '../helpers/rest'

const revalidateTag = vi.fn()
const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
  unstable_cache: (fn: unknown) => fn,
}))

/**
 * S05 — blog acadêmico e fluxo editorial: acesso por papel, máquina de estados imposta em
 * toda gravação (REST, Local API, restauração e job), comentário obrigatório, checklist,
 * agendamento com relógio controlado, arquivamento/restauração, correção com nova versão,
 * auditoria de aprovador e publicador, autoria sem perfil público, higienização/XSS e
 * testes de vazamento (AGENTS.md §8.3).
 */
let payload: Payload
let editor: TestAccount
let admin: TestAccount
let editorToken: string
let adminToken: string
const run = randomUUID().slice(0, 8)
const SLUG = `s05-${run}`
let categoryId: number
let otherCategoryId: number
let tagId: number
let publicPersonId: number
let privatePersonId: number
let coverId: number
const created: number[] = []

type Doc = { id: number; slug: string } & Record<string, unknown>
const fullChecklist = Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.name, true]))

const lexical = (...texts: string[]) => ({
  root: {
    type: 'root',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: texts.map((value) => ({
      type: 'paragraph',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      textFormat: 0,
      children: [
        { type: 'text', version: 1, text: value, format: 0, style: '', mode: 'normal', detail: 0 },
      ],
    })),
  },
})

async function createEssay(name: string, data: Record<string, unknown> = {}): Promise<Doc> {
  const { status, json } = await restJson<{ doc: Doc }>('POST', '/essays?draft=true', {
    token: editorToken,
    body: {
      title: `Ensaio ${name} ${run}`,
      slug: `${SLUG}-${name}`,
      excerpt: `Resumo fictício ${name}.`,
      nature: 'reflective_essay',
      category: categoryId,
      tags: [tagId],
      authors: [
        { role: 'author', person: publicPersonId },
        { role: 'co_author', person: privatePersonId },
        { role: 'guest', name: 'Convidada Fictícia', bio: 'Minibio fictícia.' },
      ],
      references: [
        {
          authors: 'AUTORA FICTÍCIA, A.',
          title: 'Obra fictícia',
          year: 2020,
          doi: 'https://doi.org/10.1000/ABC',
        },
      ],
      content: lexical('Texto fictício do ensaio para testes de integração.'),
      ...data,
    },
  })
  expect(status, JSON.stringify(json)).toBe(201)
  created.push(json.doc.id)
  return json.doc
}

async function transition(
  id: number,
  to: string,
  extra: Record<string, unknown> = {},
  token = editorToken,
) {
  return restJson<{ doc?: Doc; message?: string; code?: string; details?: string[] }>(
    'POST',
    `/essays/${id}/transition`,
    { token, body: { to, ...extra } },
  )
}

async function expectTransition(
  id: number,
  to: string,
  extra: Record<string, unknown> = {},
  token = editorToken,
) {
  const result = await transition(id, to, extra, token)
  expect(result.status, JSON.stringify(result.json)).toBe(200)
  return result.json.doc!
}

const saveChecklist = (id: number) =>
  restJson('PATCH', `/essays/${id}?draft=true`, {
    token: adminToken,
    body: { checklist: fullChecklist },
  })

/** Leva um ensaio de rascunho até aprovado (editor envia; admin revisa e aprova). */
async function approve(id: number) {
  await expectTransition(id, 'in_review')
  expect((await saveChecklist(id)).status).toBe(200)
  await expectTransition(id, 'approved', {}, adminToken)
}

const mainRow = (id: number) =>
  payload.findByID({ collection: 'essays', id, depth: 0, overrideAccess: true })
const latest = (id: number) =>
  payload.findByID({ collection: 'essays', id, depth: 0, draft: true, overrideAccess: true })

const anonGet = (path: string) => restJson<Record<string, unknown>>('GET', path)
const anonList = async () =>
  JSON.stringify((await restJson('GET', `/essays?limit=200&where[slug][like]=${SLUG}`)).json)

describe('S05 — ensaios e fluxo editorial', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    authRateLimiter.reset()
    admin = await createAccount(payload, ['admin'], { name: 'Admin Fictício' })
    editor = await createAccount(payload, ['editor'], { name: 'Editora Fictícia' })
    editorToken = await loginRest(editor.email, editor.password)
    adminToken = await loginRest(admin.email, admin.password)
    const context = { skipRevalidation: true }
    categoryId = (
      await payload.create({
        collection: 'categories',
        data: { name: `Categoria ${run}`, slug: `${SLUG}-categoria`, primary: true },
        overrideAccess: true,
        context,
      })
    ).id
    otherCategoryId = (
      await payload.create({
        collection: 'categories',
        data: { name: `Outra ${run}`, slug: `${SLUG}-outra` },
        overrideAccess: true,
        context,
      })
    ).id
    tagId = (
      await payload.create({
        collection: 'tags',
        data: { name: `Tag ${run}`, slug: `${SLUG}-tag` },
        overrideAccess: true,
        context,
      })
    ).id
    const publicPerson = await payload.create({
      collection: 'people',
      data: { fullName: `Autora Pública ${run}`, slug: `${SLUG}-publica`, visibility: 'public' },
      overrideAccess: true,
      context,
    })
    publicPersonId = publicPerson.id
    await payload.create({
      collection: 'consent-records',
      data: {
        person: publicPersonId,
        scopes: ['public_profile'],
        grantedAt: '2026-10-01T00:00:00.000Z',
        method: 'signed_form',
        collectedBy: 'Coordenação fictícia',
      },
      overrideAccess: true,
      context,
    })
    privatePersonId = (
      await payload.create({
        collection: 'people',
        data: {
          fullName: `Autor Sem Perfil ${run}`,
          slug: `${SLUG}-privado`,
          visibility: 'public',
        },
        overrideAccess: true,
        context,
      })
    ).id
    const media = await restJson<{ doc: Doc }>('POST', '/media', {
      token: editorToken,
      form: uploadForm(
        {
          alt: `Capa fictícia ${run}`,
          credit: 'Acervo fictício',
          license: 'group-authorized',
          source: 'group-archive',
          containsIdentifiablePeople: false,
        },
        TINY_PNG,
        'capa.png',
        'image/png',
      ),
    })
    expect(media.status, JSON.stringify(media.json)).toBe(201)
    coverId = media.json.doc.id
  })

  beforeEach(() => {
    revalidateTag.mockClear()
    revalidatePath.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  afterAll(async () => {
    vi.useRealTimers()
    if (created.length > 0) {
      await payload.db.deleteMany({ collection: 'essays', where: { id: { in: created } } })
      await payload.db.deleteVersions({ collection: 'essays', where: { parent: { in: created } } })
    }
    await payload.delete({
      collection: 'redirects',
      where: { from: { contains: SLUG } },
      overrideAccess: true,
    })
    await payload.db.deleteMany({ collection: 'categories', where: { slug: { like: SLUG } } })
    await payload.db.deleteMany({ collection: 'tags', where: { slug: { like: SLUG } } })
    await payload.delete({
      collection: 'media',
      where: { alt: { contains: run } },
      overrideAccess: true,
    })
    await cleanupPeople(payload, SLUG)
    await cleanupAccounts(payload)
  })

  describe('acesso (matriz 14.3) e criação', () => {
    it('visitante e conta inativa não criam, alteram, excluem nem mudam a situação de ensaios', async () => {
      const essay = await createEssay('acesso')
      expect((await restJson('POST', '/essays', { body: { title: 'X' } })).status).toBe(403)
      expect(
        (await restJson('PATCH', `/essays/${essay.id}?draft=true`, { body: { title: 'X' } }))
          .status,
      ).toBe(403)
      expect((await restJson('DELETE', `/essays/${essay.id}`)).status).toBe(403)
      expect(
        (await restJson('POST', `/essays/${essay.id}/transition`, { body: { to: 'in_review' } }))
          .status,
      ).toBe(401)
      expect(
        (await restJson('POST', '/categories', { body: { name: 'X', slug: 'x' } })).status,
      ).toBe(403)
      expect((await restJson('POST', '/tags', { body: { name: 'X', slug: 'x' } })).status).toBe(403)
      expect((await restJson('POST', '/essays/publish-due')).status).toBe(401)
      expect((await restJson('GET', '/payload-jobs')).status).toBe(403)
      expect((await restJson('GET', '/globals/payload-jobs-stats')).status).toBe(403)
      expect([401, 403]).toContain((await restJson('GET', '/payload-jobs/run')).status)

      const inactive = await createAccount(payload, ['editor'], { active: true })
      const inactiveToken = await loginRest(inactive.email, inactive.password)
      await payload.update({
        collection: 'users',
        id: inactive.id,
        data: { active: false },
        overrideAccess: true,
      })
      expect(
        (await transition(essay.id, 'in_review', {}, inactiveToken)).status,
      ).toBeGreaterThanOrEqual(401)
      expect((await latest(essay.id)).workflowStatus).toBe('draft')
    })

    it('criação sempre em rascunho, com campos do fluxo ignorados e tempo de leitura calculado', async () => {
      const essay = await createEssay('criacao', {
        workflowStatus: 'published',
        publishedAt: '2020-01-01T00:00:00.000Z',
        approvedBy: admin.id,
        readingTime: 99,
      })
      const doc = await latest(essay.id)
      expect(doc).toMatchObject({ workflowStatus: 'draft', _status: 'draft', readingTime: 1 })
      expect(doc.publishedAt ?? null).toBeNull()
      expect(doc.approvedBy ?? null).toBeNull()
      expect(doc.references?.[0]?.doi).toBe('10.1000/abc')
      // Integrante sem "nome publicado": o nome completo do cadastro é registrado.
      expect(doc.authors?.map((author) => author.name)).toEqual([
        `Autora Pública ${run}`,
        `Autor Sem Perfil ${run}`,
        'Convidada Fictícia',
      ])
      const published = await restJson('POST', '/essays', {
        token: editorToken,
        body: {
          title: 'Direto',
          slug: `${SLUG}-direto`,
          nature: 'review',
          category: categoryId,
          _status: 'published',
        },
      })
      expect(published.status).toBe(403)
    })
  })

  describe('máquina de estados imposta em toda gravação', () => {
    it('rascunho → publicado é rejeitado (endpoint, PATCH publicado e PATCH de campo do fluxo)', async () => {
      const essay = await createEssay('salto')
      const jump = await transition(essay.id, 'published')
      expect(jump.status).toBe(400)
      expect(jump.json.code).toBe('invalid_transition')
      const direct = await restJson('PATCH', `/essays/${essay.id}`, {
        token: adminToken,
        body: { _status: 'published', workflowStatus: 'published' },
      })
      expect(direct.status).toBe(403)
      const draftPatch = await restJson('PATCH', `/essays/${essay.id}?draft=true`, {
        token: adminToken,
        body: { workflowStatus: 'published', publishedAt: '2020-01-01T00:00:00.000Z' },
      })
      expect(draftPatch.status).toBe(200)
      expect(await latest(essay.id)).toMatchObject({ workflowStatus: 'draft' })
      expect(await anonList()).not.toContain(essay.slug)
      const unknown = await transition(essay.id, 'publicado')
      expect(unknown.status).toBe(400)
    })

    it('envio exige ensaio completo', async () => {
      const essay = await createEssay('incompleto', { excerpt: '', authors: [] })
      const result = await transition(essay.id, 'in_review')
      expect(result.status).toBe(400)
      expect(result.json.code).toBe('incomplete')
      expect(result.json.details).toEqual(
        expect.arrayContaining(['Informe o resumo (chamada).', 'Registre ao menos um autor.']),
      )
    })

    it('fluxo completo: revisão, devolução com comentário, ajuste, aprovação com checklist, publicação', async () => {
      const essay = await createEssay('fluxo', { cover: coverId })
      await expectTransition(essay.id, 'in_review')

      // Em revisão o conteúdo não muda (campo somente leitura; alteração descartada).
      await restJson('PATCH', `/essays/${essay.id}?draft=true`, {
        token: editorToken,
        body: { title: 'Título alterado indevidamente' },
      })
      expect((await latest(essay.id)).title).toBe(`Ensaio fluxo ${run}`)

      const noComment = await transition(essay.id, 'returned', { comment: 'curto' }, adminToken)
      expect(noComment.status).toBe(400)
      expect(noComment.json.code).toBe('comment_required')
      const comment = `Rever a introdução e citar as fontes ${run}.`
      await expectTransition(essay.id, 'returned', { comment }, adminToken)

      // Devolvido: o editor ajusta o texto.
      const edit = await restJson('PATCH', `/essays/${essay.id}?draft=true`, {
        token: editorToken,
        body: { title: `Ensaio fluxo ajustado ${run}` },
      })
      expect(edit.status).toBe(200)
      await expectTransition(essay.id, 'in_review')

      const early = await transition(essay.id, 'approved', {}, adminToken)
      expect(early.json.code).toBe('checklist_incomplete')
      expect((await saveChecklist(essay.id)).status).toBe(200)
      await expectTransition(essay.id, 'approved', {}, adminToken)
      expect(await anonList()).not.toContain(essay.slug)

      const published = await expectTransition(essay.id, 'published')
      expect(published.workflowStatus).toBe('published')

      const doc = await mainRow(essay.id)
      expect(doc).toMatchObject({
        _status: 'published',
        workflowStatus: 'published',
        title: `Ensaio fluxo ajustado ${run}`,
      })
      expect(doc.approvedBy).toBe(admin.id)
      expect(doc.publishedBy).toBe(editor.id)
      expect(doc.submittedBy).toBe(editor.id)
      expect(doc.reviewHistory?.map((entry) => entry.to)).toEqual([
        'in_review',
        'returned',
        'in_review',
        'approved',
        'published',
      ])
      expect(doc.reviewHistory?.[1]).toMatchObject({ comment, actor: admin.id })

      // Auditoria: quem aprovou e quem publicou.
      const audit = await payload.find({
        collection: 'audit-logs',
        where: {
          and: [
            { targetCollection: { equals: 'essays' } },
            { documentId: { equals: String(essay.id) } },
          ],
        },
        limit: 100,
        overrideAccess: true,
      })
      const byAction = (action: string) => audit.docs.filter((entry) => entry.action === action)
      expect(byAction('approve').map((entry) => entry.userEmail)).toContain(admin.email)
      expect(
        byAction('publish').some(
          (entry) =>
            entry.userEmail === editor.email && entry.diffSummary?.includes('Aprovado → Publicado'),
        ),
      ).toBe(true)
      expect(byAction('workflow').some((entry) => entry.diffSummary?.includes('Devolver'))).toBe(
        true,
      )
      // O comentário de revisão nunca vai para a auditoria (só nomes de campos/ações).
      expect(JSON.stringify(audit.docs)).not.toContain(comment)

      // Revalidação: blog, home, perfis e página do ensaio, sem novo deploy.
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.essays, { expire: 0 })
      expect(revalidateTag).toHaveBeenCalledWith(essayTag(essay.slug), { expire: 0 })

      // Visitante: ensaio publicado, autoria sem perfil só pelo nome, sem campos internos.
      const anon = await anonGet(`/essays/${essay.id}?depth=2`)
      expect(anon.status).toBe(200)
      const authors = anon.json.authors as { name: string; person: unknown }[]
      expect(authors[0]!.person).toMatchObject({ slug: `${SLUG}-publica` })
      expect(Object.keys(authors[0]!.person as object).sort()).toEqual(['fullName', 'id', 'slug'])
      expect(authors[1]).toMatchObject({ name: `Autor Sem Perfil ${run}`, person: null })
      const text = JSON.stringify(anon.json)
      for (const key of [
        'reviewHistory',
        'internalNotes',
        'checklist',
        'approvedBy',
        'submittedBy',
        'publishedBy',
        'scheduledAt',
      ]) {
        expect(text, key).not.toContain(`"${key}"`)
      }
      expect(text).not.toContain(comment)
      expect(text).not.toContain(`${SLUG}-privado`)
      expect(anon.json.cover).toMatchObject({ alt: `Capa fictícia ${run}` })
    })

    it('restaurar versão antiga como publicada é bloqueado', async () => {
      const essay = await createEssay('restaurar')
      await approve(essay.id)
      await expectTransition(essay.id, 'published')
      const versions = await payload.findVersions({
        collection: 'essays',
        where: { parent: { equals: essay.id } },
        sort: 'createdAt',
        overrideAccess: true,
      })
      const first = versions.docs[0]!
      const restore = await restJson('POST', `/essays/versions/${first.id}`, { token: adminToken })
      expect(restore.status).toBe(403)
      expect((await mainRow(essay.id)).workflowStatus).toBe('published')
    })

    it('exclusão: rascunho pode ser excluído; publicado só arquiva', async () => {
      const draft = await createEssay('excluir-rascunho')
      expect((await restJson('DELETE', `/essays/${draft.id}`, { token: editorToken })).status).toBe(
        200,
      )
      const essay = await createEssay('excluir-publicado')
      await approve(essay.id)
      await expectTransition(essay.id, 'published')
      expect((await restJson('DELETE', `/essays/${essay.id}`, { token: adminToken })).status).toBe(
        400,
      )
    })
  })

  describe('agendamento (relógio controlado)', () => {
    it('agendado fica oculto até a data, aparece depois e o job conclui a publicação', async () => {
      const essay = await createEssay('agendado')
      await approve(essay.id)
      const past = await transition(essay.id, 'scheduled', {
        scheduledAt: new Date(Date.now() - 60_000).toISOString(),
      })
      expect(past.json.code).toBe('schedule_in_past')
      const when = new Date(Date.now() + 5 * 60_000)
      await expectTransition(essay.id, 'scheduled', { scheduledAt: when.toISOString() })
      expect(await mainRow(essay.id)).toMatchObject({
        _status: 'published',
        workflowStatus: 'scheduled',
      })

      // Antes da data: invisível na API, nas listagens e no RSS/sitemap.
      expect((await anonGet(`/essays/${essay.id}`)).status).toBe(404)
      expect(await anonList()).not.toContain(essay.slug)
      const { listEssays, getSitemapEntries } = await import('@/lib/content/queries')
      expect((await listEssays({ categoryId })).docs.map((doc) => doc.slug)).not.toContain(
        essay.slug,
      )
      expect((await publishDueEssays(payload)).published).not.toContain(essay.id)

      // Depois da data (relógio avançado): visível sem depender do job.
      vi.useFakeTimers({ toFake: ['Date'], now: when.getTime() + 60_000 })
      expect((await anonGet(`/essays/${essay.id}`)).status).toBe(200)
      expect((await listEssays({ categoryId })).docs.map((doc) => doc.slug)).toContain(essay.slug)
      expect((await getSitemapEntries()).essays.map((doc) => doc.slug)).toContain(essay.slug)

      // O job conclui Agendado → Publicado, sem usuário, registrado na auditoria.
      const result = await publishDueEssays(payload)
      expect(result.published).toContain(essay.id)
      const doc = await mainRow(essay.id)
      expect(doc).toMatchObject({
        workflowStatus: 'published',
        publishedAt: when.toISOString(),
        publishedBy: editor.id,
      })
      expect(doc.reviewHistory?.at(-1)).toMatchObject({
        to: 'published',
        actor: null,
        actorName: 'Sistema (publicação agendada)',
      })
      const audit = await payload.find({
        collection: 'audit-logs',
        where: {
          and: [{ documentId: { equals: String(essay.id) } }, { action: { equals: 'publish' } }],
        },
        overrideAccess: true,
      })
      expect(
        audit.docs.some((entry) => entry.userId == null && entry.diffSummary?.includes('sistema')),
      ).toBe(true)
      // Executar de novo não republica (idempotente).
      expect((await publishDueEssays(payload)).published).not.toContain(essay.id)
    })

    it('cancelar agendamento retira o ensaio da versão publicada', async () => {
      const essay = await createEssay('cancelar')
      await approve(essay.id)
      const when = new Date(Date.now() + 3 * 60_000)
      await expectTransition(essay.id, 'scheduled', { scheduledAt: when.toISOString() })
      await expectTransition(essay.id, 'approved')
      expect(await mainRow(essay.id)).toMatchObject({
        _status: 'draft',
        workflowStatus: 'approved',
      })
      vi.useFakeTimers({ toFake: ['Date'], now: when.getTime() + 60_000 })
      expect((await anonGet(`/essays/${essay.id}`)).status).toBe(404)
      expect((await publishDueEssays(payload)).published).not.toContain(essay.id)
    })

    it('ação editorial sobre agendamento vencido conclui a publicação antes (sem esperar o job)', async () => {
      const essay = await createEssay('vencido')
      await approve(essay.id)
      const when = new Date(Date.now() + 2 * 60_000)
      await expectTransition(essay.id, 'scheduled', { scheduledAt: when.toISOString() })
      vi.useFakeTimers({ toFake: ['Date'], now: when.getTime() + 30_000 })
      await expectTransition(essay.id, 'archived')
      const doc = await mainRow(essay.id)
      expect(doc.workflowStatus).toBe('archived')
      expect(doc.reviewHistory?.slice(-2).map((entry) => [entry.from, entry.to])).toEqual([
        ['scheduled', 'published'],
        ['published', 'archived'],
      ])
    })

    it('endpoint do cron exige editor/admin ou CRON_SECRET', async () => {
      const previous = process.env.CRON_SECRET
      process.env.CRON_SECRET = `segredo-de-teste-${run}-${run}`
      try {
        expect((await restJson('GET', '/essays/publish-due')).status).toBe(401)
        const ok = await restJson('GET', '/essays/publish-due', {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        })
        expect(ok.status).toBe(200)
        expect((await restJson('POST', '/essays/publish-due', { token: editorToken })).status).toBe(
          200,
        )
      } finally {
        process.env.CRON_SECRET = previous
      }
    })
  })

  describe('arquivamento, restauração e correção', () => {
    it('arquivado responde pela URL, mas sai das listagens, do RSS e do sitemap; restauração volta', async () => {
      const essay = await createEssay('arquivo')
      await approve(essay.id)
      await expectTransition(essay.id, 'published')
      const { listEssays, getSitemapEntries } = await import('@/lib/content/queries')
      expect((await listEssays({ tagId })).docs.map((doc) => doc.slug)).toContain(essay.slug)

      await expectTransition(essay.id, 'archived')
      const doc = await mainRow(essay.id)
      expect(doc).toMatchObject({
        _status: 'published',
        workflowStatus: 'archived',
        archivedBy: editor.id,
      })
      expect(doc.archivedAt).toBeTruthy()
      const byUrl = await anonGet(`/essays?where[slug][equals]=${essay.slug}`)
      expect(JSON.stringify(byUrl.json)).toContain(essay.slug)
      expect((await listEssays({ tagId })).docs.map((item) => item.slug)).not.toContain(essay.slug)
      expect((await getSitemapEntries()).essays.map((item) => item.slug)).not.toContain(essay.slug)
      const { buildRss } = await import('@/lib/editorial/feed')
      const rss = buildRss(
        (await listEssays({ limit: 100 })).docs.map((item) => ({ ...item, tags: item.tags })),
        { siteUrl: 'https://x.org', title: 'B', description: 'D' },
      )
      expect(rss).not.toContain(essay.slug)

      await expectTransition(essay.id, 'published')
      expect((await mainRow(essay.id)).archivedAt ?? null).toBeNull()
      expect((await listEssays({ tagId })).docs.map((item) => item.slug)).toContain(essay.slug)
    })

    it('correção relevante: nova versão em revisão sem tirar o texto publicado do ar; slug alterado gera 301', async () => {
      const essay = await createEssay('correcao')
      await approve(essay.id)
      await expectTransition(essay.id, 'published')
      const firstPublishedAt = (await mainRow(essay.id)).publishedAt

      await expectTransition(essay.id, 'in_review')
      await expectTransition(
        essay.id,
        'returned',
        { comment: 'Corrigir dado factual no segundo parágrafo.' },
        adminToken,
      )
      await restJson('PATCH', `/essays/${essay.id}?draft=true`, {
        token: editorToken,
        body: {
          title: `Ensaio correção revisado ${run}`,
          slug: `${SLUG}-correcao-revisada`,
          correctionNote: 'Dado factual corrigido.',
        },
      })
      // Enquanto a correção não é aprovada, o público vê a versão anterior.
      const during = await anonGet(`/essays/${essay.id}`)
      expect(during.json.title).toBe(`Ensaio correcao ${run}`)
      expect(during.json.slug).toBe(essay.slug)

      await expectTransition(essay.id, 'in_review')
      await saveChecklist(essay.id)
      await expectTransition(essay.id, 'approved', {}, adminToken)
      await expectTransition(essay.id, 'published')
      const doc = await mainRow(essay.id)
      expect(doc).toMatchObject({
        title: `Ensaio correção revisado ${run}`,
        publishedAt: firstPublishedAt,
      })
      expect(doc.revisedAt).toBeTruthy()
      created.push(essay.id)
      const redirect = await payload.find({
        collection: 'redirects',
        where: { from: { equals: `/blog/${essay.slug}` } },
        overrideAccess: true,
      })
      expect(redirect.docs[0]?.to?.url).toBe(`/blog/${SLUG}-correcao-revisada`)
    })
  })

  describe('higienização e XSS', () => {
    it('estilos, nós desconhecidos e links javascript: são removidos no servidor; o texto não executa', async () => {
      const essay = await createEssay('xss', {
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                textStyle: 'color: red',
                children: [
                  {
                    type: 'text',
                    text: '<script>window.__xss=1</script>',
                    format: 0,
                    style: 'font-size:72px',
                  },
                  {
                    type: 'link',
                    fields: { linkType: 'custom', url: 'javascript:alert(1)' },
                    children: [{ type: 'text', text: 'link malicioso' }],
                  },
                ],
              },
              { type: 'html', html: '<img src=x onerror=alert(1)>', children: [] },
            ],
          },
        },
      })
      const doc = await latest(essay.id)
      const json = JSON.stringify(doc.content)
      expect(json).not.toMatch(/javascript:|font-size|color: red|onerror|"html"/)
      const html = renderToStaticMarkup(createElement(RichText, { data: doc.content }))
      expect(html).not.toContain('<script')
      expect(html).not.toContain('javascript:')
      expect(html).toContain('&lt;script&gt;')
    })
  })

  describe('taxonomia', () => {
    it('categoria em uso não é excluída; slug alterado cria 301', async () => {
      await createEssay('taxonomia', { category: otherCategoryId })
      expect(
        (await restJson('DELETE', `/categories/${otherCategoryId}`, { token: editorToken })).status,
      ).toBe(400)
      const renamed = await restJson('PATCH', `/tags/${tagId}`, {
        token: editorToken,
        body: { slug: `${SLUG}-tag-nova` },
      })
      expect(renamed.status).toBe(200)
      const redirect = await payload.find({
        collection: 'redirects',
        where: { from: { equals: `/blog/tag/${SLUG}-tag` } },
        overrideAccess: true,
      })
      expect(redirect.docs[0]?.to?.url).toBe(`/blog/tag/${SLUG}-tag-nova`)
      expect((await anonGet('/categories?limit=100')).status).toBe(200)
    })
  })

  describe('vazamento (AGENTS.md §8.3)', () => {
    it('rascunhos, revisão, agendados, comentários e campos internos não saem em respostas públicas', async () => {
      const secret = `SEGREDO-${run}`
      const draft = await createEssay('vaz-rascunho', {
        title: `Rascunho ${secret}`,
        internalNotes: `Nota ${secret}`,
      })
      const review = await createEssay('vaz-revisao', { title: `Revisão ${secret}` })
      await expectTransition(review.id, 'in_review')
      await expectTransition(
        review.id,
        'returned',
        { comment: `Comentário ${secret} de revisão` },
        adminToken,
      )
      const scheduled = await createEssay('vaz-agendado', { title: `Agendado ${secret}` })
      await approve(scheduled.id)
      await expectTransition(scheduled.id, 'scheduled', {
        scheduledAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
      })
      const published = await createEssay('vaz-publicado', { internalNotes: `Interna ${secret}` })
      await approve(published.id)
      await expectTransition(published.id, 'published')
      // Correção em andamento de um texto publicado: o rascunho novo não vaza.
      await expectTransition(published.id, 'in_review')

      const surfaces = await publicCollectionSurfaces('essays', [
        draft.id,
        review.id,
        scheduled.id,
        published.id,
      ])
      surfaces.push(
        ...(await Promise.all(
          [
            `/essays?where[workflowStatus][equals]=draft`,
            `/essays?where[workflowStatus][equals]=scheduled`,
            `/essays?where[internalNotes][contains]=${secret}`,
            `/essays?where[_status][equals]=draft`,
            `/essays?where[title][contains]=${secret}&draft=true`,
          ].map(async (path) => {
            const { status, json } = await restJson('GET', path)
            return { label: `GET /api${path}`, status, text: JSON.stringify(json) }
          }),
        )),
      )
      expectNoLeak(surfaces, [secret, `${SLUG}-privado`])
      for (const item of surfaces.filter((surface) => surface.status === 200)) {
        for (const key of [
          'reviewHistory',
          'internalNotes',
          'checklist',
          'scheduledAt',
          'approvedBy',
        ]) {
          expect(item.text, `${item.label} expôs ${key}`).not.toContain(`"${key}"`)
        }
      }

      const { getSitemapEntries, listEssays, getFeaturedEssays } =
        await import('@/lib/content/queries')
      const slugs = [draft.slug, review.slug, scheduled.slug]
      const sitemap = (await getSitemapEntries()).essays.map((item) => item.slug)
      const listed = (await listEssays({ limit: 100 })).docs.map((item) => item.slug)
      const featured = (await getFeaturedEssays([draft.id, scheduled.id])).map((item) => item.slug)
      for (const slug of slugs) {
        expect(sitemap).not.toContain(slug)
        expect(listed).not.toContain(slug)
        expect(featured).not.toContain(slug)
      }
      expect(listed).toContain(published.slug)
    })
  })
})

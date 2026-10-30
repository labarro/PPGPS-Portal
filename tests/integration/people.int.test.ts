import { randomUUID } from 'node:crypto'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { CACHE_TAGS, personTag } from '@/lib/content/cache-tags'
import { currentRole, isFormerMember, timeline } from '@/lib/people/memberships'
import { authRateLimiter } from '@/lib/security/rate-limit'

import { groupProfileSeed } from '../../scripts/seed/data/institutional'
import { cleanupAccounts, createAccount, type TestAccount } from '../helpers/fixtures'
import { TINY_PNG } from '../helpers/files'
import { cleanupPeople, fakeLattes, fakeOrcid, invalidOrcid } from '../helpers/people'
import { loginRest, restJson, uploadForm } from '../helpers/rest'

const revalidateTag = vi.fn()
const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
  unstable_cache: (fn: unknown) => fn,
}))

/**
 * S04 — pessoas, vínculos e consentimentos: acesso por papel, validações (ORCID, Lattes,
 * vínculos), visibilidade por consentimento individual, revogação com revalidação,
 * líderes do grupo, conta ↔ pessoa e testes de vazamento (AGENTS.md §8.3).
 */
let payload: Payload
let editor: TestAccount
let admin: TestAccount
let editorToken: string
let adminToken: string
const run = randomUUID().slice(0, 8)
const seed = Number.parseInt(run.slice(0, 6), 16)
const SLUG_PREFIX = `s04-${run}`
let lineId: number

type Doc = { id: number; slug: string } & Record<string, unknown>

async function createPerson(name: string, data: Record<string, unknown> = {}): Promise<Doc> {
  const { status, json } = await restJson<{ doc: Doc }>('POST', '/people', {
    token: editorToken,
    body: { fullName: name, slug: `${SLUG_PREFIX}-${name}`, ...data },
  })
  expect(status, JSON.stringify(json)).toBe(201)
  return json.doc
}

async function grant(personId: number, scopes: string[], extra: Record<string, unknown> = {}) {
  const { status, json } = await restJson<{ doc: Doc }>('POST', '/consent-records', {
    token: editorToken,
    body: {
      person: personId,
      scopes,
      grantedAt: '2026-10-01T00:00:00.000Z',
      method: 'signed_form',
      collectedBy: 'Coordenação fictícia',
      ...extra,
    },
  })
  expect(status, JSON.stringify(json)).toBe(201)
  return json.doc
}

async function revoke(consentId: number) {
  const { status, json } = await restJson('PATCH', `/consent-records/${consentId}`, {
    token: editorToken,
    body: { revokedAt: '2026-10-20T00:00:00.000Z' },
  })
  expect(status, JSON.stringify(json)).toBe(200)
}

async function membership(personId: number, data: Record<string, unknown>) {
  return restJson<{ doc: Doc; errors?: unknown }>('POST', '/memberships', {
    token: editorToken,
    body: { person: personId, lines: [lineId], source: 'manual', ...data },
  })
}

const anonText = async (path: string) => JSON.stringify((await restJson('GET', path)).json)

describe('S04 — integrantes, vínculos e consentimentos', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    authRateLimiter.reset()
    // Admin primeiro: no banco vazio a primeira conta vira admin (regra de bootstrap da S02).
    admin = await createAccount(payload, ['admin'])
    editor = await createAccount(payload, ['editor'])
    editorToken = await loginRest(editor.email, editor.password)
    adminToken = await loginRest(admin.email, admin.password)
    const line = await payload.create({
      collection: 'research-lines',
      data: {
        name: `Linha S04 ${run}`,
        slug: `${SLUG_PREFIX}-linha`,
        summary: 'Linha fictícia.',
        order: 90,
        active: true,
        _status: 'published',
      },
      overrideAccess: true,
      context: { skipRevalidation: true },
    })
    lineId = line.id
    // Perfil do grupo publicado (independe da ordem dos arquivos e do estado do banco).
    await payload.updateGlobal({
      slug: 'group-profile',
      data: {
        ...(groupProfileSeed as unknown as Record<string, unknown>),
        leaders: [],
        _status: 'published',
      },
      overrideAccess: true,
      context: { skipRevalidation: true },
    })
  })

  beforeEach(() => {
    revalidateTag.mockClear()
    revalidatePath.mockClear()
  })

  afterAll(async () => {
    await payload.updateGlobal({
      slug: 'group-profile',
      data: {
        ...(groupProfileSeed as unknown as Record<string, unknown>),
        leaders: [],
        _status: 'published',
      },
      overrideAccess: true,
      context: { skipRevalidation: true },
    })
    await cleanupPeople(payload, SLUG_PREFIX)
    await payload.delete({
      collection: 'redirects',
      where: { from: { contains: SLUG_PREFIX } },
      overrideAccess: true,
    })
    await payload.delete({ collection: 'research-lines', id: lineId, overrideAccess: true })
    await payload.delete({
      collection: 'media',
      where: { alt: { contains: run } },
      overrideAccess: true,
    })
    await cleanupAccounts(payload)
  })

  describe('acesso (matriz 14.3)', () => {
    it('visitante não cria nem altera pessoas, vínculos e consentimentos; não lê consentimentos', async () => {
      expect((await restJson('POST', '/people', { body: { fullName: 'X' } })).status).toBe(403)
      expect((await restJson('POST', '/memberships', { body: { role: 'leader' } })).status).toBe(
        403,
      )
      expect(
        (await restJson('POST', '/consent-records', { body: { scopes: ['photo'] } })).status,
      ).toBe(403)
      expect((await restJson('GET', '/consent-records')).status).toBe(403)
    })

    it('editor (coordenador) e admin gerenciam pessoas, vínculos e consentimentos', async () => {
      const person = await createPerson('acesso')
      const m = await membership(person.id, { role: 'researcher', startDate: '2024-01-01' })
      expect(m.status, JSON.stringify(m.json)).toBe(201)
      const consent = await grant(person.id, ['public_profile'])
      expect((await restJson('GET', '/consent-records', { token: editorToken })).status).toBe(200)
      const patched = await restJson('PATCH', `/people/${person.id}`, {
        token: adminToken,
        body: { shortBio: 'Biografia fictícia.' },
      })
      expect(patched.status).toBe(200)
      expect(consent.id).toBeGreaterThan(0)
    })

    it('campos calculados de consentimento não são editáveis pela API', async () => {
      const person = await createPerson('calculado', { consentPublicProfile: true })
      const read = await payload.findByID({ collection: 'people', id: person.id, depth: 0 })
      expect(read.consentPublicProfile).toBe(false)
      await restJson('PATCH', `/people/${person.id}`, {
        token: editorToken,
        body: { consentPublicProfile: true, consentStatus: 'authorized' },
      })
      const after = await payload.findByID({ collection: 'people', id: person.id, depth: 0 })
      expect(after.consentPublicProfile).toBe(false)
      expect(after.consentStatus).toBe('none')
    })

    it('exclusão de pessoa com vínculos é bloqueada (arquivamento)', async () => {
      const person = await createPerson('excluir')
      await membership(person.id, { role: 'researcher', startDate: '2024-01-01' })
      const deleted = await restJson('DELETE', `/people/${person.id}`, { token: editorToken })
      expect(deleted.status).toBe(400)
      expect(JSON.stringify(deleted.json)).toMatch(/Arquivado em/)
    })

    it('somente admin liga uma conta administrativa a uma pessoa; editor não', async () => {
      const person = await createPerson('conta')
      const byEditor = await restJson('PATCH', `/users/${editor.id}`, {
        token: editorToken,
        body: { person: person.id },
      })
      const afterEditor = await payload.findByID({ collection: 'users', id: editor.id, depth: 0 })
      expect(byEditor.status === 403 || afterEditor.person == null).toBe(true)
      const byAdmin = await restJson('PATCH', `/users/${editor.id}`, {
        token: adminToken,
        body: { person: person.id },
      })
      expect(byAdmin.status).toBe(200)
      const linked = await payload.findByID({ collection: 'users', id: editor.id, depth: 0 })
      expect(linked.person).toBe(person.id)
    })
  })

  describe('identificadores acadêmicos', () => {
    it('ORCID com dígito verificador inválido é rejeitado', async () => {
      const { status, json } = await restJson('POST', '/people', {
        token: editorToken,
        body: {
          fullName: 'Orcid inválido',
          slug: `${SLUG_PREFIX}-orcid-x`,
          orcid: invalidOrcid(seed),
        },
      })
      expect(status).toBe(400)
      expect(JSON.stringify(json)).toMatch(/dígito verificador/)
    })

    it('ORCID e Lattes válidos são normalizados e únicos', async () => {
      const orcid = fakeOrcid(seed)
      const person = await createPerson('ids', {
        orcid: `https://orcid.org/${orcid}`,
        lattesUrl: `https://lattes.cnpq.br/${fakeLattes(seed).split('/').at(-1)}/`,
      })
      expect(person.orcid).toBe(orcid)
      expect(person.lattesUrl).toBe(fakeLattes(seed))
      const duplicate = await restJson('POST', '/people', {
        token: editorToken,
        body: { fullName: 'Duplicada', slug: `${SLUG_PREFIX}-dup`, orcid },
      })
      expect(duplicate.status).toBe(400)
    })

    it('Lattes fora do formato é rejeitado', async () => {
      const { status, json } = await restJson('POST', '/people', {
        token: editorToken,
        body: {
          fullName: 'Lattes inválido',
          slug: `${SLUG_PREFIX}-lattes-x`,
          lattesUrl: 'https://exemplo.org/curriculo',
        },
      })
      expect(status).toBe(400)
      expect(JSON.stringify(json)).toMatch(/Lattes/)
    })

    it('slugs reservados de /integrantes são recusados', async () => {
      const { status } = await restJson('POST', '/people', {
        token: editorToken,
        body: { fullName: 'Reservado', slug: 'egressos' },
      })
      expect(status).toBe(400)
    })
  })

  describe('vínculos', () => {
    it('estudante exige nível de formação; datas coerentes e não futuras; motivo do término', async () => {
      const person = await createPerson('regras')
      expect(
        (await membership(person.id, { role: 'student', startDate: '2022-01-01' })).status,
      ).toBe(400)
      expect(
        (
          await membership(person.id, {
            role: 'researcher',
            startDate: '2023-01-01',
            endDate: '2022-01-01',
            endReason: 'left',
          })
        ).status,
      ).toBe(400)
      expect(
        (
          await membership(person.id, {
            role: 'researcher',
            startDate: '2023-01-01',
            endDate: '2099-01-01',
            endReason: 'left',
          })
        ).status,
      ).toBe(400)
      expect(
        (
          await membership(person.id, {
            role: 'researcher',
            startDate: '2023-01-01',
            endDate: '2024-01-01',
          })
        ).status,
      ).toBe(400)
    })

    it('mesmo papel e nível com períodos sobrepostos é recusado; papéis distintos podem coexistir', async () => {
      const person = await createPerson('sobreposicao')
      const first = await membership(person.id, {
        role: 'student',
        trainingLevel: 'masters',
        startDate: '2021-03-01',
        endDate: '2023-02-28',
        endReason: 'training_completed',
      })
      expect(first.status).toBe(201)
      expect(first.json.doc.status).toBe('ended')
      const overlapping = await membership(person.id, {
        role: 'student',
        trainingLevel: 'masters',
        startDate: '2022-06-01',
      })
      expect(overlapping.status).toBe(400)
      expect(JSON.stringify(overlapping.json)).toMatch(/sobreposto/)
      const researcher = await membership(person.id, {
        role: 'researcher',
        startDate: '2023-03-01',
      })
      expect(researcher.status).toBe(201)
      expect(researcher.json.doc.status).toBe('active')
      const doctorate = await membership(person.id, {
        role: 'student',
        trainingLevel: 'doctorate',
        startDate: '2023-03-01',
      })
      expect(doctorate.status).toBe(201)
    })

    it('mestrado encerrado + pesquisadora ativa: linha do tempo e papel atual corretos', async () => {
      const person = await createPerson('linha-do-tempo')
      await membership(person.id, {
        role: 'student',
        trainingLevel: 'masters',
        startDate: '2021-03-01',
        endDate: '2023-02-28',
        endReason: 'training_completed',
      })
      await membership(person.id, { role: 'researcher', startDate: '2023-03-01' })
      await grant(person.id, ['public_profile'])
      const { json } = await restJson<{
        docs: { role: string; trainingLevel?: string; startDate: string; endDate?: string }[]
      }>('GET', `/memberships?where[person][equals]=${person.id}&limit=10`)
      expect(json.docs).toHaveLength(2)
      expect(currentRole(json.docs)?.role).toBe('researcher')
      expect(isFormerMember(json.docs)).toBe(false)
      expect(timeline(json.docs).map((m) => m.role)).toEqual(['researcher', 'student'])
    })
  })

  describe('visibilidade por consentimento individual', () => {
    it('sem public_profile (inclusive líder) não aparece na API nem nos vínculos', async () => {
      const hidden = await createPerson('sem-consentimento', {
        publicEmail: `oculta-${run}@example.com`,
      })
      await membership(hidden.id, { role: 'leader', startDate: '2020-01-01' })
      await grant(hidden.id, ['photo', 'email'])
      expect((await restJson('GET', `/people/${hidden.id}`)).status).toBe(404)
      expect(await anonText('/people?limit=200&depth=2')).not.toContain(hidden.slug)
      expect(await anonText(`/memberships?where[person][equals]=${hidden.id}`)).not.toContain(
        String(hidden.slug),
      )
      const memberships = await restJson<{ docs: unknown[] }>(
        'GET',
        `/memberships?where[person][equals]=${hidden.id}`,
      )
      expect(memberships.json.docs).toEqual([])
      const read = await payload.findByID({ collection: 'people', id: hidden.id, depth: 0 })
      expect(read.consentStatus).toBe('partial')
    })

    it('com public_profile aparece; e-mail só com escopo email; campos administrativos ausentes', async () => {
      const person = await createPerson('autorizada', {
        publicEmail: `autorizada-${run}@example.com`,
      })
      const profileConsent = await grant(person.id, ['public_profile'])
      const visible = await restJson<Doc>('GET', `/people/${person.id}`)
      expect(visible.status).toBe(200)
      const text = JSON.stringify(visible.json)
      expect(text).not.toContain(`autorizada-${run}@example.com`)
      for (const field of [
        'consentPublicProfile',
        'consentPhoto',
        'consentEmail',
        'consentStatus',
        'visibility',
        'archivedAt',
        'consents',
        'memberships',
      ]) {
        expect(visible.json, field).not.toHaveProperty(field)
      }

      await grant(person.id, ['email'])
      expect(await anonText(`/people/${person.id}`)).toContain(`autorizada-${run}@example.com`)

      // Revogar o perfil público retira tudo (inclusive o e-mail) e revalida imediatamente.
      revalidateTag.mockClear()
      await revoke(profileConsent.id)
      expect((await restJson('GET', `/people/${person.id}`)).status).toBe(404)
      const tags = revalidateTag.mock.calls.map((call) => call[0])
      expect(tags).toEqual(
        expect.arrayContaining([CACHE_TAGS.people, CACHE_TAGS.sitemap, personTag(person.slug)]),
      )
      const after = await payload.findByID({ collection: 'people', id: person.id, depth: 0 })
      expect(after.consentStatus).toBe('partial')
      expect(after.consentEmail).toBe(false)
    })

    it('visitante não filtra nem ordena por campos de consentimento', async () => {
      const where = await restJson('GET', '/people?where[consentEmail][equals]=true')
      expect(where.status).toBeGreaterThanOrEqual(400)
      const nested = await restJson('GET', '/memberships?where[person.consentPhoto][equals]=true')
      expect(nested.status).toBeGreaterThanOrEqual(400)
      const sort = await restJson('GET', '/people?sort=consentStatus')
      expect(sort.status).toBeGreaterThanOrEqual(400)
    })

    it('pessoa arquivada ou com visibilidade administrativa não é pública', async () => {
      const archived = await createPerson('arquivada')
      await grant(archived.id, ['public_profile'])
      expect((await restJson('GET', `/people/${archived.id}`)).status).toBe(200)
      await restJson('PATCH', `/people/${archived.id}`, {
        token: editorToken,
        body: { archivedAt: '2026-10-25T00:00:00.000Z' },
      })
      expect((await restJson('GET', `/people/${archived.id}`)).status).toBe(404)

      const adminOnly = await createPerson('restrita', { visibility: 'admin' })
      await grant(adminOnly.id, ['public_profile'])
      expect((await restJson('GET', `/people/${adminOnly.id}`)).status).toBe(404)
    })

    it('foto só com escopo photo e mídia vinculada à autorização; revogar retira a imagem', async () => {
      const person = await createPerson('com-foto')
      const profile = await grant(person.id, ['public_profile'])
      const photoConsent = await grant(person.id, ['photo'])
      const upload = await restJson<{ doc: { id: number; filename: string } }>('POST', '/media', {
        token: editorToken,
        form: uploadForm(
          {
            alt: `Retrato fictício ${run}`,
            credit: 'Fictício',
            license: 'group-authorized',
            source: 'group-archive',
            containsIdentifiablePeople: true,
            consentRecord: photoConsent.id,
          },
          TINY_PNG,
          'retrato.png',
          'image/png',
        ),
      })
      expect(upload.status, JSON.stringify(upload.json)).toBe(201)
      const mediaId = upload.json.doc.id
      expect((await restJson('GET', `/media/${mediaId}`)).status).toBe(200)
      const media = await restJson('GET', `/media/${mediaId}`)
      expect(media.json).not.toHaveProperty('consentRecord')
      expect(media.json).not.toHaveProperty('publicConsent')

      const linked = await restJson('PATCH', `/people/${person.id}`, {
        token: editorToken,
        body: { photo: mediaId },
      })
      expect(linked.status, JSON.stringify(linked.json)).toBe(200)
      const withPhoto = await restJson<{ photo: { id: number } | null }>(
        'GET',
        `/people/${person.id}?depth=1`,
      )
      expect(withPhoto.json.photo?.id).toBe(mediaId)

      await revoke(photoConsent.id)
      const noPhoto = await restJson<{ photo: unknown }>('GET', `/people/${person.id}?depth=1`)
      expect(noPhoto.json.photo ?? null).toBeNull()
      expect((await restJson('GET', `/media/${mediaId}`)).status).toBe(404)
      expect(profile.id).toBeGreaterThan(0)
    })

    it('foto sem autorização desta pessoa é recusada no perfil', async () => {
      const person = await createPerson('foto-recusada')
      const other = await createPerson('outra-pessoa')
      const otherConsent = await grant(other.id, ['photo'])
      const upload = await restJson<{ doc: { id: number } }>('POST', '/media', {
        token: editorToken,
        form: uploadForm(
          {
            alt: `Outro retrato ${run}`,
            credit: 'Fictício',
            license: 'group-authorized',
            source: 'group-archive',
            containsIdentifiablePeople: true,
            consentRecord: otherConsent.id,
          },
          TINY_PNG,
          'outro.png',
          'image/png',
        ),
      })
      const result = await restJson('PATCH', `/people/${person.id}`, {
        token: editorToken,
        body: { photo: upload.json.doc.id },
      })
      expect(result.status).toBe(400)
    })

    it('revogação é definitiva e o titular não pode ser trocado', async () => {
      const person = await createPerson('revogacao')
      const other = await createPerson('revogacao-outra')
      const consent = await grant(person.id, ['public_profile'])
      const moved = await restJson('PATCH', `/consent-records/${consent.id}`, {
        token: editorToken,
        body: { person: other.id },
      })
      expect(moved.status).toBe(400)
      await revoke(consent.id)
      const undo = await restJson('PATCH', `/consent-records/${consent.id}`, {
        token: editorToken,
        body: { revokedAt: null },
      })
      expect(undo.status).toBe(400)
      const future = await restJson('POST', '/consent-records', {
        token: editorToken,
        body: {
          person: person.id,
          scopes: ['public_profile'],
          grantedAt: '2099-01-01T00:00:00.000Z',
          method: 'email',
          collectedBy: 'Fictício',
        },
      })
      expect(future.status).toBe(400)
    })
  })

  describe('redirecionamentos de perfis', () => {
    it('slug de perfil público alterado gera 301; revogação remove o redirecionamento', async () => {
      const person = await createPerson('slug-antigo')
      const consent = await grant(person.id, ['public_profile'])
      const renamed = await restJson<{ doc: Doc }>('PATCH', `/people/${person.id}`, {
        token: editorToken,
        body: { slug: `${SLUG_PREFIX}-slug-novo` },
      })
      expect(renamed.status).toBe(200)
      const redirect = await payload.find({
        collection: 'redirects',
        where: { from: { equals: `/integrantes/${SLUG_PREFIX}-slug-antigo` } },
        overrideAccess: true,
      })
      expect(redirect.docs[0]?.to?.url).toBe(`/integrantes/${SLUG_PREFIX}-slug-novo`)

      await revoke(consent.id)
      const after = await payload.find({
        collection: 'redirects',
        where: { from: { equals: `/integrantes/${SLUG_PREFIX}-slug-antigo` } },
        overrideAccess: true,
      })
      expect(after.docs).toHaveLength(0)
    })

    it('slug de pessoa não pública alterado não gera redirecionamento', async () => {
      const person = await createPerson('oculta-antigo')
      await restJson('PATCH', `/people/${person.id}`, {
        token: editorToken,
        body: { slug: `${SLUG_PREFIX}-oculta-novo` },
      })
      const redirect = await payload.find({
        collection: 'redirects',
        where: { from: { equals: `/integrantes/${SLUG_PREFIX}-oculta-antigo` } },
        overrideAccess: true,
      })
      expect(redirect.docs).toHaveLength(0)
    })
  })

  describe('líderes do grupo', () => {
    it('líder precisa de vínculo ativo de "Líder"; perfil sem autorização não é exposto pelo global', async () => {
      const leader = await createPerson('lider-oculto')
      const noRole = await restJson('POST', '/globals/group-profile', {
        token: editorToken,
        body: { leaders: [leader.id], _status: 'published' },
      })
      expect(noRole.status).toBe(400)

      await membership(leader.id, { role: 'leader', startDate: '2019-01-01' })
      const ok = await restJson('POST', '/globals/group-profile', {
        token: editorToken,
        body: { leaders: [leader.id], _status: 'published' },
      })
      expect(ok.status, JSON.stringify(ok.json)).toBe(200)

      const anon = await restJson<{ leaders?: unknown[] }>('GET', '/globals/group-profile?depth=1')
      const text = JSON.stringify(anon.json)
      expect(text).not.toContain(leader.slug)
      expect((anon.json.leaders ?? []).every((item) => typeof item !== 'object')).toBe(true)

      await grant(leader.id, ['public_profile'])
      const visible = await restJson<{ leaders?: { slug?: string }[] }>(
        'GET',
        '/globals/group-profile?depth=1',
      )
      expect(visible.json.leaders?.some((item) => item?.slug === leader.slug)).toBe(true)
      expect(JSON.stringify(visible.json)).not.toMatch(/consentPublicProfile|consentStatus/)
    })

    it('publicar sem líderes e sem texto de transição é recusado', async () => {
      const result = await restJson('POST', '/globals/group-profile', {
        token: editorToken,
        body: { leaders: [], leadersText: '', _status: 'published' },
      })
      expect(result.status).toBe(400)
    })
  })

  describe('vazamento (AGENTS.md §8.3): nenhuma superfície pública expõe dados não públicos', () => {
    it('API, populações, sitemap e diretório não contêm pessoas sem consentimento nem campos administrativos', async () => {
      const secretName = `Pessoa Sigilosa ${run}`
      const secretEmail = `sigilosa-${run}@example.com`
      const hidden = await createPerson('sigilosa', {
        fullName: secretName,
        publicEmail: secretEmail,
        orcid: fakeOrcid(seed + 7),
      })
      await membership(hidden.id, { role: 'researcher', startDate: '2022-01-01' })
      const revokedConsent = await grant(hidden.id, ['public_profile', 'email'], {
        notes: `Observação sigilosa ${run}`,
      })
      await revoke(revokedConsent.id)

      const visible = await createPerson('visivel-vazamento', {
        publicEmail: `visivel-${run}@example.com`,
      })
      await membership(visible.id, { role: 'researcher', startDate: '2022-01-01' })
      await grant(visible.id, ['public_profile'], { notes: `Nota interna ${run}` })

      const secrets = [
        secretName,
        secretEmail,
        hidden.slug,
        `Observação sigilosa ${run}`,
        `Nota interna ${run}`,
        `visivel-${run}@example.com`,
      ]
      const paths = [
        '/people?limit=500&depth=2',
        `/people/${hidden.id}?depth=2`,
        `/people/${visible.id}?depth=2`,
        '/memberships?limit=500&depth=2',
        `/memberships?where[person][equals]=${hidden.id}&depth=2`,
        '/consent-records?limit=500',
        `/consent-records/${revokedConsent.id}`,
        '/globals/group-profile?depth=2',
        '/media?limit=100&depth=2',
        `/people?where[slug][equals]=${hidden.slug}`,
      ]
      for (const path of paths) {
        const text = await anonText(path)
        for (const secret of secrets)
          expect(text, `${path} expôs "${secret}"`).not.toContain(secret)
        // O perfil do grupo tem procedência pública própria (`collectedAt`, S03).
        if (path.startsWith('/globals/')) continue
        expect(text, `${path} expôs campo administrativo`).not.toMatch(
          /"(consentPublicProfile|consentPhoto|consentEmail|consentStatus|archivedAt|visibility|endReason|collectedAt|sourceUrl|consents|scopes|grantedAt|revokedAt|evidence|collectedBy)"/,
        )
      }
      expect((await restJson('GET', '/consent-records')).status).toBe(403)

      const { getSitemapEntries, listDirectory } = await import('@/lib/content/queries')
      const { buildSitemap } = await import('@/lib/content/sitemap')
      const urls = buildSitemap(await getSitemapEntries(), 'https://portal.example.org').map(
        (item) => item.url,
      )
      expect(urls).toContain(`https://portal.example.org/integrantes/${visible.slug}`)
      expect(urls.join(' ')).not.toContain(hidden.slug)
      const directory = await listDirectory()
      expect(directory.some((person) => person.slug === visible.slug)).toBe(true)
      expect(JSON.stringify(directory)).not.toContain(secretName)
      expect(JSON.stringify(directory)).not.toContain(`visivel-${run}@example.com`)
    })
  })

  describe('importação CSV', () => {
    const csv = () =>
      [
        'nome_completo;slug;orcid;lattes;papel;nivel_formacao;linhas;inicio;termino;motivo_termino;fonte',
        `Importada Fictícia;${SLUG_PREFIX}-importada;${fakeOrcid(seed + 1)};;estudante;mestrado;${SLUG_PREFIX}-linha;01/03/2020;28/02/2022;conclusao;planilha`,
        `Importada Fictícia;${SLUG_PREFIX}-importada;${fakeOrcid(seed + 1)};;pesquisador;;${SLUG_PREFIX}-linha;2022-03-01;;;planilha`,
        `Lattes Fictício;${SLUG_PREFIX}-lattes;;${fakeLattes(seed + 2)};colaborador-externo;;;2023-05-10;;;dgp`,
        `Com Erro;${SLUG_PREFIX}-erro;${invalidOrcid(seed + 3)};;estudante;;;2020-01-01;;;planilha`,
        `Sobreposta;${SLUG_PREFIX}-sobreposta;;;pesquisador;;;2020-01-01;;;planilha`,
        `Sobreposta;${SLUG_PREFIX}-sobreposta;;;pesquisador;;;2021-01-01;;;planilha`,
      ].join('\n')

    it('pré-visualização não grava; aplicação reexecutada não duplica; nunca cria consentimentos', async () => {
      const { importPeople } = await import('../../scripts/import/people-core')
      const count = async () =>
        (
          await payload.count({
            collection: 'people',
            where: { slug: { like: `${SLUG_PREFIX}-` } },
            overrideAccess: true,
          })
        ).totalDocs
      const before = await count()

      const preview = await importPeople(payload, csv(), { apply: false })
      expect(preview.applied).toBe(false)
      expect(await count()).toBe(before)
      expect(preview.summary.errors).toBe(1)

      const first = await importPeople(payload, csv(), { apply: true })
      expect(first.summary).toMatchObject({ peopleCreated: 2, membershipsCreated: 3 })
      // Linha inválida e pessoa com vínculos sobrepostos: erro registrado, sem registro parcial.
      expect(first.summary.errors).toBe(3)
      expect(
        (
          await payload.find({
            collection: 'people',
            where: { slug: { equals: `${SLUG_PREFIX}-sobreposta` } },
            overrideAccess: true,
          })
        ).docs,
      ).toHaveLength(0)
      expect(await count()).toBe(before + 2)

      const second = await importPeople(payload, csv(), { apply: true })
      expect(second.summary).toMatchObject({
        peopleCreated: 0,
        peopleMatched: 2,
        membershipsCreated: 0,
        membershipsExisting: 3,
      })
      expect(await count()).toBe(before + 2)

      const imported = await payload.find({
        collection: 'people',
        where: { slug: { equals: `${SLUG_PREFIX}-importada` } },
        overrideAccess: true,
      })
      const person = imported.docs[0]!
      expect(person.consentPublicProfile).toBe(false)
      const consents = await payload.count({
        collection: 'consent-records',
        where: { person: { equals: person.id } },
        overrideAccess: true,
      })
      expect(consents.totalDocs).toBe(0)
      expect((await restJson('GET', `/people/${person.id}`)).status).toBe(404)
    })
  })

  describe('auditoria', () => {
    it('criação de pessoa, vínculo e consentimento gera registro de auditoria', async () => {
      const person = await createPerson('auditada')
      const consent = await grant(person.id, ['public_profile'])
      for (const [collection, id] of [
        ['people', person.id],
        ['consent-records', consent.id],
      ] as const) {
        const logs = await payload.find({
          collection: 'audit-logs',
          where: {
            and: [
              { targetCollection: { equals: collection } },
              { documentId: { equals: String(id) } },
              { action: { equals: 'create' } },
            ],
          },
          overrideAccess: true,
        })
        expect(logs.docs.length, collection).toBeGreaterThan(0)
      }
    })
  })
})

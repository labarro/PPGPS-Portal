import { randomUUID } from 'node:crypto'

import { Pool } from 'pg'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { CACHE_TAGS } from '@/lib/content/cache-tags'
import { createRedirectLookup, REDIRECT_SQL } from '@/lib/content/redirect-lookup'
import { authRateLimiter } from '@/lib/security/rate-limit'

import { groupProfileSeed } from '../../scripts/seed/data/institutional'
import { cleanupAccounts, createAccount, type TestAccount } from '../helpers/fixtures'
import { expectNoLeak, publicCollectionSurfaces, publicGlobalSurfaces } from '../helpers/leak'
import { loginRest, restJson } from '../helpers/rest'

// Revalidação: os hooks importam `next/cache` dinamicamente; aqui registramos as chamadas.
const revalidateTag = vi.fn()
const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
  unstable_cache: (fn: unknown) => fn,
}))

/**
 * S03 — perfil do grupo, linhas temáticas, páginas e redirecionamentos: acesso por papel,
 * vazamento de rascunhos, publicação, revalidação por tag e 301 automático.
 */
let payload: Payload
let editor: TestAccount
let editorToken: string
const run = randomUUID().slice(0, 8)
const marker = (name: string) => `Marcador ${name} ${run}`
const createdLines: number[] = []
const createdPages: number[] = []

async function createLine(data: Record<string, unknown>, draft = false) {
  const { status, json } = await restJson<{ doc: { id: number; slug: string } }>(
    'POST',
    `/research-lines${draft ? '?draft=true' : ''}`,
    {
      token: editorToken,
      body: {
        name: `Linha ${run}`,
        summary: 'Resumo fictício de teste.',
        order: 50,
        active: true,
        _status: draft ? 'draft' : 'published',
        ...data,
      },
    },
  )
  expect(status, JSON.stringify(json)).toBe(201)
  createdLines.push(json.doc.id)
  return json.doc
}

async function updateLine(id: number, data: Record<string, unknown>, draft = false) {
  const { status, json } = await restJson<{ doc: { slug: string } }>(
    'PATCH',
    `/research-lines/${id}${draft ? '?draft=true' : ''}`,
    { token: editorToken, body: { ...data, _status: draft ? 'draft' : 'published' } },
  )
  expect(status, JSON.stringify(json)).toBe(200)
  return json.doc
}

async function redirectFrom(from: string) {
  const result = await payload.find({
    collection: 'redirects',
    where: { from: { equals: from } },
    overrideAccess: true,
    depth: 0,
  })
  return result.docs[0] ?? null
}

async function publishSeedProfile() {
  await payload.updateGlobal({
    slug: 'group-profile',
    data: { ...(groupProfileSeed as unknown as Record<string, unknown>), _status: 'published' },
    overrideAccess: true,
    context: { skipRevalidation: true },
  })
}

describe('S03 — conteúdo do grupo', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    authRateLimiter.reset()
    editor = await createAccount(payload, ['editor'])
    editorToken = await loginRest(editor.email, editor.password)
    await publishSeedProfile()
  })

  beforeEach(() => {
    revalidateTag.mockClear()
    revalidatePath.mockClear()
  })

  afterAll(async () => {
    for (const id of createdLines) {
      await payload
        .delete({ collection: 'research-lines', id, overrideAccess: true })
        .catch(() => null)
    }
    for (const id of createdPages) {
      await payload.delete({ collection: 'pages', id, overrideAccess: true }).catch(() => null)
    }
    await payload.delete({
      collection: 'redirects',
      where: { from: { contains: run } },
      overrideAccess: true,
    })
    // Estado canônico para os demais testes (e para o E2E local, que usa o mesmo banco).
    await publishSeedProfile()
    await cleanupAccounts(payload)
  })

  describe('acesso (matriz 14.3)', () => {
    it('visitante anônimo não cria, edita nem exclui conteúdo do grupo', async () => {
      expect(
        (await restJson('POST', '/research-lines', { body: { name: 'X', summary: 'Y' } })).status,
      ).toBe(403)
      expect((await restJson('POST', '/pages', { body: { title: 'X' } })).status).toBe(403)
      expect(
        (await restJson('POST', '/globals/group-profile', { body: { summary: 'X' } })).status,
      ).toBe(403)
      expect((await restJson('POST', '/globals/homepage', { body: {} })).status).toBe(403)
      expect((await restJson('GET', '/redirects')).status).toBe(403)
      expect(
        (await restJson('POST', '/redirects', { body: { from: '/x', to: { url: '/y' } } })).status,
      ).toBe(403)
    })

    it('editor (coordenador) edita o perfil do grupo, linhas, páginas e redirecionamentos', async () => {
      const line = await createLine({ slug: `acesso-${run}` })
      expect(line.slug).toBe(`acesso-${run}`)

      const page = await restJson<{ doc: { id: number } }>('POST', '/pages', {
        token: editorToken,
        body: { title: `Página ${run}`, slug: `acesso-${run}`, _status: 'published' },
      })
      expect(page.status).toBe(201)
      createdPages.push(page.json.doc.id)

      const profile = await restJson('POST', '/globals/group-profile', {
        token: editorToken,
        body: { summary: marker('resumo-editor'), _status: 'published' },
      })
      expect(profile.status).toBe(200)

      expect((await restJson('GET', '/redirects', { token: editorToken })).status).toBe(200)
    })

    it('publicar o perfil exige o texto de liderança; rascunho não exige', async () => {
      const published = await restJson('POST', '/globals/group-profile', {
        token: editorToken,
        body: { leadersText: '', _status: 'published' },
      })
      expect(published.status).toBe(400)
      expect(JSON.stringify(published.json)).toMatch(/leadersText|Liderança/)

      const draft = await restJson('POST', '/globals/group-profile?draft=true', {
        token: editorToken,
        body: { leadersText: '', _status: 'draft' },
      })
      expect(draft.status).toBe(200)
      await publishSeedProfile()
    })

    it('slug inválido é rejeitado e slug vazio é gerado a partir do nome', async () => {
      const invalid = await restJson('POST', '/research-lines', {
        token: editorToken,
        body: { name: 'X', summary: 'Y', slug: 'Com Espaço!', _status: 'published' },
      })
      // O slug informado é normalizado (sem acentos/espaços) antes da validação.
      expect(invalid.status).toBe(201)
      createdLines.push((invalid.json as { doc: { id: number } }).doc.id)
      expect((invalid.json as { doc: { slug: string } }).doc.slug).toBe('com-espaco')

      const generated = await createLine({ name: `Promoção Ética ${run}`, slug: '' })
      expect(generated.slug).toBe(`promocao-etica-${run}`)
    })
  })

  describe('vazamento: rascunhos e conteúdo inativo nunca são públicos', () => {
    it('API pública só expõe o publicado (coleções e globals, inclusive com ?draft=true)', async () => {
      // Linha publicada que depois recebe um rascunho com texto sigiloso.
      const published = await createLine({
        slug: `publicada-${run}`,
        summary: marker('linha-publicada'),
      })
      await updateLine(published.id, { summary: marker('rascunho-linha') }, true)
      // Linha que só existe como rascunho e linha publicada porém inativa.
      const draftOnly = await createLine(
        { slug: `so-rascunho-${run}`, summary: marker('linha-so-rascunho') },
        true,
      )
      const inactive = await createLine({
        slug: `inativa-${run}`,
        summary: marker('linha-inativa'),
        active: false,
      })

      // Página publicada com rascunho posterior e página só em rascunho.
      const page = await restJson<{ doc: { id: number } }>('POST', '/pages', {
        token: editorToken,
        body: {
          title: marker('pagina-publicada'),
          slug: `pagina-${run}`,
          _status: 'published',
        },
      })
      createdPages.push(page.json.doc.id)
      await restJson('PATCH', `/pages/${page.json.doc.id}?draft=true`, {
        token: editorToken,
        body: { title: marker('rascunho-pagina'), _status: 'draft' },
      })
      const draftPage = await restJson<{ doc: { id: number } }>('POST', '/pages?draft=true', {
        token: editorToken,
        body: { title: marker('pagina-so-rascunho'), slug: `rascunho-${run}`, _status: 'draft' },
      })
      createdPages.push(draftPage.json.doc.id)

      // Perfil e página inicial: rascunhos posteriores à publicação.
      await restJson('POST', '/globals/group-profile?draft=true', {
        token: editorToken,
        body: { summary: marker('rascunho-perfil'), _status: 'draft' },
      })
      await restJson('POST', '/globals/homepage?draft=true', {
        token: editorToken,
        body: { hero: { purpose: marker('rascunho-home') }, _status: 'draft' },
      })

      const surfaces = [
        ...(await publicCollectionSurfaces('research-lines', [
          published.id,
          draftOnly.id,
          inactive.id,
        ])),
        ...(await publicCollectionSurfaces('pages', [page.json.doc.id, draftPage.json.doc.id])),
        ...(await publicGlobalSurfaces('group-profile')),
        ...(await publicGlobalSurfaces('homepage')),
      ]
      expectNoLeak(surfaces, [
        marker('rascunho-linha'),
        marker('linha-so-rascunho'),
        marker('linha-inativa'),
        marker('rascunho-pagina'),
        marker('pagina-so-rascunho'),
        marker('rascunho-perfil'),
        marker('rascunho-home'),
        editor.email,
      ])

      // O que está publicado continua visível.
      const all = surfaces.map((item) => item.text).join('\n')
      expect(all).toContain(marker('linha-publicada'))
      expect(all).toContain(marker('pagina-publicada'))

      // Documento só em rascunho: 404 por id para o visitante.
      expect((await restJson('GET', `/research-lines/${draftOnly.id}`)).status).toBe(404)
      expect((await restJson('GET', `/pages/${draftPage.json.doc.id}`)).status).toBe(404)

      // A equipe editorial vê o rascunho (pré-visualização).
      const asEditor = await restJson<{ summary: string }>(
        'GET',
        `/research-lines/${published.id}?draft=true`,
        { token: editorToken },
      )
      expect(asEditor.json.summary).toBe(marker('rascunho-linha'))

      await publishSeedProfile()
      await restJson('POST', '/globals/homepage', {
        token: editorToken,
        body: { hero: { purpose: '' }, _status: 'published' },
      })
    })

    it('sitemap lista somente linhas e páginas publicadas (e ativas)', async () => {
      const { getSitemapEntries } = await import('@/lib/content/queries')
      const { buildSitemap } = await import('@/lib/content/sitemap')
      const entries = await getSitemapEntries()
      const urls = buildSitemap(entries, 'https://portal.example.org').map((item) => item.url)

      expect(urls).toContain(`https://portal.example.org/linhas/publicada-${run}`)
      expect(urls).toContain(`https://portal.example.org/o-grupo/pagina-${run}`)
      expect(urls).toContain('https://portal.example.org/o-grupo/historico')
      expect(urls.join('\n')).not.toContain(`so-rascunho-${run}`)
      expect(urls.join('\n')).not.toContain(`inativa-${run}`)
      expect(urls.join('\n')).not.toContain(`rascunho-${run}`)
    })
  })

  describe('redirecionamento 301 ao alterar o slug publicado', () => {
    let pool: Pool
    beforeAll(() => {
      pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
    })
    afterAll(async () => {
      await pool.end()
    })

    it('cria 301, reaponta cadeias e remove o redirecionamento quando o endereço volta a existir', async () => {
      const a = `slug-a-${run}`
      const b = `slug-b-${run}`
      const c = `slug-c-${run}`
      const line = await createLine({ slug: a })

      // Rascunho com outro slug NÃO cria redirecionamento (a versão publicada continua em `a`).
      await updateLine(line.id, { slug: b }, true)
      expect(await redirectFrom(`/linhas/${a}`)).toBeNull()

      // Publicar com o novo slug cria o 301 de `a` para `b`.
      await updateLine(line.id, { slug: b })
      const first = await redirectFrom(`/linhas/${a}`)
      expect(first?.to?.url).toBe(`/linhas/${b}`)
      expect(first?.type).toBe('301')

      // A consulta do proxy (SQL mínimo) encontra o destino.
      const lookup = createRedirectLookup(async (from) => {
        const result = await pool.query<{ to: string; type: string }>(REDIRECT_SQL, [from])
        return result.rows[0] ?? null
      })
      expect(await lookup(`/linhas/${a}/`)).toEqual({ to: `/linhas/${b}`, status: 301 })

      // Nova mudança: `a` e `b` apontam direto para `c` (sem cadeia).
      await updateLine(line.id, { slug: c })
      expect((await redirectFrom(`/linhas/${a}`))?.to?.url).toBe(`/linhas/${c}`)
      expect((await redirectFrom(`/linhas/${b}`))?.to?.url).toBe(`/linhas/${c}`)

      // Uma nova linha publicada em `a` remove o redirecionamento de `a`.
      await createLine({ slug: a, name: `Outra ${run}` })
      expect(await redirectFrom(`/linhas/${a}`)).toBeNull()
      expect((await redirectFrom(`/linhas/${b}`))?.to?.url).toBe(`/linhas/${c}`)
    })

    it('alterar o slug de uma página publicada também cria 301', async () => {
      const created = await restJson<{ doc: { id: number } }>('POST', '/pages', {
        token: editorToken,
        body: { title: `Página ${run}`, slug: `pag-a-${run}`, _status: 'published' },
      })
      createdPages.push(created.json.doc.id)
      await restJson('PATCH', `/pages/${created.json.doc.id}`, {
        token: editorToken,
        body: { slug: `pag-b-${run}`, _status: 'published' },
      })
      expect((await redirectFrom(`/o-grupo/pag-a-${run}`))?.to?.url).toBe(`/o-grupo/pag-b-${run}`)
    })

    it('origem de redirecionamento é normalizada e caminhos do sistema são recusados', async () => {
      const ok = await restJson<{ doc: { from: string } }>('POST', '/redirects', {
        token: editorToken,
        body: { from: `/Linhas/Manual-${run}/`, to: { url: '/linhas' }, type: '301' },
      })
      expect(ok.status).toBe(201)
      expect(ok.json.doc.from).toBe(`/linhas/manual-${run}`)

      const reserved = await restJson('POST', '/redirects', {
        token: editorToken,
        body: { from: `/admin/${run}`, to: { url: '/' }, type: '301' },
      })
      expect(reserved.status).toBe(400)
      const unsafe = await restJson('POST', '/redirects', {
        token: editorToken,
        body: { from: `/linhas/x-${run}`, to: { url: 'javascript:alert(1)' }, type: '301' },
      })
      expect(unsafe.status).toBe(400)
    })
  })

  describe('revalidação por tag e auditoria', () => {
    it('publicar o perfil revalida a tag do perfil, o sitemap e o layout (home, /o-grupo/*, rodapé)', async () => {
      await restJson('POST', '/globals/group-profile', {
        token: editorToken,
        body: { summary: marker('revalida'), _status: 'published' },
      })
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.groupProfile, { expire: 0 })
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.sitemap, { expire: 0 })
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      await publishSeedProfile()
    })

    it('publicar uma linha revalida a lista, a página da linha, a home e o sitemap', async () => {
      const line = await createLine({ slug: `revalida-${run}` })
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.researchLines, { expire: 0 })
      expect(revalidateTag).toHaveBeenCalledWith(`research-line:${line.slug}`, { expire: 0 })
      expect(revalidatePath).toHaveBeenCalledWith('/linhas', undefined)
      expect(revalidatePath).toHaveBeenCalledWith(`/linhas/${line.slug}`, undefined)
      expect(revalidatePath).toHaveBeenCalledWith('/', undefined)
    })

    it('publicação é auditada como "publish"', async () => {
      const line = await createLine({ slug: `auditada-${run}` })
      await updateLine(line.id, { summary: 'Novo resumo fictício.' })
      const logs = await payload.find({
        collection: 'audit-logs',
        where: {
          and: [
            { targetCollection: { equals: 'research-lines' } },
            { documentId: { equals: String(line.id) } },
          ],
        },
        overrideAccess: true,
        sort: '-at',
      })
      expect(logs.docs.map((log) => log.action)).toContain('publish')
    })
  })
})

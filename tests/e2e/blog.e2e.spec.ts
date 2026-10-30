import { randomUUID } from 'node:crypto'

import { expect, type APIRequestContext, type Page, test } from '@playwright/test'

import { cleanupE2EEssays } from '../helpers/essays'
import {
  cleanupE2EUsers,
  editorUser,
  loginUser,
  seedEditorUser,
  seedLoginUser,
} from '../helpers/users'
import { apiLogin, expectNoHorizontalOverflow, expectNoSeriousA11yViolations } from './helpers'

/**
 * S05 — blog acadêmico e fluxo editorial (ensaios FICTÍCIOS do `seed:essays`): listagens,
 * página do ensaio (selo, aviso sem revisão por pares, autoria, referências, JSON-LD, OG),
 * arquivados, agendados e rascunhos fora do site, RSS/Atom, home e perfil; fluxo completo
 * rascunho → revisão → devolução → aprovação → agendamento → publicação → arquivamento,
 * com axe; bloqueio do visitante pela API; XSS; ações editoriais no painel.
 */
const run = `e2e-s05-${randomUUID().slice(0, 6)}`
const PUBLISHED = {
  slug: 'ensaio-ficticio-autonomia-e-cuidado',
  title: 'Autonomia e cuidado: notas fictícias para uma bioética da atenção básica',
}
const SECOND = 'Promoção da saúde em territórios: um exercício fictício de divulgação'
const ARCHIVED = {
  slug: 'ensaio-ficticio-arquivado',
  title: 'Ensaio fictício arquivado: memória de um debate',
}
const SCHEDULED = {
  slug: 'ensaio-ficticio-agendado',
  title: 'Ensaio fictício agendado para o futuro',
}
const DRAFT = { slug: 'ensaio-ficticio-rascunho', title: 'Rascunho fictício em preparação' }
const CHECKLIST = {
  natureIndicated: true,
  groundedArguments: true,
  noPersonalData: true,
  imagesLicensed: true,
  accessibleLanguage: true,
  conflictsDeclared: true,
  noClinicalAdvice: true,
  notInstitutionalPosition: true,
}

const cards = (page: Page) => page.getByTestId('essay-card')

async function idBySlug(
  request: APIRequestContext,
  collection: string,
  slug: string,
  token: string,
) {
  const response = await request.get(
    `/api/${collection}?where[slug][equals]=${slug}&depth=0&draft=true`,
    {
      headers: { Authorization: `JWT ${token}` },
    },
  )
  const json = (await response.json()) as { docs: { id: number }[] }
  return json.docs[0]!.id
}

test.describe('Blog — páginas públicas', () => {
  test('/blog lista só ensaios publicados (sem arquivado, agendado e rascunho)', async ({
    page,
  }) => {
    await page.goto('/blog')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog')
    for (const title of [PUBLISHED.title, SECOND]) {
      await expect(cards(page).filter({ hasText: title })).toHaveCount(1)
    }
    for (const title of [ARCHIVED.title, SCHEDULED.title, DRAFT.title]) {
      await expect(page.locator('main')).not.toContainText(title)
    }
    // Todo cartão tem selo de natureza.
    const count = await cards(page).count()
    await expect(page.getByTestId('nature-badge')).toHaveCount(count)
    await expect(page.getByRole('navigation', { name: 'Categorias do blog' })).toBeVisible()
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
      'href',
      /\/blog\/rss\.xml$/,
    )
  })

  test('página do ensaio: selo, aviso sem revisão por pares, autoria, referências, tags e JSON-LD', async ({
    page,
  }) => {
    await page.goto(`/blog/${PUBLISHED.slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(PUBLISHED.title)
    await expect(page.getByTestId('nature-badge').first()).toContainText('Ensaio reflexivo')
    const notice = page.getByTestId('essay-notice')
    await expect(notice).toContainText('Não passou por revisão por pares')
    await expect(notice).toContainText('não representam necessariamente posição institucional')
    await expect(notice).toContainText('CC BY-NC-ND 4.0')
    await expect(page.getByText('1 minuto de leitura').first()).toBeVisible()

    // Autora com perfil público tem link; coautora sem autorização aparece só pelo nome.
    const byline = page.getByTestId('essay-authors').first()
    await expect(byline.getByRole('link', { name: 'Helena Exemplar Fictícia' })).toHaveAttribute(
      'href',
      '/integrantes/helena-exemplar-ficticia',
    )
    await expect(byline).toContainText('Sofia Ilustrativa Sem Autorização')
    await expect(byline.getByRole('link', { name: /Sofia/ })).toHaveCount(0)
    await expect(page.locator('a[href*="sofia-ilustrativa"]')).toHaveCount(0)

    await expect(page.getByTestId('references').locator('li')).toHaveCount(2)
    await expect(page.getByRole('link', { name: 'Autonomia', exact: true })).toHaveAttribute(
      'href',
      '/blog/tag/autonomia',
    )

    const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .map((text) => JSON.parse(text))
      .flat()
    const posting = jsonLd.find((item) => item['@type'] === 'BlogPosting')
    expect(posting).toMatchObject({ headline: PUBLISHED.title, genre: 'Ensaio reflexivo' })
    expect(posting.author).toEqual([
      expect.objectContaining({
        name: 'Helena Exemplar Fictícia',
        url: expect.stringContaining('/integrantes/'),
      }),
      { '@type': 'Person', name: 'Sofia Ilustrativa Sem Autorização' },
    ])

    // Imagem Open Graph gerada por next/og.
    const og = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(og).toContain(`/blog/${PUBLISHED.slug}/opengraph-image`)
    const image = await page.request.get(og!)
    expect(image.status()).toBe(200)
    expect(image.headers()['content-type']).toContain('image/png')
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
  })

  test('arquivado responde 200 com aviso; agendado e rascunho respondem 404', async ({
    page,
    request,
  }) => {
    const archived = await page.goto(`/blog/${ARCHIVED.slug}`)
    expect(archived?.status()).toBe(200)
    await expect(page.getByTestId('archived-notice')).toContainText('Ensaio arquivado')
    await expect(page.getByTestId('essay-notice')).toBeVisible()
    for (const slug of [SCHEDULED.slug, DRAFT.slug, 'nao-existe']) {
      expect((await request.get(`/blog/${slug}`)).status()).toBe(404)
    }
  })

  test('categoria e tag listam os ensaios publicados', async ({ page }) => {
    await page.goto('/blog/categoria/bioetica')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bioética')
    await expect(cards(page).filter({ hasText: PUBLISHED.title })).toHaveCount(1)
    await expect(page.locator('main')).not.toContainText(SECOND)
    await expect(page.locator('main')).not.toContainText(ARCHIVED.title)
    await page.goto('/blog/tag/autonomia')
    await expect(cards(page).filter({ hasText: PUBLISHED.title })).toHaveCount(1)
    expect((await page.request.get('/blog/categoria/inexistente')).status()).toBe(404)
  })

  test('RSS e Atom: somente publicados e não arquivados', async ({ request }) => {
    const rss = await request.get('/blog/rss.xml')
    expect(rss.status()).toBe(200)
    expect(rss.headers()['content-type']).toContain('application/rss+xml')
    const xml = await rss.text()
    expect(xml).toContain(`/blog/${PUBLISHED.slug}</link>`)
    for (const slug of [ARCHIVED.slug, SCHEDULED.slug, DRAFT.slug]) expect(xml).not.toContain(slug)
    const atom = await request.get('/blog/atom.xml')
    expect(atom.headers()['content-type']).toContain('application/atom+xml')
    expect(await atom.text()).toContain(PUBLISHED.slug)
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain(`/blog/${PUBLISHED.slug}`)
    expect(sitemap).toContain('/blog/categoria/bioetica')
    for (const slug of [ARCHIVED.slug, SCHEDULED.slug, DRAFT.slug])
      expect(sitemap).not.toContain(slug)
  })

  test('destaques na página inicial e ensaios no perfil da autora', async ({ page }) => {
    await page.goto('/')
    const highlights = page.getByTestId('home-essays')
    await expect(highlights.getByText(PUBLISHED.title)).toBeVisible()
    await expect(highlights).not.toContainText(ARCHIVED.title)
    await page.goto('/integrantes/helena-exemplar-ficticia')
    await expect(page.getByTestId('person-essays').getByText(PUBLISHED.title)).toBeVisible()
    await expect(page.getByTestId('person-essays')).not.toContainText(ARCHIVED.title)
  })

  test('celular: leitura do ensaio sem rolagem horizontal e menu com Blog', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto(`/blog/${PUBLISHED.slug}`)
    await expectNoHorizontalOverflow(page)
    await expectNoSeriousA11yViolations(page)
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await expect(page.getByRole('dialog').getByRole('link', { name: 'Blog' })).toBeVisible()
  })
})

test.describe('Fluxo editorial completo (S05)', () => {
  let editorToken: string
  let adminToken: string
  let categoryId: number
  let tagId: number
  let personId: number

  test.beforeAll(async ({ request }) => {
    await seedLoginUser()
    await seedEditorUser()
    editorToken = await apiLogin(request, editorUser)
    adminToken = await apiLogin(request, loginUser)
    categoryId = await idBySlug(request, 'categories', 'promocao-da-saude', editorToken)
    tagId = await idBySlug(request, 'tags', 'territorio', editorToken)
    personId = await idBySlug(request, 'people', 'marina-ficticia-duarte', editorToken)
  })

  test.afterAll(async () => {
    await cleanupE2EEssays(run)
    await cleanupE2EUsers()
  })

  const auth = (token: string) => ({ Authorization: `JWT ${token}` })

  async function act(
    request: APIRequestContext,
    id: number,
    to: string,
    token: string,
    extra = {},
  ) {
    const response = await request.post(`/api/essays/${id}/transition`, {
      headers: auth(token),
      data: { to, ...extra },
    })
    return { status: response.status(), json: (await response.json()) as { code?: string } }
  }

  test('rascunho → revisão → devolução → ajuste → aprovação → agendamento → publicação → arquivamento', async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000)
    const slug = `${run}-fluxo`
    const title = `Ensaio fictício do fluxo ${run}`

    // 1. Editor cria o ensaio com autora integrante, convidado, referência e tag.
    const created = await request.post('/api/essays?draft=true', {
      headers: auth(editorToken),
      data: {
        title,
        slug,
        excerpt: 'Resumo fictício do teste de fluxo editorial.',
        nature: 'science_communication',
        category: categoryId,
        tags: [tagId],
        authors: [
          { role: 'author', person: personId },
          { role: 'guest', name: 'Convidado E2E Fictício', bio: 'Minibio fictícia.' },
        ],
        references: [{ authors: 'AUTORA FICTÍCIA, A.', title: 'Obra fictícia', year: 2021 }],
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: 'Texto fictício do fluxo editorial E2E.', format: 0 },
                ],
              },
            ],
          },
        },
      },
    })
    expect(created.status(), await created.text()).toBe(201)
    const id = ((await created.json()) as { doc: { id: number } }).doc.id

    // Visitante não publica nem altera pela API; rascunho → publicado é rejeitado.
    expect(
      (await request.post(`/api/essays/${id}/transition`, { data: { to: 'published' } })).status(),
    ).toBe(401)
    expect(
      (await request.patch(`/api/essays/${id}`, { data: { title: 'Invasor' } })).status(),
    ).toBe(403)
    expect((await act(request, id, 'published', adminToken)).json.code).toBe('invalid_transition')
    expect((await request.get(`/blog/${slug}`)).status()).toBe(404)

    // 2–5. Revisão, devolução com comentário, ajuste e reenvio.
    expect((await act(request, id, 'in_review', editorToken)).status).toBe(200)
    expect((await act(request, id, 'returned', adminToken)).json.code).toBe('comment_required')
    expect(
      (await act(request, id, 'returned', adminToken, { comment: 'Ajustar o resumo, por favor.' }))
        .status,
    ).toBe(200)
    const edit = await request.patch(`/api/essays/${id}?draft=true`, {
      headers: auth(editorToken),
      data: { excerpt: 'Resumo fictício ajustado após a revisão.' },
    })
    expect(edit.status()).toBe(200)
    expect((await act(request, id, 'in_review', editorToken)).status).toBe(200)

    // 6. Aprovação pelo admin (checklist completo).
    await request.patch(`/api/essays/${id}?draft=true`, {
      headers: auth(adminToken),
      data: { checklist: CHECKLIST },
    })
    expect((await act(request, id, 'approved', adminToken)).status).toBe(200)
    expect((await request.get(`/blog/${slug}`)).status()).toBe(404)

    // 7–8. Agendamento para daqui a ~62 s: oculto antes, publicado depois.
    const when = new Date(Date.now() + 62_000).toISOString()
    expect((await act(request, id, 'scheduled', editorToken, { scheduledAt: when })).status).toBe(
      200,
    )
    expect((await request.get(`/blog/${slug}`)).status()).toBe(404)
    expect(await (await request.get('/blog/rss.xml')).text()).not.toContain(slug)
    await expect
      .poll(async () => (await request.get(`/blog/${slug}`)).status(), {
        timeout: 150_000,
        intervals: [5_000],
      })
      .toBe(200)

    // 9. Home, blog, categoria, tag, RSS e perfil.
    await page.goto('/')
    await expect(page.getByTestId('home-essays').getByText(title)).toBeVisible()
    await page.goto('/blog')
    await expect(cards(page).filter({ hasText: title })).toHaveCount(1)
    await page.goto('/blog/categoria/promocao-da-saude')
    await expect(cards(page).filter({ hasText: title })).toHaveCount(1)
    await page.goto('/blog/tag/territorio')
    await expect(cards(page).filter({ hasText: title })).toHaveCount(1)
    expect(await (await request.get('/blog/rss.xml')).text()).toContain(`/blog/${slug}`)
    await page.goto('/integrantes/marina-ficticia-duarte')
    await expect(page.getByTestId('person-essays').getByText(title)).toBeVisible()
    await page.goto(`/blog/${slug}`)
    await expect(page.getByText('Resumo fictício ajustado após a revisão.').first()).toBeVisible()
    await expect(page.getByTestId('nature-badge').first()).toContainText('Divulgação científica')
    await expect(page.getByText('Convidado E2E Fictício').first()).toBeVisible()
    await expectNoSeriousA11yViolations(page)

    // 10. Arquivamento: URL com aviso; fora de listagens, RSS e sitemap.
    expect((await act(request, id, 'archived', editorToken)).status).toBe(200)
    await page.goto(`/blog/${slug}`)
    await expect(page.getByTestId('archived-notice')).toBeVisible()
    await page.goto('/blog')
    await expect(page.locator('main')).not.toContainText(title)
    expect(await (await request.get('/blog/rss.xml')).text()).not.toContain(slug)
    expect(await (await request.get('/sitemap.xml')).text()).not.toContain(slug)
  })

  test('script inserido no conteúdo não é executado (XSS)', async ({ page, request }) => {
    const slug = `${run}-xss`
    const created = await request.post('/api/essays?draft=true', {
      headers: auth(editorToken),
      data: {
        title: `Ensaio fictício XSS ${run}`,
        slug,
        excerpt: 'Teste fictício de XSS.',
        nature: 'review',
        category: categoryId,
        authors: [{ role: 'guest', name: 'Convidada XSS Fictícia' }],
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                textStyle: 'background:red',
                children: [
                  {
                    type: 'text',
                    text: '<script>window.__xss = true</script>',
                    format: 0,
                    style: 'color:red',
                  },
                  {
                    type: 'link',
                    fields: { linkType: 'custom', url: 'javascript:window.__xss=true' },
                    children: [{ type: 'text', text: 'link suspeito' }],
                  },
                ],
              },
              { type: 'html', html: '<img src=x onerror="window.__xss=true">', children: [] },
            ],
          },
        },
      },
    })
    expect(created.status()).toBe(201)
    const id = ((await created.json()) as { doc: { id: number } }).doc.id
    for (const [to, token] of [
      ['in_review', editorToken],
      ['approved', adminToken],
      ['published', editorToken],
    ] as const) {
      if (to === 'approved') {
        await request.patch(`/api/essays/${id}?draft=true`, {
          headers: auth(adminToken),
          data: { checklist: CHECKLIST },
        })
      }
      expect((await act(request, id, to, token)).status).toBe(200)
    }
    let dialogs = 0
    page.on('dialog', async (dialog) => {
      dialogs += 1
      await dialog.dismiss()
    })
    await page.goto(`/blog/${slug}`)
    await expect(page.getByText('<script>window.__xss = true</script>')).toBeVisible()
    await page.getByText('link suspeito').click()
    expect(await page.evaluate(() => (window as { __xss?: boolean }).__xss)).toBeUndefined()
    expect(dialogs).toBe(0)
    await expect(page.locator('main script:not([type="application/ld+json"])')).toHaveCount(0)
    await expect(page.locator('main a[href^="javascript:"]')).toHaveCount(0)
  })

  test('painel: o editor envia o ensaio à revisão pelas ações editoriais', async ({
    page,
    request,
  }) => {
    const slug = `${run}-painel`
    const created = await request.post('/api/essays?draft=true', {
      headers: auth(editorToken),
      data: {
        title: `Ensaio fictício do painel ${run}`,
        slug,
        excerpt: 'Resumo fictício.',
        nature: 'reflective_essay',
        category: categoryId,
        authors: [{ role: 'author', person: personId }],
        content: {
          root: {
            type: 'root',
            children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Texto.' }] }],
          },
        },
      },
    })
    const id = ((await created.json()) as { doc: { id: number } }).doc.id
    await page.goto('/admin/login')
    await page.locator('#field-email').fill(editorUser.email)
    await page.locator('#field-password').fill(editorUser.password)
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForURL(/\/admin(?!\/login)/)
    await page.goto(`/admin/collections/essays/${id}`)
    const actions = page.getByRole('region', { name: 'Ações editoriais' })
    await expect(actions.getByTestId('editorial-status')).toContainText('Rascunho')
    await expect(page.getByText('Não inclua dados pessoais de pacientes')).toBeVisible()
    // Sem botão "Publicar" genérico: só as ações do fluxo.
    await expect(page.getByRole('button', { name: /^Publicar/ })).toHaveCount(0)
    await actions.getByRole('button', { name: 'Enviar para revisão' }).click()
    await expect(actions.getByTestId('editorial-status')).toContainText('Em revisão', {
      timeout: 30_000,
    })
    await expect(actions.getByRole('button', { name: 'Devolver com comentários' })).toBeVisible()
    await actions.getByRole('button', { name: 'Devolver com comentários' }).click()
    await expect(actions.getByRole('alert')).toContainText('comentário de revisão')
  })
})

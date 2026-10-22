import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { cleanupE2EContent, cleanupE2EUsers, editorUser, seedEditorUser } from '../helpers/users'
import {
  apiLogin,
  DGP_URL,
  expectNoHorizontalOverflow,
  expectNoInstitutionalLogos,
  expectNoSeriousA11yViolations,
  GROUP_NAME,
  PUBLIC_ROUTES,
} from './helpers'

/**
 * S03 — portal do grupo: navegação, acessibilidade (axe), identidade sem logotipos, linhas do
 * DGP como referência histórica, ausência do laboratório (Q6), sitemap, rascunhos, 301 e
 * edição pelo editor refletida sem deploy.
 */
const run = `e2e-${randomUUID().slice(0, 6)}`

test.describe('Portal do grupo (S03) — rotas públicas', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route}: 200, h1, sem logotipos, sem laboratório e sem violações axe (desktop)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      const response = await page.goto(route)
      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.locator('main')).not.toContainText(/laborat[óo]rio/i)
      await expect(page.locator('body')).not.toContainText(/laborat[óo]rio/i)
      await expectNoInstitutionalLogos(page)
      await expectNoSeriousA11yViolations(page)
    })
  }

  test('não existe rota de laboratório (Q6)', async ({ request }) => {
    for (const path of ['/laboratorio', '/o-grupo/laboratorio', '/linhas/laboratorio']) {
      expect((await request.get(path)).status()).toBe(404)
    }
  })
})

test.describe('Celular (360 px)', () => {
  test.use({ viewport: { width: 360, height: 740 } })

  for (const route of PUBLIC_ROUTES) {
    test(`${route}: sem rolagem horizontal e sem violações axe`, async ({ page }) => {
      await page.goto(route)
      await expectNoHorizontalOverflow(page)
      await expectNoSeriousA11yViolations(page)
    })
  }
})

test.describe('Navegação e conteúdo', () => {
  test('roteiro: Início → O grupo → Histórico → Objetivos → Referências → Linhas → uma linha', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(GROUP_NAME)

    const menu = page.getByRole('navigation', { name: 'Menu principal' })
    await menu.getByRole('link', { name: 'O grupo' }).click()
    await expect(page).toHaveURL(/\/o-grupo$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('O grupo')

    const sections = page.getByRole('navigation', { name: 'Seções de O grupo' })
    await sections.getByRole('link', { name: 'Histórico' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Histórico')
    await expect(sections.getByRole('link', { name: 'Histórico' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await sections.getByRole('link', { name: 'Objetivos' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Objetivos')
    await sections.getByRole('link', { name: 'Referências institucionais' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Referências institucionais')

    await menu.getByRole('link', { name: 'Linhas temáticas' }).click()
    await expect(page).toHaveURL(/\/linhas$/)
    await page.getByRole('link', { name: 'Bioética', exact: true }).first().click()
    await expect(page).toHaveURL(/\/linhas\/bioetica$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bioética')
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Promoção da Saúde', exact: true }),
    ).toBeVisible()
  })

  test('as 2 linhas temáticas estão em /linhas e na página inicial', async ({ page }) => {
    await page.goto('/linhas')
    const lines = page.getByTestId('research-lines')
    await expect(lines.getByRole('heading', { level: 2 })).toHaveText([
      'Bioética',
      'Promoção da Saúde',
    ])
    await page.goto('/')
    await expect(page.getByTestId('research-lines').getByRole('link')).toHaveText([
      'Bioética',
      'Promoção da Saúde',
    ])
  })

  test('histórico lista as 4 linhas do DGP como referência, com fonte e data, sem páginas nem extinção', async ({
    page,
    request,
  }) => {
    await page.goto('/o-grupo/historico')
    const dgp = page.getByTestId('dgp-lines')
    await expect(dgp.locator('li')).toHaveCount(4)
    await expect(dgp).toContainText('Bioética e o processo de envelhecimento')
    await expect(dgp).toContainText(
      'Tecnologias na promoção da saúde no processo de envelhecimento',
    )
    await expect(dgp.getByText(/Fonte: .*coletado em 19\/10\/2026/)).toHaveCount(4)
    await expect(dgp.locator('a')).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText(/extint|encerrad|desativad|descontinuad/i)
    // Sem páginas próprias para as linhas do DGP.
    expect((await request.get('/linhas/bioetica-e-o-processo-de-envelhecimento')).status()).toBe(
      404,
    )
  })

  test('referências institucionais e rodapé: somente texto e links, sem imagens', async ({
    page,
  }) => {
    await page.goto('/o-grupo/referencias-institucionais')
    const references = page.getByRole('main').getByTestId('institutional-references')
    await expect(references.locator('li')).toHaveCount(4)
    await expect(references.locator('img, svg, picture, object, embed')).toHaveCount(0)
    await expect(references.getByRole('link').first()).toBeVisible()

    const footer = page.getByRole('contentinfo')
    await expect(footer.getByTestId('institutional-references').getByRole('link')).toHaveCount(3)
    await expect(footer.locator('img, svg, picture')).toHaveCount(0)
    await expectNoInstitutionalLogos(page)
  })

  test('link para o espelho do grupo no DGP aponta para o endereço oficial', async ({ page }) => {
    await page.goto('/o-grupo')
    const link = page.getByTestId('dgp-link')
    await expect(link).toHaveAttribute('href', DGP_URL)
    await expect(link).toHaveAttribute('rel', /noopener/)
  })

  test('página inicial publica JSON-LD do grupo sem vínculo institucional oficial', async ({
    page,
  }) => {
    await page.goto('/')
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
    const data = JSON.parse(raw ?? '{}') as Record<string, unknown>
    expect(data['@type']).toBe('ResearchOrganization')
    expect(data.name).toBe(GROUP_NAME)
    expect(data).not.toHaveProperty('parentOrganization')
    expect(data).not.toHaveProperty('memberOf')
  })

  test('SEO: título, descrição, canônica e noindex fora da produção; robots e sitemap', async ({
    page,
    request,
  }) => {
    await page.goto('/o-grupo/historico')
    await expect(page).toHaveTitle('Histórico · Bioética e Promoção da Saúde')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/o-grupo\/historico$/,
    )
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)

    const robots = await request.get('/robots.txt')
    expect(await robots.text()).toContain('Disallow: /')
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    const xml = await sitemap.text()
    expect(xml).toContain('/linhas/bioetica</loc>')
    expect(xml).toContain('/o-grupo/historico</loc>')
  })
})

test.describe.serial('Edição pelo coordenador (editor)', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    await seedEditorUser()
    token = await apiLogin(request, editorUser)
  })

  test.afterAll(async () => {
    await cleanupE2EContent(run)
    await cleanupE2EUsers()
  })

  test('alteração da apresentação publicada aparece no site sem deploy', async ({
    page,
    request,
  }) => {
    const headers = { Authorization: `JWT ${token}` }
    const current = await request.get('/api/globals/group-profile', { headers })
    const original = ((await current.json()) as { summary: string }).summary
    const updated = `Frase de propósito alterada no painel ${run}.`

    try {
      const save = await request.post('/api/globals/group-profile', {
        headers,
        data: { summary: updated, _status: 'published' },
      })
      expect(save.status(), await save.text()).toBe(200)

      await page.goto('/')
      await expect(page.getByText(updated).first()).toBeVisible()
      await page.goto('/o-grupo')
      await expect(page.getByText(updated).first()).toBeVisible()
    } finally {
      await request.post('/api/globals/group-profile', {
        headers,
        data: { summary: original, _status: 'published' },
      })
    }
    await page.goto('/')
    await expect(page.getByText(original).first()).toBeVisible()
  })

  test('alterar o slug de uma linha publicada responde 301 no endereço antigo', async ({
    request,
  }) => {
    const headers = { Authorization: `JWT ${token}` }
    const created = await request.post('/api/research-lines', {
      headers,
      data: {
        name: `Linha ${run}`,
        slug: `${run}-antiga`,
        summary: 'Linha fictícia criada pelo teste.',
        order: 90,
        active: true,
        _status: 'published',
      },
    })
    expect(created.status(), await created.text()).toBe(201)
    const id = ((await created.json()) as { doc: { id: number } }).doc.id
    expect((await request.get(`/linhas/${run}-antiga`)).status()).toBe(200)

    const renamed = await request.patch(`/api/research-lines/${id}`, {
      headers,
      data: { slug: `${run}-nova`, _status: 'published' },
    })
    expect(renamed.status(), await renamed.text()).toBe(200)

    const old = await request.get(`/linhas/${run}-antiga`, { maxRedirects: 0 })
    expect(old.status()).toBe(301)
    expect(old.headers().location).toMatch(new RegExp(`/linhas/${run}-nova$`))
    expect((await request.get(`/linhas/${run}-nova`)).status()).toBe(200)

    // Exclusão pela API do site: os hooks revalidam o cache (lista de linhas, home).
    expect((await request.delete(`/api/research-lines/${id}`, { headers })).status()).toBe(200)
    expect((await request.get(`/linhas/${run}-nova`)).status()).toBe(404)
  })

  test('rascunho de página não aparece no site, no sitemap nem na API pública; pré-visualização mostra', async ({
    page,
    request,
    browser,
  }) => {
    const headers = { Authorization: `JWT ${token}` }
    const title = `Página em rascunho ${run}`
    const draft = await request.post('/api/pages?draft=true', {
      headers,
      data: { title, slug: `${run}-rascunho`, summary: 'Rascunho fictício.', _status: 'draft' },
    })
    expect(draft.status(), await draft.text()).toBe(201)

    expect((await request.get(`/o-grupo/${run}-rascunho`)).status()).toBe(404)
    expect(await (await request.get('/sitemap.xml')).text()).not.toContain(`${run}-rascunho`)
    for (const path of [
      '/api/pages?draft=true',
      '/api/pages',
      '/api/pages?where[_status][equals]=draft',
    ]) {
      expect(await (await request.get(path)).text()).not.toContain(title)
    }

    // Pré-visualização: somente com a sessão do painel (cookie) de admin/editor.
    const anonymous = await browser.newContext()
    const denied = await anonymous.request.get(`/next/preview?path=/o-grupo/${run}-rascunho`, {
      maxRedirects: 0,
    })
    expect(denied.status()).toBe(403)
    await anonymous.close()

    await page.goto('/admin/login')
    await page.locator('#field-email').fill(editorUser.email)
    await page.locator('#field-password').fill(editorUser.password)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/admin\/?$/)
    await page.goto(`/next/preview?path=${encodeURIComponent(`/o-grupo/${run}-rascunho`)}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(page.getByRole('status')).toContainText('Pré-visualização')
    await page.getByRole('link', { name: 'Sair da pré-visualização' }).click()
    await expect(page).toHaveURL(/\/$/)
    expect((await page.request.get(`/o-grupo/${run}-rascunho`)).status()).toBe(404)
  })

  test('editor encontra o perfil do grupo e as linhas no painel', async ({ page }) => {
    await page.goto('/admin/login')
    await page.locator('#field-email').fill(editorUser.email)
    await page.locator('#field-password').fill(editorUser.password)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/admin\/?$/)
    await page.goto('/admin/globals/group-profile')
    await expect(page.locator('#field-officialName')).toHaveValue(GROUP_NAME)
    await page.goto('/admin/collections/research-lines')
    await expect(page.getByRole('link', { name: 'Bioética' }).first()).toBeVisible()
  })
})

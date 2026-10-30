import { expect, type APIRequestContext, test } from '@playwright/test'

import { TINY_PNG } from '../helpers/files'
import { cleanupE2EUsers, editorUser, seedEditorUser } from '../helpers/users'
import { apiLogin, expectNoHorizontalOverflow, expectNoSeriousA11yViolations } from './helpers'

/**
 * S04 — integrantes, vínculos e consentimentos (dados FICTÍCIOS do `seed:people`):
 * diretório com filtros na URL, perfil com linha do tempo, visibilidade por consentimento
 * individual (inclusive revogação sem deploy), foto/e-mail por escopo, páginas de linha e
 * de "O grupo", sitemap, JSON-LD e painel do editor.
 */
const AUTHORIZED_CURRENT = [
  'Helena Exemplar Fictícia',
  'Marina Fictícia Duarte',
  'Laura Amostra Colaboradora',
]
const FORMER = 'Rafael Demonstração Antigo'
const NO_CONSENT = {
  name: 'Sofia Ilustrativa Sem Autorização',
  slug: 'sofia-ilustrativa-sem-autorizacao',
}
const REVOKED = { name: 'Tiago Hipotético Revogado', slug: 'tiago-hipotetico-revogado' }

const cards = (page: import('@playwright/test').Page) => page.getByTestId('person-card')

async function personId(request: APIRequestContext, headers: Record<string, string>, slug: string) {
  const response = await request.get(`/api/people?where[slug][equals]=${slug}&depth=0`, { headers })
  const json = (await response.json()) as { docs: { id: number }[] }
  return json.docs[0]!.id
}

test.describe('Diretório /integrantes', () => {
  test('padrão: só integrantes atuais autorizados; sem autorização, revogados e ex-integrantes fora', async ({
    page,
  }) => {
    await page.goto('/integrantes')
    for (const name of AUTHORIZED_CURRENT)
      await expect(cards(page).filter({ hasText: name })).toHaveCount(1)
    for (const name of [FORMER, NO_CONSENT.name, REVOKED.name]) {
      await expect(page.locator('main')).not.toContainText(name)
    }
    await expect(page.getByTestId('results-count')).toContainText('3 integrantes')
  })

  test('filtros por papel, linha e situação ficam na URL e sobrevivem ao recarregar', async ({
    page,
  }) => {
    await page.goto('/integrantes')
    await page.getByLabel('Papel no grupo').selectOption('pesquisador')
    await page.getByLabel('Linha temática').selectOption('bioetica')
    await page.getByRole('button', { name: 'Filtrar' }).click()
    await expect(page).toHaveURL(/papel=pesquisador/)
    await expect(page).toHaveURL(/linha=bioetica/)
    await expect(cards(page)).toHaveCount(1)
    await expect(cards(page).first()).toContainText('Marina Fictícia Duarte')

    const url = page.url()
    await page.goto(url)
    await expect(cards(page)).toHaveCount(1)
    await expect(page.getByLabel('Papel no grupo')).toHaveValue('pesquisador')
    await expectNoSeriousA11yViolations(page)

    await page.goto('/integrantes?linha=promocao-da-saude')
    await expect(cards(page)).toHaveCount(2)
    await expect(page.locator('main')).not.toContainText('Marina Fictícia Duarte')

    await page.goto('/integrantes?papel=tecnico')
    await expect(page.getByRole('heading', { name: 'Nenhum integrante encontrado' })).toBeVisible()
    await page.getByRole('main').getByRole('link', { name: 'Limpar filtros' }).last().click()
    await expect(page).toHaveURL(/\/integrantes$/)
    await expect(cards(page)).toHaveCount(3)
  })

  test('ex-integrante autorizado aparece apenas no filtro "ex-integrantes"', async ({ page }) => {
    await page.goto('/integrantes?situacao=ex-integrantes')
    await expect(cards(page)).toHaveCount(1)
    await expect(cards(page).first()).toContainText(FORMER)
    await expect(cards(page).first()).toContainText('Ex-integrante')
  })

  test('celular: filtros e cartões sem rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/integrantes?situacao=ex-integrantes&papel=estudante')
    await expect(cards(page)).toHaveCount(1)
    await expectNoHorizontalOverflow(page)
    await expectNoSeriousA11yViolations(page)
  })
})

test.describe('Perfil /integrantes/[slug]', () => {
  test('mestrado encerrado + pesquisadora ativa: papel atual e linha do tempo corretos', async ({
    page,
  }) => {
    await page.goto('/integrantes/marina-ficticia-duarte')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Marina Fictícia Duarte')
    await expect(page.getByTestId('current-role')).toHaveText('Pesquisador(a)')
    const items = page.getByTestId('timeline').locator('li')
    await expect(items).toHaveCount(2)
    await expect(items.nth(0)).toContainText('2023–atual')
    await expect(items.nth(0)).toContainText('Pesquisador(a)')
    await expect(items.nth(1)).toContainText('2021–2023')
    await expect(items.nth(1)).toContainText('Estudante de mestrado')
    // Sem escopo "email": nenhum e-mail.
    await expect(page.getByTestId('public-email')).toHaveCount(0)
  })

  test('e-mail com escopo "email"; JSON-LD Person com sameAs; nenhum campo de consentimento', async ({
    page,
  }) => {
    const response = await page.goto('/integrantes/helena-exemplar-ficticia')
    const html = (await response?.text()) ?? ''
    await expect(page.getByTestId('public-email')).toHaveText('helena.exemplar@example.com')
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
    const person = jsonLd
      .map((text) => JSON.parse(text))
      .flat()
      .find((item) => item['@type'] === 'Person')
    expect(person?.sameAs).toEqual(
      expect.arrayContaining([
        'https://orcid.org/0000-0000-0000-001X',
        'http://lattes.cnpq.br/0000000000000001',
      ]),
    )
    expect(JSON.stringify(person)).not.toMatch(/email/i)
    expect(html).not.toMatch(/consentPublicProfile|consentStatus|consent-records/)
  })

  test('pessoa sem consentimento ou com consentimento revogado não tem página, API nem sitemap', async ({
    page,
    request,
  }) => {
    for (const person of [NO_CONSENT, REVOKED]) {
      expect((await request.get(`/integrantes/${person.slug}`)).status()).toBe(404)
      const api = await request.get(`/api/people?where[slug][equals]=${person.slug}`)
      expect(((await api.json()) as { docs: unknown[] }).docs).toEqual([])
    }
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain('/integrantes/marina-ficticia-duarte')
    expect(sitemap).toContain('/integrantes/rafael-demonstracao-antigo')
    expect(sitemap).not.toContain(NO_CONSENT.slug)
    expect(sitemap).not.toContain(REVOKED.slug)
    expect((await request.get('/api/consent-records')).status()).toBe(403)
    await page.goto('/linhas/promocao-da-saude')
    await expect(page.locator('main')).not.toContainText(NO_CONSENT.name)
  })

  test('slugs reservados de /integrantes respondem 404', async ({ request }) => {
    for (const slug of ['orientacoes', 'egressos']) {
      expect((await request.get(`/integrantes/${slug}`)).status()).toBe(404)
    }
  })
})

test.describe('Integração com as páginas da S03', () => {
  test('página da linha lista só integrantes atuais autorizados; "O grupo" lista a líder', async ({
    page,
  }) => {
    await page.goto('/linhas/promocao-da-saude')
    const members = page.getByTestId('line-members')
    await expect(members.getByTestId('person-card')).toHaveCount(2)
    await expect(members).toContainText('Helena Exemplar Fictícia')
    await expect(members).toContainText('Laura Amostra Colaboradora')
    await expect(members).not.toContainText(FORMER)

    await page.goto('/o-grupo')
    await expect(page.getByTestId('group-leaders')).toContainText('Helena Exemplar Fictícia')
    await page.getByRole('link', { name: 'Conheça os integrantes do grupo' }).click()
    await expect(page).toHaveURL(/\/integrantes$/)
  })

  test('menu principal e página inicial levam aos integrantes', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('navigation', { name: 'Menu principal' })
      .getByRole('link', { name: 'Integrantes' })
      .click()
    await expect(page).toHaveURL(/\/integrantes$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Integrantes')
  })
})

test.describe.serial('Consentimento pelo coordenador (editor)', () => {
  let token: string
  let headers: Record<string, string>

  test.beforeAll(async ({ request }) => {
    await seedEditorUser()
    token = await apiLogin(request, editorUser)
    headers = { Authorization: `JWT ${token}` }
  })

  test.afterAll(async () => {
    await cleanupE2EUsers()
  })

  test('registrar "perfil público" publica sem deploy; revogar retira imediatamente', async ({
    page,
    request,
  }) => {
    const id = await personId(request, headers, NO_CONSENT.slug)
    const granted = await request.post('/api/consent-records', {
      headers,
      data: {
        person: id,
        scopes: ['public_profile'],
        grantedAt: '2026-10-29T00:00:00.000Z',
        method: 'digital_form',
        collectedBy: 'Coordenação (fictício, E2E)',
      },
    })
    expect(granted.status(), await granted.text()).toBe(201)
    const consentId = ((await granted.json()) as { doc: { id: number } }).doc.id

    try {
      await page.goto(`/integrantes/${NO_CONSENT.slug}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(NO_CONSENT.name)
      await page.goto('/integrantes')
      await expect(cards(page).filter({ hasText: NO_CONSENT.name })).toHaveCount(1)
    } finally {
      const revoked = await request.patch(`/api/consent-records/${consentId}`, {
        headers,
        data: { revokedAt: '2026-10-30T00:00:00.000Z' },
      })
      expect(revoked.status(), await revoked.text()).toBe(200)
    }

    expect((await page.request.get(`/integrantes/${NO_CONSENT.slug}`)).status()).toBe(404)
    await page.goto('/integrantes')
    await expect(page.locator('main')).not.toContainText(NO_CONSENT.name)
    const sitemap = await (await page.request.get('/sitemap.xml')).text()
    expect(sitemap).not.toContain(NO_CONSENT.slug)
  })

  test('foto só com escopo "photo" e mídia vinculada; revogar retira a imagem e o arquivo', async ({
    page,
    request,
  }) => {
    const slug = 'laura-amostra-colaboradora'
    const id = await personId(request, headers, slug)
    const consent = await request.post('/api/consent-records', {
      headers,
      data: {
        person: id,
        scopes: ['photo'],
        grantedAt: '2026-10-29T00:00:00.000Z',
        method: 'signed_form',
        collectedBy: 'Coordenação (fictício, E2E)',
      },
    })
    expect(consent.status(), await consent.text()).toBe(201)
    const consentId = ((await consent.json()) as { doc: { id: number } }).doc.id

    const upload = await request.post('/api/media', {
      headers,
      multipart: {
        _payload: JSON.stringify({
          alt: 'Retrato fictício de Laura (E2E)',
          credit: 'Fictício',
          license: 'group-authorized',
          source: 'group-archive',
          containsIdentifiablePeople: true,
          consentRecord: consentId,
        }),
        file: { name: 'retrato.png', mimeType: 'image/png', buffer: Buffer.from(TINY_PNG) },
      },
    })
    expect(upload.status(), await upload.text()).toBe(201)
    const media = ((await upload.json()) as { doc: { id: number; url: string } }).doc

    try {
      const linked = await request.patch(`/api/people/${id}`, {
        headers,
        data: { photo: media.id },
      })
      expect(linked.status(), await linked.text()).toBe(200)

      await page.goto(`/integrantes/${slug}`)
      const photo = page.getByTestId('person-photo')
      await expect(photo).toHaveAttribute('alt', 'Retrato fictício de Laura (E2E)')
      const src = (await photo.getAttribute('src')) ?? ''
      expect((await page.request.get(src)).status()).toBe(200)

      const revoked = await request.patch(`/api/consent-records/${consentId}`, {
        headers,
        data: { revokedAt: '2026-10-30T00:00:00.000Z' },
      })
      expect(revoked.status(), await revoked.text()).toBe(200)

      await page.goto(`/integrantes/${slug}`)
      await expect(page.getByTestId('person-photo')).toHaveCount(0)
      expect((await page.request.get(src)).status()).toBeGreaterThanOrEqual(400)
    } finally {
      await request.patch(`/api/people/${id}`, { headers, data: { photo: null } })
      await request.delete(`/api/media/${media.id}`, { headers })
    }
  })

  test('editor encontra pessoas, vínculos e consentimentos no painel', async ({ page }) => {
    await page.goto('/admin/login')
    await page.locator('#field-email').fill(editorUser.email)
    await page.locator('#field-password').fill(editorUser.password)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/admin\/?$/)
    await page.goto('/admin/collections/people')
    await page.getByRole('link', { name: 'Marina Fictícia Duarte' }).first().click()
    await expect(page.locator('#field-fullName')).toHaveValue('Marina Fictícia Duarte')
    await expect(page.getByText('Situação de consentimento (calculada)')).toBeVisible()
    await page.goto('/admin/collections/memberships')
    await expect(page.getByText(/Marina Fictícia Duarte - Pesquisador\(a\)/).first()).toBeVisible()
    await page.goto('/admin/collections/consent-records')
    await expect(page.getByText(/Helena Exemplar Fictícia - Perfil público/).first()).toBeVisible()
  })
})

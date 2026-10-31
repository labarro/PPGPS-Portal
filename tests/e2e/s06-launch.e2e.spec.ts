import { expect, test } from '@playwright/test'

import {
  expectNoInstitutionalLogos,
  expectNoSeriousA11yViolations,
  GROUP_NAME,
  LEGAL_ROUTES,
  PUBLIC_ROUTES,
} from './helpers'

/**
 * S06 — lançamento do M1: páginas legais, nota de responsabilidade, verificação de marca em
 * todas as rotas e teste GLOBAL de vazamento (critérios de aceite 2 e 3 da ficha).
 * Dados: seeds fictícios (seed:content, seed:people, seed:essays).
 */

/** Únicos e-mails que podem aparecer publicamente (titular com escopo `email`). */
const ALLOWED_EMAILS = new Set(['helena.exemplar@example.com'])

/** Conteúdo que nunca pode sair em resposta pública. */
const FORBIDDEN = [
  // Pessoa com autorização revogada e pessoa sem autorização (perfil/biografia/slug).
  'Tiago Hipotético Revogado',
  'tiago-hipotetico-revogado',
  'sofia-ilustrativa-sem-autorizacao',
  'nunca deve aparecer no site',
  // Consentimentos, auditoria, fluxo editorial interno e credenciais.
  'consentStatus',
  'consentPublicProfile',
  'consentPhoto',
  'consentEmail',
  'consentRecord',
  'evidenceDocument',
  'diffSummary',
  'reviewHistory',
  'internalNotes',
  'approvedBy',
  'submittedBy',
  'resetPasswordToken',
  '"hash"',
  '"salt"',
  // Rascunho e agendado (fictícios).
  'Rascunho fictício em preparação',
  'Ensaio fictício agendado para o futuro',
]

const FEEDS_AND_FILES = ['/sitemap.xml', '/robots.txt', '/blog/rss.xml', '/blog/atom.xml']

/** API REST pública (somente leitura) com profundidade, como um visitante curioso faria. */
const PUBLIC_API = [
  '/api/people?limit=100&depth=2',
  '/api/memberships?limit=100&depth=2',
  '/api/essays?limit=100&depth=2',
  '/api/essays?limit=100&depth=2&draft=true',
  '/api/pages?limit=100&depth=2',
  '/api/research-lines?limit=100&depth=2',
  '/api/categories?limit=100',
  '/api/tags?limit=100',
  '/api/media?limit=100',
  // Documentos: somente os de visibilidade pública (acesso filtra os demais).
  '/api/documents?limit=100',
  '/api/globals/group-profile?depth=2',
  '/api/globals/homepage?depth=2',
  '/api/globals/navigation',
  '/api/globals/footer',
  '/api/globals/site-settings',
]

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

function findLeaks(body: string): string[] {
  const leaks = FORBIDDEN.filter((needle) => body.includes(needle))
  for (const email of body.match(EMAIL_PATTERN) ?? []) {
    // Ignora artefatos de bundle (ex.: "@2x.png" e pacotes "@scope/pkg").
    if (/\.(png|jpe?g|webp|svg|js|css)$/i.test(email)) continue
    if (!ALLOWED_EMAILS.has(email.toLowerCase())) leaks.push(`e-mail: ${email}`)
  }
  return leaks
}

test.describe('S06 — páginas legais', () => {
  for (const route of LEGAL_ROUTES) {
    test(`${route}: 200, h1, link no rodapé, sem logotipos e sem violações axe`, async ({
      page,
    }) => {
      const response = await page.goto(route)
      expect(response?.status()).toBe(200)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator(`footer a[href="${route}"]`)).toHaveCount(1)
      await expectNoInstitutionalLogos(page)
      await expectNoSeriousA11yViolations(page)
    })
  }

  test('privacidade: canal do titular e direitos, sem e-mail pessoal', async ({ page }) => {
    await page.goto('/privacidade')
    await expect(page.getByRole('heading', { name: 'Seus direitos' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'Contato' })).toHaveAttribute(
      'href',
      '/o-grupo/contato',
    )
    const text = (await page.locator('main').textContent()) ?? ''
    expect(text).toContain('transferência internacional')
    expect(text.match(EMAIL_PATTERN) ?? []).toEqual([])
  })

  test('/sobre-o-portal exibe a nota de responsabilidade do grupo e o link do programa', async ({
    page,
  }) => {
    await page.goto('/sobre-o-portal')
    const note = page.getByTestId('responsibility-note')
    await expect(note).toBeVisible()
    await expect(note).toContainText(GROUP_NAME)
    await expect(note).toContainText('responde pelo seu conteúdo')
    await expect(note.getByRole('link', { name: /Programa de Pós-Graduação/ })).toHaveAttribute(
      'href',
      /^https:\/\//,
    )
    // Discreto: sem aviso ostensivo de portal não oficial nas demais páginas (Q1).
    await page.goto('/')
    await expect(page.getByTestId('responsibility-note')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText(/não oficial/i)
  })

  test('páginas legais estão no sitemap e fora da navegação de "O grupo"', async ({
    page,
    request,
  }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    for (const route of LEGAL_ROUTES) expect(sitemap).toContain(`${route}</loc>`)
    expect(sitemap).not.toContain('/o-grupo/privacidade')
    await page.goto('/o-grupo')
    await expect(page.locator('main a[href="/o-grupo/privacidade"]')).toHaveCount(0)
    expect((await request.get('/o-grupo/privacidade')).status()).toBe(404)
  })
})

test.describe('S06 — vazamento global e marca', () => {
  test('nenhuma rota pública expõe e-mail privado, consentimento, auditoria, rascunho ou pessoa sem consentimento', async ({
    request,
  }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const fromSitemap = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => new URL(match[1] ?? '/').pathname,
    )
    const routes = [
      ...new Set([
        ...PUBLIC_ROUTES,
        ...LEGAL_ROUTES,
        ...fromSitemap,
        ...FEEDS_AND_FILES,
        ...PUBLIC_API,
      ]),
    ]
    expect(routes.length).toBeGreaterThan(30)

    const problems: string[] = []
    for (const route of routes) {
      const response = await request.get(route)
      const status = response.status()
      if (status >= 500) problems.push(`${route}: HTTP ${status}`)
      const leaks = findLeaks(await response.text())
      if (leaks.length > 0) problems.push(`${route}: ${leaks.join(', ')}`)
    }
    expect(problems).toEqual([])
  })

  test('APIs administrativas negadas ao visitante', async ({ request }) => {
    for (const path of [
      '/api/users',
      '/api/audit-logs',
      '/api/consent-records',
      '/api/redirects',
      '/api/payload-jobs',
      '/api/people/versions',
    ]) {
      const response = await request.get(path)
      expect([401, 403, 404], path).toContain(response.status())
      expect(findLeaks(await response.text()), path).toEqual([])
    }
  })

  test('nenhum logotipo institucional em todas as rotas públicas (inclusive legais)', async ({
    page,
  }) => {
    for (const route of [...PUBLIC_ROUTES, ...LEGAL_ROUTES]) {
      await page.goto(route)
      await expectNoInstitutionalLogos(page)
    }
  })
})

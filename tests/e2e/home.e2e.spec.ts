import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('Página pública provisória', () => {
  test('carrega em pt-BR com cabeçalhos de segurança e noindex', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)

    const headers = response?.headers() ?? {}
    expect(headers['x-robots-tag']).toContain('noindex')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['strict-transport-security']).toContain('max-age=')
    expect(headers['content-security-policy']).toContain("frame-ancestors 'self'")
    expect(headers['x-powered-by']).toBeUndefined()

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bioética e Promoção da Saúde')
    await expect(page.getByText('portal não oficial', { exact: false })).toBeVisible()
  })

  test('não tem violações de acessibilidade sérias ou críticas (axe)', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
  })
})

test.describe('API', () => {
  test('GraphQL e playground desabilitados (404)', async ({ request }) => {
    expect((await request.get('/api/graphql')).status()).toBe(404)
    expect(
      (await request.post('/api/graphql', { data: { query: '{ __typename }' } })).status(),
    ).toBe(404)
    expect((await request.get('/api/graphql-playground')).status()).toBe(404)
  })
})

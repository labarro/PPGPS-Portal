import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

import { strongTestPassword } from '../helpers/test-env'

const GROUP_NAME = 'Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar'
const SHORT_NAME = 'Bioética e Promoção da Saúde'

async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
}

/** Nenhuma marca institucional: sem imagens/SVG de logotipo e sem referências a arquivos de marca. */
async function expectNoInstitutionalLogos(page: Page) {
  const offenders = await page.evaluate(() => {
    const pattern = /unicesumar|ppgps|cnpq|logo/i
    const found: string[] = []
    for (const img of Array.from(
      document.querySelectorAll('img, image, picture source, object, embed'),
    )) {
      const attrs = ['src', 'srcset', 'href', 'data', 'alt']
        .map((a) => img.getAttribute(a) ?? '')
        .join(' ')
      if (pattern.test(attrs)) found.push(`${img.tagName}: ${attrs}`)
    }
    for (const svg of Array.from(document.querySelectorAll('svg title, svg [aria-label]'))) {
      const text = `${svg.textContent ?? ''} ${svg.getAttribute('aria-label') ?? ''}`
      if (pattern.test(text)) found.push(`SVG: ${text}`)
    }
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('header *, footer *'))) {
      const bg = getComputedStyle(el).backgroundImage
      if (bg && bg !== 'none' && /url\(/.test(bg)) found.push(`background: ${bg}`)
    }
    return found
  })
  expect(offenders).toEqual([])
  // Cabeçalho e rodapé não têm nenhuma imagem: a marca é o nome em texto (wordmark).
  await expect(page.locator('header img, header svg title, footer img')).toHaveCount(0)
}

test.describe('Layout público (S02)', () => {
  test('carrega em pt-BR com cabeçalhos de segurança, CSP report-only e noindex', async ({
    page,
  }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)

    const headers = response?.headers() ?? {}
    expect(headers['x-robots-tag']).toContain('noindex')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['strict-transport-security']).toContain('max-age=')
    expect(headers['content-security-policy']).toContain("frame-ancestors 'self'")
    expect(headers['content-security-policy-report-only']).toContain("default-src 'self'")
    expect(headers['x-powered-by']).toBeUndefined()

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  })

  test('identifica o grupo no cabeçalho e na página, sem aviso ostensivo de portal não oficial', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    const header = page.getByRole('banner')
    await expect(header.getByTestId('wordmark')).toContainText(GROUP_NAME)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(GROUP_NAME)
    await expect(page.getByRole('contentinfo')).toContainText(GROUP_NAME)
    await expect(page.getByText(/portal não oficial/i)).toHaveCount(0)
  })

  test('não exibe logotipos institucionais', async ({ page }) => {
    await page.goto('/')
    await expectNoInstitutionalLogos(page)
  })

  test('"Pular para o conteúdo" é o primeiro foco e leva ao conteúdo principal', async ({
    page,
  }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#conteudo')).toBeFocused()
  })

  test('foco visível (contorno ≥ 2 px) nos links', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      const style = getComputedStyle(el)
      return { width: parseFloat(style.outlineWidth), style: style.outlineStyle }
    })
    expect(outline.style).not.toBe('none')
    expect(outline.width).toBeGreaterThanOrEqual(2)
  })

  test('sem violações sérias ou críticas de acessibilidade (axe) — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    await expectNoSeriousA11yViolations(page)
  })
})

test.describe('Celular (320 px)', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test('sem rolagem horizontal; nome curto no cabeçalho', async ({ page }) => {
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    await expect(page.getByTestId('wordmark')).toContainText(SHORT_NAME)
    await expect(page.getByTestId('wordmark')).toHaveAccessibleName(new RegExp(GROUP_NAME))
  })

  test('menu móvel abre pelo teclado, prende o foco e fecha com Esc devolvendo o foco', async ({
    page,
  }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Abrir menu' })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Menu' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Início' })).toBeVisible()

    // Foco preso no painel.
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    }

    await expectNoSeriousA11yViolations(page)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('botão "Fechar menu" fecha o painel', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('button', { name: 'Fechar menu' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('sem violações sérias ou críticas de acessibilidade (axe) — celular', async ({ page }) => {
    await page.goto('/')
    await expectNoSeriousA11yViolations(page)
  })
})

test.describe('Página não encontrada', () => {
  test('404 com layout do site, trilha de navegação e caminho de volta', async ({ page }) => {
    const response = await page.goto('/pagina-que-nao-existe')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada')
    const breadcrumbs = page.getByRole('navigation', { name: 'Trilha de navegação' })
    await expect(breadcrumbs.getByRole('link', { name: 'Início' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Voltar à página inicial' })).toBeVisible()
    await expectNoSeriousA11yViolations(page)
    await expectNoInstitutionalLogos(page)
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

  test('visitante anônimo não acessa usuários, auditoria nem escrita', async ({ request }) => {
    expect((await request.get('/api/users')).status()).toBe(403)
    expect((await request.get('/api/audit-logs')).status()).toBe(403)
    expect(
      (
        await request.post('/api/users', {
          data: { email: 'x@example.com', password: strongTestPassword() },
        })
      ).status(),
    ).toBe(403)
  })
})

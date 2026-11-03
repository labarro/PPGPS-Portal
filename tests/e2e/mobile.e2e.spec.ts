import { expect, type Page, test } from '@playwright/test'

import { expectNoHorizontalOverflow, expectNoSeriousA11yViolations } from './helpers'

/**
 * Revisão mobile-first pós-lançamento (S06): larguras de celular reais, tablet e desktop.
 * Garante: sem rolagem horizontal, alvos de toque >= 24 px (WCAG 2.5.8; links dentro de
 * parágrafos são isentos), hierarquia de títulos coerente e menu utilizável.
 */
const PHONE_WIDTHS = [320, 375, 390, 430] as const

const ROUTES = [
  '/',
  '/o-grupo',
  '/linhas',
  '/linhas/bioetica',
  '/integrantes',
  '/integrantes/helena-exemplar-ficticia',
  '/blog',
  '/blog/ensaio-ficticio-autonomia-e-cuidado',
  '/blog/tag/autonomia',
  '/o-grupo/contato',
  '/privacidade',
] as const

async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = []
    for (const el of document.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, summary',
    )) {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      const style = getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none') continue
      if (el.closest('.sr-only, [aria-hidden="true"]')) continue
      // Exceção "em linha" da WCAG 2.5.8: links dentro de frases.
      if (el.tagName === 'A' && el.closest('p, .prose-portal')) continue
      if (rect.width < 24 || rect.height < 24) {
        found.push(
          `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 40)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`,
        )
      }
    }
    return found
  })
}

for (const width of PHONE_WIDTHS) {
  test.describe(`Celular ${width} px`, () => {
    test.use({ viewport: { width, height: 800 }, hasTouch: true })

    test('rotas sem rolagem horizontal e com alvos de toque >= 24 px', async ({ page }) => {
      const problems: string[] = []
      for (const route of ROUTES) {
        await page.goto(route)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        )
        if (overflow > 0) problems.push(`${route}: rolagem horizontal de ${overflow}px`)
        for (const item of await smallTargets(page)) problems.push(`${route}: ${item}`)
      }
      expect(problems).toEqual([])
    })
  })
}

test.describe('Celular 375 px — estrutura', () => {
  test.use({ viewport: { width: 375, height: 800 }, hasTouch: true })

  test('cabeçalho compacto: marca em uma linha e botão de menu com 44 px', async ({ page }) => {
    await page.goto('/')
    const header = await page.locator('header').first().boundingBox()
    expect(header?.height ?? 0).toBeLessThanOrEqual(72)
    const button = await page.getByRole('button', { name: 'Abrir menu' }).boundingBox()
    expect(button?.height ?? 0).toBeGreaterThanOrEqual(44)
  })

  test('as chamadas principais da página inicial aparecem na primeira tela', async ({ page }) => {
    await page.goto('/')
    const cta = await page.getByRole('link', { name: 'Conheça as linhas temáticas' }).boundingBox()
    expect(cta).not.toBeNull()
    expect((cta?.y ?? 9999) + (cta?.height ?? 0)).toBeLessThanOrEqual(800)
  })

  test('nome da linha nunca é maior que o título da seção que o contém', async ({ page }) => {
    for (const route of ['/', '/o-grupo']) {
      await page.goto(route)
      const sizes = await page.evaluate(() => {
        const list = document.querySelector('[data-testid="research-lines"]')
        const section = list?.closest('section')
        const h2 = section?.querySelector('h2')
        const h3 = list?.querySelector('h3')
        return {
          h2: h2 ? parseFloat(getComputedStyle(h2).fontSize) : 0,
          h3: h3 ? parseFloat(getComputedStyle(h3).fontSize) : 0,
        }
      })
      expect(sizes.h3, route).toBeGreaterThan(0)
      expect(sizes.h3, route).toBeLessThanOrEqual(sizes.h2)
    }
  })

  test('página inicial: texto de "O grupo" antes dos links das subpáginas', async ({ page }) => {
    await page.goto('/')
    const text = await page
      .getByRole('link', { name: 'Leia a apresentação completa' })
      .boundingBox()
    const nav = await page.getByRole('navigation', { name: 'Páginas sobre o grupo' }).boundingBox()
    expect(text?.y ?? 0).toBeLessThan(nav?.y ?? 0)
  })

  test('seções de "O grupo" ficam todas visíveis, sem rolagem horizontal escondida', async ({
    page,
  }) => {
    await page.goto('/o-grupo')
    const nav = page.getByRole('navigation', { name: 'Seções de O grupo' })
    for (const link of await nav.getByRole('link').all()) {
      const box = await link.boundingBox()
      expect((box?.x ?? -1) >= 0 && (box?.x ?? 0) + (box?.width ?? 0) <= 375).toBe(true)
    }
  })

  test('menu móvel: itens principais com 48 px e links de apoio (contato e páginas legais)', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    const dialog = page.getByRole('dialog', { name: 'Menu' })
    const blog = await dialog.getByRole('link', { name: 'Blog' }).boundingBox()
    expect(blog?.height ?? 0).toBeGreaterThanOrEqual(48)
    const support = dialog.getByRole('navigation', { name: 'Links de apoio' })
    for (const name of ['Contato', 'Sobre o portal', 'Privacidade', 'Acessibilidade']) {
      await expect(support.getByRole('link', { name })).toBeVisible()
    }
    await expectNoSeriousA11yViolations(page)
    await support.getByRole('link', { name: 'Privacidade' }).click()
    await expect(page).toHaveURL(/\/privacidade$/)
    await expect(dialog).toBeHidden()
  })

  test('ensaio: trilha não repete o título inteiro e metadados sem separador órfão', async ({
    page,
  }) => {
    await page.goto('/blog/ensaio-ficticio-autonomia-e-cuidado')
    const current = page.locator('nav[aria-label="Trilha de navegação"] [aria-current="page"]')
    const box = await current.boundingBox()
    expect(box?.height ?? 99).toBeLessThan(30)
    const orphanDots = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('article header p span'))
          .filter((el) => getComputedStyle(el).display !== 'none')
          .filter((el) => /^\s*·/.test((el as HTMLElement).innerText ?? '')).length,
    )
    expect(orphanDots).toBe(0)
  })

  test('rodapé: links do portal e de apoio lado a lado', async ({ page }) => {
    await page.goto('/')
    const portal = await page.locator('footer nav[aria-labelledby="rodape-portal"]').boundingBox()
    const links = await page.locator('footer nav[aria-labelledby="rodape-links"]').boundingBox()
    expect(Math.abs((portal?.y ?? 0) - (links?.y ?? 999))).toBeLessThan(4)
    expect(links?.x ?? 0).toBeGreaterThan(portal?.x ?? 0)
  })
})

test.describe('Tablet e desktop — sem regressão', () => {
  test('tablet 768 px: menu móvel, sem itens quebrados nem rolagem horizontal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/o-grupo')
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Menu principal', exact: true })).toBeHidden()
    await expectNoHorizontalOverflow(page)
  })

  test('desktop 1280 px: menu horizontal em linha única', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Menu principal', exact: true })
    await expect(nav).toBeVisible()
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeHidden()
    for (const link of await nav.getByRole('link').all()) {
      const box = await link.boundingBox()
      expect(box?.height ?? 99).toBeLessThanOrEqual(44)
    }
  })
})

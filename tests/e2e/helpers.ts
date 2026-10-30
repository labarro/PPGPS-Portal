import AxeBuilder from '@axe-core/playwright'
import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const GROUP_NAME = 'Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar'
export const SHORT_NAME = 'Bioética e Promoção da Saúde'
export const DGP_URL = 'http://dgp.cnpq.br/dgp/espelhogrupo/5367326681852422'

/** Rotas públicas da S03 e da S04 (planejamento 9.2; perfis fictícios do seed:people). */
export const PUBLIC_ROUTES = [
  '/',
  '/o-grupo',
  '/o-grupo/historico',
  '/o-grupo/objetivos',
  '/o-grupo/referencias-institucionais',
  '/o-grupo/contato',
  '/linhas',
  '/linhas/bioetica',
  '/linhas/promocao-da-saude',
  '/integrantes',
  '/integrantes?situacao=ex-integrantes',
  '/integrantes/marina-ficticia-duarte',
  '/integrantes/helena-exemplar-ficticia',
  // S05: blog acadêmico (ensaios fictícios do seed:essays).
  '/blog',
  '/blog/ensaio-ficticio-autonomia-e-cuidado',
  '/blog/ensaio-ficticio-arquivado',
  '/blog/categoria/bioetica',
  '/blog/tag/autonomia',
] as const

export async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
}

/** Nenhuma marca institucional: sem imagens/SVG de logotipo e sem referências a arquivos de marca. */
export async function expectNoInstitutionalLogos(page: Page) {
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
  await expect(page.locator('header img, header svg title, footer img, footer svg')).toHaveCount(0)
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

/** Login pela API REST (mesmo caminho do painel); devolve o token JWT. */
export async function apiLogin(
  request: APIRequestContext,
  user: { email: string; password: string },
): Promise<string> {
  const response = await request.post('/api/users/login', { data: user })
  expect(response.status(), await response.text()).toBe(200)
  const json = (await response.json()) as { token: string }
  return json.token
}

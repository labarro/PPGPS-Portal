#!/usr/bin/env node
/**
 * Auditoria manual assistida de teclado e da árvore de acessibilidade (S06). Não substitui um
 * leitor de tela real (NVDA/VoiceOver), mas verifica o que ele consome:
 * - ordem de foco por Tab (cabeçalho → conteúdo → rodapé), primeiro foco = "Pular para o
 *   conteúdo", contorno visível em cada parada;
 * - marcos (banner, navegação, main, contentinfo), um único h1 e níveis de título sem saltos;
 * - nome acessível em todos os links e botões.
 *
 *   node scripts/qa/a11y-keyboard.mjs <base-url> [largura]
 */
import { chromium } from '@playwright/test'

const [base = 'http://localhost:3100', widthArg = '1280'] = process.argv.slice(2)
const width = Number(widthArg)
const ROUTES = (process.env.A11Y_ROUTES ?? '').split(',').filter(Boolean)
const routes = ROUTES.length
  ? ROUTES
  : [
      '/',
      '/o-grupo',
      '/o-grupo/historico',
      '/o-grupo/objetivos',
      '/o-grupo/referencias-institucionais',
      '/o-grupo/contato',
      '/linhas',
      '/linhas/bioetica',
      '/integrantes',
      '/blog',
      '/privacidade',
      '/acessibilidade',
      '/sobre-o-portal',
    ]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height: 900 } })
let failures = 0
for (const route of routes) {
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
  const structure = await page.evaluate(() => {
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter((h) => h.getClientRects().length > 0 || h.closest('.sr-only'))
      .map((h) => Number(h.tagName[1]))
    const jumps = headings.filter((level, i) => i > 0 && level - headings[i - 1] > 1).length
    const unnamed = [...document.querySelectorAll('a[href], button')].filter((el) => {
      const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim()
      return name.length === 0 && el.getClientRects().length > 0
    }).length
    return {
      h1: document.querySelectorAll('h1').length,
      jumps,
      unnamed,
      banner: !!document.querySelector('header'),
      main: document.querySelectorAll('main').length,
      contentinfo: !!document.querySelector('footer'),
      navs: document.querySelectorAll('nav[aria-label], nav[aria-labelledby]').length,
    }
  })

  const stops = []
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab')
    const info = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      const style = getComputedStyle(el)
      const region = el.closest('header')
        ? 'header'
        : el.closest('main')
          ? 'main'
          : el.closest('footer')
            ? 'footer'
            : 'outro'
      const visible = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2
      return { region, visible, label: (el.textContent ?? '').trim().slice(0, 30) }
    })
    if (!info) break
    stops.push(info)
    if (info.region === 'footer' && stops.filter((s) => s.region === 'footer').length > 2) break
  }
  const order = stops.map((s) => s.region)
  const regressions = order.findIndex(
    (r, i) =>
      i > 0 &&
      ['header', 'main', 'footer'].indexOf(r) < ['header', 'main', 'footer'].indexOf(order[i - 1]),
  )
  const invisible = stops.filter((s) => !s.visible).length
  const problems = []
  if (stops[0]?.label !== 'Pular para o conteúdo') problems.push(`1º foco "${stops[0]?.label}"`)
  if (regressions >= 0) problems.push(`ordem de foco volta para trás na parada ${regressions + 1}`)
  if (invisible > 0) problems.push(`${invisible} parada(s) sem contorno visível`)
  if (structure.h1 !== 1) problems.push(`${structure.h1} h1`)
  if (structure.jumps > 0) problems.push(`${structure.jumps} salto(s) de nível de título`)
  if (structure.unnamed > 0) problems.push(`${structure.unnamed} controle(s) sem nome`)
  if (!structure.banner || structure.main !== 1 || !structure.contentinfo)
    problems.push('marcos ausentes')
  if (problems.length) failures++
  console.log(
    `${problems.length ? 'FALHA' : 'OK   '} ${width}px ${route} — ${stops.length} paradas de Tab, ${structure.navs} navegações rotuladas${problems.length ? ` — ${problems.join('; ')}` : ''}`,
  )
}
await browser.close()
process.exit(failures ? 1 : 0)

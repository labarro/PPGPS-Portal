#!/usr/bin/env node
/**
 * Capturas de tela para revisão visual mobile-first (S06, pós-lançamento).
 *
 *   node scripts/qa/mobile-shots.mjs <base-url> <diretório-de-saída> [larguras]
 *
 * Gera uma captura de página inteira por rota e largura (padrão: 320, 375, 390, 430, 768,
 * 1280) e uma captura do menu móvel aberto. Também informa rolagem horizontal e alvos de toque
 * menores que 24×24 px (WCAG 2.5.8) por rota. Uso manual; não roda no CI.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'

const [base = 'http://localhost:3100', outDir = 'shots', widthsArg] = process.argv.slice(2)
const widths = (widthsArg ?? '320,375,390,430,768,1280').split(',').map(Number)
const routes = (process.env.SHOT_ROUTES ?? '').split(',').filter(Boolean)
const ROUTES = routes.length
  ? routes
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
const EXTRA = (process.env.SHOT_EXTRA ?? '').split(',').filter(Boolean)

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
const report = []
for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 800 : 900 },
    deviceScaleFactor: 1,
    isMobile: width < 768,
    hasTouch: width < 768,
    locale: 'pt-BR',
  })
  const page = await context.newPage()
  for (const route of [...ROUTES, ...EXTRA]) {
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
    const name = `${width}${route === '/' ? '-home' : route.replace(/[/?=&]+/g, '-')}.png`
    await page.screenshot({ path: path.join(outDir, name), fullPage: true })
    const metrics = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - window.innerWidth
      const small = []
      for (const el of document.querySelectorAll('a[href], button, input, select, summary')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        const style = getComputedStyle(el)
        if (style.visibility === 'hidden' || style.display === 'none') continue
        // Links dentro de parágrafos são isentos (WCAG 2.5.8, exceção "inline").
        if (el.tagName === 'A' && el.closest('p, li p, .prose-portal p')) continue
        if (r.width < 24 || r.height < 24) {
          small.push(
            `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`,
          )
        }
      }
      const h1 = document.querySelector('h1')
      return {
        overflow,
        small: small.slice(0, 12),
        smallCount: small.length,
        h1: h1 ? getComputedStyle(h1).fontSize : null,
        body: getComputedStyle(document.body).fontSize,
      }
    })
    report.push({ width, route, ...metrics })
  }
  if (width < 1024) {
    await page.goto(`${base}/`, { waitUntil: 'networkidle' })
    const trigger = page.getByRole('button', { name: /menu/i }).first()
    if (await trigger.isVisible()) {
      await trigger.click()
      await page.waitForTimeout(400)
      await page.screenshot({ path: path.join(outDir, `${width}-menu-aberto.png`) })
    }
  }
  await context.close()
}
await browser.close()
writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1))
for (const r of report) {
  if (r.overflow > 0 || r.smallCount > 0) {
    console.log(
      `${r.width} ${r.route}: overflow=${r.overflow} pequenos=${r.smallCount} ${r.small.join(' | ')}`,
    )
  }
}
console.log(`OK: ${report.length} capturas em ${outDir}`)

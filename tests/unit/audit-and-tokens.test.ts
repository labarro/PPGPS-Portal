import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { validateHref } from '@/globals/shared'
import { changedFields } from '@/hooks/audit'
import { cn } from '@/lib/utils'

describe('cn (classes utilitárias)', () => {
  it('combina condicionais e resolve conflitos do Tailwind', () => {
    expect(cn('px-2', false && 'hidden', 'px-4', ['text-sm'])).toBe('px-4 text-sm')
  })
})

describe('auditoria: resumo de alterações', () => {
  it('lista apenas nomes de campos alterados, ignorando campos internos e sensíveis', () => {
    expect(
      changedFields(
        { id: 1, title: 'A', hash: 'x', updatedAt: '1', roles: ['editor'], sessions: [] },
        {
          id: 1,
          title: 'B',
          hash: 'y',
          updatedAt: '2',
          roles: ['editor'],
          sessions: [{ id: 's' }],
        },
      ),
    ).toEqual(['title'])
  })

  it('criação lista os campos preenchidos', () => {
    expect(changedFields({}, { id: 1, title: 'A', visibility: 'admin', createdAt: 'x' })).toEqual([
      'title',
      'visibility',
    ])
  })

  it('compara estruturas aninhadas', () => {
    expect(changedFields({ items: [{ label: 'a' }] }, { items: [{ label: 'b' }] })).toEqual([
      'items',
    ])
    expect(changedFields(null, undefined)).toEqual([])
  })
})

describe('links dos globals', () => {
  it('aceita caminhos internos, https e mailto; recusa esquemas perigosos', () => {
    expect(validateHref('/blog')).toBe(true)
    expect(validateHref('https://dgp.cnpq.br/x')).toBe(true)
    expect(validateHref('mailto:grupo@example.com')).toBe(true)
    for (const bad of [
      'javascript:alert(1)',
      'data:text/html,x',
      '//evil.example',
      'http://inseguro.example',
      '',
      42,
    ]) {
      expect(validateHref(bad)).not.toBe(true)
    }
  })
})

/** Contraste WCAG 2.x a partir do arquivo único de tokens. */
function parseTokens(): Record<string, string> {
  const css = readFileSync(path.resolve('src/styles/tokens.css'), 'utf8')
  return Object.fromEntries(
    [...css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [
      m[1] as string,
      (m[2] as string).toLowerCase(),
    ]),
  )
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

describe('tokens de design (azul-marinho e branco) com contraste AA', () => {
  const t = parseTokens()

  it('a primária é azul-marinho e o fundo é branco', () => {
    expect(t.background).toBe('#ffffff')
    expect(t['primary-foreground']).toBe('#ffffff')
    const p = t.primary ?? '#000000'
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(p.slice(i, i + 2), 16)) as [
      number,
      number,
      number,
    ]
    expect(b).toBeGreaterThan(r)
    expect(b).toBeGreaterThan(g)
    expect(luminance(p)).toBeLessThan(0.05)
  })

  // [texto, fundo, mínimo]: texto 4,5:1; componentes de interface e foco 3:1 (WCAG 1.4.3/1.4.11).
  const pairs: [string, string, number][] = [
    ['foreground', 'background', 4.5],
    ['primary-foreground', 'primary', 4.5],
    ['primary-foreground', 'primary-hover', 4.5],
    ['secondary-foreground', 'secondary', 4.5],
    ['muted-foreground', 'background', 4.5],
    ['muted-foreground', 'muted', 4.5],
    ['accent-foreground', 'accent', 4.5],
    ['inverse-foreground', 'inverse', 4.5],
    ['inverse-muted-foreground', 'inverse', 4.5],
    ['link', 'background', 4.5],
    ['link', 'muted', 4.5],
    ['primary', 'secondary', 4.5],
    ['destructive-foreground', 'destructive', 4.5],
    ['input', 'background', 3],
    ['ring', 'background', 3],
    ['ring-inverse', 'inverse', 3],
    ['primary', 'background', 3],
  ]

  it.each(pairs)('%s sobre %s ≥ %d:1', (fg, bg, min) => {
    const ratio = contrast(t[fg] ?? '', t[bg] ?? '')
    expect(
      ratio,
      `${fg} (${t[fg]}) sobre ${bg} (${t[bg]}) = ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(min)
  })
})

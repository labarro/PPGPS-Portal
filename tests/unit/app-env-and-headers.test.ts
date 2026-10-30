import { describe, expect, it } from 'vitest'

import { isProtectedNonProduction, resolveAppEnv } from '@/lib/env/app-env'
import { defaultLocale, publicLocales } from '@/lib/i18n/locales'
import { NOINDEX_VALUE, securityHeaders } from '@/lib/security/headers'

describe('resolveAppEnv', () => {
  it('reconhece os quatro ambientes', () => {
    expect(resolveAppEnv('local')).toBe('local')
    expect(resolveAppEnv('preview')).toBe('preview')
    expect(resolveAppEnv(' Staging ')).toBe('staging')
    expect(resolveAppEnv('production')).toBe('production')
  })

  it('nunca trata valor ausente ou desconhecido como produção', () => {
    expect(resolveAppEnv(undefined)).toBe('local')
    expect(resolveAppEnv('')).toBe('local')
    expect(resolveAppEnv('prod')).toBe('local')
  })

  it('protege apenas preview e staging obrigatoriamente', () => {
    expect(isProtectedNonProduction('preview')).toBe(true)
    expect(isProtectedNonProduction('staging')).toBe(true)
    expect(isProtectedNonProduction('local')).toBe(false)
    expect(isProtectedNonProduction('production')).toBe(false)
  })
})

describe('securityHeaders', () => {
  const asMap = (env: Parameters<typeof securityHeaders>[0]) =>
    Object.fromEntries(securityHeaders(env).map(({ key, value }) => [key, value]))

  it('inclui os cabeçalhos básicos em todos os ambientes', () => {
    for (const env of ['local', 'preview', 'staging', 'production'] as const) {
      const headers = asMap(env)
      expect(headers['Strict-Transport-Security']).toContain('max-age=')
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'self'")
    }
  })

  it('aplica a CSP completa em modo enforce (S06), sem report-only', () => {
    const local = asMap('local')['Content-Security-Policy'] ?? ''
    expect(local).toContain("default-src 'self'")
    expect(local).toContain("object-src 'none'")
    expect(local).toContain("base-uri 'self'")
    expect(local).toContain("frame-ancestors 'self'")
    expect(local).not.toContain('upgrade-insecure-requests')
    expect(local).not.toContain('unsafe-eval')
    for (const env of ['local', 'preview', 'staging', 'production'] as const) {
      expect(asMap(env)['Content-Security-Policy-Report-Only']).toBeUndefined()
    }
    const production = asMap('production')['Content-Security-Policy'] ?? ''
    expect(production).toContain('upgrade-insecure-requests')
    expect(production).toContain("script-src 'self' 'unsafe-inline'")
    expect(production).not.toContain('unsafe-eval')
    expect(production).not.toMatch(/https?:\/\/(?!\*\.sentry\.io)/)
    const withReport = Object.fromEntries(
      securityHeaders('preview', { cspReportUri: 'https://relatorios.example.com/csp' }).map(
        ({ key, value }) => [key, value],
      ),
    )
    expect(withReport['Content-Security-Policy']).toContain(
      'report-uri https://relatorios.example.com/csp',
    )
    expect(asMap('production')['Cross-Origin-Opener-Policy']).toBe('same-origin')
  })

  it("'unsafe-eval' somente no servidor de desenvolvimento", () => {
    const dev = Object.fromEntries(
      securityHeaders('local', { development: true }).map(({ key, value }) => [key, value]),
    )
    expect(dev['Content-Security-Policy']).toContain("'unsafe-eval'")
  })

  it('aplica noindex fora da produção e não na produção', () => {
    expect(asMap('preview')['X-Robots-Tag']).toBe(NOINDEX_VALUE)
    expect(asMap('staging')['X-Robots-Tag']).toBe(NOINDEX_VALUE)
    expect(asMap('local')['X-Robots-Tag']).toBe(NOINDEX_VALUE)
    expect(asMap('production')['X-Robots-Tag']).toBeUndefined()
  })
})

describe('locales', () => {
  it('pt-BR é padrão e o único idioma público', () => {
    expect(defaultLocale).toBe('pt-BR')
    expect(publicLocales()).toEqual(['pt-BR'])
  })
})

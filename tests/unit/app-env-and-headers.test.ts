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
      expect(headers['Content-Security-Policy']).toBe("frame-ancestors 'self'")
    }
  })

  it('envia CSP completa em modo report-only (S02), sem bloquear', () => {
    const local = asMap('local')['Content-Security-Policy-Report-Only'] ?? ''
    expect(local).toContain("default-src 'self'")
    expect(local).toContain("object-src 'none'")
    expect(local).toContain("frame-ancestors 'self'")
    expect(local).not.toContain('upgrade-insecure-requests')
    expect(asMap('staging')['Content-Security-Policy-Report-Only']).toContain(
      'upgrade-insecure-requests',
    )
    const withReport = Object.fromEntries(
      securityHeaders('preview', { cspReportUri: 'https://relatorios.example.com/csp' }).map(
        ({ key, value }) => [key, value],
      ),
    )
    expect(withReport['Content-Security-Policy-Report-Only']).toContain(
      'report-uri https://relatorios.example.com/csp',
    )
    expect(asMap('production')['Cross-Origin-Opener-Policy']).toBe('same-origin')
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

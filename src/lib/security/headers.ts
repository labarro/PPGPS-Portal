import { type AppEnv, isProduction } from '../env/app-env'

export type HeaderEntry = { key: string; value: string }

/** Valor do cabeçalho de não indexação aplicado fora da produção. */
export const NOINDEX_VALUE = 'noindex, nofollow, noarchive'

/**
 * Cabeçalhos básicos de segurança (S01; planejamento 17.4 e 17.7).
 * A CSP completa entra na S02 (report-only) e S06 (enforce); aqui só `frame-ancestors`.
 */
export function securityHeaders(env: AppEnv): HeaderEntry[] {
  const headers: HeaderEntry[] = [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    },
  ]

  if (!isProduction(env)) {
    headers.push({ key: 'X-Robots-Tag', value: NOINDEX_VALUE })
  }

  return headers
}

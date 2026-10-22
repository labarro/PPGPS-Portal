import { type AppEnv, isProduction } from '../env/app-env'

export type HeaderEntry = { key: string; value: string }

/** Valor do cabeçalho de não indexação aplicado fora da produção. */
export const NOINDEX_VALUE = 'noindex, nofollow, noarchive'

export type SecurityHeaderOptions = {
  /** Endpoint que recebe relatórios de violação da CSP (ex.: endpoint "security" do Sentry). */
  cspReportUri?: string | null
}

/**
 * CSP completa em modo *report-only* (S02): registra violações sem bloquear nada.
 * Passa a *enforce* na S06, depois de analisados os relatórios (planejamento 17.7).
 * `'unsafe-inline'` em scripts é necessário sem nonces (Next/Payload); a S06 avalia nonces.
 */
export function contentSecurityPolicyReportOnly(env: AppEnv, options: SecurityHeaderOptions = {}) {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.sentry.io",
    "media-src 'self'",
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ]
  if (env !== 'local') directives.push('upgrade-insecure-requests')
  if (options.cspReportUri) directives.push(`report-uri ${options.cspReportUri}`)
  return directives.join('; ')
}

/**
 * Cabeçalhos de segurança (S01 + S02; planejamento 17.4 e 17.7).
 * A CSP aplicada (enforce) continua restrita a `frame-ancestors` até a S06.
 */
export function securityHeaders(env: AppEnv, options: SecurityHeaderOptions = {}): HeaderEntry[] {
  const headers: HeaderEntry[] = [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
    {
      key: 'Content-Security-Policy-Report-Only',
      value: contentSecurityPolicyReportOnly(env, options),
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=()',
    },
  ]

  if (!isProduction(env)) {
    headers.push({ key: 'X-Robots-Tag', value: NOINDEX_VALUE })
  }

  return headers
}

import { type AppEnv, isProduction } from '../env/app-env'

export type HeaderEntry = { key: string; value: string }

/** Valor do cabeçalho de não indexação aplicado fora da produção. */
export const NOINDEX_VALUE = 'noindex, nofollow, noarchive'

export type SecurityHeaderOptions = {
  /** Endpoint que recebe relatórios de violação da CSP (ex.: endpoint "security" do Sentry). */
  cspReportUri?: string | null
  /** `next dev` (Fast Refresh) precisa de `'unsafe-eval'`; nunca em builds de produção. */
  development?: boolean
}

/**
 * CSP completa (S02 em *report-only*; **S06 em *enforce*** — planejamento 17.7).
 * `'unsafe-inline'` em scripts continua necessário sem nonces: nonces obrigariam a
 * renderização dinâmica de todo HTML com cabeçalho por requisição e desligariam o cache de
 * CDN; o risco é mitigado pela ausência de HTML bruto (serializer próprio do Lexical),
 * `object-src 'none'`, `base-uri 'self'` e nenhum script de terceiros (ADR-0016).
 * Limitação aceita: o editor de JSON do painel (Monaco, só na fila de jobs do admin) carrega
 * de CDN e fica indisponível.
 */
export function contentSecurityPolicy(env: AppEnv, options: SecurityHeaderOptions = {}) {
  const directives = [
    "default-src 'self'",
    options.development
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
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
 * Cabeçalhos de segurança (S01 + S02 + S06; planejamento 17.4 e 17.7).
 * S06: a CSP completa passa a ser aplicada (*enforce*) em todos os ambientes.
 */
export function securityHeaders(env: AppEnv, options: SecurityHeaderOptions = {}): HeaderEntry[] {
  const headers: HeaderEntry[] = [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(env, options) },
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

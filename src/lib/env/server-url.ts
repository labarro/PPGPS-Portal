import { resolveAppEnv } from './app-env'

/**
 * Domínio oficial de produção (ADR-0014). Usado somente quando `APP_ENV=production`.
 * A ativação pública é reservada à S06.
 */
export const PRODUCTION_SITE_URL = 'https://bioeticaps.app'
export const PRODUCTION_HOST = 'bioeticaps.app'

/** Verdadeiro para `bioeticaps.app` e qualquer subdomínio (ex.: `www.`). */
export function isProductionHost(urlOrHost: string): boolean {
  const host = urlOrHost
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .toLowerCase()
  return host === PRODUCTION_HOST || host.endsWith(`.${PRODUCTION_HOST}`)
}

/**
 * URL pública do ambiente, usada em links absolutos (canônica, sitemap, robots, JSON-LD e
 * e-mail de recuperação de senha).
 *
 * Nunca deriva do cabeçalho `Host` da requisição: isso permitiria a um atacante gerar e-mails
 * de recuperação apontando para outro domínio (envenenamento de link de redefinição).
 *
 * - Produção: `SERVER_URL` → domínio oficial (`VERCEL_URL` é o endereço do deploy, nunca canônico).
 * - Demais ambientes: `SERVER_URL` → `VERCEL_URL` → localhost. O domínio de produção é
 *   ignorado fora da produção (ADR-0014), para que homologação/preview nunca o usem.
 */
export function resolveServerUrl(env: Record<string, string | undefined> = process.env): string {
  const production = resolveAppEnv(env.APP_ENV) === 'production'
  const explicit = env.SERVER_URL?.trim()
  if (explicit && (production || !isProductionHost(explicit))) {
    return explicit.replace(/\/+$/, '')
  }
  if (production) return PRODUCTION_SITE_URL

  const vercel = env.VERCEL_URL?.trim()
  if (vercel && !isProductionHost(vercel)) {
    return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`
  }
  return `http://localhost:${env.PORT?.trim() || '3000'}`
}

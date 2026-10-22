import type { MetadataRoute } from 'next'

import { type AppEnv, isProduction } from '../env/app-env'

/**
 * robots.txt (planejamento 16.7): bloqueia `/admin`, `/api` e `/next` (pré-visualização) e
 * aponta o sitemap. Fora da produção, bloqueia tudo — além do `X-Robots-Tag: noindex`.
 */
export function buildRobots(env: AppEnv, siteUrl: string): MetadataRoute.Robots {
  const base = siteUrl.replace(/\/+$/, '')
  if (!isProduction(env)) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}

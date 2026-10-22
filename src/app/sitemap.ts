import type { MetadataRoute } from 'next'

import { buildSitemap } from '@/lib/content/sitemap'
import { getSitemapEntries } from '@/lib/content/queries'
import { resolveServerUrl } from '@/lib/env/server-url'

// Gerado por requisição a partir dos dados (em cache por tag); nunca no build (sem banco).
export const dynamic = 'force-dynamic'

/** Somente conteúdo publicado (planejamento 16.7; critério de aceite da S03). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(await getSitemapEntries(), resolveServerUrl())
}

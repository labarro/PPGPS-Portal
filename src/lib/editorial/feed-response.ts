import { listEssays } from '@/lib/content/queries'
import { resolveServerUrl } from '@/lib/env/server-url'
import { getSiteChrome } from '@/lib/site/chrome'

import { buildAtom, buildRss, type FeedItem } from './feed'

/** Resposta dos feeds do blog (RSS e Atom): 20 ensaios listáveis mais recentes. */
export async function feedResponse(kind: 'rss' | 'atom'): Promise<Response> {
  const [{ docs }, chrome] = await Promise.all([listEssays({ limit: 20 }), getSiteChrome()])
  const items: FeedItem[] = docs.map((essay) => ({
    title: essay.title,
    slug: essay.slug,
    excerpt: essay.excerpt,
    nature: essay.nature,
    publishedAt: essay.publishedAt,
    updatedAt: essay.updatedAt,
    authors: essay.authors.map(({ name }) => ({ name })),
    category: essay.category,
    tags: essay.tags,
  }))
  const options = {
    siteUrl: resolveServerUrl(),
    title: `Blog · ${chrome.siteName}`,
    description:
      'Ensaios de natureza ensaística, sem revisão por pares, de integrantes e convidados do grupo.',
  }
  const body = kind === 'rss' ? buildRss(items, options) : buildAtom(items, options)
  return new Response(body, {
    headers: {
      'Content-Type': `${kind === 'rss' ? 'application/rss+xml' : 'application/atom+xml'}; charset=utf-8`,
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}

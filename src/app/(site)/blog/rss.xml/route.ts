import { feedResponse } from '@/lib/editorial/feed-response'

// Gerado por requisição a partir dos dados em cache por tag; nunca no build (sem banco).
export const dynamic = 'force-dynamic'

/** RSS 2.0 do blog (ficha S05): somente ensaios publicados e não arquivados. */
export function GET(): Promise<Response> {
  return feedResponse('rss')
}

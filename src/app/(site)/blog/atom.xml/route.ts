import { feedResponse } from '@/lib/editorial/feed-response'

export const dynamic = 'force-dynamic'

/** Atom do blog (ficha S05): somente ensaios publicados e não arquivados. */
export function GET(): Promise<Response> {
  return feedResponse('atom')
}

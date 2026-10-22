import type { Where } from 'payload'

/**
 * Regra ÚNICA de visibilidade pública (AGENTS.md §4.6), reutilizada pelo acesso das coleções,
 * pelas consultas das páginas, pelo sitemap e (a partir da S09) pelo índice de busca.
 *
 * S03: documento publicado (`_status = published`); linhas temáticas também precisam estar
 * ativas; nada arquivado. A S04 estende esta função com consentimentos.
 */
export type PublicCollection = 'research-lines' | 'pages'

type VisibilityDoc = {
  _status?: 'draft' | 'published' | null
  active?: boolean | null
  archivedAt?: string | null
}

export function canViewPublic(collection: PublicCollection, doc: VisibilityDoc | null | undefined) {
  if (!doc) return false
  if (doc._status !== 'published') return false
  if (doc.archivedAt) return false
  if (collection === 'research-lines' && doc.active !== true) return false
  return true
}

/** Mesmo critério de `canViewPublic`, como filtro de consulta (usado pelo `read` das coleções). */
export function publicWhere(collection: PublicCollection): Where {
  const published: Where = { _status: { equals: 'published' } }
  if (collection === 'research-lines') {
    return { and: [published, { active: { equals: true } }] }
  }
  return published
}

/** Globals com rascunho: o visitante só lê a versão publicada. */
export const PUBLISHED_GLOBAL_WHERE: Where = { _status: { equals: 'published' } }

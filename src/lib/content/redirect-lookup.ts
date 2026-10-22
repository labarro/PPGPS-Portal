import { isRedirectCandidate, normalizePath } from './paths'

/**
 * Consulta de redirecionamentos usada pelo proxy (antes de qualquer página), para responder
 * com 301/302 reais — o Next só emite 307/308 a partir de páginas. Consulta mínima e somente
 * leitura na tabela `redirects` (plugin de redirects), com cache curto em memória:
 * - só para caminhos com slug editável (`/linhas/*`, `/o-grupo/*`);
 * - qualquer falha deixa a requisição seguir normalmente (a página tem um fallback).
 */
export type RedirectHit = { to: string; status: 301 | 302 }

export type RedirectQuery = (from: string) => Promise<{ to: string; type: string } | null>

/**
 * Só acertos ficam em cache: uma falta em cache faria o endereço antigo continuar sem 301
 * logo após a troca de slug (consulta indexada e barata; somente caminhos com slug).
 */
export const REDIRECT_CACHE_TTL_MS = { hit: 30_000, miss: 0 } as const

type CacheEntry = { value: RedirectHit | null; expires: number }

export function createRedirectLookup(query: RedirectQuery, now: () => number = Date.now) {
  const cache = new Map<string, CacheEntry>()

  return async function lookup(pathname: string): Promise<RedirectHit | null> {
    if (!isRedirectCandidate(pathname)) return null
    const from = normalizePath(pathname)
    const cached = cache.get(from)
    if (cached && cached.expires > now()) return cached.value

    const row = await query(from)
    const value: RedirectHit | null =
      row && row.to && row.to !== from
        ? { to: row.to, status: row.type === '302' ? 302 : 301 }
        : null
    if (value) {
      if (cache.size > 500) cache.clear()
      cache.set(from, { value, expires: now() + REDIRECT_CACHE_TTL_MS.hit })
    } else {
      cache.delete(from)
    }
    return value
  }
}

/** Colunas geradas pelo Payload para os campos `from`, `to.url` e `type` da coleção. */
export const REDIRECT_SQL =
  'select "to_url" as "to", "type" from "redirects" where "from" = $1 limit 1'

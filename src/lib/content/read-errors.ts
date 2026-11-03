import { isDatabaseUnavailable } from '../db/availability'
import { reportServerError } from '../observability/server-capture'

/**
 * Falha de leitura pública (S06, pós-lançamento):
 * - banco indisponível (mesmo após a nova tentativa): a página FALHA (erro de servidor,
 *   capturado pelo Sentry com a causa real via `onRequestError`). Antes, o visitante recebia
 *   HTTP 200 com estados vazios ("em elaboração") ou até 404 em perfis — conteúdo enganoso e
 *   indexável;
 * - outros erros: mantém o valor padrão (degradação parcial), mas registra no Sentry.
 */
export function handleReadError<T>(key: readonly string[], fallback: T, error: unknown): T {
  console.error(`[site] Falha ao ler ${key.join('/')}.`, error)
  if (isDatabaseUnavailable(error)) throw error
  reportServerError(error, { read: key.join('/') })
  return fallback
}

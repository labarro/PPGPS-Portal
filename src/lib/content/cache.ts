import { createHash } from 'node:crypto'

import { unstable_cache } from 'next/cache'

/**
 * Tempo de segurança do cache de dados públicos (s). A atualização normal é imediata, por
 * tag, nos hooks do Payload; este limite só cobre alterações feitas fora do servidor do site
 * (ex.: seed por linha de comando).
 */
export const DATA_CACHE_SECONDS = 300

/**
 * Separa o cache por banco (ex.: desenvolvimento × testes na mesma máquina) e, opcionalmente,
 * por execução (`DATA_CACHE_SCOPE`, usado pelos E2E para não reaproveitar cache em disco).
 */
function databaseScope(): string {
  return createHash('sha256')
    .update(`${process.env.DATABASE_URL ?? ''}|${process.env.DATA_CACHE_SCOPE ?? ''}`)
    .digest('hex')
    .slice(0, 12)
}

/**
 * Leitura pública com cache por tags (planejamento 12.4). Fora do runtime do Next (testes,
 * scripts) executa diretamente.
 */
export function cachedRead<T>(
  key: readonly string[],
  tags: readonly string[],
  read: () => Promise<T>,
): Promise<T> {
  if (!process.env.NEXT_RUNTIME) return read()
  return unstable_cache(read, [databaseScope(), ...key], {
    tags: [...tags],
    revalidate: DATA_CACHE_SECONDS,
  })()
}

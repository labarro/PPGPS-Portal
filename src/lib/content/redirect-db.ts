import { Pool } from 'pg'

import { createRedirectLookup, REDIRECT_SQL } from './redirect-lookup'

/**
 * Conexão mínima e preguiçosa (1 conexão, curta) para o proxy consultar `redirects`.
 * Usa a mesma `DATABASE_URL` do app; nenhuma escrita.
 */
let pool: Pool | null = null

function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null
  pool ??= new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 3_000,
    statement_timeout: 2_000,
  })
  return pool
}

export const lookupRedirect = createRedirectLookup(async (from) => {
  const db = getPool()
  if (!db) return null
  const result = await db.query<{ to: string; type: string }>(REDIRECT_SQL, [from])
  return result.rows[0] ?? null
})

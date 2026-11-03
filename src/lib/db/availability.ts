import { DatabaseUnavailableError } from './safe-adapter'

/** Códigos de rede/servidor do Postgres que indicam banco inacessível (não erro de consulta). */
const CONNECTION_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  '57P01', // admin_shutdown
  '57P03', // cannot_connect_now
  '53300', // too_many_connections
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
])

/**
 * Indisponibilidade do banco (S06, pós-lançamento): inicialização do Payload que falhou
 * (`payloadInitError`), erro de conexão do driver ou `DatabaseUnavailableError`. Erros de
 * consulta comuns NÃO entram aqui.
 */
export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof DatabaseUnavailableError) return true
  if (!error || typeof error !== 'object') return false
  const e = error as {
    payloadInitError?: unknown
    code?: unknown
    message?: unknown
    cause?: unknown
  }
  if (e.payloadInitError === true) return true
  if (typeof e.code === 'string' && CONNECTION_CODES.has(e.code)) return true
  if (
    typeof e.message === 'string' &&
    /cannot connect to Postgres|Connection terminated/i.test(e.message)
  ) {
    return true
  }
  return e.cause !== undefined && e.cause !== error && isDatabaseUnavailable(e.cause)
}

/**
 * Executa `fn` com UMA nova tentativa após `delayMs` quando o banco está indisponível
 * (oscilação de rede ou retomada do compute do Neon). Outros erros sobem imediatamente.
 */
export async function withDatabaseRetry<T>(fn: () => Promise<T>, delayMs = 400): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    return fn()
  }
}

/**
 * Autenticação básica HTTP para ambientes não produtivos (S01; ADR-0005).
 * Funções puras, sem dependência de runtime específico (Node ou Edge).
 */

export type BasicAuthCredentials = {
  user: string
  password: string
}

/** Lê usuário e senha de um cabeçalho `Authorization: Basic ...`. */
export function parseBasicAuthHeader(
  header: string | null | undefined,
): BasicAuthCredentials | null {
  if (!header) return null
  const [scheme, encoded] = header.trim().split(/\s+/, 2)
  if (!scheme || scheme.toLowerCase() !== 'basic' || !encoded) return null

  let decoded: string
  try {
    decoded = atob(encoded)
  } catch {
    return null
  }

  const separator = decoded.indexOf(':')
  if (separator < 0) return null

  return {
    user: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  }
}

/** Comparação em tempo constante em relação ao conteúdo (evita ataques de temporização). */
export function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder()
  const left = encoder.encode(a)
  const right = encoder.encode(b)
  const length = Math.max(left.length, right.length)
  let diff = left.length ^ right.length
  for (let i = 0; i < length; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0)
  }
  return diff === 0
}

export function isAuthorized(
  header: string | null | undefined,
  expected: BasicAuthCredentials,
): boolean {
  const provided = parseBasicAuthHeader(header)
  if (!provided) return false
  // Avalia as duas comparações sempre, sem curto-circuito.
  const userOk = safeEqual(provided.user, expected.user)
  const passwordOk = safeEqual(provided.password, expected.password)
  return userOk && passwordOk
}

/** Credenciais configuradas, ou `null` se usuário/senha estiverem ausentes ou vazios. */
export function readBasicAuthCredentials(
  env: Record<string, string | undefined>,
): BasicAuthCredentials | null {
  const user = env.BASIC_AUTH_USER?.trim()
  const password = env.BASIC_AUTH_PASSWORD
  if (!user || !password) return null
  return { user, password }
}

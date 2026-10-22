/**
 * URL pública do ambiente, usada em links absolutos (ex.: e-mail de recuperação de senha).
 *
 * Nunca deriva do cabeçalho `Host` da requisição: isso permitiria a um atacante gerar e-mails
 * de recuperação apontando para outro domínio (envenenamento de link de redefinição).
 * Ordem: `SERVER_URL` → `VERCEL_URL` (definida pela própria Vercel no deploy) → localhost.
 */
export function resolveServerUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.SERVER_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercel = env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`
  return `http://localhost:${env.PORT?.trim() || '3000'}`
}

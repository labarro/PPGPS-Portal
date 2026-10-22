import { resolveServerUrl } from '../../lib/env/server-url'
import {
  type PasswordEmailKind,
  passwordEmailHtml,
  passwordEmailSubject,
  resetPasswordUrl,
} from '../../lib/email/templates'

/** Validade do link de definição/redefinição de senha: 1 hora (planejamento 14.1). */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

/** Conta que nunca entrou recebe o texto de "definir senha"; as demais, "redefinir". */
export const passwordEmailKind = (user: unknown): PasswordEmailKind =>
  (user as { lastLoginAt?: string | null } | null | undefined)?.lastLoginAt ? 'reset' : 'setup'

export function buildPasswordEmail(user: unknown, token: string, kind = passwordEmailKind(user)) {
  return {
    subject: passwordEmailSubject(kind),
    html: passwordEmailHtml({
      kind,
      name: (user as { name?: string | null } | null | undefined)?.name ?? null,
      url: resetPasswordUrl(resolveServerUrl(), token),
      expiresInMinutes: RESET_TOKEN_TTL_MS / 60_000,
    }),
  }
}

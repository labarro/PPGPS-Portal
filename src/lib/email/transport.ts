import { type AppEnv, isProduction, resolveAppEnv } from '../env/app-env'

/**
 * Seleção do transporte de e-mail (planejamento 17.7 — S02; ADR-0011).
 *
 * Regra de privacidade: fora da produção, e-mails NUNCA chegam a destinatários reais.
 * - `smtp`: SMTP configurado. Fora da produção, só é aceito se for um servidor de captura
 *   (Mailpit local ou caixa de testes declarada com `EMAIL_SMTP_IS_SANDBOX=true`).
 * - `capture`: sem SMTP fora da produção — a mensagem é descartada e só metadados mínimos
 *   (assunto e destinatário mascarado) vão para o log; nunca o corpo, links ou tokens.
 * - `disabled`: produção sem SMTP — o envio falha de forma explícita.
 */
export type EmailTransportChoice =
  | {
      kind: 'smtp'
      host: string
      port: number
      secure: boolean
      user?: string
      pass?: string
      sandbox: boolean
    }
  | { kind: 'capture'; reason: string }
  | { kind: 'disabled'; reason: string }

type Env = Record<string, string | undefined>

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'mailpit'])

export function resolveEmailTransport(env: Env = process.env): EmailTransportChoice {
  const appEnv: AppEnv = resolveAppEnv(env.APP_ENV)
  const host = env.SMTP_HOST?.trim()

  if (!host) {
    return isProduction(appEnv)
      ? { kind: 'disabled', reason: 'SMTP_HOST não configurado em produção.' }
      : {
          kind: 'capture',
          reason: 'Sem SMTP fora da produção: mensagens capturadas (descartadas).',
        }
  }

  const port = Number(env.SMTP_PORT || 587)
  const sandbox = LOCAL_HOSTS.has(host.toLowerCase()) || env.EMAIL_SMTP_IS_SANDBOX === 'true'

  if (!isProduction(appEnv) && !sandbox) {
    return {
      kind: 'capture',
      reason: `SMTP "${host}" não é de captura: envio real bloqueado fora da produção.`,
    }
  }

  return {
    kind: 'smtp',
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    secure: env.SMTP_SECURE === 'true' || port === 465,
    user: env.SMTP_USER?.trim() || undefined,
    pass: env.SMTP_PASSWORD || undefined,
    sandbox,
  }
}

/** Mascara um e-mail para logs: "fulano@example.com" → "f***@example.com". */
export function maskEmail(value: unknown): string {
  if (typeof value !== 'string') return '(desconhecido)'
  const [local = '', domain = ''] = value.split('@')
  if (!domain) return '***'
  return `${local.slice(0, 1)}***@${domain}`
}

export const DEFAULT_FROM_NAME = 'Portal Bioética e Promoção da Saúde'
export const DEFAULT_FROM_ADDRESS = 'nao-responda@example.com'

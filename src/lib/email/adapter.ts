import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter } from 'payload'

import {
  DEFAULT_FROM_ADDRESS,
  DEFAULT_FROM_NAME,
  type EmailTransportChoice,
  maskEmail,
  resolveEmailTransport,
} from './transport'

type Env = Record<string, string | undefined>

const recipients = (to: unknown): string =>
  (Array.isArray(to) ? to : [to])
    .map((item) =>
      maskEmail(typeof item === 'object' && item ? (item as { address?: string }).address : item),
    )
    .join(', ')

/** Captura: descarta a mensagem e registra apenas assunto e destinatário mascarado. */
function captureAdapter(
  choice: Extract<EmailTransportChoice, { kind: 'capture' }>,
  from: string,
  fromName: string,
): EmailAdapter {
  return ({ payload }) => ({
    name: 'capture',
    defaultFromAddress: from,
    defaultFromName: fromName,
    sendEmail: async (message) => {
      payload.logger.info({
        msg: '[e-mail capturado — não enviado]',
        reason: choice.reason,
        subject: message.subject,
        to: recipients(message.to),
      })
      return { captured: true }
    },
  })
}

function disabledAdapter(reason: string, from: string, fromName: string): EmailAdapter {
  return () => ({
    name: 'disabled',
    defaultFromAddress: from,
    defaultFromName: fromName,
    sendEmail: async () => {
      throw new Error(`Envio de e-mail indisponível: ${reason}`)
    },
  })
}

/** Adaptador de e-mail do Payload conforme o ambiente (ver `transport.ts`). */
export function buildEmailAdapter(env: Env = process.env): EmailAdapter | Promise<EmailAdapter> {
  const from = env.EMAIL_FROM_ADDRESS?.trim() || DEFAULT_FROM_ADDRESS
  const fromName = env.EMAIL_FROM_NAME?.trim() || DEFAULT_FROM_NAME
  const choice = resolveEmailTransport(env)

  if (choice.kind === 'capture') return captureAdapter(choice, from, fromName)
  if (choice.kind === 'disabled') return disabledAdapter(choice.reason, from, fromName)

  return nodemailerAdapter({
    defaultFromAddress: from,
    defaultFromName: fromName,
    // Sem verificação na inicialização: evita conexão de rede ao carregar a configuração.
    skipVerify: true,
    transportOptions: {
      host: choice.host,
      port: choice.port,
      secure: choice.secure,
      ...(choice.user ? { auth: { user: choice.user, pass: choice.pass } } : {}),
    },
  })
}

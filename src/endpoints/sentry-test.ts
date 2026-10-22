import type { Endpoint } from 'payload'

import { isAdmin } from '../access'

/**
 * Erro forçado para homologação do Sentry (roteiro S02, passo 8). Somente `admin`.
 * A mensagem inclui um e-mail FICTÍCIO de propósito: o evento recebido no Sentry deve
 * mostrá-lo removido pelo `beforeSend` (ver `src/lib/observability/scrub.ts`).
 */
export const sentryTestEndpoint: Endpoint = {
  path: '/sentry-test',
  method: 'post',
  handler: async (req) => {
    if (!isAdmin({ req })) {
      return Response.json({ errors: [{ message: 'Acesso negado.' }] }, { status: 403 })
    }
    const error = new Error(
      'Erro forçado de homologação do Sentry (S02) — dado fictício: fulano.teste@example.com',
    )
    const Sentry = await import('@sentry/nextjs')
    const eventId = Sentry.captureException(error)
    await Sentry.flush(2000)
    return Response.json(
      {
        ok: false,
        message: 'Erro forçado registrado.',
        eventId,
        sentryEnabled: !!Sentry.getClient(),
      },
      { status: 500 },
    )
  },
}

import { resolveAppEnv } from '../env/app-env'
import { type ScrubbableEvent, scrubEvent } from './scrub'

/**
 * Opções comuns do Sentry (servidor, edge e cliente). Sem DSN, o SDK não é inicializado e o
 * app funciona normalmente. Plano gratuito: sem replay, sem perfis e com amostragem baixa
 * de traces para não exceder a cota.
 */
export function sentryOptions(dsn: string | undefined, appEnv: string | undefined) {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: resolveAppEnv(appEnv),
    sendDefaultPii: false,
    tracesSampleRate: 0,
    maxBreadcrumbs: 30,
    beforeSend<T extends ScrubbableEvent>(event: T): T {
      return scrubEvent(event)
    },
    beforeSendTransaction<T extends ScrubbableEvent>(event: T): T {
      return scrubEvent(event)
    },
  }
}

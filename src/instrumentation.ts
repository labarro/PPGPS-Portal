import * as Sentry from '@sentry/nextjs'

import { sentryOptions } from './lib/observability/sentry-options'

/** Inicializa o Sentry no servidor (Node e Edge) somente quando há DSN configurado. */
export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  Sentry.init(sentryOptions(dsn, process.env.APP_ENV))
}

export const onRequestError = Sentry.captureRequestError

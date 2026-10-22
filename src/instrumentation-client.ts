import * as Sentry from '@sentry/nextjs'

import { sentryOptions } from './lib/observability/sentry-options'

/** Sentry no navegador: só com DSN público configurado no build; sem replay nem PII. */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init(sentryOptions(dsn, process.env.NEXT_PUBLIC_APP_ENV))
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

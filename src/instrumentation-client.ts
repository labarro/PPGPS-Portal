import { sentryOptions } from './lib/observability/sentry-options'

/**
 * Sentry no navegador: só com DSN público configurado no build; sem replay nem PII.
 *
 * O DSN é sempre definido em tempo de build (`next.config.ts` → `env`), então sem DSN todo o
 * bloco abaixo é eliminado e o SDK não entra no JavaScript público. Com DSN, o SDK é carregado
 * de forma assíncrona (chunk próprio), fora do caminho crítico de renderização (S05: o SDK
 * incluído por engano no chunk principal custava ~66 KB comprimidos e derrubava o Lighthouse).
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

type SentryModule = typeof import('@sentry/nextjs')
let sentry: SentryModule | null = null

if (dsn) {
  void import('@sentry/nextjs').then((module) => {
    module.init(sentryOptions(dsn, process.env.NEXT_PUBLIC_APP_ENV))
    sentry = module
  })
}

export function onRouterTransitionStart(
  ...args: Parameters<SentryModule['captureRouterTransitionStart']>
): void {
  sentry?.captureRouterTransitionStart(...args)
}

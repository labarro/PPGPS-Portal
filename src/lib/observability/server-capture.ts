/**
 * Registro de erros TRATADOS no servidor (S06): o Sentry só é carregado quando há DSN; sem
 * DSN não faz nada. Somente o nome da leitura vai como contexto (sem dados pessoais; o
 * `beforeSend` de `sentry-options.ts` ainda aplica o scrubbing).
 */
export function reportServerError(error: unknown, context: Record<string, string> = {}): void {
  if (!process.env.SENTRY_DSN) return
  void import('@sentry/nextjs')
    .then((Sentry) =>
      Sentry.captureException(error, { tags: { handled: 'fallback' }, extra: context }),
    )
    .catch(() => undefined)
}

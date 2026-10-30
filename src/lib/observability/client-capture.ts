/**
 * Envio de erros do navegador ao Sentry carregando o SDK SOB DEMANDA (S05): sem DSN público
 * definido no build nada é carregado; com DSN, o SDK vem em chunk assíncrono, fora do
 * JavaScript inicial das páginas públicas. O SDK já foi inicializado por
 * `instrumentation-client.ts` (sem PII; ver `sentry-options.ts`).
 */
export function captureClientException(error: unknown): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  void import('@sentry/nextjs')
    .then((Sentry) => Sentry.captureException(error))
    .catch(() => undefined)
}

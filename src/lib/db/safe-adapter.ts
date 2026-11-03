import type { DatabaseAdapterObj } from 'payload'

/**
 * Correção do alerta do Sentry de 02/11/2026 (issue 7825652445, `Error: undefined`,
 * `auto.node.onunhandledrejection`, `GET /privacidade`).
 *
 * Causa comprovada (reproduzida localmente): quando a conexão com o Postgres falha durante a
 * inicialização do Payload, `@payloadcms/db-postgres` chama `this.rejectInitializing()` SEM
 * argumento. A promise `adapter.initializing` rejeita com `undefined` e, como só é aguardada
 * por `beginTransaction` (escritas), ninguém a observa numa leitura de página: o Node emite
 * `unhandledRejection` com motivo `undefined` e o Sentry registra `Error: undefined`, sem
 * pista da falha real (a conexão), que só aparecia no log.
 *
 * Este invólucro:
 * 1. substitui o motivo `undefined` por um erro descritivo (`DatabaseUnavailableError`);
 * 2. marca `initializing` como observada, porque a falha real já é propagada pela própria
 *    inicialização (`getPayload` rejeita com o erro de conexão) e passa a ser tratada e
 *    registrada em `src/lib/content/queries.ts`. Escritas que aguardem `initializing` ainda
 *    recebem a rejeição (agora com erro descritivo).
 * Nenhum tratamento global de `unhandledRejection` é alterado.
 */
export class DatabaseUnavailableError extends Error {
  readonly code = 'DATABASE_UNAVAILABLE'
  constructor(message = 'Banco de dados indisponível durante a inicialização do Payload.') {
    super(message)
    this.name = 'DatabaseUnavailableError'
  }
}

type InitializingAdapter = {
  initializing?: Promise<unknown>
  rejectInitializing?: (reason?: unknown) => void
}

export function withObservableInit<T extends DatabaseAdapterObj>(adapterObj: T): T {
  const init = adapterObj.init
  return {
    ...adapterObj,
    init: (args: Parameters<typeof init>[0]) => {
      const adapter = init(args) as ReturnType<typeof init> & InitializingAdapter
      const reject = adapter.rejectInitializing
      if (typeof reject === 'function') {
        adapter.rejectInitializing = (reason?: unknown) =>
          reject(reason ?? new DatabaseUnavailableError())
      }
      adapter.initializing?.catch(() => undefined)
      return adapter
    },
  }
}

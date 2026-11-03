import type { DatabaseAdapterObj } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { isDatabaseUnavailable, withDatabaseRetry } from '@/lib/db/availability'
import { DatabaseUnavailableError, withObservableInit } from '@/lib/db/safe-adapter'
import { handleReadError } from '@/lib/content/read-errors'

/**
 * Regressão do alerta do Sentry de 02/11/2026 (issue 7825652445): falha de conexão na
 * inicialização do Payload gerava `unhandledRejection` com motivo `undefined`.
 */

/** Imita o adaptador do @payloadcms/db-postgres 3.92 (promise `initializing` + rejeição sem motivo). */
function fakeAdapterObj() {
  const init = () => {
    let resolveInitializing!: (v?: unknown) => void
    let rejectInitializing!: (reason?: unknown) => void
    const initializing = new Promise((res, rej) => {
      resolveInitializing = res
      rejectInitializing = rej
    })
    return {
      name: 'fake',
      initializing,
      resolveInitializing,
      rejectInitializing,
      // Igual ao `connect()` do adaptador real quando a conexão falha.
      async connect(this: { rejectInitializing: (r?: unknown) => void }) {
        this.rejectInitializing()
        throw new Error('Error: cannot connect to Postgres: connect ECONNREFUSED')
      },
    }
  }
  return { defaultIDType: 'number', init } as unknown as DatabaseAdapterObj
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 20))

describe('withObservableInit (causa raiz do "Error: undefined")', () => {
  it('sem o invólucro, a falha de conexão gera unhandledRejection com motivo undefined', async () => {
    const reasons: unknown[] = []
    const listener = (reason: unknown) => reasons.push(reason)
    process.on('unhandledRejection', listener)
    try {
      const adapter = fakeAdapterObj().init({} as never) as unknown as {
        connect: () => Promise<void>
      }
      await expect(adapter.connect()).rejects.toThrow(/cannot connect/)
      await flush()
    } finally {
      process.off('unhandledRejection', listener)
    }
    expect(reasons).toEqual([undefined])
  })

  it('com o invólucro: nenhuma rejeição não tratada; a falha real continua propagada', async () => {
    const reasons: unknown[] = []
    const listener = (reason: unknown) => reasons.push(reason)
    process.on('unhandledRejection', listener)
    let adapter: { connect: () => Promise<void>; initializing: Promise<unknown> }
    try {
      adapter = withObservableInit(fakeAdapterObj()).init({} as never) as unknown as typeof adapter
      await expect(adapter.connect()).rejects.toThrow(/cannot connect to Postgres/)
      await flush()
    } finally {
      process.off('unhandledRejection', listener)
    }
    expect(reasons).toEqual([])
    // Quem aguarda `initializing` (ex.: beginTransaction) recebe um erro descritivo.
    await expect(adapter.initializing).rejects.toBeInstanceOf(DatabaseUnavailableError)
  })

  it('preserva um motivo explícito e o caminho de sucesso', async () => {
    const obj = withObservableInit(fakeAdapterObj())
    const a = obj.init({} as never) as unknown as {
      rejectInitializing: (r?: unknown) => void
      initializing: Promise<unknown>
    }
    const reason = new Error('motivo real')
    a.rejectInitializing(reason)
    await expect(a.initializing).rejects.toBe(reason)

    const b = obj.init({} as never) as unknown as {
      resolveInitializing: () => void
      initializing: Promise<unknown>
    }
    b.resolveInitializing()
    await expect(b.initializing).resolves.toBeUndefined()
    expect(obj.defaultIDType).toBe('number')
  })
})

describe('isDatabaseUnavailable', () => {
  it('reconhece falhas de inicialização e de conexão', () => {
    expect(isDatabaseUnavailable(Object.assign(new Error('x'), { payloadInitError: true }))).toBe(
      true,
    )
    expect(isDatabaseUnavailable(new DatabaseUnavailableError())).toBe(true)
    expect(isDatabaseUnavailable(Object.assign(new Error('x'), { code: 'ECONNREFUSED' }))).toBe(
      true,
    )
    expect(isDatabaseUnavailable(Object.assign(new Error('x'), { code: '57P01' }))).toBe(true)
    expect(isDatabaseUnavailable(new Error('Error: cannot connect to Postgres: timeout'))).toBe(
      true,
    )
    expect(
      isDatabaseUnavailable(
        new Error('wrap', { cause: Object.assign(new Error(), { code: 'ETIMEDOUT' }) }),
      ),
    ).toBe(true)
  })

  it('não confunde erros de consulta ou valores sem forma de erro', () => {
    expect(isDatabaseUnavailable(new Error('column "x" does not exist'))).toBe(false)
    expect(isDatabaseUnavailable(Object.assign(new Error('x'), { code: '42703' }))).toBe(false)
    expect(isDatabaseUnavailable(undefined)).toBe(false)
    expect(isDatabaseUnavailable('texto')).toBe(false)
  })
})

describe('withDatabaseRetry', () => {
  it('tenta uma segunda vez somente em indisponibilidade', async () => {
    const down = Object.assign(new Error('x'), { payloadInitError: true })
    const flaky = vi.fn().mockRejectedValueOnce(down).mockResolvedValueOnce('ok')
    await expect(withDatabaseRetry(flaky, 1)).resolves.toBe('ok')
    expect(flaky).toHaveBeenCalledTimes(2)

    const broken = vi.fn().mockRejectedValue(new Error('consulta inválida'))
    await expect(withDatabaseRetry(broken, 1)).rejects.toThrow('consulta inválida')
    expect(broken).toHaveBeenCalledTimes(1)

    const stillDown = vi.fn().mockRejectedValue(down)
    await expect(withDatabaseRetry(stillDown, 1)).rejects.toBe(down)
    expect(stillDown).toHaveBeenCalledTimes(2)
  })
})

describe('handleReadError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('banco indisponível: propaga (a página falha em vez de exibir estado vazio com 200)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const down = Object.assign(new Error('x'), { payloadInitError: true })
    expect(() => handleReadError(['group-profile'], null, down)).toThrow(down)
  })

  it('outros erros: valor padrão (degradação parcial)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubEnv('SENTRY_DSN', '')
    expect(handleReadError(['pages', 'list'], [], new Error('consulta inválida'))).toEqual([])
  })
})

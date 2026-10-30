import { afterEach, describe, expect, it, vi } from 'vitest'

const captureException = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}))

import { captureClientException } from '@/lib/observability/client-capture'

describe('erros do navegador com SDK do Sentry sob demanda (S05)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    captureException.mockClear()
  })

  it('sem DSN público não carrega o SDK nem envia nada', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '')
    captureClientException(new Error('x'))
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(captureException).not.toHaveBeenCalled()
  })

  it('com DSN público carrega o SDK de forma assíncrona e registra o erro', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://publickey@o0.ingest.example.com/0')
    const error = new Error('falha fictícia')
    captureClientException(error)
    await vi.waitFor(() => expect(captureException).toHaveBeenCalledWith(error))
  })
})

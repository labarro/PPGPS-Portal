import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { RedirectHit } from '@/lib/content/redirect-lookup'
import { NOINDEX_VALUE } from '@/lib/security/headers'
import { handleProxy } from '@/proxy'

const request = (authorization?: string, path = '/admin', method = 'GET') =>
  new NextRequest(`https://preview.example.com${path}`, {
    method,
    headers: authorization ? { authorization } : {},
  })

const basic = (user: string, password: string) => `Basic ${btoa(`${user}:${password}`)}`

const noRedirect = vi.fn(async (): Promise<RedirectHit | null> => null)
const proxy = (req: NextRequest) => handleProxy(req, noRedirect)

afterEach(() => {
  vi.unstubAllEnvs()
  noRedirect.mockClear()
})

describe('proxy (autenticação básica + noindex)', () => {
  it('preview sem credenciais configuradas falha fechado (503)', async () => {
    vi.stubEnv('APP_ENV', 'preview')
    vi.stubEnv('BASIC_AUTH_USER', '')
    vi.stubEnv('BASIC_AUTH_PASSWORD', '')
    const response = await proxy(request())
    expect(response.status).toBe(503)
    expect(response.headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })

  it.each(['preview', 'staging'])(
    '%s exige autenticação básica (401 sem credenciais)',
    async (env) => {
      vi.stubEnv('APP_ENV', env)
      vi.stubEnv('BASIC_AUTH_USER', 'revisor')
      vi.stubEnv('BASIC_AUTH_PASSWORD', 'segredo')
      const response = await proxy(request())
      expect(response.status).toBe(401)
      expect(response.headers.get('WWW-Authenticate')).toMatch(/^Basic /)
      expect(response.headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
    },
  )

  it('nega credenciais incorretas', async () => {
    vi.stubEnv('APP_ENV', 'staging')
    vi.stubEnv('BASIC_AUTH_USER', 'revisor')
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'segredo')
    expect((await proxy(request(basic('revisor', 'errado')))).status).toBe(401)
  })

  it('libera credenciais corretas com noindex', async () => {
    vi.stubEnv('APP_ENV', 'staging')
    vi.stubEnv('BASIC_AUTH_USER', 'revisor')
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'segredo')
    const response = await proxy(request(basic('revisor', 'segredo')))
    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })

  it('local sem credenciais não exige autenticação, mas aplica noindex', async () => {
    vi.stubEnv('APP_ENV', 'local')
    vi.stubEnv('BASIC_AUTH_USER', '')
    vi.stubEnv('BASIC_AUTH_PASSWORD', '')
    const response = await proxy(request())
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })

  it('APP_ENV ausente é tratado como não produtivo (noindex)', async () => {
    vi.stubEnv('APP_ENV', '')
    vi.stubEnv('BASIC_AUTH_USER', '')
    vi.stubEnv('BASIC_AUTH_PASSWORD', '')
    expect((await proxy(request())).headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })

  it('produção não exige autenticação básica nem aplica noindex', async () => {
    vi.stubEnv('APP_ENV', 'production')
    vi.stubEnv('BASIC_AUTH_USER', 'revisor')
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'segredo')
    const response = await proxy(request())
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Robots-Tag')).toBeNull()
  })
})

describe('proxy (redirecionamentos 301 do plugin de redirects)', () => {
  const hit = vi.fn(
    async (path: string): Promise<RedirectHit | null> =>
      path === '/linhas/antiga' ? { to: '/linhas/nova', status: 301 } : null,
  )

  it('responde 301 com Location para o novo endereço (e noindex fora da produção)', async () => {
    vi.stubEnv('APP_ENV', 'local')
    vi.stubEnv('BASIC_AUTH_USER', '')
    vi.stubEnv('BASIC_AUTH_PASSWORD', '')
    const response = await handleProxy(request(undefined, '/linhas/antiga'), hit)
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://preview.example.com/linhas/nova')
    expect(response.headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })

  it('não consulta redirecionamentos antes da autenticação básica', async () => {
    vi.stubEnv('APP_ENV', 'staging')
    vi.stubEnv('BASIC_AUTH_USER', 'revisor')
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'segredo')
    hit.mockClear()
    const response = await handleProxy(request(undefined, '/linhas/antiga'), hit)
    expect(response.status).toBe(401)
    expect(hit).not.toHaveBeenCalled()
  })

  it('ignora métodos diferentes de GET/HEAD e segue quando a consulta falha', async () => {
    vi.stubEnv('APP_ENV', 'production')
    hit.mockClear()
    expect((await handleProxy(request(undefined, '/linhas/antiga', 'POST'), hit)).status).toBe(200)
    expect(hit).not.toHaveBeenCalled()

    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failing = vi.fn(async () => {
      throw new Error('banco indisponível')
    })
    const response = await handleProxy(request(undefined, '/linhas/antiga'), failing)
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Robots-Tag')).toBeNull()
    spy.mockRestore()
  })

  it('em produção redireciona sem noindex', async () => {
    vi.stubEnv('APP_ENV', 'production')
    const response = await handleProxy(request(undefined, '/linhas/antiga'), hit)
    expect(response.status).toBe(301)
    expect(response.headers.get('X-Robots-Tag')).toBeNull()
  })
})

describe('proxy (domínio oficial, ADR-0014)', () => {
  const at = (url: string) => new NextRequest(url)

  it('produção redireciona www.bioeticaps.app para o apex com 308, preservando caminho e query', async () => {
    vi.stubEnv('APP_ENV', 'production')
    const response = await proxy(at('https://www.bioeticaps.app/linhas/bioetica?x=1'))
    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://bioeticaps.app/linhas/bioetica?x=1')
    expect(noRedirect).not.toHaveBeenCalled()
  })

  it('produção não redireciona o apex', async () => {
    vi.stubEnv('APP_ENV', 'production')
    expect((await proxy(at('https://bioeticaps.app/'))).status).toBe(200)
  })

  it('fora da produção não redireciona por host e mantém autenticação e noindex', async () => {
    vi.stubEnv('APP_ENV', 'staging')
    vi.stubEnv('BASIC_AUTH_USER', 'revisor')
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'segredo')
    const response = await proxy(at('https://www.bioeticaps.app/'))
    expect(response.status).toBe(401)
    expect(response.headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })
})

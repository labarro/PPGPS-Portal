import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NOINDEX_VALUE } from '@/lib/security/headers'
import { proxy } from '@/proxy'

const request = (authorization?: string) =>
  new NextRequest('https://preview.example.com/admin', {
    headers: authorization ? { authorization } : {},
  })

const basic = (user: string, password: string) => `Basic ${btoa(`${user}:${password}`)}`

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('proxy (autenticação básica + noindex)', () => {
  it('preview sem credenciais configuradas falha fechado (503)', () => {
    vi.stubEnv('APP_ENV', 'preview')
    vi.stubEnv('BASIC_AUTH_USER', '')
    vi.stubEnv('BASIC_AUTH_PASSWORD', '')
    const response = proxy(request())
    expect(response.status).toBe(503)
    expect(response.headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })

  it.each(['preview', 'staging'])('%s exige autenticação básica (401 sem credenciais)', (env) => {
    vi.stubEnv('APP_ENV', env)
    vi.stubEnv('BASIC_AUTH_USER', 'revisor')
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'segredo')
    const response = proxy(request())
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toMatch(/^Basic /)
    expect(response.headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })

  it('nega credenciais incorretas', () => {
    vi.stubEnv('APP_ENV', 'staging')
    vi.stubEnv('BASIC_AUTH_USER', 'revisor')
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'segredo')
    expect(proxy(request(basic('revisor', 'errado'))).status).toBe(401)
  })

  it('libera credenciais corretas com noindex', () => {
    vi.stubEnv('APP_ENV', 'staging')
    vi.stubEnv('BASIC_AUTH_USER', 'revisor')
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'segredo')
    const response = proxy(request(basic('revisor', 'segredo')))
    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })

  it('local sem credenciais não exige autenticação, mas aplica noindex', () => {
    vi.stubEnv('APP_ENV', 'local')
    vi.stubEnv('BASIC_AUTH_USER', '')
    vi.stubEnv('BASIC_AUTH_PASSWORD', '')
    const response = proxy(request())
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })

  it('APP_ENV ausente é tratado como não produtivo (noindex)', () => {
    vi.stubEnv('APP_ENV', '')
    vi.stubEnv('BASIC_AUTH_USER', '')
    vi.stubEnv('BASIC_AUTH_PASSWORD', '')
    expect(proxy(request()).headers.get('X-Robots-Tag')).toBe(NOINDEX_VALUE)
  })

  it('produção não exige autenticação básica nem aplica noindex', () => {
    vi.stubEnv('APP_ENV', 'production')
    vi.stubEnv('BASIC_AUTH_USER', 'revisor')
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'segredo')
    const response = proxy(request())
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Robots-Tag')).toBeNull()
  })
})

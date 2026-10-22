import { describe, expect, it } from 'vitest'

import { checkPassword, PASSWORD_MIN_LENGTH } from '@/lib/auth/password-policy'
import { clientIp, truncateIp } from '@/lib/security/ip'
import { AUTH_RATE_LIMITS, SlidingWindowRateLimiter } from '@/lib/security/rate-limit'

const headers = (values: Record<string, string>) => new Headers(values)

describe('política de senha', () => {
  it('exige no mínimo 12 caracteres', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12)
    expect(checkPassword('Ab1!xY7#qW')).toMatchObject({ ok: false })
    expect(checkPassword('')).toMatchObject({ ok: false })
    expect(checkPassword(undefined)).toMatchObject({ ok: false })
    expect(checkPassword('x'.repeat(129))).toMatchObject({ ok: false })
  })

  it.each([
    'password1234',
    'Senha1234567',
    'senha123456789',
    'qwerty123456',
    'aaaaaaaaaaaa',
    'abcabcabcabc',
    'abcdefghijklm',
    '1234567890123',
    'administrador',
    'Bioetica2026!',
    'unicesumar2026',
  ])('recusa senha comum ou previsível: %s', (password) => {
    expect(checkPassword(password).ok).toBe(false)
  })

  it('recusa senha que contém o e-mail', () => {
    expect(checkPassword('coordenacao-2026-xyz', 'coordenacao@example.com').ok).toBe(false)
  })

  it('aceita senhas longas e imprevisíveis, inclusive frases', () => {
    expect(checkPassword('tucano verde dança no cerrado').ok).toBe(true)
    expect(checkPassword('V7#mKp2!qLx9@Rt').ok).toBe(true)
  })
})

describe('limite de taxa (janela deslizante)', () => {
  it('permite até o limite e bloqueia o excedente, liberando após a janela', () => {
    let now = 0
    const limiter = new SlidingWindowRateLimiter(() => now)
    const rule = { limit: 3, windowMs: 1000 }
    expect(limiter.hit('k', rule).allowed).toBe(true)
    expect(limiter.hit('k', rule).allowed).toBe(true)
    expect(limiter.hit('k', rule)).toMatchObject({ allowed: true, remaining: 0 })
    const blocked = limiter.hit('k', rule)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBe(1)
    expect(limiter.hit('outra', rule).allowed).toBe(true)
    now = 1001
    expect(limiter.hit('k', rule).allowed).toBe(true)
  })

  it('não cresce sem limite de memória', () => {
    let now = 0
    const limiter = new SlidingWindowRateLimiter(() => now, 5)
    for (let i = 0; i < 20; i += 1) {
      now += 1
      limiter.hit(`ip-${i}`, { limit: 1, windowMs: 10 })
    }
    expect(limiter.size).toBeLessThanOrEqual(5)
    limiter.reset()
    expect(limiter.size).toBe(0)
  })

  it('regras de autenticação conforme a S02', () => {
    expect(AUTH_RATE_LIMITS.login).toEqual({ limit: 10, windowMs: 600_000 })
    expect(AUTH_RATE_LIMITS.forgotPassword).toEqual({ limit: 5, windowMs: 900_000 })
  })
})

describe('IP do cliente e truncamento (auditoria)', () => {
  it('usa o primeiro x-forwarded-for válido, depois x-real-ip', () => {
    expect(clientIp(headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7')
    expect(clientIp(headers({ 'x-forwarded-for': 'lixo', 'x-real-ip': '2001:db8::1' }))).toBe(
      '2001:db8::1',
    )
    expect(clientIp(headers({}))).toBeNull()
    expect(clientIp(null)).toBeNull()
  })

  it('trunca IPv4 em /24 e IPv6 em /48', () => {
    expect(truncateIp('203.0.113.77')).toBe('203.0.113.0')
    expect(truncateIp('2001:db8:abcd:12:1:2:3:4')).toBe('2001:db8:abcd::')
    expect(truncateIp('2001:db8::1')).toBe('2001:db8:0::')
    expect(truncateIp('::ffff:198.51.100.9')).toBe('198.51.100.0')
    expect(truncateIp('não é ip')).toBeNull()
    expect(truncateIp(null)).toBeNull()
  })
})

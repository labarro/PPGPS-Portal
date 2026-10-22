import { describe, expect, it } from 'vitest'

import { passwordEmailKind } from '@/collections/Users/email'
import {
  escapeHtml,
  passwordEmailHtml,
  passwordEmailSubject,
  resetPasswordUrl,
} from '@/lib/email/templates'
import { maskEmail, resolveEmailTransport } from '@/lib/email/transport'
import { resolveServerUrl } from '@/lib/env/server-url'
import { scrubEvent, scrubText } from '@/lib/observability/scrub'
import { sentryOptions } from '@/lib/observability/sentry-options'

describe('transporte de e-mail', () => {
  it('fora da produção, sem SMTP: captura (não envia)', () => {
    expect(resolveEmailTransport({ APP_ENV: 'staging' }).kind).toBe('capture')
    expect(resolveEmailTransport({ APP_ENV: 'local' }).kind).toBe('capture')
  })

  it('fora da produção, SMTP real é bloqueado; Mailpit e sandbox declarada são aceitos', () => {
    expect(resolveEmailTransport({ APP_ENV: 'preview', SMTP_HOST: 'smtp.provedor.com' }).kind).toBe(
      'capture',
    )
    expect(
      resolveEmailTransport({ APP_ENV: 'local', SMTP_HOST: 'localhost', SMTP_PORT: '1025' }),
    ).toMatchObject({
      kind: 'smtp',
      port: 1025,
      sandbox: true,
    })
    expect(
      resolveEmailTransport({
        APP_ENV: 'staging',
        SMTP_HOST: 'sandbox.smtp.example.com',
        EMAIL_SMTP_IS_SANDBOX: 'true',
      }).kind,
    ).toBe('smtp')
  })

  it('na produção usa SMTP; sem SMTP, falha explicitamente', () => {
    expect(resolveEmailTransport({ APP_ENV: 'production' }).kind).toBe('disabled')
    expect(
      resolveEmailTransport({
        APP_ENV: 'production',
        SMTP_HOST: 'smtp.provedor.com',
        SMTP_PORT: '465',
      }),
    ).toMatchObject({
      kind: 'smtp',
      secure: true,
      sandbox: false,
    })
  })

  it('mascara e-mails nos logs', () => {
    expect(maskEmail('coordenacao@example.com')).toBe('c***@example.com')
    expect(maskEmail('invalido')).toBe('***')
    expect(maskEmail(undefined)).toBe('(desconhecido)')
  })
})

describe('modelos de e-mail (pt-BR)', () => {
  it('assuntos em português', () => {
    expect(passwordEmailSubject('setup')).toBe('Defina sua senha de acesso ao portal')
    expect(passwordEmailSubject('reset')).toBe('Redefinição de senha do portal')
  })

  it('escapa valores e informa validade de 60 minutos', () => {
    const html = passwordEmailHtml({
      kind: 'reset',
      name: '<b>Fulana</b>',
      url: 'https://portal.example.com/admin/reset/abc"def',
      expiresInMinutes: 60,
    })
    expect(html).toContain('&lt;b&gt;Fulana&lt;/b&gt;')
    expect(html).not.toContain('<b>Fulana</b>')
    expect(html).toContain('abc&quot;def')
    expect(html).toContain('60 minutos')
    expect(html).toContain('lang="pt-BR"')
    expect(escapeHtml(`'&`)).toBe('&#39;&amp;')
  })

  it('monta a URL de redefinição a partir da URL configurada', () => {
    expect(resetPasswordUrl('https://h.example.com/', 'tok en')).toBe(
      'https://h.example.com/admin/reset/tok%20en',
    )
    expect(passwordEmailKind({ lastLoginAt: null })).toBe('setup')
    expect(passwordEmailKind({ lastLoginAt: '2026-01-01T00:00:00Z' })).toBe('reset')
  })
})

describe('URL pública do ambiente (nunca do cabeçalho Host)', () => {
  it('prioriza SERVER_URL, depois VERCEL_URL, depois localhost', () => {
    expect(resolveServerUrl({ SERVER_URL: 'https://h.example.com/' })).toBe('https://h.example.com')
    expect(resolveServerUrl({ VERCEL_URL: 'app-abc.vercel.app' })).toBe(
      'https://app-abc.vercel.app',
    )
    expect(resolveServerUrl({ PORT: '3100' })).toBe('http://localhost:3100')
  })
})

describe('Sentry sem dados pessoais', () => {
  it('remove e-mails, IPs, tokens e credenciais de textos', () => {
    const text = scrubText(
      'Falha para fulana@example.com de 203.0.113.9 em /admin/reset/abc123 com JWT eyJhbGciOi.x.y e 2001:db8:0:0:0:0:0:1 token 0123456789abcdef0123456789abcdef',
    )
    expect(text).not.toMatch(
      /fulana@example\.com|203\.0\.113\.9|abc123|eyJhbGciOi|2001:db8|0123456789abcdef0123/,
    )
  })

  it('remove usuário, cookies, corpo, query string e cabeçalhos sensíveis do evento', () => {
    const event = scrubEvent({
      message: 'Erro de fulano@example.com',
      user: { email: 'fulano@example.com', ip_address: '203.0.113.9' },
      server_name: 'maquina',
      request: {
        url: 'https://portal.example.com/admin/reset/segredo?email=fulano@example.com',
        query_string: 'email=fulano@example.com',
        cookies: { 'payload-token': 'x' },
        data: { password: 'x' },
        headers: {
          Authorization: 'JWT abc',
          Cookie: 'a=b',
          'User-Agent': 'teste',
          'X-Forwarded-For': '203.0.113.9',
        },
      },
      exception: { values: [{ value: 'Falha para fulano@example.com' }] },
      breadcrumbs: [{ message: 'login fulano@example.com', data: { email: 'x', url: '/a?b' } }],
      extra: { userEmail: 'fulano@example.com', detalhe: 'ip 203.0.113.9' },
    })
    const serialized = JSON.stringify(event)
    expect(serialized).not.toContain('fulano@example.com')
    expect(serialized).not.toContain('203.0.113.9')
    expect(serialized).not.toContain('segredo')
    expect(event.user).toBeUndefined()
    expect(event.request?.cookies).toBeUndefined()
    expect(event.request?.data).toBeUndefined()
    expect(event.request?.headers).toEqual({ 'User-Agent': 'teste' })
  })

  it('sem DSN o SDK fica desabilitado; PII nunca é enviada', () => {
    const disabled = sentryOptions(undefined, 'staging')
    expect(disabled.enabled).toBe(false)
    expect(disabled.sendDefaultPii).toBe(false)
    const enabled = sentryOptions('https://chave@o0.ingest.sentry.io/0', 'staging')
    expect(enabled.enabled).toBe(true)
    expect(enabled.environment).toBe('staging')
    expect(enabled.beforeSend({ user: { email: 'a@b.com' } }).user).toBeUndefined()
  })
})

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { cleanupAccounts, createAccount } from '../helpers/fixtures'
import { deleteMessagesTo, extractResetToken, waitForMessage } from '../helpers/mailpit'
import { restJson } from '../helpers/rest'
import { strongTestPassword } from '../helpers/test-env'

let payload: Payload

const minutesFromNow = (iso: string | null | undefined) =>
  (new Date(iso ?? 0).getTime() - Date.now()) / 60_000

describe('Autenticação: senha, bloqueio, limite de taxa, sessão e recuperação', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    await cleanupAccounts(payload)
  })

  describe('política de senha', () => {
    it.each([
      ['curta', 'Ab1!cdEf'],
      ['comum', 'password1234'],
      ['previsível', 'senha12345678'],
      ['repetitiva', 'abcabcabcabc'],
    ])('rejeita senha %s', async (_kind, password) => {
      await expect(
        payload.create({
          collection: 'users',
          data: { email: `fraca-${Date.now()}@int.example.com`, password, roles: ['editor'] },
          context: { skipSetupEmail: true },
        }),
      ).rejects.toThrow()
    })

    it('aceita senha forte', async () => {
      const account = await createAccount(payload, ['editor'])
      expect(account.id).toBeTruthy()
    })
  })

  describe('bloqueio após 5 tentativas', () => {
    it('bloqueia por 15 minutos e recusa até a senha correta', async () => {
      const account = await createAccount(payload, ['editor'])
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        await expect(
          payload.login({
            collection: 'users',
            data: { email: account.email, password: 'Errada-Senha-123' },
          }),
        ).rejects.toThrow()
      }
      const locked = await payload.findByID({
        collection: 'users',
        id: account.id,
        showHiddenFields: true,
      })
      const minutes = minutesFromNow(locked.lockUntil)
      expect(minutes).toBeGreaterThan(14)
      expect(minutes).toBeLessThanOrEqual(15.1)

      await expect(
        payload.login({
          collection: 'users',
          data: { email: account.email, password: account.password },
        }),
      ).rejects.toThrow(/locked|bloquead/i)
    })
  })

  describe('limite de taxa (por IP, via REST)', () => {
    it('limita recuperação de senha a 5 pedidos por 15 minutos', async () => {
      const ip = '198.19.0.10'
      const statuses: number[] = []
      for (let i = 0; i < 6; i += 1) {
        const { status } = await restJson('POST', '/users/forgot-password', {
          body: { email: `inexistente-${i}@int.example.com` },
          ip,
        })
        statuses.push(status)
      }
      expect(statuses.slice(0, 5).every((status) => status === 200)).toBe(true)
      expect(statuses[5]).toBe(429)
    })

    it('limita tentativas de login a 10 por 10 minutos', async () => {
      const ip = '198.19.0.11'
      let last = 0
      for (let i = 0; i < 11; i += 1) {
        last = (
          await restJson('POST', '/users/login', {
            body: { email: `ninguem-${i}@int.example.com`, password: 'Qualquer-Senha-1' },
            ip,
          })
        ).status
      }
      expect(last).toBe(429)
    })
  })

  describe('sessão', () => {
    it('token expira em 2 horas e cookie é HttpOnly/SameSite=Lax', async () => {
      const account = await createAccount(payload, ['editor'])
      const { response, json } = await restJson<{ token: string; exp: number }>(
        'POST',
        '/users/login',
        {
          body: { email: account.email, password: account.password },
        },
      )
      const [, body] = json.token.split('.')
      const claims = JSON.parse(Buffer.from(body ?? '', 'base64url').toString()) as {
        exp: number
        iat: number
      }
      expect(claims.exp - claims.iat).toBe(2 * 60 * 60)
      const cookie = response.headers.get('set-cookie') ?? ''
      expect(cookie).toMatch(/HttpOnly/i)
      expect(cookie).toMatch(/SameSite=Lax/i)
    })
  })

  describe('recuperação de senha por e-mail (capturado no Mailpit)', () => {
    it('envia link em português, válido por 1 h, de uso único, com URL configurada (não do Host)', async () => {
      const account = await createAccount(payload, ['editor'], { name: 'Pessoa Fictícia' })
      await deleteMessagesTo(account.email)

      const { status } = await restJson('POST', '/users/forgot-password', {
        body: { email: account.email },
        headers: { host: 'atacante.example.net', 'x-forwarded-host': 'atacante.example.net' },
      })
      expect(status).toBe(200)

      const message = await waitForMessage(account.email)
      expect(message.subject).toMatch(/senha/i)
      expect(message.html).toContain('O link vale por 60 minutos')
      const { url, token } = extractResetToken(message.html)
      expect(url).not.toContain('atacante.example.net')
      expect(url.startsWith(process.env.SERVER_URL || 'http://localhost')).toBe(true)

      const user = await payload.findByID({
        collection: 'users',
        id: account.id,
        showHiddenFields: true,
      })
      const minutes = minutesFromNow(user.resetPasswordExpiration)
      expect(minutes).toBeGreaterThan(59)
      expect(minutes).toBeLessThanOrEqual(60.1)

      const weak = await restJson('POST', '/users/reset-password', {
        body: { token, password: 'curta' },
      })
      expect(weak.status).toBe(400)

      const newPassword = strongTestPassword()
      const ok = await restJson('POST', '/users/reset-password', {
        body: { token, password: newPassword },
      })
      expect(ok.status).toBe(200)

      const reuse = await restJson('POST', '/users/reset-password', {
        body: { token, password: strongTestPassword() },
      })
      expect(reuse.status).toBe(403)

      const login = await payload.login({
        collection: 'users',
        data: { email: account.email, password: newPassword },
      })
      expect(login.token).toBeTruthy()
    })

    it('recusa token expirado (após 1 h)', async () => {
      const account = await createAccount(payload, ['editor'])
      const token = await payload.forgotPassword({
        collection: 'users',
        data: { email: account.email },
        disableEmail: true,
      })
      await payload.db.updateOne({
        collection: 'users',
        id: account.id,
        data: { resetPasswordExpiration: new Date(Date.now() - 1000).toISOString() },
      })
      const { status } = await restJson('POST', '/users/reset-password', {
        body: { token, password: strongTestPassword() },
      })
      expect(status).toBe(403)
    })

    it('conta criada pelo admin recebe e-mail para definir a senha', async () => {
      const admin = await createAccount(payload, ['admin'])
      const email = `convite-${Date.now()}@int.example.com`
      await deleteMessagesTo(email)
      await payload.create({
        collection: 'users',
        data: { email, password: strongTestPassword(), roles: ['editor'] },
        user: await payload.findByID({ collection: 'users', id: admin.id }),
        overrideAccess: false,
      })
      const message = await waitForMessage(email)
      expect(message.subject).toBe('Defina sua senha de acesso ao portal')
    })
  })
})

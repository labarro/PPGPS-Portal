import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { authRateLimiter } from '@/lib/security/rate-limit'
import { DEFAULT_NAVIGATION } from '@/lib/site/chrome'

import { cleanupAccounts, createAccount, INT_DOMAIN, type TestAccount } from '../helpers/fixtures'
import { loginRest, restJson } from '../helpers/rest'
import { strongTestPassword } from '../helpers/test-env'

/**
 * Matriz 14.3 (S02) por papel, via API REST (o mesmo caminho usado pelo painel):
 * visitante anônimo, editor (coordenador) e admin (desenvolvedor).
 */
let payload: Payload
let admin: TestAccount
let editor: TestAccount
let adminToken: string
let editorToken: string

describe('RBAC — usuários, papéis e configurações', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    authRateLimiter.reset()
    admin = await createAccount(payload, ['admin'])
    editor = await createAccount(payload, ['editor'])
    adminToken = await loginRest(admin.email, admin.password)
    editorToken = await loginRest(editor.email, editor.password)
  })

  afterAll(async () => {
    await cleanupAccounts(payload)
  })

  describe('visitante anônimo', () => {
    it('não lista usuários nem auditoria', async () => {
      expect((await restJson('GET', '/users')).status).toBe(403)
      expect((await restJson('GET', '/audit-logs')).status).toBe(403)
    })

    it('não há cadastro público: criar conta é negado', async () => {
      const { status } = await restJson('POST', '/users', {
        body: { email: `publico${INT_DOMAIN}`, password: strongTestPassword(), roles: ['admin'] },
      })
      expect(status).toBe(403)
      expect(
        await payload.count({
          collection: 'users',
          where: { email: { equals: `publico${INT_DOMAIN}` } },
        }),
      ).toEqual({ totalDocs: 0 })
    })

    it('o bootstrap do primeiro usuário fica bloqueado quando já existem contas', async () => {
      const { status } = await restJson('POST', '/users/first-register', {
        body: { email: `primeiro${INT_DOMAIN}`, password: strongTestPassword() },
      })
      expect(status).toBe(403)
    })

    it('não escreve em mídia, documentos, auditoria nem globals', async () => {
      expect((await restJson('POST', '/documents', { body: { title: 'x' } })).status).toBe(403)
      expect((await restJson('POST', '/media', { body: { alt: 'x' } })).status).toBe(403)
      expect((await restJson('POST', '/audit-logs', { body: { action: 'login' } })).status).toBe(
        403,
      )
      const nav = await restJson('POST', '/globals/navigation', {
        body: { items: [{ label: 'Invasor', href: '/x' }] },
      })
      expect(nav.status).toBe(403)
    })

    it('lê os globals públicos do site', async () => {
      expect((await restJson('GET', '/globals/navigation')).status).toBe(200)
      expect((await restJson('GET', '/globals/footer')).status).toBe(200)
      expect((await restJson('GET', '/globals/site-settings')).status).toBe(200)
    })
  })

  describe('editor (coordenador)', () => {
    it('vê somente a própria conta', async () => {
      const { status, json } = await restJson<{ docs: { email: string }[] }>('GET', '/users', {
        token: editorToken,
      })
      expect(status).toBe(200)
      expect(json.docs.map((doc) => doc.email)).toEqual([editor.email])
    })

    it('não cria usuários', async () => {
      const { status } = await restJson('POST', '/users', {
        token: editorToken,
        body: {
          email: `criado-por-editor${INT_DOMAIN}`,
          password: strongTestPassword(),
          roles: ['editor'],
        },
      })
      expect(status).toBe(403)
    })

    it('não altera papéis (nem os próprios) nem ativa/desativa contas', async () => {
      await restJson('PATCH', `/users/${editor.id}`, {
        token: editorToken,
        body: { roles: ['admin'], active: false },
      })
      const after = await payload.findByID({ collection: 'users', id: editor.id })
      expect(after.roles).toEqual(['editor'])
      expect(after.active).toBe(true)
    })

    it('não edita nem exclui outras contas', async () => {
      const patch = await restJson('PATCH', `/users/${admin.id}`, {
        token: editorToken,
        body: { name: 'Alterado' },
      })
      expect([403, 404]).toContain(patch.status)
      const del = await restJson('DELETE', `/users/${admin.id}`, { token: editorToken })
      expect([403, 404]).toContain(del.status)
      expect((await payload.findByID({ collection: 'users', id: admin.id })).name).not.toBe(
        'Alterado',
      )
    })

    it('lê a auditoria, mas não a altera nem exclui', async () => {
      const list = await restJson<{ docs: { id: number }[] }>('GET', '/audit-logs', {
        token: editorToken,
      })
      expect(list.status).toBe(200)
      const first = list.json.docs[0]
      expect(first).toBeDefined()
      expect(
        (
          await restJson('PATCH', `/audit-logs/${first?.id}`, {
            token: editorToken,
            body: { action: 'export' },
          })
        ).status,
      ).toBe(403)
      expect(
        (await restJson('DELETE', `/audit-logs/${first?.id}`, { token: editorToken })).status,
      ).toBe(403)
    })

    it('edita navegação, mas não as configurações técnicas', async () => {
      const nav = await restJson('POST', '/globals/navigation', {
        token: editorToken,
        // Menu padrão da S03 (estado canônico para os demais testes e o E2E local).
        body: { items: DEFAULT_NAVIGATION },
      })
      expect(nav.status).toBe(200)

      await restJson('POST', '/globals/site-settings', {
        token: editorToken,
        body: { technical: { showIndicators: true } },
      })
      const settings = await payload.findGlobal({ slug: 'site-settings' })
      expect(settings.technical?.showIndicators).not.toBe(true)
    })

    it('não acessa o endpoint técnico de teste do Sentry', async () => {
      expect((await restJson('POST', '/users/sentry-test', { token: editorToken })).status).toBe(
        403,
      )
    })
  })

  describe('admin (desenvolvedor)', () => {
    it('cria a conta do coordenador com papel editor', async () => {
      const email = `novo-editor${INT_DOMAIN}`
      const { status, json } = await restJson<{ doc: { id: number; roles: string[] } }>(
        'POST',
        '/users',
        {
          token: adminToken,
          body: { email, password: strongTestPassword(), roles: ['editor'] },
        },
      )
      expect(status).toBe(201)
      expect(json.doc.roles).toEqual(['editor'])
    })

    it('rejeita papéis inexistentes (não há "researcher")', async () => {
      const { status } = await restJson('POST', '/users', {
        token: adminToken,
        body: {
          email: `pesquisador${INT_DOMAIN}`,
          password: strongTestPassword(),
          roles: ['researcher'],
        },
      })
      expect(status).toBe(400)
      expect(payload.config.collections.find((c) => c.slug === 'users')).toBeDefined()
    })

    it('altera papéis e ativa/desativa contas', async () => {
      const target = await createAccount(payload, ['editor'])
      const { status } = await restJson('PATCH', `/users/${target.id}`, {
        token: adminToken,
        body: { roles: ['admin', 'editor'], active: false },
      })
      expect(status).toBe(200)
      const after = await payload.findByID({ collection: 'users', id: target.id })
      expect(after.roles?.slice().sort()).toEqual(['admin', 'editor'])
      expect(after.active).toBe(false)
    })

    it('conta desativada não entra e perde as permissões', async () => {
      const inactive = await createAccount(payload, ['admin'], { active: false })
      const { status } = await restJson('POST', '/users/login', {
        body: { email: inactive.email, password: inactive.password },
        ip: '203.0.113.77',
      })
      expect(status).toBe(403)
    })
  })
})

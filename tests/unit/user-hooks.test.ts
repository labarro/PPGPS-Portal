import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  blockInactiveLogin,
  enforceAuthPolicies,
  firstUserIsAdmin,
  protectLastAdmin,
} from '@/collections/Users/hooks'
import { secureUpload } from '@/hooks/upload-security'
import { authRateLimiter } from '@/lib/security/rate-limit'

import { FAKE_EXE, TINY_PNG } from '../helpers/files'

/** Requisição falsa mínima: `count` controla quantos usuários/admins "existem". */
function fakeReq(count: number, extra: Partial<PayloadRequest> = {}) {
  return {
    payload: { count: vi.fn().mockResolvedValue({ totalDocs: count }) },
    headers: new Headers({ 'x-forwarded-for': '198.18.9.9' }),
    payloadAPI: 'REST',
    ...extra,
  } as unknown as PayloadRequest
}

type AnyHook = (args: Record<string, unknown>) => unknown

describe('primeiro usuário (bootstrap)', () => {
  it('em banco vazio vira admin ativo, ignorando papéis enviados', async () => {
    const result = await (firstUserIsAdmin as unknown as AnyHook)({
      data: { email: 'a@example.com', roles: ['editor'], active: false },
      operation: 'create',
      req: fakeReq(0),
    })
    expect(result).toMatchObject({ roles: ['admin'], active: true })
  })

  it('com contas existentes mantém os papéis normalizados', async () => {
    const result = await (firstUserIsAdmin as unknown as AnyHook)({
      data: { roles: ['editor', 'researcher'] },
      operation: 'create',
      req: fakeReq(2),
    })
    expect(result).toMatchObject({ roles: ['editor'] })
  })
})

describe('proteção do último administrador', () => {
  const original = { id: 1, roles: ['admin'], active: true }

  it('impede remover o papel ou desativar o último admin ativo', async () => {
    for (const data of [{ roles: ['editor'] }, { active: false }]) {
      await expect(
        (protectLastAdmin as unknown as AnyHook)({
          data,
          operation: 'update',
          originalDoc: original,
          req: fakeReq(0),
        }),
      ).rejects.toMatchObject({
        data: {
          errors: [
            expect.objectContaining({ message: expect.stringMatching(/último administrador/) }),
          ],
        },
      })
    }
  })

  it('permite quando há outro admin ativo', async () => {
    const data = { roles: ['editor'] }
    await expect(
      (protectLastAdmin as unknown as AnyHook)({
        data,
        operation: 'update',
        originalDoc: original,
        req: fakeReq(1),
      }),
    ).resolves.toBe(data)
  })
})

describe('políticas de autenticação', () => {
  it('rejeita senha fraca na criação, edição e redefinição', () => {
    for (const operation of ['create', 'update', 'resetPassword']) {
      expect(() =>
        (enforceAuthPolicies as unknown as AnyHook)({
          args: { data: { email: 'x@example.com', password: 'senha123' } },
          operation,
          req: fakeReq(1, { payloadAPI: 'local' }),
        }),
      ).toThrow()
    }
  })

  it('limita esqueci-minha-senha por IP via REST, mas não a Local API', () => {
    authRateLimiter.reset()
    const call = (api: string) =>
      (enforceAuthPolicies as unknown as AnyHook)({
        args: { data: { email: 'x@example.com' } },
        operation: 'forgotPassword',
        req: fakeReq(1, { payloadAPI: api as PayloadRequest['payloadAPI'] }),
      })
    for (let i = 0; i < 5; i += 1) call('REST')
    expect(() => call('REST')).toThrow(/Muitas tentativas/)
    expect(() => call('local')).not.toThrow()
    authRateLimiter.reset()
  })

  it('bloqueia login de conta desativada', () => {
    expect(() => (blockInactiveLogin as unknown as AnyHook)({ user: { active: false } })).toThrow(
      /desativada/,
    )
    expect((blockInactiveLogin as unknown as AnyHook)({ user: { active: true } })).toEqual({
      active: true,
    })
  })
})

describe('upload seguro (beforeOperation)', () => {
  const hook = secureUpload({ accept: ['image/png'] }) as unknown as AnyHook

  it('renomeia para UUID com extensão real e corrige o MIME', () => {
    const file = {
      data: Buffer.from(TINY_PNG),
      size: TINY_PNG.length,
      name: 'Foto Fulana.jpg',
      mimetype: 'image/jpeg',
    }
    hook({ args: {}, operation: 'create', req: { file } })
    expect(file.name).toMatch(/^[0-9a-f-]{36}\.png$/)
    expect(file.mimetype).toBe('image/png')
  })

  it('rejeita conteúdo executável com extensão de imagem', () => {
    const file = {
      data: Buffer.from(FAKE_EXE),
      size: FAKE_EXE.length,
      name: 'foto.png',
      mimetype: 'image/png',
    }
    expect(() => hook({ args: {}, operation: 'create', req: { file } })).toThrow()
  })

  it('ignora operações sem arquivo', () => {
    const args = { data: {} }
    expect(hook({ args, operation: 'update', req: {} })).toBe(args)
    expect(hook({ args, operation: 'read', req: { file: {} } })).toBe(args)
  })
})

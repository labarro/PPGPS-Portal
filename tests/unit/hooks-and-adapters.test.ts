import type { CollectionConfig, GlobalConfig, PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import {
  auditAfterChange,
  auditAfterDelete,
  auditAfterLogin,
  auditGlobalAfterChange,
  withAudit,
  withGlobalAudit,
} from '@/hooks/audit'
import { revalidateSiteLayout } from '@/hooks/revalidate'
import { buildEmailAdapter } from '@/lib/email/adapter'

type AnyHook = (args: Record<string, unknown>) => Promise<unknown> | unknown

function fakeReq(
  user: Record<string, unknown> | null = {
    id: 7,
    email: 'editor@example.com',
    collection: 'users',
  },
) {
  const create = vi.fn().mockResolvedValue({})
  const req = {
    user,
    headers: new Headers({ 'x-forwarded-for': '203.0.113.45' }),
    payload: { create, logger: { debug: vi.fn(), info: vi.fn() } },
  } as unknown as PayloadRequest
  return { req, create }
}

const collection = { slug: 'documents' } as CollectionConfig

describe('hooks de auditoria', () => {
  it('criação registra autor, coleção, documento, campos e IP truncado', async () => {
    const { req, create } = fakeReq()
    await (auditAfterChange as unknown as AnyHook)({
      collection,
      doc: { id: 10, title: 'x' },
      operation: 'create',
      previousDoc: {},
      req,
    })
    expect(create).toHaveBeenCalledTimes(1)
    const call = create.mock.calls[0]?.[0]
    expect(call.collection).toBe('audit-logs')
    expect(call.overrideAccess).toBe(true)
    expect(call.data).toMatchObject({
      action: 'create',
      targetCollection: 'documents',
      documentId: '10',
      userId: '7',
      userEmail: 'editor@example.com',
      diffSummary: 'Campos: title',
      ip: '203.0.113.0',
    })
  })

  it('edição sem mudança de conteúdo não gera registro', async () => {
    const { req, create } = fakeReq()
    await (auditAfterChange as unknown as AnyHook)({
      collection,
      doc: { id: 1, title: 'a', updatedAt: '2' },
      operation: 'update',
      previousDoc: { id: 1, title: 'a', updatedAt: '1' },
      req,
    })
    expect(create).not.toHaveBeenCalled()
  })

  it('exclusão, global e login', async () => {
    const { req, create } = fakeReq(null)
    await (auditAfterDelete as unknown as AnyHook)({ collection, doc: { id: 3 }, id: 3, req })
    await (auditGlobalAfterChange as unknown as AnyHook)({
      doc: { about: 'b' },
      global: { slug: 'footer' },
      previousDoc: { about: 'a' },
      req,
    })
    await (auditAfterLogin as unknown as AnyHook)({
      collection: { slug: 'users' },
      req,
      user: { id: 9, email: 'admin@example.com' },
    })
    const actions = create.mock.calls.map((call) => call[0].data)
    expect(actions[0]).toMatchObject({ action: 'delete', documentId: '3', userId: null })
    expect(actions[1]).toMatchObject({ action: 'update', targetCollection: 'global:footer' })
    expect(actions[2]).toMatchObject({
      action: 'login',
      userId: '9',
      userEmail: 'admin@example.com',
    })
    expect(req.user).toMatchObject({ id: 9, collection: 'users' })
  })

  it('withAudit aplica os hooks a todas as coleções, exceto a própria auditoria', () => {
    const result = withAudit([
      { slug: 'users', auth: true, fields: [] },
      { slug: 'audit-logs', fields: [] },
    ] as CollectionConfig[])
    expect(result[0]?.hooks?.afterChange).toContain(auditAfterChange)
    expect(result[0]?.hooks?.afterLogin).toContain(auditAfterLogin)
    expect(result[1]?.hooks).toBeUndefined()
    const globals = withGlobalAudit([{ slug: 'footer', fields: [] }] as GlobalConfig[])
    expect(globals[0]?.hooks?.afterChange).toContain(auditGlobalAfterChange)
  })

  it('revalida o layout público ao mudar globals', async () => {
    const { revalidatePath } = await import('next/cache')
    const { req } = fakeReq()
    const doc = { items: [] }
    expect(await (revalidateSiteLayout as unknown as AnyHook)({ doc, req })).toBe(doc)
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })
})

describe('adaptador de e-mail', () => {
  const logger = { info: vi.fn() }
  const payload = { logger } as never

  it('captura (não envia) fora da produção sem SMTP e só registra metadados mascarados', async () => {
    const adapter = (await buildEmailAdapter({ APP_ENV: 'staging' }))({ payload })
    expect(adapter.name).toBe('capture')
    await adapter.sendEmail({
      to: 'coordenacao@example.com',
      subject: 'Assunto',
      html: '<a href="/admin/reset/tok">x</a>',
    })
    const logged = JSON.stringify(logger.info.mock.calls)
    expect(logged).toContain('c***@example.com')
    expect(logged).not.toContain('coordenacao@example.com')
    expect(logged).not.toContain('reset/tok')
  })

  it('produção sem SMTP falha explicitamente', async () => {
    const adapter = (await buildEmailAdapter({ APP_ENV: 'production' }))({ payload })
    await expect(adapter.sendEmail({ to: 'x@example.com', subject: 's' })).rejects.toThrow(
      /indisponível/,
    )
  })

  it('SMTP de captura (Mailpit) usa nodemailer', async () => {
    const adapter = (
      await buildEmailAdapter({ APP_ENV: 'local', SMTP_HOST: 'localhost', SMTP_PORT: '1025' })
    )({
      payload,
    })
    expect(adapter.name).toBe('nodemailer')
  })
})

import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { cleanupAccounts, createAccount, type TestAccount } from '../helpers/fixtures'
import { TINY_PDF } from '../helpers/files'
import { loginRest, restJson, uploadForm } from '../helpers/rest'

let payload: Payload
let editor: TestAccount
let admin: TestAccount
let editorToken: string
let adminToken: string

async function entriesFor(targetCollection: string, documentId: string | number) {
  const { docs } = await payload.find({
    collection: 'audit-logs',
    where: {
      and: [
        { targetCollection: { equals: targetCollection } },
        { documentId: { equals: String(documentId) } },
      ],
    },
    sort: 'at',
    limit: 50,
  })
  return docs
}

describe('Auditoria (somente inserção)', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    editor = await createAccount(payload, ['editor'])
    admin = await createAccount(payload, ['admin'])
    editorToken = await loginRest(editor.email, editor.password)
    adminToken = await loginRest(admin.email, admin.password)
  })

  afterAll(async () => {
    await cleanupAccounts(payload)
  })

  it('registra criação, edição e exclusão com usuário, coleção, documento e data', async () => {
    const created = await restJson<{ doc: { id: number } }>('POST', '/documents', {
      token: editorToken,
      form: uploadForm(
        {
          title: 'Documento fictício de auditoria',
          type: 'other',
          visibility: 'admin',
          license: 'cc0',
        },
        TINY_PDF,
        'auditoria.pdf',
        'application/pdf',
      ),
    })
    expect(created.status).toBe(201)
    const id = created.json.doc.id

    const updated = await restJson('PATCH', `/documents/${id}`, {
      token: editorToken,
      body: { title: 'Título alterado (fictício)' },
    })
    expect(updated.status).toBe(200)

    const deleted = await restJson('DELETE', `/documents/${id}`, { token: editorToken })
    expect(deleted.status).toBe(200)

    const entries = await entriesFor('documents', id)
    expect(entries.map((entry) => entry.action)).toEqual(['create', 'update', 'delete'])
    for (const entry of entries) {
      expect(entry.userId).toBe(String(editor.id))
      expect(entry.userEmail).toBe(editor.email)
      expect(entry.at).toBeTruthy()
      expect(entry.ip).toMatch(/^198\.18\.\d+\.0$/)
    }
    // Só nomes de campos, nunca valores.
    expect(entries[1]?.diffSummary).toContain('title')
    expect(entries[1]?.diffSummary).not.toContain('Título alterado')
  })

  it('registra login', async () => {
    await loginRest(editor.email, editor.password)
    const entries = await entriesFor('users', editor.id)
    expect(
      entries.some((entry) => entry.action === 'login' && entry.userId === String(editor.id)),
    ).toBe(true)
  })

  it('registra mudança de papel (role_change) com o autor', async () => {
    const target = await createAccount(payload, ['editor'])
    await restJson('PATCH', `/users/${target.id}`, {
      token: adminToken,
      body: { roles: ['admin'] },
    })
    const entries = await entriesFor('users', target.id)
    const change = entries.find(
      (entry) => entry.action === 'role_change' && entry.diffSummary?.includes('editor → admin'),
    )
    expect(change).toBeDefined()
    expect(change?.userId).toBe(String(admin.id))
  })

  it('registra alteração de globals', async () => {
    const before = await payload.count({
      collection: 'audit-logs',
      where: { targetCollection: { equals: 'global:footer' } },
    })
    await restJson('POST', '/globals/footer', {
      token: editorToken,
      body: { about: `Texto fictício ${Date.now()}` },
    })
    const after = await payload.count({
      collection: 'audit-logs',
      where: { targetCollection: { equals: 'global:footer' } },
    })
    expect(after.totalDocs).toBe(before.totalDocs + 1)
  })

  it('nem o admin altera ou exclui registros pela API', async () => {
    const { docs } = await payload.find({ collection: 'audit-logs', limit: 1 })
    const id = docs[0]?.id
    expect(
      (
        await restJson('PATCH', `/audit-logs/${id}`, {
          token: adminToken,
          body: { action: 'export' },
        })
      ).status,
    ).toBe(403)
    expect((await restJson('DELETE', `/audit-logs/${id}`, { token: adminToken })).status).toBe(403)
    expect(
      (
        await restJson('POST', '/audit-logs', {
          token: adminToken,
          body: { action: 'login', targetCollection: 'x', at: new Date().toISOString() },
        })
      ).status,
    ).toBe(403)
  })

  it('o banco bloqueia UPDATE, DELETE e TRUNCATE mesmo com overrideAccess', async () => {
    const { docs } = await payload.find({ collection: 'audit-logs', limit: 1 })
    const id = docs[0]?.id as number
    await expect(
      payload.update({
        collection: 'audit-logs',
        id,
        data: { diffSummary: 'adulterado' },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'audit-logs', id, overrideAccess: true }),
    ).rejects.toThrow()
    const drizzle = (
      payload.db as unknown as { drizzle: { execute: (query: unknown) => Promise<unknown> } }
    ).drizzle
    await expect(drizzle.execute(sql`TRUNCATE "audit_logs"`)).rejects.toThrow()
    const still = await payload.findByID({ collection: 'audit-logs', id })
    expect(still.diffSummary).not.toBe('adulterado')
  })
})

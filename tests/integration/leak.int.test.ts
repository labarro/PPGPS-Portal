import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { cleanupAccounts, createAccount, type TestAccount } from '../helpers/fixtures'
import { TINY_PDF, TINY_PNG } from '../helpers/files'
import { loginRest, restJson, uploadForm } from '../helpers/rest'

/**
 * Testes de vazamento (AGENTS.md §8.3): respostas públicas não expõem contas, auditoria,
 * documentos não públicos nem imagens com pessoas identificáveis.
 */
let payload: Payload
let editor: TestAccount
let privateTitle: string
let identifiableAlt: string

describe('Vazamento de dados não públicos', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    editor = await createAccount(payload, ['editor'], { name: 'Nome Fictício Sigiloso' })
    const token = await loginRest(editor.email, editor.password)
    privateTitle = `Documento sigiloso fictício ${Date.now()}`
    identifiableAlt = `Retrato fictício ${Date.now()}`

    await restJson('POST', '/documents', {
      token,
      form: uploadForm(
        { title: privateTitle, type: 'authorization', visibility: 'admin', license: 'cc0' },
        TINY_PDF,
        'termo.pdf',
        'application/pdf',
      ),
    })
    await restJson('POST', '/media', {
      token,
      form: uploadForm(
        {
          alt: identifiableAlt,
          credit: 'Fictício',
          license: 'group-authorized',
          source: 'group-archive',
          containsIdentifiablePeople: true,
        },
        TINY_PNG,
        'retrato.png',
        'image/png',
      ),
    })
  })

  afterAll(async () => {
    await cleanupAccounts(payload)
  })

  it('listagens públicas não contêm documentos restritos nem imagens com pessoas', async () => {
    const documents = await restJson<{ docs: { visibility: string }[] }>(
      'GET',
      '/documents?limit=100',
    )
    expect(documents.status).toBe(200)
    expect(documents.json.docs.every((doc) => doc.visibility === 'public')).toBe(true)
    expect(JSON.stringify(documents.json)).not.toContain(privateTitle)

    const media = await restJson<{ docs: { containsIdentifiablePeople: boolean }[] }>(
      'GET',
      '/media?limit=100',
    )
    expect(media.status).toBe(200)
    expect(media.json.docs.every((doc) => doc.containsIdentifiablePeople === false)).toBe(true)
    expect(JSON.stringify(media.json)).not.toContain(identifiableAlt)
  })

  it('consulta por campo não contorna o filtro público', async () => {
    const byVisibility = await restJson<{ docs: unknown[] }>(
      'GET',
      '/documents?where[visibility][equals]=admin',
    )
    expect(byVisibility.json.docs).toEqual([])
  })

  it('nenhuma resposta pública expõe e-mail, nome ou auditoria das contas', async () => {
    const responses = await Promise.all([
      restJson('GET', '/users'),
      restJson('GET', '/users/me'),
      restJson('GET', '/audit-logs'),
      restJson('GET', '/globals/site-settings'),
      restJson('GET', '/globals/footer'),
      restJson('GET', '/globals/navigation'),
      restJson('GET', '/media?limit=100&depth=2'),
      restJson('GET', '/documents?limit=100&depth=2'),
    ])
    for (const { json } of responses) {
      const text = JSON.stringify(json)
      expect(text).not.toContain(editor.email)
      expect(text).not.toContain('Nome Fictício Sigiloso')
      expect(text).not.toMatch(/"(hash|salt|resetPasswordToken|loginAttempts|lockUntil|sessions)"/)
    }
    expect((await restJson<{ user: unknown }>('GET', '/users/me')).json.user ?? null).toBeNull()
  })
})

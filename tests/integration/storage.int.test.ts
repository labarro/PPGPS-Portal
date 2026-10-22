import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { cleanupAccounts, createAccount } from '../helpers/fixtures'
import { FAKE_EXE, jpegOfSize, SVG_WITH_SCRIPT, TINY_PDF, TINY_PNG } from '../helpers/files'
import { loginRest, rest, restJson, uploadForm } from '../helpers/rest'
import { objectExists, testS3 } from '../helpers/s3'

/**
 * Upload seguro e download controlado no MinIO (S3 compatível, mesmo adaptador do R2).
 * Arquivos mínimos e fictícios.
 */
let payload: Payload
let editorToken: string

const mediaData = {
  alt: 'Imagem fictícia de teste',
  credit: 'Autoria fictícia',
  license: 'cc-by',
  source: 'portal-production',
  containsIdentifiablePeople: false,
}

async function uploadMedia(
  data: Record<string, unknown>,
  file: Uint8Array,
  name: string,
  type: string,
) {
  return restJson<{
    doc?: { id: number; filename: string; prefix: string; url: string }
    errors?: unknown[]
  }>('POST', '/media', { token: editorToken, form: uploadForm(data, file, name, type) })
}

async function uploadDocument(visibility: string, name = 'termo.pdf') {
  return restJson<{ doc: { id: number; filename: string; prefix: string } }>('POST', '/documents', {
    token: editorToken,
    form: uploadForm(
      { title: `Documento fictício (${visibility})`, type: 'other', visibility, license: 'cc0' },
      TINY_PDF,
      name,
      'application/pdf',
    ),
  })
}

describe('Storage (MinIO) — upload seguro e acesso a arquivos', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const editor = await createAccount(payload, ['editor'])
    editorToken = await loginRest(editor.email, editor.password)
  })

  afterAll(async () => {
    await cleanupAccounts(payload)
  })

  it('salva imagem válida no bucket com nome aleatório (sem o nome original)', async () => {
    const { status, json } = await uploadMedia(
      mediaData,
      TINY_PNG,
      'Foto da Fulana.png',
      'image/png',
    )
    expect(status).toBe(201)
    const doc = json.doc!
    expect(doc.filename).toMatch(/^[0-9a-f-]{36}\.png$/)
    expect(doc.filename).not.toContain('Fulana')
    expect(doc.prefix).toBe('media')
    expect(await objectExists(`media/${doc.filename}`)).toBe(true)
  })

  it('visitante baixa a imagem pública pela rota da aplicação', async () => {
    const { json } = await uploadMedia(mediaData, TINY_PNG, 'publica.png', 'image/png')
    const response = await rest('GET', `/media/file/${json.doc!.filename}`)
    expect(response.status).toBe(200)
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(TINY_PNG)
  })

  it('imagem com pessoas identificáveis não é pública (registro nem arquivo)', async () => {
    const { json } = await uploadMedia(
      { ...mediaData, containsIdentifiablePeople: true },
      TINY_PNG,
      'pessoas.png',
      'image/png',
    )
    const doc = json.doc!
    expect([403, 404]).toContain((await rest('GET', `/media/${doc.id}`)).status)
    expect((await rest('GET', `/media/file/${doc.filename}`)).status).toBe(403)
    expect((await rest('GET', `/media/file/${doc.filename}`, { token: editorToken })).status).toBe(
      200,
    )
  })

  it.each([
    ['.exe renomeado para .jpg', FAKE_EXE, 'foto.jpg', 'image/jpeg'],
    ['SVG (bloqueado)', SVG_WITH_SCRIPT, 'logo.svg', 'image/svg+xml'],
    ['PDF em mídia (tipo não permitido na coleção)', TINY_PDF, 'arquivo.png', 'image/png'],
  ])('rejeita %s', async (_label, file, name, type) => {
    const { status } = await uploadMedia(mediaData, file, name, type)
    expect(status).toBe(400)
  })

  it('rejeita imagem acima de 10 MB', async () => {
    const { status } = await uploadMedia(
      mediaData,
      jpegOfSize(10 * 1024 * 1024 + 1),
      'grande.jpg',
      'image/jpeg',
    )
    expect(status).toBe(400)
  })

  it.each(['alt', 'credit', 'license', 'source'])('não salva imagem sem %s', async (field) => {
    const data: Record<string, unknown> = { ...mediaData }
    delete data[field]
    const { status } = await uploadMedia(data, TINY_PNG, 'sem-campo.png', 'image/png')
    expect(status).toBe(400)
  })

  it('documento privado: visitante não acessa; editor recebe URL assinada de curta duração', async () => {
    const { status, json } = await uploadDocument('admin')
    expect(status).toBe(201)
    const doc = json.doc
    expect(doc.prefix).toBe('documents')

    expect([403, 404]).toContain((await rest('GET', `/documents/${doc.id}`)).status)
    expect((await rest('GET', `/documents/file/${doc.filename}`)).status).toBe(403)

    const signed = await rest('GET', `/documents/file/${doc.filename}`, { token: editorToken })
    expect(signed.status).toBe(302)
    const location = signed.headers.get('location') ?? ''
    expect(location).toContain('X-Amz-Signature=')
    expect(location).toContain('X-Amz-Expires=300')

    const download = await fetch(location)
    expect(download.status).toBe(200)
    expect(new Uint8Array(await download.arrayBuffer())).toEqual(TINY_PDF)
  })

  it('documento "members" é tratado como restrito (sem contas de integrantes no MVP)', async () => {
    const { json } = await uploadDocument('members')
    expect((await rest('GET', `/documents/file/${json.doc.filename}`)).status).toBe(403)
  })

  it('documento público é baixado por qualquer visitante', async () => {
    const { json } = await uploadDocument('public')
    const response = await rest('GET', `/documents/file/${json.doc.filename}`)
    expect(response.status).toBe(302)
    expect((await fetch(response.headers.get('location') ?? '')).status).toBe(200)
  })

  it('o bucket é privado: acesso direto sem assinatura é negado', async () => {
    const { json } = await uploadDocument('public')
    const { endpoint, bucket } = testS3()
    const direct = await fetch(`${endpoint}/${bucket}/documents/${json.doc.filename}`)
    expect(direct.status).toBe(403)
  })

  it('rejeita PDF acima de 25 MB', async () => {
    const big = new Uint8Array(25 * 1024 * 1024 + 1)
    big.set(TINY_PDF)
    const { status } = await restJson('POST', '/documents', {
      token: editorToken,
      form: uploadForm(
        { title: 'Grande', type: 'other', visibility: 'admin', license: 'cc0' },
        big,
        'grande.pdf',
        'application/pdf',
      ),
    })
    expect([400, 413]).toContain(status)
  })

  it('excluir a mídia remove o objeto do bucket', async () => {
    const { json } = await uploadMedia(mediaData, TINY_PNG, 'remover.png', 'image/png')
    const key = `media/${json.doc!.filename}`
    expect(await objectExists(key)).toBe(true)
    expect(
      (await restJson('DELETE', `/media/${json.doc!.id}`, { token: editorToken })).status,
    ).toBe(200)
    expect(await objectExists(key)).toBe(false)
  })
})

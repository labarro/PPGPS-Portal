#!/usr/bin/env node
/**
 * Fumaça de armazenamento PELO APP implantado (preview), contra o R2 real — S02/ADR-0011.
 * Usa a conta FICTÍCIA do seed (SEED_ADMIN_*), arquivos mínimos e remove tudo ao final.
 *
 * Verifica: upload de imagem válida (nome aleatório), download público pelo app, rejeição de
 * ".exe renomeado para .jpg", documento privado negado ao visitante e servido ao admin por URL
 * assinada do R2, auditoria das operações, exclusão.
 * Uso: node scripts/ci/smoke-storage-app.mjs <url>
 * Variáveis: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, BASIC_AUTH_USER, BASIC_AUTH_PASSWORD,
 *   VERCEL_AUTOMATION_BYPASS_SECRET (opcional). Nenhum valor é impresso.
 */
import { appendFileSync } from 'node:fs'

const base = (process.argv[2] || '').replace(/\/+$/, '')
const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, BASIC_AUTH_USER, BASIC_AUTH_PASSWORD } = process.env
if (!base || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  console.error(
    '::error::Uso: smoke-storage-app.mjs <url> com SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD',
  )
  process.exit(1)
}

const common = {}
if (BASIC_AUTH_USER && BASIC_AUTH_PASSWORD) {
  common.Authorization = `Basic ${Buffer.from(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`).toString('base64')}`
}
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  common['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
}

let cookie = ''
const call = (path, init = {}, { auth = true } = {}) =>
  fetch(`${base}${path}`, {
    redirect: 'manual',
    ...init,
    headers: { ...common, ...(auth && cookie ? { Cookie: cookie } : {}), ...(init.headers ?? {}) },
  })

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
  'latin1',
)
const EXE = Buffer.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0xff, 0xff, 0, 0])

const form = (data, bytes, name, type) => {
  const body = new FormData()
  body.append('_payload', JSON.stringify(data))
  body.append('file', new Blob([bytes], { type }), name)
  return body
}

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const created = []
try {
  const login = await call('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SEED_ADMIN_EMAIL, password: SEED_ADMIN_PASSWORD }),
  })
  const setCookie = login.headers.getSetCookie?.() ?? []
  cookie = setCookie
    .map((c) => c.split(';')[0])
    .filter((c) => c.startsWith('payload-token='))
    .join('; ')
  check('login da conta fictícia do seed', login.status === 200 && !!cookie, `HTTP ${login.status}`)
  if (!cookie) throw new Error('sem sessão')

  const media = await call('/api/media', {
    method: 'POST',
    body: form(
      {
        alt: 'Imagem fictícia de verificação',
        credit: 'Pipeline',
        license: 'cc0',
        source: 'portal-production',
        containsIdentifiablePeople: false,
      },
      PNG,
      'verificacao.png',
      'image/png',
    ),
  })
  const mediaDoc = (await media.json()).doc
  check(
    'upload de imagem no R2 com nome aleatório',
    media.status === 201 && /^[0-9a-f-]{36}\.png$/.test(mediaDoc?.filename ?? ''),
    `HTTP ${media.status}`,
  )
  if (mediaDoc) created.push(`/api/media/${mediaDoc.id}`)

  if (mediaDoc) {
    const file = await call(`/api/media/file/${mediaDoc.filename}`, {}, { auth: false })
    const bytes = Buffer.from(await file.arrayBuffer())
    check(
      'visitante baixa a imagem pública pelo app',
      file.status === 200 && bytes.equals(PNG),
      `HTTP ${file.status}`,
    )
  }

  const exe = await call('/api/media', {
    method: 'POST',
    body: form(
      { alt: 'x', credit: 'x', license: 'cc0', source: 'portal-production' },
      EXE,
      'foto.jpg',
      'image/jpeg',
    ),
  })
  check('.exe renomeado para .jpg é rejeitado', exe.status === 400, `HTTP ${exe.status}`)

  const doc = await call('/api/documents', {
    method: 'POST',
    body: form(
      {
        title: 'Documento fictício de verificação',
        type: 'other',
        visibility: 'admin',
        license: 'cc0',
      },
      PDF,
      'verificacao.pdf',
      'application/pdf',
    ),
  })
  const documentDoc = (await doc.json()).doc
  check('upload de documento privado', doc.status === 201, `HTTP ${doc.status}`)
  if (documentDoc) {
    created.push(`/api/documents/${documentDoc.id}`)
    const anon = await call(`/api/documents/file/${documentDoc.filename}`, {}, { auth: false })
    check('visitante não acessa documento privado', anon.status === 403, `HTTP ${anon.status}`)

    const signed = await call(`/api/documents/file/${documentDoc.filename}`)
    const location = signed.headers.get('location') ?? ''
    const host = location ? new URL(location).host : ''
    check(
      'admin recebe URL assinada do R2 (5 min)',
      signed.status === 302 &&
        /r2\.cloudflarestorage\.com$/.test(host) &&
        location.includes('X-Amz-Signature=') &&
        location.includes('X-Amz-Expires=300'),
      `HTTP ${signed.status} → ${host || '(sem destino)'}`,
    )
    if (location) {
      const download = await fetch(location)
      const bytes = Buffer.from(await download.arrayBuffer())
      check(
        'download pela URL assinada',
        download.status === 200 && bytes.equals(PDF),
        `HTTP ${download.status}`,
      )
      const unsigned = await fetch(location.split('?')[0])
      check(
        'sem assinatura o R2 nega o acesso',
        [400, 401, 403].includes(unsigned.status),
        `HTTP ${unsigned.status}`,
      )
    }
  }

  const audit = await call(
    '/api/audit-logs?limit=5&sort=-at&where[targetCollection][in]=media,documents',
  )
  const auditDocs = audit.status === 200 ? (await audit.json()).docs : []
  check(
    'operações registradas na auditoria',
    auditDocs.some((d) => d.action === 'create'),
    `HTTP ${audit.status}`,
  )
} catch (error) {
  check('execução', false, error instanceof Error ? error.message : 'erro')
} finally {
  for (const path of created) {
    const del = await call(path, { method: 'DELETE' })
    check(`limpeza ${path.split('/')[2]}`, del.status === 200, `HTTP ${del.status}`)
  }
}

const ok = results.length > 0 && results.every((result) => result.ok)
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Armazenamento pelo app implantado (R2)\n\n| Verificação | Resultado |\n|---|---|\n${results
      .map((r) => `| ${r.name} | ${r.ok ? 'OK' : 'FALHA'}${r.detail ? ` (${r.detail})` : ''} |`)
      .join('\n')}\n`,
  )
}
process.exit(ok ? 0 : 1)

#!/usr/bin/env node
/**
 * Verificação REAL e controlada do bucket R2 do ambiente (preview/staging) — ADR-0011.
 * Custo: ~7 operações (2 classe A, ~5 classe B) com um objeto de 64 bytes, removido no fim.
 * Faixa gratuita do R2: 1 mi classe A + 10 mi classe B/mês; nunca usar em laço ou carga.
 *
 * Verifica: escrita, leitura, URL assinada (download), bucket privado (acesso sem assinatura
 * negado), exclusão. Nunca imprime credenciais. Recusa buckets de backup e de produção.
 * Variáveis: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION, S3_PREFIX.
 */
import { randomBytes, randomUUID } from 'node:crypto'

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env
const region = process.env.S3_REGION || 'auto'
const prefix = (process.env.S3_PREFIX || '').replace(/^\/|\/$/g, '')

const fail = (message) => {
  console.error(`::error::[r2-smoke] ${message}`)
  process.exit(1)
}

if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
  fail('configuração incompleta (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY)')
}
if (/backup|prod/i.test(S3_BUCKET)) fail(`bucket "${S3_BUCKET}" não é permitido neste teste`)

const client = new S3Client({
  endpoint: S3_ENDPOINT,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
})

const key = `${prefix ? `${prefix}/` : ''}_smoke/${randomUUID()}.txt`
const body = randomBytes(32).toString('hex')
const results = []
const step = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const started = Date.now()
try {
  await client.send(
    new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body, ContentType: 'text/plain' }),
  )
  step('escrita (PutObject)', true, `${body.length} bytes`)

  const read = await client.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }))
  const text = await read.Body.transformToString()
  step('leitura autenticada (GetObject)', text === body)

  const signed = await getSignedUrl(client, new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), {
    expiresIn: 60,
  })
  const viaSigned = await fetch(signed)
  step(
    'download por URL assinada (60 s)',
    viaSigned.status === 200 && (await viaSigned.text()) === body,
  )

  const unsigned = await fetch(`${S3_ENDPOINT.replace(/\/+$/, '')}/${S3_BUCKET}/${key}`)
  step(
    'bucket privado: acesso sem assinatura negado',
    [400, 401, 403].includes(unsigned.status),
    `HTTP ${unsigned.status}`,
  )
  await unsigned.body?.cancel()

  await client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }))
  let gone = false
  try {
    await client.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }))
  } catch (error) {
    gone = error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound'
  }
  step('exclusão (DeleteObject + HeadObject 404)', gone)

  // Isolamento (ADR-0011): a credencial da aplicação não deve alcançar o bucket de backups.
  // Só alerta (não bloqueia o deploy): o reescopo do token é feito no painel da Cloudflare.
  try {
    await client.send(new ListObjectsV2Command({ Bucket: 'ppgps-backups', MaxKeys: 1 }))
    console.log(
      '::warning::[r2-smoke] A credencial deste ambiente ALCANÇA o bucket ppgps-backups. Restrinja o token R2 ao bucket do ambiente.',
    )
  } catch {
    console.log('OK   credencial sem acesso ao bucket ppgps-backups')
  }
} catch (error) {
  step(
    'operação no bucket',
    false,
    `${error?.name ?? 'Erro'} (HTTP ${error?.$metadata?.httpStatusCode ?? '?'})`,
  )
  await client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key })).catch(() => undefined)
}

const ok = results.length >= 5 && results.every((result) => result.ok)
console.log(
  `[r2-smoke] bucket=${S3_BUCKET} prefixo=${prefix || '(raiz)'} tempo=${Date.now() - started} ms resultado=${ok ? 'OK' : 'FALHA'}`,
)
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs')
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Verificação real do R2 (${S3_BUCKET}${prefix ? `/${prefix}` : ''})\n\n| Etapa | Resultado |\n|---|---|\n${results
      .map((r) => `| ${r.name} | ${r.ok ? 'OK' : 'FALHA'}${r.detail ? ` (${r.detail})` : ''} |`)
      .join('\n')}\n`,
  )
}
process.exit(ok ? 0 : 1)

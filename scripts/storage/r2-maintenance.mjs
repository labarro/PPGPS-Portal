#!/usr/bin/env node
/**
 * Auditoria do R2 (S02; ADR-0011). Somente verificação — nunca altera configurações:
 *
 *   node scripts/storage/r2-maintenance.mjs lifecycle   # só no bucket ppgps-preview
 *   node scripts/storage/r2-maintenance.mjs exposure
 *
 * lifecycle: confirma a expiração de 7 dias configurada no painel. Lê a configuração se o
 *   token permitir; com token restrito a objetos (privilégio mínimo), usa uma sonda de 2 bytes
 *   e o cabeçalho x-amz-expiration; se o R2 não o informar, registra INFO (não verificável).
 * exposure: para cada bucket do projeto, confirma que listagem e leitura ANÔNIMAS pelo
 *   endpoint S3 são negadas, que a credencial do ambiente acessa o próprio bucket e que não
 *   alcança os outros (isolamento por token). `r2.dev`/domínios personalizados exigem a API
 *   da Cloudflare: verificação manual no painel.
 *
 * Variáveis: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION,
 *   R2_ALL_BUCKETS (lista separada por vírgula). Nenhuma credencial é impressa.
 */
import { appendFileSync } from 'node:fs'

import { randomUUID } from 'node:crypto'

import {
  DeleteObjectCommand,
  GetBucketLifecycleConfigurationCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const mode = process.argv[2]
const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env
const endpoint = (S3_ENDPOINT ?? '').replace(/\/+$/, '')
const results = []
/** level "info": registro informativo, não é aprovação nem falha. */
const record = (name, ok, detail = '', level = 'check') => {
  results.push({ name, ok, detail, level })
  const tag = level === 'info' ? 'INFO' : ok ? 'OK  ' : 'FALHA'
  console.log(`${tag} ${name}${detail ? ` — ${detail}` : ''}`)
}
const finish = (title) => {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### ${title}\n\n| Verificação | Resultado |\n|---|---|\n${results
        .map(
          (r) =>
            `| ${r.name} | ${r.level === 'info' ? 'INFO' : r.ok ? 'OK' : 'FALHA'}${r.detail ? ` (${r.detail})` : ''} |`,
        )
        .join('\n')}\n\n`,
    )
  }
  process.exit(results.length > 0 && results.every((r) => r.ok) ? 0 : 1)
}

if (!endpoint || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
  console.error('::error::configuração incompleta')
  process.exit(1)
}

const client = new S3Client({
  endpoint,
  region: process.env.S3_REGION || 'auto',
  forcePathStyle: true,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
})

const status = (error) => error?.$metadata?.httpStatusCode ?? '?'

if (mode === 'lifecycle') {
  // Somente verificação: a regra é criada pelo supervisor no painel. Nunca altera o bucket
  // além de um objeto de sonda de 2 bytes, removido em seguida.
  if (S3_BUCKET !== 'ppgps-preview') {
    console.error(`::error::verificação de lifecycle só no ppgps-preview (recebido "${S3_BUCKET}")`)
    process.exit(1)
  }
  let viaApi = false
  try {
    const current = await client.send(
      new GetBucketLifecycleConfigurationCommand({ Bucket: S3_BUCKET }),
    )
    const rule = (current.Rules ?? []).find(
      (r) => r.Status === 'Enabled' && r.Expiration?.Days === 7 && !(r.Filter?.Prefix ?? r.Prefix),
    )
    record(
      'regra de expiração de 7 dias (leitura da configuração)',
      !!rule,
      `${current.Rules?.length ?? 0} regra(s)`,
    )
    viaApi = true
  } catch (error) {
    record(
      'leitura da configuração de ciclo de vida',
      true,
      `negada (${error?.name} HTTP ${status(error)}) — esperado para token restrito a objetos`,
      'info',
    )
  }
  if (!viaApi) {
    // Sonda: o S3 informa a expiração aplicável no cabeçalho x-amz-expiration.
    const key = `_lifecycle-probe/${randomUUID()}.txt`
    try {
      await client.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: 'ok' }))
      const head = await client.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }))
      const expiration = head.Expiration ?? ''
      const date = /expiry-date="([^"]+)"/.exec(expiration)?.[1]
      const days =
        date && head.LastModified ? (new Date(date) - head.LastModified) / 86_400_000 : NaN
      if (date) {
        record(
          'expiração aplicada ao objeto (x-amz-expiration)',
          days > 6 && days <= 8.1,
          `${days.toFixed(1)} dia(s)`,
        )
      } else {
        record(
          'expiração aplicada ao objeto (x-amz-expiration)',
          true,
          'cabeçalho não informado pelo R2 — não verificável com token de privilégio mínimo; depende da confirmação no painel',
          'info',
        )
      }
    } finally {
      await client
        .send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }))
        .catch(() => undefined)
    }
  }
  finish(`Ciclo de vida — ${S3_BUCKET}`)
} else if (mode === 'exposure') {
  const buckets = (process.env.R2_ALL_BUCKETS || 'ppgps-preview,ppgps-staging,ppgps-backups')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean)

  for (const bucket of buckets) {
    const list = await fetch(`${endpoint}/${bucket}?list-type=2`)
    record(
      `${bucket}: listagem anônima negada`,
      [400, 401, 403].includes(list.status),
      `HTTP ${list.status}`,
    )
    await list.body?.cancel()
    const get = await fetch(`${endpoint}/${bucket}/qualquer-objeto.txt`)
    record(
      `${bucket}: leitura anônima negada`,
      [400, 401, 403].includes(get.status),
      `HTTP ${get.status}`,
    )
    await get.body?.cancel()

    if (bucket === S3_BUCKET) {
      // Acesso positivo: a credencial do ambiente funciona no próprio bucket.
      try {
        await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }))
        record(`${bucket}: acessível com as próprias credenciais`, true)
      } catch (error) {
        record(
          `${bucket}: acessível com as próprias credenciais`,
          false,
          `${error?.name} HTTP ${status(error)}`,
        )
      }
      continue
    }
    try {
      await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }))
      record(`${bucket}: inacessível com as credenciais de ${S3_BUCKET}`, false, 'acesso permitido')
    } catch (error) {
      record(
        `${bucket}: inacessível com as credenciais de ${S3_BUCKET}`,
        [401, 403].includes(status(error)) || error?.name === 'AccessDenied',
        `${error?.name} HTTP ${status(error)}`,
      )
    }
  }
  finish(`Exposição e isolamento do R2 (credenciais de ${S3_BUCKET})`)
} else {
  console.error('::error::uso: r2-maintenance.mjs lifecycle|exposure')
  process.exit(1)
}

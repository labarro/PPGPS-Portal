#!/usr/bin/env node
/**
 * Manutenção e auditoria do R2 (S02; ADR-0011). Duas operações:
 *
 *   node scripts/storage/r2-maintenance.mjs lifecycle   # só no bucket ppgps-preview
 *   node scripts/storage/r2-maintenance.mjs exposure    # verificação somente leitura
 *
 * lifecycle: garante (idempotente) a regra "expirar-preview-7-dias" — objetos expiram 7 dias
 *   após a criação e uploads multipart incompletos são abortados após 1 dia. Preserva outras
 *   regras existentes. Recusa qualquer bucket que não seja `ppgps-preview`.
 * exposure: para cada bucket do projeto, confirma que listagem e leitura ANÔNIMAS pelo
 *   endpoint S3 são negadas e que as credenciais do ambiente não alcançam os outros buckets
 *   (isolamento por token). Não consegue verificar `r2.dev`/domínios personalizados (exigem a
 *   API da Cloudflare): isso fica registrado como verificação manual.
 *
 * Variáveis: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION,
 *   R2_ALL_BUCKETS (lista separada por vírgula). Nenhuma credencial é impressa.
 */
import { appendFileSync } from 'node:fs'

import {
  GetBucketLifecycleConfigurationCommand,
  ListObjectsV2Command,
  PutBucketLifecycleConfigurationCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const mode = process.argv[2]
const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env
const endpoint = (S3_ENDPOINT ?? '').replace(/\/+$/, '')
const RULE_ID = 'expirar-preview-7-dias'

const results = []
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${detail ? ` — ${detail}` : ''}`)
}
const finish = (title) => {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### ${title}\n\n| Verificação | Resultado |\n|---|---|\n${results
        .map((r) => `| ${r.name} | ${r.ok ? 'OK' : 'FALHA'}${r.detail ? ` (${r.detail})` : ''} |`)
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
  if (S3_BUCKET !== 'ppgps-preview') {
    console.error(`::error::lifecycle só é aplicado em ppgps-preview (recebido "${S3_BUCKET}")`)
    process.exit(1)
  }
  let rules = []
  try {
    const current = await client.send(
      new GetBucketLifecycleConfigurationCommand({ Bucket: S3_BUCKET }),
    )
    rules = current.Rules ?? []
  } catch (error) {
    if (
      !['NoSuchLifecycleConfiguration', 'NoSuchBucketLifecycle'].includes(error?.name) &&
      status(error) !== 404
    ) {
      record('ler regras de ciclo de vida', false, `${error?.name} HTTP ${status(error)}`)
      finish(`Ciclo de vida — ${S3_BUCKET}`)
    }
  }
  const existing = rules.find((rule) => rule.ID === RULE_ID)
  const ok =
    existing?.Status === 'Enabled' &&
    existing.Expiration?.Days === 7 &&
    existing.AbortIncompleteMultipartUpload?.DaysAfterInitiation === 1
  if (ok) {
    record('regra de expiração de 7 dias já existe', true, `${rules.length} regra(s) no bucket`)
  } else {
    const desired = {
      ID: RULE_ID,
      Status: 'Enabled',
      Filter: { Prefix: '' },
      Expiration: { Days: 7 },
      AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
    }
    try {
      await client.send(
        new PutBucketLifecycleConfigurationCommand({
          Bucket: S3_BUCKET,
          LifecycleConfiguration: {
            Rules: [...rules.filter((rule) => rule.ID !== RULE_ID), desired],
          },
        }),
      )
      record('regra de expiração de 7 dias aplicada', true)
    } catch (error) {
      record(
        'aplicar regra de expiração',
        false,
        `${error?.name} HTTP ${status(error)} — o token pode não ter permissão de administração do bucket`,
      )
      finish(`Ciclo de vida — ${S3_BUCKET}`)
    }
    const after = await client.send(
      new GetBucketLifecycleConfigurationCommand({ Bucket: S3_BUCKET }),
    )
    const confirmed = (after.Rules ?? []).find((rule) => rule.ID === RULE_ID)
    record(
      'regra confirmada por leitura',
      confirmed?.Expiration?.Days === 7,
      `Status ${confirmed?.Status ?? '-'}`,
    )
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

    if (bucket === S3_BUCKET) continue
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

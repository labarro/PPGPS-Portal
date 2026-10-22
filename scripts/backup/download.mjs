#!/usr/bin/env node
/**
 * Baixa do bucket `ppgps-backups` o backup criptografado mais recente de um rótulo (ou o
 * indicado em BACKUP_BASE) e o respectivo manifesto — caminho real de recuperação (ADR-0012).
 * O arquivo continua cifrado; a chave privada não é usada aqui.
 *
 *   node scripts/backup/download.mjs <rótulo> <diretório-de-saída>
 *
 * Variáveis: BACKUP_S3_ENDPOINT, BACKUP_S3_BUCKET, BACKUP_S3_ACCESS_KEY_ID,
 *   BACKUP_S3_SECRET_ACCESS_KEY, BACKUP_S3_REGION, BACKUP_BASE (opcional).
 * Saída: `base=<nome>` em $GITHUB_OUTPUT. Código 2 = sem permissão de leitura/objeto ausente.
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'

const [label, outDir] = process.argv.slice(2)
const env = process.env
if (!/^[a-z0-9-]+$/.test(label ?? '') || !outDir) {
  console.error('::error::uso: download.mjs <rótulo> <diretório>')
  process.exit(1)
}
const bucket = env.BACKUP_S3_BUCKET || 'ppgps-backups'
if (!/backup/.test(bucket)) {
  console.error('::error::a origem deve ser o bucket de backups')
  process.exit(1)
}

const client = new S3Client({
  endpoint: env.BACKUP_S3_ENDPOINT,
  region: env.BACKUP_S3_REGION || 'auto',
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.BACKUP_S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: env.BACKUP_S3_SECRET_ACCESS_KEY ?? '',
  },
})

try {
  const keys = []
  let token
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: `${label}/`, ContinuationToken: token }),
    )
    for (const item of page.Contents ?? []) if (item.Key?.endsWith('.dump.age')) keys.push(item.Key)
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)

  const wanted = env.BACKUP_BASE?.trim()
  // Nomes têm carimbo UTC ordenável (rótulo-AAAAMMDDTHHMMSSZ).
  const dumpKey = wanted
    ? keys.find((key) => path.basename(key) === `${wanted}.dump.age`)
    : keys.sort().at(-1)
  if (!dumpKey) {
    console.error(`::warning::nenhum backup "${wanted || label}" encontrado em ${bucket}`)
    process.exit(2)
  }

  mkdirSync(outDir, { recursive: true })
  const base = path.basename(dumpKey, '.dump.age')
  for (const key of [dumpKey, dumpKey.replace(/\.dump\.age$/, '.manifest.json')]) {
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    const bytes = await object.Body.transformToByteArray()
    writeFileSync(path.join(outDir, path.basename(key)), bytes)
    console.log(`[backup-download] ${key} (${bytes.length} bytes)`)
  }
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `base=${base}\n`)
} catch (error) {
  const status = error?.$metadata?.httpStatusCode
  console.error(
    `::warning::leitura do bucket de backups falhou (${error?.name ?? 'Erro'}, HTTP ${status ?? '?'})`,
  )
  process.exit(2)
}

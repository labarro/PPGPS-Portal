#!/usr/bin/env node
/**
 * Envia o backup JÁ CRIPTOGRAFADO e o manifesto ao bucket `ppgps-backups` e aplica a retenção
 * do rótulo (homologação: 7 dias — planejamento 24.5). Usa credenciais EXCLUSIVAS de backup
 * (BACKUP_S3_*), nunca as da aplicação.
 *
 *   node scripts/backup/upload.mjs <arquivo.dump.age> <manifesto.json> <rótulo>
 *
 * Variáveis: BACKUP_S3_ENDPOINT, BACKUP_S3_BUCKET, BACKUP_S3_ACCESS_KEY_ID,
 *   BACKUP_S3_SECRET_ACCESS_KEY, BACKUP_S3_REGION, BACKUP_RETENTION_DAYS (padrão 7).
 */
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const [dump, manifest, label] = process.argv.slice(2)
const env = process.env
const fail = (message) => {
  console.error(`::error::[backup-upload] ${message}`)
  process.exit(1)
}

if (!dump || !manifest || !/^[a-z0-9-]+$/.test(label ?? ''))
  fail('uso: upload.mjs <dump.age> <manifest.json> <rótulo>')
if (!dump.endsWith('.dump.age'))
  fail('somente arquivos criptografados (.dump.age) podem ser enviados')
const bucket = env.BACKUP_S3_BUCKET || 'ppgps-backups'
if (!/backup/.test(bucket)) fail('o destino deve ser o bucket de backups')
if (!env.BACKUP_S3_ENDPOINT || !env.BACKUP_S3_ACCESS_KEY_ID || !env.BACKUP_S3_SECRET_ACCESS_KEY) {
  fail('credenciais de backup ausentes')
}

const client = new S3Client({
  endpoint: env.BACKUP_S3_ENDPOINT,
  region: env.BACKUP_S3_REGION || 'auto',
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.BACKUP_S3_ACCESS_KEY_ID,
    secretAccessKey: env.BACKUP_S3_SECRET_ACCESS_KEY,
  },
})

const now = new Date()
const folder = `${label}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`
for (const [file, type] of [
  [dump, 'application/octet-stream'],
  [manifest, 'application/json'],
]) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `${folder}/${path.basename(file)}`,
      Body: readFileSync(file),
      ContentType: type,
    }),
  )
  console.log(
    `[backup-upload] enviado ${folder}/${path.basename(file)} (${statSync(file).size} bytes)`,
  )
}

const retentionDays = Number(env.BACKUP_RETENTION_DAYS || 7)
const cutoff = now.getTime() - retentionDays * 86_400_000
const expired = []
let token
do {
  const page = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: `${label}/`, ContinuationToken: token }),
  )
  for (const item of page.Contents ?? []) {
    if (item.LastModified && item.LastModified.getTime() < cutoff) expired.push({ Key: item.Key })
  }
  token = page.IsTruncated ? page.NextContinuationToken : undefined
} while (token)

if (expired.length > 0) {
  await client.send(
    new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: expired, Quiet: true } }),
  )
}
console.log(
  `[backup-upload] retenção ${retentionDays} dias: ${expired.length} objeto(s) expirado(s) removido(s)`,
)

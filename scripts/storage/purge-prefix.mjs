#!/usr/bin/env node
/**
 * Remove os objetos do prefixo de um PR no bucket de PREVIEW quando o PR é fechado.
 * Travas: só o bucket `ppgps-preview` (ou o MinIO local) e só prefixos `pr-<número>`.
 * Variáveis: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION, S3_PREFIX.
 */
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'

const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PREFIX } = process.env
const fail = (message) => {
  console.error(`::error::[purge-prefix] ${message}`)
  process.exit(1)
}

if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY)
  fail('configuração incompleta')
if (!['ppgps-preview', 'ppgps-local', 'ppgps-test'].includes(S3_BUCKET))
  fail(`bucket "${S3_BUCKET}" não permitido`)
if (!/^pr-\d+$/.test(S3_PREFIX ?? ''))
  fail(`prefixo "${S3_PREFIX}" inválido (esperado pr-<número>)`)

const client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: process.env.S3_REGION || 'auto',
  forcePathStyle: true,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
})

let removed = 0
let token
do {
  const page = await client.send(
    new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: `${S3_PREFIX}/`,
      ContinuationToken: token,
    }),
  )
  const keys = (page.Contents ?? []).map((item) => ({ Key: item.Key }))
  if (keys.length > 0) {
    await client.send(
      new DeleteObjectsCommand({ Bucket: S3_BUCKET, Delete: { Objects: keys, Quiet: true } }),
    )
    removed += keys.length
  }
  token = page.IsTruncated ? page.NextContinuationToken : undefined
} while (token)

console.log(`[purge-prefix] ${removed} objeto(s) removido(s) de ${S3_BUCKET}/${S3_PREFIX}/`)

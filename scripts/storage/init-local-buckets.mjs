#!/usr/bin/env node
/**
 * Cria os buckets LOCAIS do MinIO (desenvolvimento e testes), se ainda não existirem.
 * Recusa qualquer endpoint que não seja local: nunca cria buckets no R2.
 */
import 'dotenv/config'

import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'

const endpoint = process.env.S3_ENDPOINT
if (!endpoint) {
  console.log('[storage:init] S3_ENDPOINT ausente; nada a fazer.')
  process.exit(0)
}
const host = new URL(endpoint).hostname
if (!['localhost', '127.0.0.1', 'minio'].includes(host)) {
  console.error(`[storage:init] Endpoint não local (${host}): operação recusada.`)
  process.exit(1)
}

const client = new S3Client({
  endpoint,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
})

const buckets = [...new Set([process.env.S3_BUCKET, process.env.S3_BUCKET_TEST].filter(Boolean))]

for (let attempt = 1; ; attempt += 1) {
  try {
    for (const Bucket of buckets) {
      try {
        await client.send(new HeadBucketCommand({ Bucket }))
        console.log(`[storage:init] bucket ${Bucket} já existe.`)
      } catch (error) {
        if (error?.$metadata?.httpStatusCode !== 404 && error?.name !== 'NotFound') throw error
        await client.send(new CreateBucketCommand({ Bucket }))
        console.log(`[storage:init] bucket ${Bucket} criado (privado).`)
      }
    }
    break
  } catch (error) {
    if (attempt >= 15) throw error
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

import { HeadObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'

/** Cliente do MinIO de TESTE (nunca R2: ver configureTestDatabase). */
export function testS3(): { client: S3Client; bucket: string; endpoint: string } {
  const endpoint = process.env.S3_ENDPOINT ?? ''
  const bucket = process.env.S3_BUCKET ?? ''
  if (!endpoint || !bucket) throw new Error('S3_ENDPOINT/S3_BUCKET de teste não configurados.')
  const client = new S3Client({
    endpoint,
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
  })
  return { client, bucket, endpoint }
}

export async function objectExists(key: string): Promise<boolean> {
  const { client, bucket } = testS3()
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

export async function listKeys(prefix: string): Promise<string[]> {
  const { client, bucket } = testS3()
  const result = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }))
  return (result.Contents ?? []).map((item) => item.Key ?? '')
}

import 'dotenv/config'

import { randomBytes } from 'node:crypto'

/**
 * Configura o processo para usar o banco e o bucket de TESTE.
 * - Local: `DATABASE_URL_TEST` (banco `ppgps_test`) e `S3_BUCKET_TEST` (MinIO).
 * - CI: `DATABASE_URL` do serviço Postgres efêmero e o MinIO do job.
 * Recusa bancos Neon e buckets remotos: testes automatizados nunca usam ambientes publicados
 * nem o Cloudflare R2 (custo e isolamento).
 */
export function configureTestDatabase(): string {
  const url = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
  if (!url) {
    throw new Error('Defina DATABASE_URL_TEST (local) ou DATABASE_URL (CI) para os testes.')
  }
  if (/neon\.tech/i.test(url)) {
    throw new Error('Testes automatizados não podem usar bancos Neon.')
  }
  process.env.DATABASE_URL = url
  process.env.PAYLOAD_SECRET ||= 'test-secret-not-used-outside-tests'

  if (process.env.S3_BUCKET_TEST) process.env.S3_BUCKET = process.env.S3_BUCKET_TEST
  const endpoint = process.env.S3_ENDPOINT
  if (endpoint && !/^https?:\/\/(localhost|127\.0\.0\.1|minio)(:\d+)?/i.test(endpoint)) {
    throw new Error('Testes automatizados só usam o MinIO local (nunca o R2).')
  }
  process.env.S3_PREFIX = ''
  return url
}

/** Senha fictícia aleatória que atende à política (≥ 12 caracteres, não previsível). */
export function strongTestPassword(): string {
  return `Teste-${randomBytes(18).toString('base64url')}-Zq`
}

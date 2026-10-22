import { type AppEnv, resolveAppEnv } from '../env/app-env'

/**
 * Configuração do armazenamento S3 compatível (ADR-0011):
 * - local e testes: MinIO do docker-compose;
 * - preview: bucket R2 `ppgps-preview`, prefixo exclusivo por PR (`pr-N/`);
 * - homologação: bucket R2 `ppgps-staging`;
 * - produção: bucket próprio (S06). O bucket de backups NUNCA é usado para uploads.
 *
 * As credenciais ficam só no servidor (sem prefixo `NEXT_PUBLIC_`).
 */
export type StorageConfig = {
  bucket: string
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle: boolean
  /** Prefixo raiz do ambiente (ex.: `pr-12`), sem barras nas pontas. */
  rootPrefix: string
}

type Env = Record<string, string | undefined>

const BACKUP_BUCKET_PATTERN = /backup/i

export class StorageConfigError extends Error {}

/** Normaliza um prefixo: só [a-z0-9-_/], sem barras repetidas ou nas pontas. */
export function sanitizePrefix(value: string | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '')
}

export function collectionPrefix(rootPrefix: string, collection: string): string {
  return rootPrefix ? `${rootPrefix}/${collection}` : collection
}

export function resolveStorageConfig(env: Env = process.env): StorageConfig | null {
  const bucket = env.S3_BUCKET?.trim()
  if (!bucket) return null

  const endpoint = env.S3_ENDPOINT?.trim()
  const accessKeyId = env.S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY?.trim()
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new StorageConfigError(
      'Armazenamento incompleto: defina S3_ENDPOINT, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY junto com S3_BUCKET.',
    )
  }
  if (BACKUP_BUCKET_PATTERN.test(bucket)) {
    throw new StorageConfigError(
      'O bucket de backups não pode ser usado para uploads da aplicação.',
    )
  }

  return {
    bucket,
    endpoint,
    region: env.S3_REGION?.trim() || 'auto',
    accessKeyId,
    secretAccessKey,
    forcePathStyle: (env.S3_FORCE_PATH_STYLE ?? 'true').trim().toLowerCase() !== 'false',
    rootPrefix: sanitizePrefix(env.S3_PREFIX),
  }
}

/** Fora do ambiente local, o armazenamento é obrigatório (falha fechada). */
export function storageRequired(env: AppEnv): boolean {
  return env !== 'local'
}

export function assertStorageForEnv(env: Env = process.env): StorageConfig | null {
  const appEnv = resolveAppEnv(env.APP_ENV)
  const config = resolveStorageConfig(env)
  if (!config && storageRequired(appEnv)) {
    throw new StorageConfigError(
      `Armazenamento S3/R2 não configurado no ambiente "${appEnv}" (defina S3_BUCKET e credenciais).`,
    )
  }
  return config
}

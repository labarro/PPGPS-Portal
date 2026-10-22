#!/usr/bin/env node
/**
 * Gera o `.env` LOCAL a partir de `.env.example`.
 * - Valores apontam apenas para os serviços do docker-compose (nunca para Neon ou R2).
 * - PAYLOAD_SECRET, senhas locais e senha do admin fictício são aleatórios.
 * - Se o `.env` já existir, nada é sobrescrito: apenas variáveis novas do modelo que ainda
 *   não existem são acrescentadas (ex.: ao atualizar de uma sprint anterior).
 */
import { randomBytes } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.join(root, '.env')
const template = path.join(root, '.env.example')

const random = (bytes) => randomBytes(bytes).toString('hex')
/** Senha forte e compatível com a política (≥ 12, com letras variadas). */
const strongPassword = () => `Local-${randomBytes(18).toString('base64url')}`

const parse = (text) =>
  Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => /^([A-Z0-9_]+)=(.*)$/.exec(line))
      .filter(Boolean)
      .map((match) => [match[1], match[2]]),
  )

const existing = existsSync(target) ? parse(readFileSync(target, 'utf8')) : {}

const pgUser = existing.POSTGRES_USER || 'ppgps'
const pgPassword = existing.POSTGRES_PASSWORD || random(12)
const pgPort = existing.POSTGRES_PORT || '5432'
const minioUser = existing.MINIO_ROOT_USER || 'ppgps'
const minioPassword = existing.MINIO_ROOT_PASSWORD || random(12)
const minioPort = existing.MINIO_API_PORT || '9000'

const values = {
  APP_ENV: 'local',
  DATABASE_URL: `postgres://${pgUser}:${pgPassword}@localhost:${pgPort}/ppgps`,
  DATABASE_URL_TEST: `postgres://${pgUser}:${pgPassword}@localhost:${pgPort}/ppgps_test`,
  PAYLOAD_SECRET: random(32),
  SERVER_URL: 'http://localhost:3000',
  BASIC_AUTH_USER: '',
  BASIC_AUTH_PASSWORD: '',
  SEED_ADMIN_EMAIL: 'admin@example.com',
  SEED_ADMIN_PASSWORD: strongPassword(),
  S3_ENDPOINT: `http://localhost:${minioPort}`,
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'ppgps-local',
  S3_BUCKET_TEST: 'ppgps-test',
  S3_ACCESS_KEY_ID: minioUser,
  S3_SECRET_ACCESS_KEY: minioPassword,
  S3_FORCE_PATH_STYLE: 'true',
  S3_PREFIX: '',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  SMTP_USER: '',
  SMTP_PASSWORD: '',
  SMTP_SECURE: 'false',
  EMAIL_SMTP_IS_SANDBOX: 'true',
  EMAIL_FROM_ADDRESS: 'nao-responda@example.com',
  EMAIL_FROM_NAME: 'Portal Bioética (local)',
  MAILPIT_API_URL: 'http://localhost:8025',
  SENTRY_DSN: '',
  NEXT_PUBLIC_SENTRY_DSN: '',
  CSP_REPORT_URI: '',
  POSTGRES_USER: pgUser,
  POSTGRES_PASSWORD: pgPassword,
  POSTGRES_DB: 'ppgps',
  POSTGRES_PORT: pgPort,
  MINIO_ROOT_USER: minioUser,
  MINIO_ROOT_PASSWORD: minioPassword,
  MINIO_API_PORT: minioPort,
  MINIO_CONSOLE_PORT: '9001',
  MAILPIT_SMTP_PORT: '1025',
  MAILPIT_UI_PORT: '8025',
}

if (!existsSync(target)) {
  const output = readFileSync(template, 'utf8')
    .split(/\r?\n/)
    .map((line) => {
      const match = /^([A-Z0-9_]+)=\s*$/.exec(line)
      if (!match) return line
      const key = match[1]
      return key in values ? `${key}=${values[key]}` : line
    })
    .join('\n')
  writeFileSync(target, output, { encoding: 'utf8', mode: 0o600 })
  console.log('[env:local] .env local criado com segredos aleatórios (não versionado).')
  process.exit(0)
}

const templateKeys = Object.keys(parse(readFileSync(template, 'utf8')))
const missing = templateKeys.filter((key) => !(key in existing))
if (missing.length === 0) {
  console.log('[env:local] .env já existe e está completo; nada foi alterado.')
  process.exit(0)
}
appendFileSync(
  target,
  `\n# Acrescentado por env:local\n${missing.map((key) => `${key}=${values[key] ?? ''}`).join('\n')}\n`,
)
console.log(
  `[env:local] .env existente preservado; variáveis novas acrescentadas: ${missing.join(', ')}`,
)

#!/usr/bin/env node
/**
 * Gera o `.env` LOCAL a partir de `.env.example`, se ainda não existir.
 * - Valores apontam apenas para os serviços do docker-compose (nunca para Neon).
 * - PAYLOAD_SECRET, senhas locais e senha do admin fictício são aleatórios.
 * Não sobrescreve um `.env` existente.
 */
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.join(root, '.env')
const template = path.join(root, '.env.example')

if (existsSync(target)) {
  console.log('[env:local] .env já existe; nada foi alterado.')
  process.exit(0)
}

const random = (bytes) => randomBytes(bytes).toString('hex')
const pgUser = 'ppgps'
const pgPassword = random(12)
const pgPort = '5432'

const values = {
  APP_ENV: 'local',
  DATABASE_URL: `postgres://${pgUser}:${pgPassword}@localhost:${pgPort}/ppgps`,
  DATABASE_URL_TEST: `postgres://${pgUser}:${pgPassword}@localhost:${pgPort}/ppgps_test`,
  PAYLOAD_SECRET: random(32),
  BASIC_AUTH_USER: '',
  BASIC_AUTH_PASSWORD: '',
  SEED_ADMIN_EMAIL: 'admin@example.com',
  SEED_ADMIN_PASSWORD: random(10),
  POSTGRES_USER: pgUser,
  POSTGRES_PASSWORD: pgPassword,
  POSTGRES_DB: 'ppgps',
  POSTGRES_PORT: pgPort,
  MINIO_ROOT_USER: 'ppgps',
  MINIO_ROOT_PASSWORD: random(12),
  MINIO_API_PORT: '9000',
  MINIO_CONSOLE_PORT: '9001',
}

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

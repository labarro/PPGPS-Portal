#!/usr/bin/env node
/**
 * Detecção de drift de schema (ADR-0008).
 *
 * O Payload gera migrations comparando o schema derivado da configuração com o snapshot
 * JSON da migration mais recente em `src/migrations`. Se `migrate:create --skip-empty`
 * produzir um arquivo novo, a configuração mudou sem migration correspondente => falha.
 *
 * O script sempre desfaz os arquivos que gerou, para não sujar a árvore de trabalho.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const migrationsDir = path.join(root, 'src', 'migrations')
const indexFile = path.join(migrationsDir, 'index.ts')

const list = () => (existsSync(migrationsDir) ? new Set(readdirSync(migrationsDir)) : new Set())

const before = list()
const indexBefore = existsSync(indexFile) ? readFileSync(indexFile, 'utf8') : null

// Comando fixo (sem entrada externa); string única para funcionar com `shell` no Windows.
const result = spawnSync('pnpm exec payload migrate:create drift_check --skip-empty', {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
})

const created = [...list()].filter((file) => !before.has(file))

for (const file of created) {
  const full = path.join(migrationsDir, file)
  if (file.endsWith('.ts')) {
    console.error(`\n----- Conteúdo da migration pendente (${file}) -----`)
    console.error(readFileSync(full, 'utf8'))
  }
  rmSync(full, { force: true })
}
if (indexBefore !== null) writeFileSync(indexFile, indexBefore)

if (result.status !== 0) {
  console.error(`\n[migrate:check] Falha ao executar migrate:create (código ${result.status}).`)
  process.exit(result.status ?? 1)
}

if (created.length > 0) {
  console.error(
    '\n[migrate:check] DRIFT DETECTADO: a configuração do Payload tem alterações de schema sem ' +
      'migration correspondente.\nExecute `pnpm migrate:create <nome-descritivo>` e versione a ' +
      'migration e os tipos (`pnpm generate:types`) no mesmo commit.',
  )
  process.exit(1)
}

console.log('[migrate:check] OK: nenhuma alteração de schema sem migration.')

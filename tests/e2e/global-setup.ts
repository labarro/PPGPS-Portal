import { execSync } from 'node:child_process'

import { configureTestDatabase } from '../helpers/test-env'

/**
 * Conteúdo institucional da S03 e integrantes FICTÍCIOS da S04 no banco de TESTE (seeds
 * idempotentes; só preenchem o que falta).
 * As migrations já foram aplicadas antes (CI: passo dedicado; local: `pnpm test:int`/`migrate`).
 */
export default function globalSetup(): void {
  configureTestDatabase()
  for (const script of ['seed:content', 'seed:people']) {
    execSync(`pnpm ${script}`, { stdio: 'inherit', env: { ...process.env, APP_ENV: 'local' } })
  }
}

import { execSync } from 'node:child_process'

import { configureTestDatabase } from '../helpers/test-env'

/**
 * Conteúdo institucional da S03 no banco de TESTE (seed idempotente; só preenche o que falta).
 * As migrations já foram aplicadas antes (CI: passo dedicado; local: `pnpm test:int`/`migrate`).
 */
export default function globalSetup(): void {
  configureTestDatabase()
  execSync('pnpm seed:content', {
    stdio: 'inherit',
    env: { ...process.env, APP_ENV: 'local' },
  })
}

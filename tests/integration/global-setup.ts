import { execSync } from 'node:child_process'

import { configureTestDatabase } from '../helpers/test-env'

/** Aplica as migrations versionadas no banco de teste antes da suíte de integração. */
export default function globalSetup(): void {
  configureTestDatabase()
  execSync('pnpm migrate', { stdio: 'inherit', env: process.env })
}

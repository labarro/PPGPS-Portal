import { defineConfig, devices } from '@playwright/test'

import { configureTestDatabase } from './tests/helpers/test-env'

/**
 * E2E de fumaça (S01). Usa o banco de TESTE e uma porta própria (3100) para não reutilizar
 * um `pnpm dev` aberto com o banco de desenvolvimento.
 * - Local: `next dev`.
 * - CI: `E2E_SERVER_COMMAND="pnpm start"` após `pnpm build`.
 */
configureTestDatabase()

const PORT = Number(process.env.E2E_PORT || 3100)
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  // Conteúdo institucional da S03 (seed idempotente) no banco de teste.
  globalSetup: './tests/e2e/global-setup.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL,
    locale: 'pt-BR',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.E2E_SERVER_COMMAND || `pnpm exec next dev --port ${PORT}`,
    // Prontidão por uma rota sem banco: não aquece o cache de dados antes do seed.
    url: `${baseURL}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      APP_ENV: 'local',
      PORT: String(PORT),
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ?? '',
      BASIC_AUTH_USER: '',
      BASIC_AUTH_PASSWORD: '',
      // Bucket de TESTE no MinIO (nunca R2) e sem Sentry nos E2E.
      S3_BUCKET: process.env.S3_BUCKET ?? '',
      S3_PREFIX: '',
      SENTRY_DSN: '',
      // Cache de dados novo a cada execução (o cache em disco do Next sobrevive a reinícios).
      DATA_CACHE_SCOPE: `e2e-${Date.now()}`,
    },
  },
})

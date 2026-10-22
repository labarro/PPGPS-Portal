import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/access/**/*.ts', 'src/hooks/**/*.ts', 'src/proxy.ts'],
      thresholds: {
        lines: 70,
      },
      reporter: ['text', 'html'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.int.test.ts'],
          globalSetup: ['./tests/integration/global-setup.ts'],
          setupFiles: ['./tests/integration/setup.ts'],
          // Um único processo: os testes compartilham o banco de teste.
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
})

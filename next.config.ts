import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { resolveAppEnv } from './src/lib/env/app-env'
import { securityHeaders } from './src/lib/security/headers'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const appEnv = resolveAppEnv(process.env.APP_ENV)

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Ambiente lógico exposto ao cliente (somente o nome; nunca segredos) — usado pelo Sentry.
  env: { NEXT_PUBLIC_APP_ENV: appEnv },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders(appEnv, { cspReportUri: process.env.CSP_REPORT_URI || null }),
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

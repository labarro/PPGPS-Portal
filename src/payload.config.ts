import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { pt } from '@payloadcms/translations/languages/pt'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { AuditLogs } from './collections/AuditLogs'
import { Documents } from './collections/Documents'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { sentryTestEndpoint } from './endpoints/sentry-test'
import { Footer } from './globals/Footer'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'
import { withAudit, withGlobalAudit } from './hooks/audit'
import { buildEmailAdapter } from './lib/email/adapter'
import { resolveAppEnv } from './lib/env/app-env'
import { defaultLocale, locales } from './lib/i18n/locales'
import { collectionPrefix, resolveStorageConfig, storageRequired } from './lib/storage/config'
import { MAX_BYTES } from './lib/uploads/file-signature'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const appEnv = resolveAppEnv(process.env.APP_ENV)
const storage = resolveStorageConfig()

/** URL assinada de documentos: 5 minutos, gerada só depois da verificação de acesso. */
const SIGNED_URL_TTL_SECONDS = 300

export default buildConfig({
  // Sem `serverURL`: o painel usa URLs relativas (previews têm URL variável). Links absolutos
  // de e-mail usam `resolveServerUrl()` (nunca o cabeçalho Host).
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Portal Bioética e Promoção da Saúde',
    },
  },
  collections: withAudit([Users, Media, Documents, AuditLogs]).map((collection) =>
    collection.slug === Users.slug
      ? { ...collection, endpoints: [sentryTestEndpoint] }
      : collection,
  ),
  globals: withGlobalAudit([Navigation, Footer, SiteSettings]),
  editor: lexicalEditor(),
  email: buildEmailAdapter(),
  // Idioma da interface do painel administrativo.
  i18n: {
    fallbackLanguage: 'pt',
    supportedLanguages: { pt, en },
  },
  // Idiomas do conteúdo: pt-BR padrão; `en` declarado para a V2 e oculto na UI pública.
  localization: {
    locales: locales.map(({ code, label }) => ({ code, label })),
    defaultLocale,
    fallback: true,
  },
  // GraphQL desabilitado (AGENTS.md §4.12; planejamento 11.3). As rotas também não existem.
  graphQL: {
    disable: true,
  },
  // Limite de leitura do corpo multipart (maior limite por tipo: PDF 25 MB). Limites por tipo
  // são aplicados por magic bytes em `secureUpload`.
  upload: {
    limits: { fileSize: MAX_BYTES.pdf },
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Schema só muda por migrations versionadas (ADR-0005). Nunca sincronização automática.
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  telemetry: false,
  hooks: {
    // Erros inesperados (5xx) da API vão ao Sentry (sem dados pessoais; ver scrub.ts).
    afterError: [
      async ({ error }) => {
        const status = (error as { status?: number }).status ?? 500
        if (status < 500) return
        const Sentry = await import('@sentry/nextjs')
        Sentry.captureException(error)
      },
    ],
  },
  onInit: async (payload) => {
    if (!storage && storageRequired(appEnv)) {
      payload.logger.error(
        `Armazenamento S3/R2 não configurado em "${appEnv}": uploads ficarão indisponíveis.`,
      )
    }
  },
  plugins: [
    s3Storage({
      // Habilitado quando há configuração (MinIO local, R2 em preview/homologação).
      enabled: storage !== null,
      // Schema idêntico com ou sem storage (campo `prefix` sempre presente).
      alwaysInsertFields: true,
      bucket: storage?.bucket ?? 'storage-disabled',
      acl: 'private',
      config: {
        endpoint: storage?.endpoint,
        region: storage?.region ?? 'auto',
        forcePathStyle: storage?.forcePathStyle ?? true,
        credentials: storage
          ? { accessKeyId: storage.accessKeyId, secretAccessKey: storage.secretAccessKey }
          : undefined,
      },
      collections: {
        media: {
          prefix: collectionPrefix(storage?.rootPrefix ?? '', 'media'),
        },
        documents: {
          prefix: collectionPrefix(storage?.rootPrefix ?? '', 'documents'),
          signedDownloads: {
            expiresIn: SIGNED_URL_TTL_SECONDS,
            shouldUseSignedURL: () => true,
          },
        },
      },
    }),
  ],
})

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { pt } from '@payloadcms/translations/languages/pt'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { defaultLocale, locales } from './lib/i18n/locales'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Sem `serverURL`: o painel usa URLs relativas, o que funciona nos previews da Vercel
  // (URL diferente por deploy). Será definido quando houver e-mail/URLs absolutas (S02).
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Portal Bioética e Promoção da Saúde',
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
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
  plugins: [],
})

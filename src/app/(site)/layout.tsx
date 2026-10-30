import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import type { ReactNode } from 'react'

import { DraftBanner } from '@/components/site/draft-banner'
import { MaintenanceNotice } from '@/components/site/maintenance-notice'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { SkipLink } from '@/components/site/skip-link'
import { getGroupProfile, getReadContext } from '@/lib/content/queries'
import { isProduction, resolveAppEnv } from '@/lib/env/app-env'
import { resolveServerUrl } from '@/lib/env/server-url'
import { defaultLocale } from '@/lib/i18n/locales'
import { getSiteChrome } from '@/lib/site/chrome'
import { SITE_FULL_NAME, SITE_SHORT_NAME } from '@/lib/site/identity'

import './styles.css'

// Fontes servidas pelo próprio site (next/font), sem requisições a terceiros no navegador.
const sans = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans-face' })
const serif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif-face',
})

const appEnv = resolveAppEnv(process.env.APP_ENV)

/**
 * Renderização no servidor a cada requisição, com os DADOS em cache por tags (ADR-0013):
 * o build não acessa o banco (ADR-0005), então não há HTML estático com conteúdo; os hooks
 * do Payload revalidam as tags ao publicar e a mudança aparece sem novo deploy.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(resolveServerUrl()),
  title: {
    default: SITE_FULL_NAME,
    template: `%s · ${SITE_SHORT_NAME}`,
  },
  description: `Portal do ${SITE_FULL_NAME}.`,
  robots: isProduction(appEnv) ? undefined : { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#0b2545',
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [chrome, profile, readContext] = await Promise.all([
    getSiteChrome(),
    getGroupProfile(),
    getReadContext(),
  ])
  return (
    <html lang={defaultLocale} className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        {readContext.draft ? <DraftBanner /> : null}
        <MaintenanceNotice />
        <SiteHeader chrome={chrome} />
        <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter chrome={chrome} profile={profile} />
      </body>
    </html>
  )
}

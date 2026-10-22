import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { SkipLink } from '@/components/site/skip-link'
import { isProduction, resolveAppEnv } from '@/lib/env/app-env'
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

// ISR: páginas estáticas regeneradas periodicamente; mudanças nos globals revalidam na hora.
export const revalidate = 300

export const metadata: Metadata = {
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
  const chrome = await getSiteChrome()
  return (
    <html lang={defaultLocale} className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <SiteHeader chrome={chrome} />
        <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter chrome={chrome} />
      </body>
    </html>
  )
}

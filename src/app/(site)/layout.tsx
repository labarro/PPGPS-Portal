import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { defaultLocale } from '@/lib/i18n/locales'
import { isProduction, resolveAppEnv } from '@/lib/env/app-env'

import './styles.css'

const appEnv = resolveAppEnv(process.env.APP_ENV)

export const metadata: Metadata = {
  title: {
    default: 'Bioética e Promoção da Saúde — grupo de pesquisa',
    template: '%s — Bioética e Promoção da Saúde',
  },
  description:
    'Portal do grupo de pesquisa Bioética e Promoção da Saúde (em construção). Portal não oficial.',
  robots: isProduction(appEnv) ? undefined : { index: false, follow: false },
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLocale}>
      <body>
        <main id="conteudo">{children}</main>
      </body>
    </html>
  )
}

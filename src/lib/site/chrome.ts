import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { defaultLocale } from '../i18n/locales'
import { SITE_FULL_NAME, SITE_SHORT_NAME } from './identity'

export type SiteLink = { label: string; href: string }

export type SiteChrome = {
  siteName: string
  shortName: string
  description: string | null
  navigation: SiteLink[]
  footer: {
    about: string | null
    contactEmail: string | null
    links: SiteLink[]
    legalLinks: SiteLink[]
  }
}

export const DEFAULT_NAVIGATION: SiteLink[] = [{ label: 'Início', href: '/' }]

export const DEFAULT_CHROME: SiteChrome = {
  siteName: SITE_FULL_NAME,
  shortName: SITE_SHORT_NAME,
  description: null,
  navigation: DEFAULT_NAVIGATION,
  footer: { about: null, contactEmail: null, links: [], legalLinks: [] },
}

type RawLink = { label?: string | null; href?: string | null } | null | undefined

const toLinks = (items: RawLink[] | null | undefined): SiteLink[] =>
  (items ?? [])
    .filter((item): item is { label: string; href: string } => !!item?.label && !!item?.href)
    .map(({ label, href }) => ({ label, href }))

/**
 * Lê os globals públicos (Navigation, Footer, SiteSettings) via Local API como visitante
 * anônimo (`overrideAccess: false`, AGENTS.md §4.5). Durante o build não há banco
 * (ADR-0005): usa os valores padrão e a página é regenerada (ISR) em produção.
 */
export const getSiteChrome = cache(async (): Promise<SiteChrome> => {
  if (process.env.NEXT_PHASE === 'phase-production-build') return DEFAULT_CHROME

  try {
    const payload = await getPayload({ config })
    const common = { overrideAccess: false, locale: defaultLocale, depth: 0 } as const
    const [settings, navigation, footer] = await Promise.all([
      payload.findGlobal({ slug: 'site-settings', ...common }),
      payload.findGlobal({ slug: 'navigation', ...common }),
      payload.findGlobal({ slug: 'footer', ...common }),
    ])
    const nav = toLinks(navigation.items)
    return {
      siteName: settings.siteName || SITE_FULL_NAME,
      shortName: settings.shortName || SITE_SHORT_NAME,
      description: settings.defaultDescription ?? null,
      navigation: nav.length > 0 ? nav : DEFAULT_NAVIGATION,
      footer: {
        about: footer.about ?? null,
        contactEmail: footer.contactEmail ?? null,
        links: toLinks(footer.links),
        legalLinks: toLinks(footer.legalLinks),
      },
    }
  } catch (error) {
    console.error('[site] Falha ao ler os globals; usando valores padrão.', error)
    return DEFAULT_CHROME
  }
})

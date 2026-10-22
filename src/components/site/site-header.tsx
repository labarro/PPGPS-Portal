import Link from 'next/link'

import type { SiteChrome } from '@/lib/site/chrome'

import { MobileNav } from './mobile-nav'
import { NavLinks } from './nav-links'

/**
 * Cabeçalho (planejamento 16.1–16.2): wordmark tipográfico com o nome do grupo (Q2) —
 * completo em telas médias e grandes, versão curta no celular — e navegação principal.
 * Nenhum logotipo institucional (sem autorização formal).
 */
export function SiteHeader({ chrome }: { chrome: SiteChrome }) {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-b-primary bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label={`${chrome.siteName} — página inicial`}
          className="group min-w-0 rounded-sm text-primary"
          data-testid="wordmark"
        >
          <span className="block font-serif text-lg leading-tight font-semibold tracking-tight group-hover:underline md:hidden">
            {chrome.shortName}
          </span>
          <span className="hidden max-w-xl font-serif text-xl leading-snug font-semibold tracking-tight text-balance group-hover:underline md:block">
            {chrome.siteName}
          </span>
        </Link>

        <nav aria-label="Menu principal" className="hidden md:block">
          <NavLinks items={chrome.navigation} orientation="horizontal" />
        </nav>

        <MobileNav items={chrome.navigation} siteName={chrome.siteName} />
      </div>
    </header>
  )
}

import type { ReactNode } from 'react'

import { GROUP_SECTIONS, FIXED_GROUP_SLUGS, pagePath } from '@/lib/content/paths'
import type { PageSummary } from '@/lib/content/queries'
import type { SiteLink } from '@/lib/site/chrome'

import { SectionNav } from './section-nav'

/** Itens da navegação de "O grupo": seções fixas + páginas livres publicadas. */
export function groupNavItems(pages: PageSummary[]): SiteLink[] {
  const fixed = GROUP_SECTIONS.map(({ label, href }) => ({ label, href }))
  const extra = pages
    .filter((page) => !FIXED_GROUP_SLUGS.includes(page.slug))
    .map((page) => ({ label: page.title, href: pagePath(page.slug) }))
  return [...fixed, ...extra]
}

/** Estrutura das páginas de "O grupo": navegação da seção + conteúdo. */
export function GroupShell({ pages, children }: { pages: PageSummary[]; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
      <aside className="min-w-0">
        <SectionNav label="Seções de O grupo" items={groupNavItems(pages)} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

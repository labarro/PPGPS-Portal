import Link from 'next/link'

import { LEGAL_PAGES } from '@/lib/content/paths'
import type { SiteChrome, SiteLink } from '@/lib/site/chrome'
import type { GroupProfile } from '@/payload-types'

import { InstitutionalReferences } from './institutional-references'

const isExternal = (href: string) => /^(https?:|mailto:)/i.test(href)

function FooterLink({ link }: { link: SiteLink }) {
  const className =
    'inline-flex min-h-11 items-center rounded-sm text-inverse-foreground underline-offset-4 hover:underline md:min-h-6'
  return isExternal(link.href) ? (
    <a href={link.href} className={className} rel="noopener noreferrer">
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  )
}

function FooterColumn({
  id,
  title,
  links,
  className,
}: {
  id: string
  title: string
  links: SiteLink[]
  className?: string
}) {
  if (links.length === 0) return null
  return (
    <nav aria-labelledby={id} className={className}>
      <h2 id={id} className="text-sm font-semibold text-inverse-foreground">
        {title}
      </h2>
      <ul className="mt-2 flex flex-col text-sm md:mt-3 md:gap-2">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <FooterLink link={link} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

const PORTAL_LINKS: SiteLink[] = [
  { label: 'O grupo', href: '/o-grupo' },
  { label: 'Histórico', href: '/o-grupo/historico' },
  { label: 'Objetivos', href: '/o-grupo/objetivos' },
  { label: 'Linhas temáticas', href: '/linhas' },
  { label: 'Integrantes', href: '/integrantes' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contato', href: '/o-grupo/contato' },
]

/**
 * Rodapé (planejamento 8.1 item 10 e 16.2; Q1 e Q2): nome do grupo, contato, navegação,
 * referências institucionais marcadas para o rodapé (somente texto e links) e páginas legais.
 * Sem aviso ostensivo de portal não oficial e sem logotipos institucionais.
 */
export function SiteFooter({
  chrome,
  profile,
}: {
  chrome: SiteChrome
  profile: GroupProfile | null
}) {
  const { footer } = chrome
  const year = new Date().getUTCFullYear()
  const contactEmail = profile?.contactEmail || footer.contactEmail
  const references = (profile?.institutionalReferences ?? []).filter((r) => r.showInFooter)
  // S06: páginas legais sempre presentes; links legais extras do CMS sem duplicar endereços.
  const legalHrefs = new Set<string>(LEGAL_PAGES.map((page) => page.href))
  const legalLinks: SiteLink[] = [
    ...LEGAL_PAGES.map(({ label, href }) => ({ label, href })),
    ...footer.legalLinks.filter((link) => !legalHrefs.has(link.href)),
  ]
  return (
    <footer className="surface-inverse mt-12 bg-inverse text-inverse-foreground sm:mt-20 [main:has(>section.bg-muted:last-child)+&]:mt-0">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 sm:py-14 md:gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <section aria-labelledby="rodape-grupo" className="col-span-2 md:col-span-1">
          <h2
            id="rodape-grupo"
            className="font-serif text-lg leading-snug font-semibold sm:text-xl"
          >
            {chrome.siteName}
          </h2>
          {footer.about ? (
            <p className="mt-3 text-sm leading-relaxed text-inverse-muted-foreground">
              {footer.about}
            </p>
          ) : null}
          {contactEmail ? (
            <p className="mt-4 text-sm">
              <span className="text-inverse-muted-foreground">Contato: </span>
              <a
                href={`mailto:${contactEmail}`}
                className="rounded-sm underline underline-offset-4 hover:no-underline"
              >
                {contactEmail}
              </a>
            </p>
          ) : null}
        </section>

        <FooterColumn id="rodape-portal" title="Portal" links={PORTAL_LINKS} />

        {references.length > 0 ? (
          <section
            aria-labelledby="rodape-referencias"
            className="order-last col-span-2 md:order-none md:col-span-1"
          >
            <h2 id="rodape-referencias" className="text-sm font-semibold">
              Referências institucionais
            </h2>
            <InstitutionalReferences references={references} variant="compact" className="mt-3" />
          </section>
        ) : null}

        <FooterColumn id="rodape-links" title="Links" links={[...footer.links, ...legalLinks]} />
      </div>
      <div className="border-t border-white/20">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-inverse-muted-foreground sm:px-6">
          © {year} {chrome.siteName}
        </p>
      </div>
    </footer>
  )
}

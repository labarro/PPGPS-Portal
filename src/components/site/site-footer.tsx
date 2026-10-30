import Link from 'next/link'

import type { SiteChrome, SiteLink } from '@/lib/site/chrome'
import type { GroupProfile } from '@/payload-types'

import { InstitutionalReferences } from './institutional-references'

const isExternal = (href: string) => /^(https?:|mailto:)/i.test(href)

function FooterLink({ link }: { link: SiteLink }) {
  const className =
    'inline-flex min-h-6 items-center rounded-sm text-inverse-foreground underline-offset-4 hover:underline'
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

function FooterColumn({ id, title, links }: { id: string; title: string; links: SiteLink[] }) {
  if (links.length === 0) return null
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="text-sm font-semibold text-inverse-foreground">
        {title}
      </h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
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
  return (
    <footer className="surface-inverse mt-20 bg-inverse text-inverse-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <section aria-labelledby="rodape-grupo">
          <h2 id="rodape-grupo" className="font-serif text-xl leading-snug font-semibold">
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
          <section aria-labelledby="rodape-referencias">
            <h2 id="rodape-referencias" className="text-sm font-semibold">
              Referências institucionais
            </h2>
            <InstitutionalReferences references={references} variant="compact" className="mt-3" />
          </section>
        ) : null}

        <FooterColumn
          id="rodape-links"
          title="Links"
          links={[...footer.links, ...footer.legalLinks]}
        />
      </div>
      <div className="border-t border-white/20">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-inverse-muted-foreground sm:px-6">
          © {year} {chrome.siteName}
        </p>
      </div>
    </footer>
  )
}

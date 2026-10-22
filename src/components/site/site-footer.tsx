import Link from 'next/link'

import type { SiteChrome, SiteLink } from '@/lib/site/chrome'

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

/**
 * Rodapé (planejamento 16.2; Q1 e Q2): nome do grupo, contato, links e páginas legais.
 * Sem aviso ostensivo de portal não oficial e sem logotipos institucionais.
 */
export function SiteFooter({ chrome }: { chrome: SiteChrome }) {
  const { footer } = chrome
  const year = new Date().getUTCFullYear()
  return (
    <footer className="surface-inverse mt-16 bg-inverse text-inverse-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <section aria-labelledby="rodape-grupo" className="md:col-span-1">
          <h2 id="rodape-grupo" className="font-serif text-lg leading-snug font-semibold">
            {chrome.siteName}
          </h2>
          {footer.about ? (
            <p className="mt-3 text-sm text-inverse-muted-foreground">{footer.about}</p>
          ) : null}
          {footer.contactEmail ? (
            <p className="mt-4 text-sm">
              <span className="text-inverse-muted-foreground">Contato: </span>
              <a
                href={`mailto:${footer.contactEmail}`}
                className="rounded-sm underline underline-offset-4 hover:no-underline"
              >
                {footer.contactEmail}
              </a>
            </p>
          ) : null}
        </section>

        {footer.links.length > 0 ? (
          <nav aria-labelledby="rodape-links">
            <h2 id="rodape-links" className="text-sm font-semibold tracking-wide uppercase">
              Links
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {footer.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {footer.legalLinks.length > 0 ? (
          <nav aria-labelledby="rodape-legal">
            <h2 id="rodape-legal" className="text-sm font-semibold tracking-wide uppercase">
              Informações
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {footer.legalLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
      <div className="border-t border-white/20">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-inverse-muted-foreground sm:px-6">
          © {year} {chrome.siteName}
        </p>
      </div>
    </footer>
  )
}

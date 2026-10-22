import { MailIcon } from 'lucide-react'
import type { Metadata } from 'next'

import { ComplementaryContent } from '@/components/site/complementary-content'
import { GroupShell } from '@/components/site/group-shell'
import { PageHeader } from '@/components/site/page-header'
import { SectionTitle } from '@/components/site/section-title'
import { getGroupProfile, listPages } from '@/lib/content/queries'
import { pageMetadata } from '@/lib/content/seo'
import { getSiteChrome } from '@/lib/site/chrome'

const TITLE = 'Contato'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: TITLE,
    path: '/o-grupo/contato',
    description: 'Como entrar em contato com o grupo de pesquisa.',
  })
}

export default async function ContactPage() {
  const [profile, pages, chrome] = await Promise.all([
    getGroupProfile(),
    listPages(),
    getSiteChrome(),
  ])
  const email = profile?.contactEmail || chrome.footer.contactEmail

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'O grupo', href: '/o-grupo' },
          { label: TITLE },
        ]}
        title={TITLE}
        lead="Canal do grupo para estudantes, pesquisadores e demais interessados."
      />
      <GroupShell pages={pages}>
        <div className="flex max-w-2xl flex-col gap-12">
          <section aria-labelledby="canal">
            <SectionTitle id="canal">Fale com o grupo</SectionTitle>
            {email ? (
              <p className="mt-5">
                <a
                  href={`mailto:${email}`}
                  className="inline-flex min-h-12 items-center gap-3 rounded-md border bg-secondary px-5 text-lg font-medium text-primary hover:bg-accent"
                >
                  <MailIcon className="size-5" aria-hidden="true" />
                  {email}
                </a>
              </p>
            ) : (
              <p
                className="mt-4 leading-relaxed text-muted-foreground"
                data-testid="contact-pending"
              >
                O canal de contato do grupo será informado em breve.
              </p>
            )}
          </section>

          {profile?.dgpUrl ? (
            <section aria-labelledby="registro-contato">
              <SectionTitle id="registro-contato">Registro oficial</SectionTitle>
              <p className="mt-4 leading-relaxed">
                Os dados de contato registrados pelo grupo no Diretório dos Grupos de Pesquisa do
                CNPq estão disponíveis no{' '}
                <a
                  href={profile.dgpUrl}
                  rel="noopener noreferrer"
                  className="text-link underline underline-offset-4 hover:no-underline"
                >
                  espelho do grupo no DGP
                  <span className="sr-only"> (site externo)</span>
                </a>
                .
              </p>
            </section>
          ) : null}
        </div>
        <ComplementaryContent slug="contato" />
      </GroupShell>
    </>
  )
}

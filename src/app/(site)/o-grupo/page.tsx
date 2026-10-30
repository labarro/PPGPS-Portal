import type { Metadata } from 'next'
import Link from 'next/link'

import { RichText } from '@/components/rich-text/rich-text'
import { EmptyState } from '@/components/site/empty-state'
import { GroupFacts } from '@/components/site/group-facts'
import { GroupShell } from '@/components/site/group-shell'
import { JsonLd } from '@/components/site/json-ld'
import { PageHeader } from '@/components/site/page-header'
import { type LineRef, PersonCard } from '@/components/site/person-card'
import { ProvisionalNote } from '@/components/site/provisional-note'
import { ResearchLinesDiptych } from '@/components/site/research-lines-diptych'
import { SectionTitle } from '@/components/site/section-title'
import { SourceNote } from '@/components/site/source-note'
import { breadcrumbJsonLd, organizationJsonLd } from '@/lib/content/jsonld'
import { MEMBERS_BASE_PATH } from '@/lib/content/paths'
import { getGroupProfile, listDirectory, listPages, listResearchLines } from '@/lib/content/queries'
import { isRichTextEmpty } from '@/lib/content/rich-text'
import { metaDescription, pageMetadata } from '@/lib/content/seo'
import { resolveServerUrl } from '@/lib/env/server-url'
import { authorizedLeaders } from '@/lib/people/directory'

const TITLE = 'O grupo'

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getGroupProfile()
  return pageMetadata({
    title: TITLE,
    path: '/o-grupo',
    description: metaDescription(profile?.summary),
  })
}

export default async function GroupPage() {
  const [profile, lines, pages, directory] = await Promise.all([
    getGroupProfile(),
    listResearchLines(),
    listPages(),
    listDirectory(),
  ])
  const siteUrl = resolveServerUrl()
  // Líderes: somente perfis autorizados (diretório anônimo) com vínculo ativo de líder.
  const leaders = authorizedLeaders(profile?.leaders, directory)
  const linesById = new Map<string, LineRef>(
    lines.map(({ id, name, slug }) => [String(id), { id, name, slug }]),
  )

  return (
    <>
      {profile ? (
        <JsonLd
          data={[
            organizationJsonLd(profile, siteUrl),
            breadcrumbJsonLd(
              [
                { name: 'Início', path: '/' },
                { name: TITLE, path: '/o-grupo' },
              ],
              siteUrl,
            ),
          ]}
        />
      ) : null}
      <PageHeader
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: TITLE }]}
        title={TITLE}
        lead={profile?.summary}
      >
        {profile?.provisionalTexts ? <ProvisionalNote /> : null}
      </PageHeader>

      <GroupShell pages={pages}>
        {!profile ? (
          <EmptyState
            title="Apresentação em preparação"
            description="As informações do grupo serão publicadas em breve."
          />
        ) : (
          <div className="flex flex-col gap-16">
            <section aria-labelledby="apresentacao">
              <SectionTitle id="apresentacao">Apresentação</SectionTitle>
              {isRichTextEmpty(profile.description) ? (
                <p className="mt-4 text-muted-foreground">Texto de apresentação em elaboração.</p>
              ) : (
                <RichText data={profile.description} baseHeading={3} className="mt-5" />
              )}
            </section>

            {lines.length > 0 ? (
              <section aria-labelledby="linhas">
                <SectionTitle id="linhas">Linhas temáticas</SectionTitle>
                <ResearchLinesDiptych lines={lines} className="mt-6" />
              </section>
            ) : null}

            <section aria-labelledby="lideranca">
              <SectionTitle id="lideranca">Liderança</SectionTitle>
              {leaders.length > 0 ? (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2" data-testid="group-leaders">
                  {leaders.map((person) => (
                    <li key={person.id}>
                      <PersonCard person={person} lines={linesById} />
                    </li>
                  ))}
                </ul>
              ) : profile.leadersText ? (
                <p className="mt-4 max-w-prose leading-relaxed whitespace-pre-line">
                  {profile.leadersText}
                </p>
              ) : null}
              <p className="mt-6">
                <Link
                  href={MEMBERS_BASE_PATH}
                  className="inline-flex min-h-11 items-center rounded-sm font-medium text-link underline underline-offset-4 hover:no-underline"
                >
                  Conheça os integrantes do grupo
                </Link>
              </p>
            </section>

            <section aria-labelledby="registro">
              <SectionTitle id="registro">
                Registro no Diretório dos Grupos de Pesquisa
              </SectionTitle>
              <GroupFacts profile={profile} className="mt-4 max-w-2xl" />
              {profile.alternativeNames && profile.alternativeNames.length > 0 ? (
                <div className="mt-8 max-w-2xl">
                  <h3 className="font-serif text-lg font-semibold text-primary">
                    Outros nomes do grupo
                  </h3>
                  <ul className="mt-3 flex flex-col gap-3">
                    {profile.alternativeNames.map((item) => (
                      <li key={item.id ?? item.name}>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Fonte: {item.source}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="mt-8 max-w-prose leading-relaxed text-muted-foreground">
                O histórico do grupo, com as linhas registradas no DGP, está em{' '}
                <Link
                  href="/o-grupo/historico"
                  className="text-link underline underline-offset-4 hover:no-underline"
                >
                  Histórico
                </Link>
                ; os vínculos institucionais, em{' '}
                <Link
                  href="/o-grupo/referencias-institucionais"
                  className="text-link underline underline-offset-4 hover:no-underline"
                >
                  Referências institucionais
                </Link>
                .
              </p>
            </section>

            <SourceNote source={profile.source} collectedAt={profile.collectedAt} />
          </div>
        )}
      </GroupShell>
    </>
  )
}

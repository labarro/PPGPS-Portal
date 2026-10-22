import type { Metadata } from 'next'
import Link from 'next/link'

import { RichText } from '@/components/rich-text/rich-text'
import { ComplementaryContent } from '@/components/site/complementary-content'
import { DgpLines } from '@/components/site/dgp-lines'
import { EmptyState } from '@/components/site/empty-state'
import { GroupFacts } from '@/components/site/group-facts'
import { GroupShell } from '@/components/site/group-shell'
import { PageHeader } from '@/components/site/page-header'
import { ProvisionalNote } from '@/components/site/provisional-note'
import { SectionTitle } from '@/components/site/section-title'
import { SourceNote } from '@/components/site/source-note'
import { researchLinePath } from '@/lib/content/paths'
import { getGroupProfile, listPages, listResearchLines } from '@/lib/content/queries'
import { isRichTextEmpty, plainText } from '@/lib/content/rich-text'
import { metaDescription, pageMetadata } from '@/lib/content/seo'

const TITLE = 'Histórico'

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getGroupProfile()
  return pageMetadata({
    title: TITLE,
    path: '/o-grupo/historico',
    description:
      metaDescription(plainText(profile?.history)) ??
      'Formação, registro e linhas do grupo no Diretório dos Grupos de Pesquisa do CNPq.',
  })
}

export default async function HistoryPage() {
  const [profile, lines, pages] = await Promise.all([
    getGroupProfile(),
    listResearchLines(),
    listPages(),
  ])
  const dgpLines = profile?.dgpResearchLines ?? []

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'O grupo', href: '/o-grupo' },
          { label: TITLE },
        ]}
        title={TITLE}
        lead="Formação do grupo, registro no Diretório dos Grupos de Pesquisa do CNPq e linhas registradas."
      >
        {profile?.provisionalTexts ? <ProvisionalNote /> : null}
      </PageHeader>

      <GroupShell pages={pages}>
        {!profile ? (
          <EmptyState
            title="Histórico em preparação"
            description="O histórico será publicado em breve."
          />
        ) : (
          <div className="flex flex-col gap-16">
            <section aria-labelledby="trajetoria">
              <SectionTitle id="trajetoria">Trajetória</SectionTitle>
              {isRichTextEmpty(profile.history) ? (
                <p className="mt-4 text-muted-foreground">Texto do histórico em elaboração.</p>
              ) : (
                <RichText data={profile.history} baseHeading={3} className="mt-5" />
              )}
              <GroupFacts profile={profile} className="mt-8 max-w-2xl" />
            </section>

            {dgpLines.length > 0 ? (
              <section aria-labelledby="linhas-dgp">
                <SectionTitle id="linhas-dgp">Linhas registradas no DGP</SectionTitle>
                <p className="mt-4 max-w-prose leading-relaxed text-muted-foreground">
                  O registro do grupo no Diretório dos Grupos de Pesquisa do CNPq lista as linhas de
                  pesquisa abaixo, apresentadas aqui como referência histórica do registro. Neste
                  portal, a atuação do grupo está organizada nas linhas temáticas
                  {lines.length > 0 ? ' ' : '.'}
                  {lines.map((line, index) => (
                    <span key={line.id}>
                      <Link
                        href={researchLinePath(line.slug)}
                        className="text-link underline underline-offset-4 hover:no-underline"
                      >
                        {line.name}
                      </Link>
                      {index < lines.length - 2 ? ', ' : index === lines.length - 2 ? ' e ' : '.'}
                    </span>
                  ))}
                </p>
                <div className="mt-6">
                  <DgpLines lines={dgpLines} />
                </div>
              </section>
            ) : null}

            <ComplementaryContent slug="historico" />
            <SourceNote source={profile.source} collectedAt={profile.collectedAt} />
          </div>
        )}
      </GroupShell>
    </>
  )
}

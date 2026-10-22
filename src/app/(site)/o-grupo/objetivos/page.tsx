import type { Metadata } from 'next'

import { RichText } from '@/components/rich-text/rich-text'
import { ComplementaryContent } from '@/components/site/complementary-content'
import { EmptyState } from '@/components/site/empty-state'
import { GroupShell } from '@/components/site/group-shell'
import { PageHeader } from '@/components/site/page-header'
import { ProvisionalNote } from '@/components/site/provisional-note'
import { getGroupProfile, listPages } from '@/lib/content/queries'
import { isRichTextEmpty, plainText } from '@/lib/content/rich-text'
import { metaDescription, pageMetadata } from '@/lib/content/seo'

const TITLE = 'Objetivos'

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getGroupProfile()
  return pageMetadata({
    title: TITLE,
    path: '/o-grupo/objetivos',
    description:
      metaDescription(plainText(profile?.objectives)) ?? 'Objetivos do grupo de pesquisa.',
  })
}

export default async function ObjectivesPage() {
  const [profile, pages] = await Promise.all([getGroupProfile(), listPages()])
  const empty = !profile || isRichTextEmpty(profile.objectives)

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'O grupo', href: '/o-grupo' },
          { label: TITLE },
        ]}
        title={TITLE}
        lead="O que o grupo busca produzir e para quem."
      >
        {profile?.provisionalTexts ? <ProvisionalNote /> : null}
      </PageHeader>

      <GroupShell pages={pages}>
        {empty ? (
          <EmptyState
            title="Objetivos em elaboração"
            description="Os objetivos do grupo serão publicados em breve."
          />
        ) : (
          <RichText data={profile.objectives} />
        )}
        <ComplementaryContent slug="objetivos" />
      </GroupShell>
    </>
  )
}

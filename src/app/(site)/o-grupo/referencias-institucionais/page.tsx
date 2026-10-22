import type { Metadata } from 'next'

import { ComplementaryContent } from '@/components/site/complementary-content'
import { EmptyState } from '@/components/site/empty-state'
import { GroupShell } from '@/components/site/group-shell'
import { InstitutionalReferences } from '@/components/site/institutional-references'
import { PageHeader } from '@/components/site/page-header'
import { getGroupProfile, listPages } from '@/lib/content/queries'
import { pageMetadata } from '@/lib/content/seo'

const TITLE = 'Referências institucionais'
const LEAD =
  'Instituições, programa e diretório relacionados ao grupo, com a descrição de cada relação e o endereço de referência.'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: TITLE,
    path: '/o-grupo/referencias-institucionais',
    description: LEAD,
  })
}

/** Somente texto e links: nenhuma imagem ou logotipo institucional (Q2; critério de aceite). */
export default async function InstitutionalReferencesPage() {
  const [profile, pages] = await Promise.all([getGroupProfile(), listPages()])
  const references = profile?.institutionalReferences ?? []

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'O grupo', href: '/o-grupo' },
          { label: TITLE },
        ]}
        title={TITLE}
        lead={LEAD}
      />
      <GroupShell pages={pages}>
        {references.length > 0 ? (
          <InstitutionalReferences references={references} headingLevel={2} />
        ) : (
          <EmptyState
            title="Referências em preparação"
            description="As referências institucionais do grupo serão publicadas em breve."
          />
        )}
        <ComplementaryContent slug="referencias-institucionais" />
      </GroupShell>
    </>
  )
}

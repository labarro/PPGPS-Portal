import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { RenderBlocks } from '@/components/blocks/render-blocks'
import { GroupShell } from '@/components/site/group-shell'
import { PageHeader } from '@/components/site/page-header'
import { FIXED_GROUP_SLUGS, isLegalPageSlug, pagePath } from '@/lib/content/paths'
import { findRedirectTarget, getPage, listPages } from '@/lib/content/queries'
import { metaDescription, pageMetadata } from '@/lib/content/seo'
import { SLUG_PATTERN } from '@/lib/content/slug'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = SLUG_PATTERN.test(slug) ? await getPage(slug) : null
  if (!page) return { title: 'Página não encontrada' }
  return pageMetadata({
    title: page.seo?.title || page.title,
    path: pagePath(page.slug),
    description: metaDescription(page.seo?.description || page.summary),
  })
}

/** Páginas livres de "O grupo" (coleção `pages`, somente publicadas). */
export default async function GroupFreePage({ params }: Props) {
  const { slug } = await params
  // Slugs das seções fixas têm rotas próprias; slug inválido nunca chega ao banco.
  // Páginas legais (S06) têm rotas de primeiro nível.
  if (!SLUG_PATTERN.test(slug) || FIXED_GROUP_SLUGS.includes(slug) || isLegalPageSlug(slug)) {
    notFound()
  }

  const [page, pages] = await Promise.all([getPage(slug), listPages()])
  if (!page) {
    const target = await findRedirectTarget(pagePath(slug))
    if (target) permanentRedirect(target)
    notFound()
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'O grupo', href: '/o-grupo' },
          { label: page.title },
        ]}
        title={page.title}
        lead={page.summary}
      />
      <GroupShell pages={pages}>
        <RenderBlocks blocks={page.layout} />
      </GroupShell>
    </>
  )
}

import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { EssayListing } from '@/components/site/essay-listing'
import { JsonLd } from '@/components/site/json-ld'
import { breadcrumbJsonLd } from '@/lib/content/jsonld'
import { pageParam } from '@/lib/content/paging'
import { BLOG_BASE_PATH, tagPath } from '@/lib/content/paths'
import { findRedirectTarget, getTag, listCategories, listEssays } from '@/lib/content/queries'
import { metaDescription, pageMetadata } from '@/lib/content/seo'
import { SLUG_PATTERN } from '@/lib/content/slug'
import { resolveServerUrl } from '@/lib/env/server-url'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tag = SLUG_PATTERN.test(slug) ? await getTag(slug) : null
  if (!tag) return { title: 'Página não encontrada' }
  return pageMetadata({
    title: `${tag.name} · Blog`,
    path: tagPath(tag.slug),
    description: metaDescription(tag.description ?? `Ensaios com a tag ${tag.name}.`),
  })
}

export default async function TagPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  if (!SLUG_PATTERN.test(slug)) notFound()
  const tag = await getTag(slug)
  if (!tag) {
    const target = await findRedirectTarget(tagPath(slug))
    if (target) permanentRedirect(target)
    notFound()
  }
  const page = pageParam(query.pagina)
  const [result, categories] = await Promise.all([
    listEssays({ page, tagId: tag.id }),
    listCategories(),
  ])
  const path = tagPath(tag.slug)
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: 'Início', path: '/' },
            { name: 'Blog', path: BLOG_BASE_PATH },
            { name: `Tag: ${tag.name}`, path },
          ],
          resolveServerUrl(),
        )}
      />
      <EssayListing
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Blog', href: BLOG_BASE_PATH },
          { label: `Tag: ${tag.name}` },
        ]}
        title={`Tag: ${tag.name}`}
        lead={tag.description ?? 'Ensaios marcados com esta tag.'}
        categories={categories}
        result={result}
        basePath={path}
        emptyTitle="Nenhum ensaio com esta tag"
        emptyDescription="Ainda não há ensaios publicados com esta tag. Veja todos os ensaios do blog."
      />
    </>
  )
}

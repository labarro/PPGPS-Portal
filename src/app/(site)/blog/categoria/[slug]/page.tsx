import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { EssayListing } from '@/components/site/essay-listing'
import { JsonLd } from '@/components/site/json-ld'
import { breadcrumbJsonLd } from '@/lib/content/jsonld'
import { pageParam } from '@/lib/content/paging'
import { BLOG_BASE_PATH, categoryPath } from '@/lib/content/paths'
import { findRedirectTarget, getCategory, listCategories, listEssays } from '@/lib/content/queries'
import { metaDescription, pageMetadata } from '@/lib/content/seo'
import { SLUG_PATTERN } from '@/lib/content/slug'
import { resolveServerUrl } from '@/lib/env/server-url'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = SLUG_PATTERN.test(slug) ? await getCategory(slug) : null
  if (!category) return { title: 'Página não encontrada' }
  return pageMetadata({
    title: `${category.name} · Blog`,
    path: categoryPath(category.slug),
    description: metaDescription(category.description ?? `Ensaios da categoria ${category.name}.`),
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  if (!SLUG_PATTERN.test(slug)) notFound()
  const category = await getCategory(slug)
  if (!category) {
    const target = await findRedirectTarget(categoryPath(slug))
    if (target) permanentRedirect(target)
    notFound()
  }
  const page = pageParam(query.pagina)
  const [result, categories] = await Promise.all([
    listEssays({ page, categoryId: category.id }),
    listCategories(),
  ])
  const path = categoryPath(category.slug)
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: 'Início', path: '/' },
            { name: 'Blog', path: BLOG_BASE_PATH },
            { name: category.name, path },
          ],
          resolveServerUrl(),
        )}
      />
      <EssayListing
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Blog', href: BLOG_BASE_PATH },
          { label: category.name },
        ]}
        title={category.name}
        lead={category.description ?? 'Ensaios desta categoria.'}
        categories={categories}
        currentCategory={category.slug}
        result={result}
        basePath={path}
        emptyTitle="Nenhum ensaio nesta categoria"
        emptyDescription="Ainda não há ensaios publicados nesta categoria. Veja todos os ensaios do blog."
      />
    </>
  )
}

import type { Metadata } from 'next'

import { EssayListing } from '@/components/site/essay-listing'
import { JsonLd } from '@/components/site/json-ld'
import { breadcrumbJsonLd } from '@/lib/content/jsonld'
import { pageParam } from '@/lib/content/paging'
import { BLOG_ATOM_PATH, BLOG_BASE_PATH, BLOG_RSS_PATH } from '@/lib/content/paths'
import { listCategories, listEssays } from '@/lib/content/queries'
import { pageMetadata } from '@/lib/content/seo'
import { resolveServerUrl } from '@/lib/env/server-url'

const BLOG_TITLE = 'Blog'
const BLOG_LEAD =
  'Ensaios reflexivos, divulgação científica e análises de integrantes e convidados do grupo sobre Bioética e Promoção da Saúde. Textos de natureza ensaística, sem revisão por pares.'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...pageMetadata({ title: BLOG_TITLE, path: BLOG_BASE_PATH, description: BLOG_LEAD }),
    alternates: {
      canonical: BLOG_BASE_PATH,
      types: { 'application/rss+xml': BLOG_RSS_PATH, 'application/atom+xml': BLOG_ATOM_PATH },
    },
  }
}

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams
  const page = pageParam(params.pagina)
  const [result, categories] = await Promise.all([listEssays({ page }), listCategories()])
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: 'Início', path: '/' },
            { name: BLOG_TITLE, path: BLOG_BASE_PATH },
          ],
          resolveServerUrl(),
        )}
      />
      <EssayListing
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: BLOG_TITLE }]}
        title={BLOG_TITLE}
        lead={BLOG_LEAD}
        categories={categories}
        result={result}
        basePath={BLOG_BASE_PATH}
        emptyTitle={page > 1 ? 'Página sem ensaios' : 'Ensaios em preparação'}
        emptyDescription={
          page > 1
            ? 'Não há ensaios nesta página. Volte para a primeira página do blog.'
            : 'Os primeiros ensaios do grupo estão em revisão editorial e serão publicados em breve.'
        }
      />
    </>
  )
}

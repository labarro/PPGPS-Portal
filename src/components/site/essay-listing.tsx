import { RssIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { BLOG_RSS_PATH } from '@/lib/content/paths'
import type { EssayPage } from '@/lib/content/queries'

import type { Crumb } from './breadcrumbs'
import { BlogCategoriesNav } from './blog-categories-nav'
import { EmptyState } from './empty-state'
import { EssayCard } from './essay-card'
import { PageHeader } from './page-header'
import { Pagination } from './pagination'

/** Página de listagem do blog (geral, categoria ou tag): cabeçalho, categorias, grade e paginação. */
export function EssayListing({
  breadcrumbs,
  title,
  lead,
  categories,
  currentCategory,
  result,
  basePath,
  emptyTitle,
  emptyDescription,
  aside,
}: {
  breadcrumbs: Crumb[]
  title: string
  lead?: string | null
  categories: { id: number; name: string; slug: string }[]
  currentCategory?: string | null
  result: EssayPage
  basePath: string
  emptyTitle: string
  emptyDescription: ReactNode
  aside?: ReactNode
}) {
  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} title={title} lead={lead}>
        <Link
          href={BLOG_RSS_PATH}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
        >
          <RssIcon className="size-4" aria-hidden="true" />
          Assinar o RSS do blog
        </Link>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <BlogCategoriesNav categories={categories} currentSlug={currentCategory} />
        {aside}
        <h2 className="sr-only">Ensaios</h2>
        {result.docs.length > 0 ? (
          <>
            <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
              {result.totalDocs === 1 ? '1 ensaio' : `${result.totalDocs} ensaios`}
              {result.totalPages > 1 ? ` · página ${result.page} de ${result.totalPages}` : null}
            </p>
            <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.docs.map((essay) => (
                <li key={essay.id}>
                  <EssayCard essay={essay} />
                </li>
              ))}
            </ul>
            <Pagination basePath={basePath} page={result.page} totalPages={result.totalPages} />
          </>
        ) : (
          <EmptyState className="mt-10" title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </>
  )
}

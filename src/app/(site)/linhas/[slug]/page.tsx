import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { RichText } from '@/components/rich-text/rich-text'
import { EmptyState } from '@/components/site/empty-state'
import { JsonLd } from '@/components/site/json-ld'
import { PageHeader } from '@/components/site/page-header'
import { ProvisionalNote } from '@/components/site/provisional-note'
import { breadcrumbJsonLd } from '@/lib/content/jsonld'
import { researchLinePath } from '@/lib/content/paths'
import { findRedirectTarget, getResearchLine, listResearchLines } from '@/lib/content/queries'
import { isRichTextEmpty } from '@/lib/content/rich-text'
import { metaDescription, pageMetadata } from '@/lib/content/seo'
import { SLUG_PATTERN } from '@/lib/content/slug'
import { resolveServerUrl } from '@/lib/env/server-url'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const line = SLUG_PATTERN.test(slug) ? await getResearchLine(slug) : null
  if (!line) return { title: 'Página não encontrada' }
  return pageMetadata({
    title: line.name,
    path: researchLinePath(line.slug),
    description: metaDescription(line.summary),
  })
}

export default async function ResearchLinePage({ params }: Props) {
  const { slug } = await params
  if (!SLUG_PATTERN.test(slug)) notFound()

  const [line, lines] = await Promise.all([getResearchLine(slug), listResearchLines()])
  if (!line) {
    // Slug antigo: o proxy já responde 301; aqui cobre a janela do cache do proxy.
    const target = await findRedirectTarget(researchLinePath(slug))
    if (target) permanentRedirect(target)
    notFound()
  }

  const others = lines.filter((item) => item.slug !== line.slug)
  const path = researchLinePath(line.slug)

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: 'Início', path: '/' },
            { name: 'Linhas temáticas', path: '/linhas' },
            { name: line.name, path },
          ],
          resolveServerUrl(),
        )}
      />
      <PageHeader
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Linhas temáticas', href: '/linhas' },
          { label: line.name },
        ]}
        title={line.name}
        lead={line.summary}
      >
        {line.provisional ? <ProvisionalNote /> : null}
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_18rem] lg:gap-16 lg:py-16">
        <div className="min-w-0">
          {isRichTextEmpty(line.description) ? (
            <EmptyState
              title="Descrição em elaboração"
              description="O texto completo desta linha temática será publicado em breve."
            />
          ) : (
            <RichText data={line.description} />
          )}
        </div>

        <aside className="flex flex-col gap-8 text-sm">
          {line.relatedProgramLineText || line.source ? (
            <section aria-labelledby="sobre-linha" className="border-t-2 border-primary pt-4">
              <h2 id="sobre-linha" className="font-serif text-lg font-semibold text-primary">
                Sobre esta linha
              </h2>
              <dl className="mt-3 flex flex-col gap-3">
                {line.relatedProgramLineText ? (
                  <div>
                    <dt className="text-muted-foreground">Linha de programa relacionada</dt>
                    <dd className="mt-0.5">{line.relatedProgramLineText}</dd>
                  </div>
                ) : null}
                {line.source ? (
                  <div>
                    <dt className="text-muted-foreground">Fonte</dt>
                    <dd className="mt-0.5">{line.source}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          {others.length > 0 ? (
            <nav aria-labelledby="outras-linhas" className="border-t-2 border-primary pt-4">
              <h2 id="outras-linhas" className="font-serif text-lg font-semibold text-primary">
                {others.length === 1 ? 'Outra linha temática' : 'Outras linhas temáticas'}
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {others.map((other) => (
                  <li key={other.id}>
                    <Link
                      href={researchLinePath(other.slug)}
                      className="font-serif text-xl text-link underline underline-offset-4 hover:no-underline"
                    >
                      {other.name}
                    </Link>
                    <p className="mt-1 text-muted-foreground">{other.summary}</p>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <p>
            <Link
              href="/linhas"
              className="inline-flex min-h-11 items-center rounded-sm font-medium text-link underline underline-offset-4 hover:no-underline"
            >
              Todas as linhas temáticas
            </Link>
          </p>
        </aside>
      </div>
    </>
  )
}

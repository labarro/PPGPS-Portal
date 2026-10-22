import type { Metadata } from 'next'
import Link from 'next/link'

import { EmptyState } from '@/components/site/empty-state'
import { JsonLd } from '@/components/site/json-ld'
import { PageHeader } from '@/components/site/page-header'
import { ResearchLinesDiptych } from '@/components/site/research-lines-diptych'
import { breadcrumbJsonLd } from '@/lib/content/jsonld'
import { listResearchLines } from '@/lib/content/queries'
import { pageMetadata } from '@/lib/content/seo'
import { resolveServerUrl } from '@/lib/env/server-url'

const TITLE = 'Linhas temáticas'
const LEAD =
  'Os eixos em que o grupo organiza sua atuação. Veja se o seu tema de interesse se aproxima de um deles.'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ title: TITLE, path: '/linhas', description: LEAD })
}

export default async function ResearchLinesPage() {
  const lines = await listResearchLines()
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: 'Início', path: '/' },
            { name: TITLE, path: '/linhas' },
          ],
          resolveServerUrl(),
        )}
      />
      <PageHeader
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: TITLE }]}
        title={TITLE}
        lead={LEAD}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        {lines.length > 0 ? (
          <ResearchLinesDiptych lines={lines} headingLevel={2} />
        ) : (
          <EmptyState
            title="Linhas temáticas em preparação"
            description="As linhas temáticas do grupo serão publicadas em breve."
          />
        )}

        <aside
          aria-labelledby="linhas-dgp-nota"
          className="mt-14 grid gap-4 rounded-lg border bg-muted p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center"
        >
          <div>
            <h2 id="linhas-dgp-nota" className="font-serif text-xl font-semibold text-primary">
              Linhas registradas no DGP
            </h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
              As linhas de pesquisa que constam no registro do grupo no Diretório dos Grupos de
              Pesquisa do CNPq são apresentadas como referência histórica no histórico do grupo.
            </p>
          </div>
          <Link
            href="/o-grupo/historico#linhas-dgp"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary px-5 text-sm font-medium text-primary hover:bg-secondary"
          >
            Ver o histórico do grupo
          </Link>
        </aside>
      </div>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

import { EmptyState } from '@/components/site/empty-state'
import { FilterBar } from '@/components/site/filter-bar'
import { JsonLd } from '@/components/site/json-ld'
import { PageHeader } from '@/components/site/page-header'
import { type LineRef, PersonCard } from '@/components/site/person-card'
import { breadcrumbJsonLd } from '@/lib/content/jsonld'
import { MEMBERS_BASE_PATH } from '@/lib/content/paths'
import { listDirectory, listResearchLines } from '@/lib/content/queries'
import { pageMetadata } from '@/lib/content/seo'
import { resolveServerUrl } from '@/lib/env/server-url'
import {
  byCurrentRole,
  filterDirectory,
  hasActiveFilters,
  parseFilters,
} from '@/lib/people/directory'
import { ROLE_PLURAL_LABELS } from '@/lib/people/memberships'

const TITLE = 'Integrantes'
const LEAD =
  'Pesquisadores, estudantes e colaboradores do grupo que autorizaram individualmente a publicação de seus perfis.'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata(): Promise<Metadata> {
  // Filtros não geram endereços canônicos próprios.
  return pageMetadata({ title: TITLE, path: MEMBERS_BASE_PATH, description: LEAD })
}

export default async function MembersPage({ searchParams }: Props) {
  const [params, people, lineSummaries] = await Promise.all([
    searchParams,
    listDirectory(),
    listResearchLines(),
  ])
  const lines: LineRef[] = lineSummaries.map(({ id, name, slug }) => ({ id, name, slug }))
  const linesById = new Map(lines.map((line) => [String(line.id), line]))
  const filters = parseFilters(
    params,
    lines.map((line) => line.slug),
  )
  const results = filterDirectory(
    people,
    filters,
    new Map(lines.map((line) => [line.slug, line.id])),
  ).sort(byCurrentRole)

  const subject = filters.status === 'ex-integrantes' ? 'ex-integrante' : 'integrante'
  const count = results.length === 1 ? `1 ${subject}` : `${results.length} ${subject}s`
  const lineName = filters.line ? lines.find((line) => line.slug === filters.line)?.name : null
  const summary = [
    count,
    filters.role ? ROLE_PLURAL_LABELS[filters.role].toLowerCase() : null,
    lineName ? `na linha ${lineName}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: 'Início', path: '/' },
            { name: TITLE, path: MEMBERS_BASE_PATH },
          ],
          resolveServerUrl(),
        )}
      />
      <PageHeader
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: TITLE }]}
        title={TITLE}
        lead={LEAD}
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
        {people.length === 0 ? (
          <EmptyState
            title="Perfis em preparação"
            description="Os perfis são publicados à medida que cada integrante autoriza individualmente a divulgação dos seus dados."
          />
        ) : (
          <>
            <FilterBar filters={filters} lines={lines} action={MEMBERS_BASE_PATH} />
            <p role="status" className="text-sm text-muted-foreground" data-testid="results-count">
              {summary}
            </p>
            {results.length === 0 ? (
              <EmptyState
                title="Nenhum integrante encontrado"
                description="Nenhum perfil público corresponde a estes filtros."
                action={
                  hasActiveFilters(filters) ? (
                    <Link
                      href={MEMBERS_BASE_PATH}
                      className="inline-flex min-h-11 items-center rounded-sm font-medium text-link underline underline-offset-4 hover:no-underline"
                    >
                      Limpar filtros
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Integrantes">
                {results.map((person) => (
                  <li key={person.id}>
                    <PersonCard person={person} lines={linesById} headingLevel={2} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  )
}

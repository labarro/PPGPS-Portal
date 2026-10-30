import { MailIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { RichText } from '@/components/rich-text/rich-text'
import { JsonLd } from '@/components/site/json-ld'
import { MembershipTimeline } from '@/components/site/membership-timeline'
import { PersonAvatar } from '@/components/site/person-avatar'
import type { LineRef } from '@/components/site/person-card'
import { SectionTitle } from '@/components/site/section-title'
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { formatDate } from '@/lib/content/format'
import { breadcrumbJsonLd, personJsonLd } from '@/lib/content/jsonld'
import { MEMBERS_BASE_PATH, personPath, RESERVED_PERSON_SLUGS } from '@/lib/content/paths'
import {
  findRedirectTarget,
  getPerson,
  listDirectory,
  listResearchLines,
} from '@/lib/content/queries'
import { isRichTextEmpty } from '@/lib/content/rich-text'
import { metaDescription, pageMetadata } from '@/lib/content/seo'
import { SLUG_PATTERN } from '@/lib/content/slug'
import { resolveServerUrl } from '@/lib/env/server-url'
import { toPublicPhoto } from '@/lib/people/directory'
import { orcidUrl } from '@/lib/people/identifiers'
import { membershipLabel } from '@/lib/people/memberships'

type Props = { params: Promise<{ slug: string }> }

const EDUCATION_LABELS: Record<string, string> = {
  bachelor: 'Graduação',
  specialization: 'Especialização/MBA',
  masters: 'Mestrado',
  doctorate: 'Doutorado',
  postdoc: 'Pós-doutorado',
  other: 'Formação',
}

const validSlug = (slug: string) => SLUG_PATTERN.test(slug) && !RESERVED_PERSON_SLUGS.includes(slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const person = validSlug(slug) ? await getPerson(slug) : null
  if (!person) return { title: 'Página não encontrada' }
  return pageMetadata({
    title: person.fullName,
    path: personPath(person.slug),
    description: metaDescription(person.shortBio),
  })
}

const linkClass =
  'inline-flex min-h-11 items-center rounded-sm font-medium text-link underline underline-offset-4 hover:no-underline'

export default async function PersonPage({ params }: Props) {
  const { slug } = await params
  if (!validSlug(slug)) notFound()

  const [person, directory, lineSummaries] = await Promise.all([
    getPerson(slug),
    listDirectory(),
    listResearchLines(),
  ])
  const entry = person ? directory.find((item) => String(item.id) === String(person.id)) : null
  if (!person || !entry) {
    const target = await findRedirectTarget(personPath(slug))
    if (target) permanentRedirect(target)
    notFound()
  }

  const lines = new Map<string, LineRef>(
    lineSummaries.map(({ id, name, slug: lineSlug }) => [String(id), { id, name, slug: lineSlug }]),
  )
  const photo = toPublicPhoto(person.photo)
  const path = personPath(person.slug)
  const siteUrl = resolveServerUrl()
  const role = entry.current ? membershipLabel(entry.current) : null
  const currentLines = [
    ...new Set(
      entry.memberships
        .filter((m) => (entry.former ? true : !m.endDate))
        .flatMap((m) => m.lineIds.map(String)),
    ),
  ]
    .map((id) => lines.get(id))
    .filter((line): line is LineRef => !!line)
  const affiliations = (person.affiliations ?? []).filter((item) => item.current !== false)
  const education = person.externalEducation ?? []
  const expertise = person.expertise ?? []
  const profiles = [
    ...(person.lattesUrl ? [{ label: 'Currículo Lattes', url: person.lattesUrl }] : []),
    ...(person.orcid ? [{ label: `ORCID ${person.orcid}`, url: orcidUrl(person.orcid) }] : []),
    ...(person.otherProfiles ?? []).map((item) => ({ label: item.label, url: item.url })),
  ]

  return (
    <>
      <JsonLd
        data={[
          personJsonLd(person, { siteUrl, path, jobTitle: role, imageUrl: photo?.url }),
          breadcrumbJsonLd(
            [
              { name: 'Início', path: '/' },
              { name: 'Integrantes', path: MEMBERS_BASE_PATH },
              { name: person.fullName, path },
            ],
            siteUrl,
          ),
        ]}
      />
      <div className="border-b bg-muted">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pb-14">
          <Breadcrumbs
            items={[
              { label: 'Início', href: '/' },
              { label: 'Integrantes', href: MEMBERS_BASE_PATH },
              { label: person.fullName },
            ]}
          />
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            <PersonAvatar name={person.fullName} photo={photo} size="lg" />
            <div className="min-w-0 border-l-4 border-primary pl-5 sm:pl-7">
              <h1 className="font-serif text-3xl leading-tight font-semibold text-primary sm:text-5xl">
                {person.fullName}
              </h1>
              <p className="mt-3 text-lg text-foreground" data-testid="current-role">
                {entry.former ? 'Ex-integrante do grupo' : role}
              </p>
              {currentLines.length > 0 ? (
                <p className="mt-1 text-muted-foreground">
                  <span className="sr-only">Linhas temáticas: </span>
                  {currentLines.map((line) => line.name).join(' · ')}
                </p>
              ) : null}
              {person.shortBio ? (
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                  {person.shortBio}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_18rem] lg:gap-16 lg:py-16">
        <div className="flex min-w-0 flex-col gap-14">
          {!isRichTextEmpty(person.academicBio) ? (
            <section aria-labelledby="apresentacao">
              <SectionTitle id="apresentacao">Apresentação</SectionTitle>
              <RichText data={person.academicBio} baseHeading={3} className="mt-5" />
            </section>
          ) : null}

          <section aria-labelledby="trajetoria">
            <SectionTitle id="trajetoria">Trajetória no grupo</SectionTitle>
            <div className="mt-6">
              <MembershipTimeline memberships={entry.memberships} lines={lines} />
            </div>
          </section>

          {education.length > 0 ? (
            <section aria-labelledby="formacao">
              <SectionTitle id="formacao">Formação</SectionTitle>
              <ul className="mt-5 flex flex-col gap-4">
                {education.map((item) => (
                  <li key={item.id ?? `${item.level}-${item.course}`}>
                    <p className="font-medium">
                      {EDUCATION_LABELS[item.level] ?? 'Formação'} em {item.course}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[item.institution, item.country, item.year].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {expertise.length > 0 ? (
            <section aria-labelledby="atuacao">
              <SectionTitle id="atuacao">Áreas de atuação</SectionTitle>
              <ul className="mt-5 flex flex-wrap gap-2">
                {expertise.map((term) => (
                  <li key={term} className="rounded-full border bg-secondary px-3 py-1 text-sm">
                    {term}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-8 text-sm">
          {affiliations.length > 0 ? (
            <section aria-labelledby="afiliacoes" className="border-t-2 border-primary pt-4">
              <h2 id="afiliacoes" className="font-serif text-lg font-semibold text-primary">
                Afiliações
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {affiliations.map((item) => (
                  <li key={item.id ?? item.institutionText}>
                    <p className="font-medium">{item.positionText}</p>
                    <p className="text-muted-foreground">
                      {[item.programText, item.institutionText].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {profiles.length > 0 || person.publicEmail ? (
            <section aria-labelledby="perfis" className="border-t-2 border-primary pt-4">
              <h2 id="perfis" className="font-serif text-lg font-semibold text-primary">
                Perfis acadêmicos e contato
              </h2>
              <ul className="mt-2 flex flex-col">
                {profiles.map((item) => (
                  <li key={item.url}>
                    <a href={item.url} rel="noopener noreferrer" className={linkClass}>
                      {item.label}
                      <span className="sr-only"> (site externo)</span>
                    </a>
                  </li>
                ))}
                {person.publicEmail ? (
                  <li>
                    <a
                      href={`mailto:${person.publicEmail}`}
                      className={`${linkClass} gap-2`}
                      data-testid="public-email"
                    >
                      <MailIcon className="size-4" aria-hidden="true" />
                      {person.publicEmail}
                    </a>
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}

          {person.citationName ? (
            <section aria-labelledby="citacao" className="border-t-2 border-primary pt-4">
              <h2 id="citacao" className="font-serif text-lg font-semibold text-primary">
                Nome em citações
              </h2>
              <p className="mt-2">{person.citationName}</p>
            </section>
          ) : null}

          <p className="text-muted-foreground">
            Perfil publicado com autorização do titular. Atualizado em{' '}
            {formatDate(person.updatedAt)}. Pedidos de correção pelo{' '}
            <Link
              href="/o-grupo/contato"
              className="text-link underline underline-offset-4 hover:no-underline"
            >
              contato do grupo
            </Link>
            .
          </p>
          <p>
            <Link href={MEMBERS_BASE_PATH} className={linkClass}>
              Todos os integrantes
            </Link>
          </p>
        </aside>
      </div>
    </>
  )
}

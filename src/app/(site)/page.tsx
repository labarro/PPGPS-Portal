import { ArrowRightIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { GroupFacts } from '@/components/site/group-facts'
import { InstitutionalReferences } from '@/components/site/institutional-references'
import { JsonLd } from '@/components/site/json-ld'
import { type LineRef, PersonCard } from '@/components/site/person-card'
import { ProvisionalNote } from '@/components/site/provisional-note'
import { ResearchLinesDiptych } from '@/components/site/research-lines-diptych'
import { EmptyState } from '@/components/site/empty-state'
import { DEFAULT_HERO_ACTIONS, resolveHomeSections } from '@/lib/content/homepage'
import { GROUP_SECTIONS, MEMBERS_BASE_PATH } from '@/lib/content/paths'
import { organizationJsonLd } from '@/lib/content/jsonld'
import {
  getGroupProfile,
  getHomepage,
  listDirectory,
  listResearchLines,
} from '@/lib/content/queries'
import { metaDescription, pageMetadata } from '@/lib/content/seo'
import { leadingParagraphs, safeHref } from '@/lib/content/rich-text'
import { resolveServerUrl } from '@/lib/env/server-url'
import { byCurrentRole } from '@/lib/people/directory'
import { getSiteChrome } from '@/lib/site/chrome'
import { cn } from '@/lib/utils'
import type { GroupProfile } from '@/payload-types'

const FEATURED_MEMBERS = 6

export async function generateMetadata(): Promise<Metadata> {
  const [profile, chrome] = await Promise.all([getGroupProfile(), getSiteChrome()])
  return {
    ...pageMetadata({
      path: '/',
      description: metaDescription(profile?.summary ?? chrome.description),
      siteName: chrome.siteName,
    }),
    // A página inicial usa o nome completo do grupo, sem o sufixo do modelo (planejamento 16.7).
    title: { absolute: profile?.officialName ?? chrome.siteName },
  }
}

/** Intersecção de dois círculos: Bioética e Promoção da Saúde. Puramente decorativo. */
function IntersectionMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="230" cy="200" r="170" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="370" cy="200" r="170" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="230" cy="200" r="120" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
      <circle cx="370" cy="200" r="120" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
    </svg>
  )
}

function Hero({
  name,
  eyebrow,
  purpose,
  actions,
  profile,
}: {
  name: string
  eyebrow: string | null
  purpose: string | null
  actions: { label: string; href: string }[]
  profile: GroupProfile | null
}) {
  return (
    <section
      aria-labelledby="titulo"
      className="surface-inverse relative isolate overflow-hidden bg-inverse-deep text-inverse-foreground"
    >
      <IntersectionMotif className="pointer-events-none absolute top-1/2 right-[-14rem] -z-10 hidden w-[52rem] -translate-y-1/2 text-inverse-line opacity-30 md:block" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_20rem] lg:items-end lg:gap-16 lg:py-24">
        <div>
          {eyebrow ? <p className="text-base text-inverse-line">{eyebrow}</p> : null}
          <h1
            id="titulo"
            className="mt-4 max-w-3xl font-serif text-[2.1rem] leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-[3.6rem]"
          >
            {name}
          </h1>
          {purpose ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-inverse-muted-foreground sm:text-xl">
              {purpose}
            </p>
          ) : null}
          {profile?.provisionalTexts ? <ProvisionalNote inverse className="mt-5" /> : null}
          {actions.length > 0 ? (
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {actions.map((action, index) => {
                const href = safeHref(action.href)
                if (!href) return null
                return (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={href}
                    className={cn(
                      'inline-flex min-h-12 items-center justify-center rounded-md px-6 text-base font-medium transition-colors',
                      index === 0
                        ? 'bg-background text-primary hover:bg-secondary'
                        : 'border border-white/60 text-inverse-foreground hover:bg-white/10',
                    )}
                  >
                    {action.label}
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
        {profile ? (
          <div className="rounded-lg border border-white/25 bg-inverse/60 p-6 backdrop-blur-sm">
            <h2 className="font-serif text-lg font-semibold">Registro do grupo</h2>
            <GroupFacts profile={profile} inverse className="mt-2" />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function SectionHeading({
  id,
  heading,
  intro,
}: {
  id: string
  heading: string
  intro: string | null
}) {
  return (
    <div className="max-w-3xl">
      <h2
        id={id}
        className="font-serif text-3xl leading-tight font-semibold text-primary sm:text-4xl"
      >
        {heading}
      </h2>
      {intro ? <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p> : null}
    </div>
  )
}

export default async function HomePage() {
  const [profile, homepage, lines, chrome, directory] = await Promise.all([
    getGroupProfile(),
    getHomepage(),
    listResearchLines(),
    getSiteChrome(),
    listDirectory(),
  ])
  // Integrantes em destaque (S04): atuais e autorizados, por hierarquia do papel.
  const featured = directory
    .filter((person) => person.current)
    .sort(byCurrentRole)
    .slice(0, FEATURED_MEMBERS)
  const linesById = new Map<string, LineRef>(
    lines.map(({ id, name, slug }) => [String(id), { id, name, slug }]),
  )

  const name = profile?.officialName ?? chrome.siteName
  const purpose = homepage?.hero?.purpose?.trim() || profile?.summary || chrome.description
  const actions =
    homepage?.hero?.actions && homepage.hero.actions.length > 0
      ? homepage.hero.actions
      : DEFAULT_HERO_ACTIONS
  const sections = resolveHomeSections(homepage?.sections)
  const references = profile?.institutionalReferences ?? []
  const aboutParagraphs = leadingParagraphs(profile?.description, 520)

  return (
    <>
      {profile ? <JsonLd data={organizationJsonLd(profile, resolveServerUrl())} /> : null}
      <Hero
        name={name}
        eyebrow={homepage?.hero?.eyebrow ?? 'Grupo de pesquisa'}
        purpose={purpose ?? null}
        actions={actions}
        profile={profile}
      />

      {sections.map((section) => {
        const id = `secao-${section.kind}`
        switch (section.kind) {
          case 'about':
            if (!profile || aboutParagraphs.length === 0) return null
            return (
              <section key={id} aria-labelledby={id} className="border-b">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-16 lg:py-20">
                  <div>
                    <SectionHeading id={id} heading={section.heading} intro={section.intro} />
                    <nav aria-label="Páginas sobre o grupo" className="mt-8">
                      <ul className="flex flex-col border-t">
                        {GROUP_SECTIONS.filter((item) => item.slug).map((item) => (
                          <li key={item.href} className="border-b">
                            <Link
                              href={item.href}
                              className="flex min-h-12 items-center justify-between gap-4 rounded-sm py-2 text-foreground hover:text-primary hover:underline"
                            >
                              {item.label}
                              <ArrowRightIcon className="size-4 text-primary" aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                  <div className="flex flex-col gap-5">
                    {aboutParagraphs.map((text, index) => (
                      <p
                        key={index}
                        className={cn(
                          'font-serif leading-relaxed text-foreground',
                          index === 0 ? 'text-xl sm:text-2xl sm:leading-relaxed' : 'text-lg',
                        )}
                      >
                        {text}
                      </p>
                    ))}
                    <Link
                      href="/o-grupo"
                      className="mt-2 inline-flex min-h-11 items-center self-start rounded-sm font-medium text-link underline underline-offset-4 hover:no-underline"
                    >
                      Leia a apresentação completa
                    </Link>
                  </div>
                </div>
              </section>
            )
          case 'research-lines':
            if (lines.length === 0) return null
            return (
              <section key={id} aria-labelledby={id}>
                <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
                  <SectionHeading id={id} heading={section.heading} intro={section.intro} />
                  <ResearchLinesDiptych lines={lines} className="mt-10" />
                </div>
              </section>
            )
          case 'featured-members':
            if (featured.length === 0) return null
            return (
              <section key={id} aria-labelledby={id} className="border-t">
                <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
                  <SectionHeading id={id} heading={section.heading} intro={section.intro} />
                  <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {featured.map((person) => (
                      <li key={person.id}>
                        <PersonCard person={person} lines={linesById} />
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={MEMBERS_BASE_PATH}
                    className="mt-8 inline-flex min-h-11 items-center rounded-sm font-medium text-link underline underline-offset-4 hover:no-underline"
                  >
                    Todos os integrantes
                  </Link>
                </div>
              </section>
            )
          case 'institutional-references':
            if (references.length === 0) return null
            return (
              <section key={id} aria-labelledby={id} className="bg-muted">
                <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
                  <SectionHeading id={id} heading={section.heading} intro={section.intro} />
                  <InstitutionalReferences references={references} className="mt-10" />
                </div>
              </section>
            )
          default:
            return null
        }
      })}

      {!profile && lines.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <EmptyState
            title="Portal em preparação"
            description="As páginas do grupo estão sendo preparadas e serão publicadas em breve."
          />
        </div>
      ) : null}
    </>
  )
}

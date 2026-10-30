import { ArchiveIcon, ClockIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { RichText } from '@/components/rich-text/rich-text'
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { EssayByline } from '@/components/site/essay-byline'
import { EssayCard } from '@/components/site/essay-card'
import { EssayNotice } from '@/components/site/essay-notice'
import { JsonLd } from '@/components/site/json-ld'
import { NatureBadge } from '@/components/site/nature-badge'
import { ReferenceList } from '@/components/site/reference-list'
import { SectionTitle } from '@/components/site/section-title'
import { formatLongDate } from '@/lib/content/format'
import { blogPostingJsonLd, breadcrumbJsonLd } from '@/lib/content/jsonld'
import { BLOG_BASE_PATH, categoryPath, essayPath, tagPath } from '@/lib/content/paths'
import {
  findRedirectTarget,
  getEssay,
  listEssays,
  toEssayAuthors,
  toEssayCover,
  toEssaySummary,
} from '@/lib/content/queries'
import { plainText } from '@/lib/content/rich-text'
import { metaDescription, pageMetadata } from '@/lib/content/seo'
import { SLUG_PATTERN } from '@/lib/content/slug'
import {
  countWords,
  developmentStageLabel,
  essayDescription,
  natureLabel,
  readingTimeLabel,
  resolveLicense,
} from '@/lib/editorial/essay'
import { resolveServerUrl } from '@/lib/env/server-url'
import { getSiteChrome } from '@/lib/site/chrome'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const essay = SLUG_PATTERN.test(slug) ? await getEssay(slug) : null
  if (!essay) return { title: 'Página não encontrada' }
  const title = essay.seo?.title?.trim() || essay.title
  const description = metaDescription(
    essay.seo?.description?.trim() || essayDescription(essay.excerpt, essay.content),
  )
  const base = pageMetadata({ title, path: essayPath(essay.slug), description })
  const authors = toEssayAuthors(essay.authors).map((author) => author.name)
  return {
    ...base,
    alternates: { canonical: essayPath(essay.slug) },
    openGraph: {
      ...base.openGraph,
      type: 'article',
      ...(essay.publishedAt ? { publishedTime: essay.publishedAt } : {}),
      ...(essay.revisedAt ? { modifiedTime: essay.revisedAt } : {}),
      ...(authors.length > 0 ? { authors } : {}),
    },
    twitter: { ...base.twitter, card: 'summary_large_image' },
    // Arquivado: continua acessível pela URL, mas fora de listagens, RSS, sitemap e buscadores.
    ...(essay.archivedAt ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function EssayPage({ params }: Props) {
  const { slug } = await params
  if (!SLUG_PATTERN.test(slug)) notFound()
  const [essay, chrome] = await Promise.all([getEssay(slug), getSiteChrome()])
  if (!essay) {
    const target = await findRedirectTarget(essayPath(slug))
    if (target) permanentRedirect(target)
    notFound()
  }

  const summary = toEssaySummary(essay)
  const path = essayPath(essay.slug)
  const siteUrl = resolveServerUrl()
  const cover = toEssayCover(essay.cover)
  const published = formatLongDate(essay.publishedAt)
  const revised = formatLongDate(essay.revisedAt)
  const archived = formatLongDate(essay.archivedAt)
  const stage = developmentStageLabel(essay.developmentStage)
  const guests = summary.authors.filter((author) => author.role === 'guest' && author.bio)
  const related = summary.category
    ? (await listEssays({ categoryId: summary.category.id, excludeId: essay.id, limit: 3 })).docs
    : []
  const license = resolveLicense(essay.license, chrome.editorial.defaultLicense)
  const references = essay.references ?? []

  return (
    <>
      <JsonLd
        data={[
          blogPostingJsonLd(
            {
              title: essay.title,
              subtitle: essay.subtitle,
              description: essayDescription(essay.excerpt, essay.content),
              natureLabel: natureLabel(essay.nature),
              publishedAt: essay.publishedAt,
              modifiedAt: essay.revisedAt ?? essay.publishedAt,
              category: summary.category?.name,
              tags: summary.tags.map((tag) => tag.name),
              authors: summary.authors,
              licenseUrl: license.url,
              imageUrl: cover?.url ?? null,
              wordCount: countWords(plainText(essay.content)),
            },
            { siteUrl, path },
          ),
          breadcrumbJsonLd(
            [
              { name: 'Início', path: '/' },
              { name: 'Blog', path: BLOG_BASE_PATH },
              { name: essay.title, path },
            ],
            siteUrl,
          ),
        ]}
      />

      {archived ? (
        <div
          role="note"
          className="border-b border-amber-300 bg-amber-50"
          data-testid="archived-notice"
        >
          <div className="mx-auto flex max-w-3xl items-start gap-3 px-4 py-4 sm:px-6">
            <ArchiveIcon className="mt-0.5 size-5 shrink-0 text-amber-900" aria-hidden="true" />
            <p className="text-amber-950">
              <strong>Ensaio arquivado</strong> em {archived}. O texto permanece disponível para
              consulta, mas não é mais destacado no blog nem atualizado.
            </p>
          </div>
        </div>
      ) : null}

      <article aria-labelledby="titulo-ensaio">
        <header className="border-b bg-muted">
          <div className="mx-auto max-w-3xl px-4 pt-6 pb-10 sm:px-6 sm:pb-12">
            <Breadcrumbs
              items={[
                { label: 'Início', href: '/' },
                { label: 'Blog', href: BLOG_BASE_PATH },
                ...(summary.category
                  ? [{ label: summary.category.name, href: categoryPath(summary.category.slug) }]
                  : []),
                { label: essay.title },
              ]}
            />
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <NatureBadge nature={essay.nature} />
              {summary.category ? (
                <Link
                  href={categoryPath(summary.category.slug)}
                  className="rounded-sm text-sm font-medium text-link underline underline-offset-4 hover:no-underline"
                >
                  {summary.category.name}
                </Link>
              ) : null}
              {stage ? (
                <span className="text-sm text-muted-foreground">Estágio: {stage}</span>
              ) : null}
            </div>
            <h1
              id="titulo-ensaio"
              className="mt-4 font-serif text-[2rem] leading-tight font-semibold text-primary sm:text-5xl"
            >
              {essay.title}
            </h1>
            {essay.subtitle ? (
              <p className="mt-4 font-serif text-xl leading-relaxed text-muted-foreground sm:text-2xl">
                {essay.subtitle}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-1 text-base text-foreground">
              <EssayByline authors={summary.authors} />
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                {published ? (
                  <span>
                    Publicado em <time dateTime={essay.publishedAt ?? undefined}>{published}</time>
                  </span>
                ) : (
                  <span>Prévia (não publicado)</span>
                )}
                {revised ? (
                  <span>
                    · Atualizado em <time dateTime={essay.revisedAt ?? undefined}>{revised}</time>
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  · <ClockIcon className="size-4" aria-hidden="true" />
                  {readingTimeLabel(essay.readingTime)}
                </span>
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          {cover ? (
            <figure className="mb-10">
              <Image
                src={cover.url}
                alt={cover.alt}
                width={cover.width ?? 1200}
                height={cover.height ?? 675}
                unoptimized
                priority
                className="w-full rounded-lg border object-cover"
              />
              {cover.caption || cover.credit ? (
                <figcaption className="mt-2 text-sm text-muted-foreground">
                  {cover.caption}
                  {cover.caption && cover.credit ? ' ' : null}
                  {cover.credit ? <span>Crédito: {cover.credit}</span> : null}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {essay.excerpt ? (
            <p className="mb-8 max-w-[66ch] font-serif text-xl leading-relaxed text-foreground">
              {essay.excerpt}
            </p>
          ) : null}

          <RichText data={essay.content} className="prose-essay" />

          {essay.correctionNote ? (
            <aside
              aria-labelledby="nota-correcao"
              className="mt-10 rounded-lg border-l-4 border-primary bg-muted p-5"
            >
              <h2 id="nota-correcao" className="font-serif text-lg font-semibold text-primary">
                Nota de correção
              </h2>
              <p className="mt-2 leading-relaxed">{essay.correctionNote}</p>
            </aside>
          ) : null}

          {references.length > 0 ? (
            <section aria-labelledby="referencias" className="mt-14">
              <SectionTitle id="referencias">Referências</SectionTitle>
              <div className="mt-6">
                <ReferenceList references={references} />
              </div>
            </section>
          ) : null}

          {summary.tags.length > 0 ? (
            <section aria-labelledby="tags" className="mt-12">
              <h2 id="tags" className="font-serif text-lg font-semibold text-primary">
                Tags
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {summary.tags.map((tag) => (
                  <li key={tag.id}>
                    <Link
                      href={tagPath(tag.slug)}
                      className="inline-flex min-h-11 items-center rounded-full border bg-secondary px-4 text-sm hover:border-primary hover:text-primary"
                    >
                      {tag.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {guests.length > 0 ? (
            <section aria-labelledby="convidados" className="mt-12">
              <h2 id="convidados" className="font-serif text-lg font-semibold text-primary">
                {guests.length === 1 ? 'Autor(a) convidado(a)' : 'Autores convidados'}
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {guests.map((guest) => (
                  <li key={guest.name}>
                    <p className="font-medium">{guest.name}</p>
                    <p className="text-muted-foreground">{guest.bio}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <EssayNotice
            className="mt-14"
            nature={essay.nature}
            license={essay.license}
            defaultLicense={chrome.editorial.defaultLicense}
            complement={chrome.editorial.noticeComplement}
          />
        </div>
      </article>

      {related.length > 0 ? (
        <section aria-labelledby="relacionados" className="border-t bg-muted">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionTitle id="relacionados">
              Outros ensaios em {summary.category?.name}
            </SectionTitle>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <EssayCard essay={item} showCover={false} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  )
}

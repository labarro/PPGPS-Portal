import Image from 'next/image'
import Link from 'next/link'

import { formatLongDate } from '@/lib/content/format'
import { essayPath } from '@/lib/content/paths'
import type { EssaySummary } from '@/lib/content/queries'
import { readingTimeLabel } from '@/lib/editorial/essay'
import { cn } from '@/lib/utils'

import { EssayByline } from './essay-byline'
import { NatureBadge } from './nature-badge'

/**
 * Cartão de ensaio (planejamento 16.3): capa (se houver), selo de natureza, título, autores,
 * data e tempo de leitura. O link do título cobre o cartão (alvo amplo), mas os links de
 * autoria continuam acessíveis por teclado.
 */
export function EssayCard({
  essay,
  headingLevel = 3,
  showCover = true,
  className,
}: {
  essay: EssaySummary
  headingLevel?: 2 | 3
  showCover?: boolean
  className?: string
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const date = formatLongDate(essay.publishedAt)
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-lg border bg-background transition-shadow hover:shadow-md',
        className,
      )}
      data-testid="essay-card"
    >
      {showCover && essay.cover ? (
        <Image
          src={essay.cover.url}
          alt=""
          width={essay.cover.width ?? 1200}
          height={essay.cover.height ?? 675}
          unoptimized
          className="aspect-[16/9] w-full border-b object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <NatureBadge nature={essay.nature} />
          {essay.category ? (
            <span className="text-sm text-muted-foreground">{essay.category.name}</span>
          ) : null}
        </div>
        <Heading className="font-serif text-xl leading-snug font-semibold text-primary sm:text-2xl">
          <Link
            href={essayPath(essay.slug)}
            className="rounded-sm after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {essay.title}
          </Link>
        </Heading>
        {essay.excerpt ? (
          <p className="line-clamp-4 leading-relaxed text-muted-foreground">{essay.excerpt}</p>
        ) : null}
        <div className="mt-auto flex flex-col gap-1 pt-2 text-sm text-muted-foreground">
          <EssayByline authors={essay.authors} linked={false} className="text-foreground" />
          <p>
            {date ? <time dateTime={essay.publishedAt ?? undefined}>{date}</time> : null}
            {date ? ' · ' : null}
            {readingTimeLabel(essay.readingTime)}
          </p>
        </div>
      </div>
    </article>
  )
}

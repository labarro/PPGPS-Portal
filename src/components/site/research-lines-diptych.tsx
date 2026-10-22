import Link from 'next/link'

import { researchLinePath } from '@/lib/content/paths'
import type { ResearchLineSummary } from '@/lib/content/queries'
import { cn } from '@/lib/utils'

import { ProvisionalNote } from './provisional-note'

/**
 * Linhas temáticas em díptico: os dois eixos lado a lado, com o nome em tipografia grande e
 * um filete vertical entre eles — a interseção Bioética / Promoção da Saúde é o tema do grupo.
 * Com mais de duas linhas, o layout passa a grade de duas colunas.
 */
export function ResearchLinesDiptych({
  lines,
  headingLevel = 3,
  className,
}: {
  lines: ResearchLineSummary[]
  headingLevel?: 2 | 3
  className?: string
}) {
  if (lines.length === 0) return null
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <ul
      className={cn('grid border-y border-primary md:grid-cols-2', className)}
      data-testid="research-lines"
    >
      {lines.map((line, index) => (
        <li
          key={line.id}
          className={cn(
            'group relative flex flex-col gap-5 py-10 md:py-12',
            index % 2 === 0
              ? 'md:pr-10 lg:pr-14'
              : 'border-t border-primary/25 md:border-t-0 md:border-l md:border-l-primary md:pl-10 lg:pl-14',
            index > 1 && 'border-t border-primary/25',
          )}
        >
          <Heading className="font-serif text-4xl leading-[1.05] font-semibold tracking-tight text-primary sm:text-5xl lg:text-6xl">
            <Link
              href={researchLinePath(line.slug)}
              className="rounded-sm decoration-2 underline-offset-[0.18em] after:absolute after:inset-0 hover:underline"
            >
              {line.name}
            </Link>
          </Heading>
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">{line.summary}</p>
          <p className="mt-auto text-sm font-medium text-link" aria-hidden="true">
            Ler sobre a linha
          </p>
          {line.provisional ? <ProvisionalNote className="relative self-start" /> : null}
        </li>
      ))}
    </ul>
  )
}

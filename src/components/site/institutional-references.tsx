import { referenceKindLabel, urlHost } from '@/lib/content/format'
import type { GroupProfile } from '@/payload-types'
import { cn } from '@/lib/utils'

export type InstitutionalReference = NonNullable<GroupProfile['institutionalReferences']>[number]

/**
 * Referências institucionais (planejamento 16.3 e 5.4): SOMENTE texto e links — nenhuma
 * imagem, logotipo ou identidade visual institucional (Q2). Não sugere vínculo oficial:
 * cada item explica, em texto, a relação com o grupo.
 */
export function InstitutionalReferences({
  references,
  variant = 'full',
  headingLevel = 3,
  className,
}: {
  references: InstitutionalReference[]
  variant?: 'full' | 'compact'
  headingLevel?: 2 | 3
  className?: string
}) {
  if (references.length === 0) return null

  if (variant === 'compact') {
    return (
      <ul
        className={cn('flex flex-col gap-2 text-sm', className)}
        data-testid="institutional-references"
      >
        {references.map((reference) => (
          <li key={reference.id ?? reference.name}>
            {reference.url ? (
              <a
                href={reference.url}
                rel="noopener noreferrer"
                className="inline-flex min-h-6 items-center rounded-sm underline-offset-4 hover:underline"
              >
                {reference.name}
                <span className="sr-only"> (site externo)</span>
              </a>
            ) : (
              <span>{reference.name}</span>
            )}
          </li>
        ))}
      </ul>
    )
  }

  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <ul
      className={cn(
        'grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2',
        className,
      )}
      data-testid="institutional-references"
    >
      {references.map((reference) => {
        const host = urlHost(reference.url)
        return (
          <li
            key={reference.id ?? reference.name}
            className="flex flex-col gap-2 bg-background p-6"
          >
            <p className="text-sm text-muted-foreground">{referenceKindLabel(reference.kind)}</p>
            <Heading className="font-serif text-xl leading-snug font-semibold text-primary">
              {reference.name}
            </Heading>
            <p className="leading-relaxed text-foreground">{reference.relationText}</p>
            {reference.url ? (
              <a
                href={reference.url}
                rel="noopener noreferrer"
                className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start rounded-sm pt-2 text-sm font-medium text-link underline underline-offset-4 hover:no-underline"
              >
                {host ? `Acessar ${host}` : 'Acessar site'}
                <span className="sr-only"> (site externo: {reference.name})</span>
              </a>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

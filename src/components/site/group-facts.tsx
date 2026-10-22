import { certificationLabel, formatDate } from '@/lib/content/format'
import { cn } from '@/lib/utils'
import type { GroupProfile } from '@/payload-types'

type Fact = { term: string; detail: string }

export function groupFacts(profile: GroupProfile): Fact[] {
  const facts: Fact[] = []
  if (profile.formationYear) facts.push({ term: 'Formação', detail: String(profile.formationYear) })
  const status = certificationLabel(profile.certificationStatus)
  if (status) {
    const date = formatDate(profile.certifiedAt)
    facts.push({ term: 'Situação no DGP/CNPq', detail: date ? `${status} em ${date}` : status })
  }
  if (profile.predominantArea) {
    facts.push({ term: 'Área predominante', detail: profile.predominantArea })
  }
  return facts
}

/**
 * Ficha do grupo: dados de registro transcritos do DGP (com fonte), em lista de definições.
 * Inspirada numa ficha catalográfica — informação factual, sem números de desempenho.
 */
export function GroupFacts({
  profile,
  inverse = false,
  className,
}: {
  profile: GroupProfile
  inverse?: boolean
  className?: string
}) {
  const facts = groupFacts(profile)
  if (facts.length === 0 && !profile.dgpUrl) return null
  return (
    <div className={className}>
      <dl
        className={cn(
          'divide-y text-sm',
          inverse ? 'divide-white/20 text-inverse-foreground' : 'divide-border',
        )}
      >
        {facts.map((fact) => (
          <div key={fact.term} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-4 py-3">
            <dt className={inverse ? 'text-inverse-muted-foreground' : 'text-muted-foreground'}>
              {fact.term}
            </dt>
            <dd className="font-medium">{fact.detail}</dd>
          </div>
        ))}
      </dl>
      {profile.dgpUrl ? (
        <p className="mt-4 text-sm">
          <a
            href={profile.dgpUrl}
            rel="noopener noreferrer"
            data-testid="dgp-link"
            className={cn(
              'inline-flex min-h-11 items-center rounded-sm font-medium underline underline-offset-4 hover:no-underline',
              inverse ? 'text-inverse-foreground' : 'text-link',
            )}
          >
            Espelho do grupo no Diretório dos Grupos de Pesquisa do CNPq
            <span className="sr-only"> (site externo)</span>
          </a>
        </p>
      ) : null}
    </div>
  )
}

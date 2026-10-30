import Link from 'next/link'

import { personPath } from '@/lib/content/paths'
import type { DirectoryPerson } from '@/lib/people/directory'
import { membershipLabel, membershipPeriod } from '@/lib/people/memberships'
import { cn } from '@/lib/utils'

import { PersonAvatar } from './person-avatar'

export type LineRef = { id: number | string; name: string; slug: string }

/**
 * Cartão de integrante (planejamento 16.3): foto autorizada ou monograma, nome, papel atual
 * (ou último papel, para ex-integrantes), linhas temáticas e link para o perfil.
 * O cartão inteiro é clicável por um único link (o nome), sem links aninhados.
 */
export function PersonCard({
  person,
  lines,
  headingLevel = 3,
  className,
}: {
  person: DirectoryPerson
  lines: ReadonlyMap<string, LineRef>
  headingLevel?: 2 | 3
  className?: string
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const reference = person.current ?? person.memberships[0] ?? null
  const relevant = person.memberships.filter((m) => (person.former ? true : !m.endDate))
  const lineNames = [
    ...new Set(
      relevant.flatMap((m) => m.lineIds.map((id) => lines.get(String(id))?.name).filter(Boolean)),
    ),
  ] as string[]

  return (
    <article
      className={cn(
        'group relative flex h-full gap-4 rounded-lg border bg-background p-5 transition-colors focus-within:border-primary hover:border-primary',
        className,
      )}
      data-testid="person-card"
    >
      <PersonAvatar name={person.fullName} photo={person.photo} />
      <div className="min-w-0">
        <Heading className="font-serif text-xl leading-snug font-semibold text-primary">
          <Link
            href={personPath(person.slug)}
            className="rounded-sm underline-offset-4 after:absolute after:inset-0 hover:underline"
          >
            {person.fullName}
          </Link>
        </Heading>
        {reference ? (
          <p className="mt-1 text-sm text-foreground">
            {person.former ? (
              <>
                <span className="font-medium">Ex-integrante</span>
                <span className="text-muted-foreground">
                  {' '}
                  · {membershipLabel(reference)} ({membershipPeriod(reference)})
                </span>
              </>
            ) : (
              <span className="font-medium">{membershipLabel(reference)}</span>
            )}
          </p>
        ) : null}
        {lineNames.length > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="sr-only">Linhas temáticas: </span>
            {lineNames.join(' · ')}
          </p>
        ) : null}
      </div>
    </article>
  )
}

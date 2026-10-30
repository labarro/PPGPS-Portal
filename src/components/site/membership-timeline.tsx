import Link from 'next/link'

import { researchLinePath } from '@/lib/content/paths'
import type { DirectoryMembership } from '@/lib/people/directory'
import { isActiveMembership, membershipLabel, membershipPeriod } from '@/lib/people/memberships'

import type { LineRef } from './person-card'

/**
 * Linha do tempo dos vínculos com o grupo (planejamento 8.2 e 16.3): do mais recente ao mais
 * antigo, com período, papel e linhas temáticas. Ex.: "Pesquisador(a) 2023–atual" acima de
 * "Estudante de mestrado 2021–2023".
 */
export function MembershipTimeline({
  memberships,
  lines,
}: {
  memberships: readonly DirectoryMembership[]
  lines: ReadonlyMap<string, LineRef>
}) {
  if (memberships.length === 0) return null
  return (
    <ol
      className="relative flex flex-col gap-8 border-l-2 border-primary/30 pl-6"
      data-testid="timeline"
    >
      {memberships.map((membership) => {
        const active = isActiveMembership(membership)
        const membershipLines = membership.lineIds
          .map((id) => lines.get(String(id)))
          .filter((line): line is LineRef => !!line)
        return (
          <li key={membership.id} className="relative">
            <span
              aria-hidden="true"
              className={
                active
                  ? 'absolute top-1.5 -left-[1.95rem] size-3.5 rounded-full border-2 border-primary bg-primary'
                  : 'absolute top-1.5 -left-[1.95rem] size-3.5 rounded-full border-2 border-primary/60 bg-background'
              }
            />
            <p className="text-sm font-medium tracking-wide text-muted-foreground tabular-nums">
              {membershipPeriod(membership)}
              <span className="sr-only">
                {active ? ' (vínculo ativo)' : ' (vínculo encerrado)'}
              </span>
            </p>
            <p className="mt-1 font-serif text-xl font-semibold text-primary">
              {membershipLabel(membership)}
            </p>
            {membershipLines.length > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {membershipLines.map((line, index) => (
                  <span key={line.id}>
                    {index > 0 ? ' · ' : null}
                    <Link
                      href={researchLinePath(line.slug)}
                      className="text-link underline underline-offset-4 hover:no-underline"
                    >
                      {line.name}
                    </Link>
                  </span>
                ))}
              </p>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

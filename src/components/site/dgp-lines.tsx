import { formatDate } from '@/lib/content/format'
import type { GroupProfile } from '@/payload-types'

export type DgpLine = NonNullable<GroupProfile['dgpResearchLines']>[number]

/**
 * Linhas registradas no DGP como REFERÊNCIA HISTÓRICA (Q7): sem páginas próprias, sem links
 * internos e sem qualquer indicação de extinção. Cada linha mostra fonte e data de coleta.
 */
export function DgpLines({ lines }: { lines: DgpLine[] }) {
  if (lines.length === 0) return null
  return (
    <ol className="divide-y border-y" data-testid="dgp-lines">
      {lines.map((line, index) => {
        const collected = formatDate(line.collectedAt)
        return (
          <li
            key={line.id ?? line.name}
            className="grid gap-1 py-5 sm:grid-cols-[3rem_1fr] sm:gap-4"
          >
            <span className="font-serif text-lg text-muted-foreground" aria-hidden="true">
              {index + 1}.
            </span>
            <div>
              <p className="font-serif text-lg leading-snug text-foreground">{line.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fonte: {line.source}
                {collected ? `, coletado em ${collected}` : ''}
                {line.note ? `. ${line.note}` : ''}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

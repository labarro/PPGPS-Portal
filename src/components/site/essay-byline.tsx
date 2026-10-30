import Link from 'next/link'
import { Fragment } from 'react'

import { personPath } from '@/lib/content/paths'
import type { EssayAuthorSummary } from '@/lib/content/queries'
import { cn } from '@/lib/utils'

/**
 * Autoria do ensaio: nome publicado de cada autor, com link para o perfil SOMENTE quando a
 * pessoa tem autorização de perfil público (ficha S05). Convidados e integrantes sem perfil
 * público aparecem só pelo nome.
 */
export function EssayByline({
  authors,
  linked = true,
  className,
}: {
  authors: EssayAuthorSummary[]
  linked?: boolean
  className?: string
}) {
  if (authors.length === 0) return null
  return (
    <span className={cn(className)} data-testid="essay-authors">
      <span className="sr-only">Autoria: </span>
      {authors.map((author, index) => (
        <Fragment key={`${author.name}-${index}`}>
          {index > 0 ? (index === authors.length - 1 ? ' e ' : ', ') : null}
          {linked && author.personSlug ? (
            <Link
              href={personPath(author.personSlug)}
              className="rounded-sm font-medium text-link underline underline-offset-4 hover:no-underline"
            >
              {author.name}
            </Link>
          ) : (
            <span className="font-medium">{author.name}</span>
          )}
        </Fragment>
      ))}
    </span>
  )
}

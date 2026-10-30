import Link from 'next/link'

import { cn } from '@/lib/utils'

/** Paginação por query string (`?pagina=N`), funcional sem JavaScript. */
export function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null
  const href = (target: number) => (target <= 1 ? basePath : `${basePath}?pagina=${target}`)
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
  const linkClass =
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 text-base'
  return (
    <nav aria-label="Paginação" className="mt-12">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <li>
            <Link href={href(page - 1)} className={cn(linkClass, 'hover:bg-secondary')}>
              Anterior
            </Link>
          </li>
        ) : null}
        {pages.map((target) => (
          <li key={target}>
            {target === page ? (
              <span
                aria-current="page"
                className={cn(linkClass, 'border-primary bg-primary text-primary-foreground')}
              >
                <span className="sr-only">Página </span>
                {target}
              </span>
            ) : (
              <Link href={href(target)} className={cn(linkClass, 'hover:bg-secondary')}>
                <span className="sr-only">Página </span>
                {target}
              </Link>
            )}
          </li>
        ))}
        {page < totalPages ? (
          <li>
            <Link href={href(page + 1)} className={cn(linkClass, 'hover:bg-secondary')}>
              Próxima
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}

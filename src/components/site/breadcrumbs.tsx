import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'

export type Crumb = { label: string; href?: string }

/** Trilha de navegação (planejamento 16.2): o último item é a página atual. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null
  return (
    <nav aria-label="Trilha de navegação" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="inline-flex min-h-6 items-center rounded-sm text-link underline underline-offset-4 hover:no-underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="text-foreground">
                  {item.label}
                </span>
              )}
              {!last ? <ChevronRightIcon className="size-4" aria-hidden="true" /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

import type { ReactNode } from 'react'

import { Breadcrumbs, type Crumb } from './breadcrumbs'

/**
 * Cabeçalho das páginas internas: trilha de navegação, título (h1) e texto de abertura.
 * Faixa clara com um filete azul-marinho à esquerda do título.
 */
export function PageHeader({
  breadcrumbs,
  title,
  lead,
  children,
}: {
  breadcrumbs: Crumb[]
  title: string
  lead?: string | null
  children?: ReactNode
}) {
  return (
    <div className="border-b bg-muted">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pb-14">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-8 border-l-4 border-primary pl-5 sm:pl-7">
          <h1 className="font-serif text-3xl leading-tight font-semibold text-primary sm:text-5xl">
            {title}
          </h1>
          {lead ? (
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {lead}
            </p>
          ) : null}
          {children ? <div className="mt-5 flex flex-wrap gap-3">{children}</div> : null}
        </div>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Título de seção (h2) das páginas internas. */
export function SectionTitle({
  id,
  children,
  className,
}: {
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <h2
      id={id}
      className={cn(
        'font-serif text-2xl leading-snug font-semibold text-primary sm:text-3xl',
        className,
      )}
    >
      {children}
    </h2>
  )
}

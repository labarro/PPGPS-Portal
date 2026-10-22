import { InboxIcon, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Estado vazio (planejamento 16.6): mensagem, explicação e ação opcional. */
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = InboxIcon,
  headingLevel = 2,
  className,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  icon?: LucideIcon
  headingLevel?: 2 | 3
  className?: string
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted px-6 py-12 text-center',
        className,
      )}
    >
      <Icon className="size-10 text-primary" aria-hidden="true" />
      <Heading className="font-serif text-xl font-semibold text-foreground">{title}</Heading>
      {description ? <div className="max-w-prose text-muted-foreground">{description}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

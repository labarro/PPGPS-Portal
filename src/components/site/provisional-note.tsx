import { PencilLineIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Aviso discreto de texto provisório (conteúdo aguardando o coordenador, Q7). Controlado pelo
 * campo "Texto provisório" no painel; some quando o texto definitivo é publicado.
 */
export function ProvisionalNote({
  className,
  inverse = false,
}: {
  className?: string
  inverse?: boolean
}) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        inverse
          ? 'border-white/40 text-inverse-foreground'
          : 'border-border bg-muted text-muted-foreground',
        className,
      )}
      data-testid="provisional-note"
    >
      <PencilLineIcon className="size-3.5" aria-hidden="true" />
      Texto provisório, em validação pelo grupo
    </p>
  )
}

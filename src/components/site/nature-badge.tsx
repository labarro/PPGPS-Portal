import { natureLabel } from '@/lib/editorial/essay'
import { cn } from '@/lib/utils'

/** Selo de natureza do ensaio (planejamento 8.8 e 16.1): sempre visível, em texto. */
export function NatureBadge({
  nature,
  inverse = false,
  className,
}: {
  nature: string | null | undefined
  inverse?: boolean
  className?: string
}) {
  return (
    <span
      data-testid="nature-badge"
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold tracking-wide uppercase',
        inverse
          ? 'border-white/60 text-inverse-foreground'
          : 'border-primary/40 bg-secondary text-primary',
        className,
      )}
    >
      <span className="sr-only">Natureza do texto: </span>
      {natureLabel(nature)}
    </span>
  )
}

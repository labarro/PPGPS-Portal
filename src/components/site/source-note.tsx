import { formatDate } from '@/lib/content/format'

/** Procedência do conteúdo transcrito (planejamento 17.7 — S03: fonte e data). */
export function SourceNote({
  source,
  collectedAt,
}: {
  source?: string | null
  collectedAt?: string | null
}) {
  if (!source) return null
  const date = formatDate(collectedAt)
  return (
    <p className="mt-10 border-t pt-4 text-sm text-muted-foreground" data-testid="source-note">
      Fonte: {source}
      {date ? `. Dados coletados em ${date}.` : '.'}
    </p>
  )
}

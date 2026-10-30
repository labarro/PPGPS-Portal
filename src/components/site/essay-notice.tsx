import { InfoIcon } from 'lucide-react'

import { essayNotice, natureLabel, resolveLicense } from '@/lib/editorial/essay'
import { cn } from '@/lib/utils'

/**
 * Aviso editorial obrigatório em todo ensaio (ficha S05; planejamento 8.8): natureza do
 * texto, ausência de revisão por pares, não representação de posição institucional e licença.
 * A revisão editorial interna NÃO é apresentada como revisão científica por pares.
 */
export function EssayNotice({
  nature,
  license,
  defaultLicense,
  complement,
  className,
}: {
  nature: string | null | undefined
  license: string | null | undefined
  defaultLicense: string | null | undefined
  complement?: string | null
  className?: string
}) {
  const notice = essayNotice(nature, complement)
  const resolved = resolveLicense(license, defaultLicense)
  return (
    <aside
      aria-labelledby="aviso-editorial"
      data-testid="essay-notice"
      className={cn('rounded-lg border border-primary/30 bg-secondary p-5 sm:p-6', className)}
    >
      <h2
        id="aviso-editorial"
        className="flex items-center gap-2 font-serif text-lg font-semibold text-primary"
      >
        <InfoIcon className="size-5 shrink-0" aria-hidden="true" />
        Sobre este texto: {natureLabel(nature)}
      </h2>
      <div className="mt-3 flex flex-col gap-2 leading-relaxed text-foreground">
        <p>{notice.lead}</p>
        <p data-testid="peer-review-notice">{notice.peerReview}</p>
        <p>{notice.institutional}</p>
        {notice.complement ? <p>{notice.complement}</p> : null}
        <p className="text-sm text-muted-foreground">
          Licença:{' '}
          {resolved.url ? (
            <a
              href={resolved.url}
              rel="license noopener noreferrer"
              className="text-link underline underline-offset-4 hover:no-underline"
            >
              {resolved.label}
              <span className="sr-only"> (site externo)</span>
            </a>
          ) : (
            resolved.label
          )}
          .
        </p>
      </div>
    </aside>
  )
}

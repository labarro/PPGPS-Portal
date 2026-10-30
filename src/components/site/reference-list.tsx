import { type EssayReference, formatReference } from '@/lib/editorial/essay'
import { safeHref } from '@/lib/content/rich-text'

/** Referências bibliográficas estruturadas do ensaio (estilo ABNT simplificado). */
export function ReferenceList({ references }: { references: EssayReference[] }) {
  if (references.length === 0) return null
  return (
    <ol
      className="flex flex-col gap-3 pl-0 font-serif text-base leading-relaxed"
      data-testid="references"
    >
      {references.map((reference, index) => {
        const ref = formatReference(reference)
        const url = safeHref(ref.url)
        return (
          <li key={`${ref.title}-${index}`} className="list-none border-l-2 border-border pl-4">
            {ref.lead ? <span>{ref.lead} </span> : null}
            <em>{ref.title}</em>
            {ref.rest ? <span> {ref.rest}</span> : null}
            {ref.doi ? (
              <>
                {' '}
                DOI:{' '}
                <a
                  href={`https://doi.org/${ref.doi}`}
                  rel="noopener noreferrer"
                  className="break-all text-link underline underline-offset-4 hover:no-underline"
                >
                  {ref.doi}
                </a>
                .
              </>
            ) : null}
            {url ? (
              <>
                {' '}
                Disponível em:{' '}
                <a
                  href={url}
                  rel="noopener noreferrer"
                  className="break-all text-link underline underline-offset-4 hover:no-underline"
                >
                  {url}
                </a>
                .
              </>
            ) : null}
            {ref.accessed ? <span> Acesso em: {ref.accessed}.</span> : null}
          </li>
        )
      })}
    </ol>
  )
}

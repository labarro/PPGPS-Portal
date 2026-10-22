import { FileTextIcon } from 'lucide-react'

import { EmptyState } from '@/components/site/empty-state'
import { getSiteChrome } from '@/lib/site/chrome'

export const revalidate = 300

/**
 * Página inicial provisória (S02): identificação do grupo com a base visual.
 * O conteúdo do grupo (apresentação, linhas temáticas, homepage v1) entra na S03.
 */
export default async function HomePage() {
  const chrome = await getSiteChrome()
  return (
    <>
      <section
        className="surface-inverse bg-inverse text-inverse-foreground"
        aria-labelledby="titulo"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold tracking-widest text-inverse-muted-foreground uppercase">
            Grupo de pesquisa
          </p>
          <h1
            id="titulo"
            className="mt-3 max-w-4xl font-serif text-3xl leading-tight font-semibold text-balance sm:text-5xl"
          >
            {chrome.siteName}
          </h1>
          {chrome.description ? (
            <p className="mt-6 max-w-2xl text-lg text-inverse-muted-foreground">
              {chrome.description}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={FileTextIcon}
          title="Portal em preparação"
          description="As páginas do grupo estão sendo preparadas e serão publicadas em breve."
        />
      </div>
    </>
  )
}

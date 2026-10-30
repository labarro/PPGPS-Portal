import type { Metadata } from 'next'

import { LegalPage } from '@/components/site/legal-page'
import { SectionTitle } from '@/components/site/section-title'
import { RESPONSIBILITY_STATEMENT } from '@/lib/content/legal-defaults'
import { legalMetadata } from '@/lib/content/legal-metadata'
import { getGroupProfile, getPage } from '@/lib/content/queries'
import { safeHref } from '@/lib/content/rich-text'

const SLUG = 'sobre-o-portal'

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata(SLUG)
}

/**
 * "Sobre o portal" (S06; Q1): identifica, de forma discreta, o grupo como mantenedor e
 * responsável pelo conteúdo, com link para as informações oficiais do programa
 * (`GroupProfile.responsibilityNote` e a referência institucional do tipo "programa").
 */
export default async function AboutPortalPage() {
  const [page, profile] = await Promise.all([getPage(SLUG), getGroupProfile()])
  const program = (profile?.institutionalReferences ?? []).find(
    (reference) => reference.kind === 'program' && safeHref(reference.url),
  )

  const responsibility = (
    <section aria-labelledby="responsabilidade" className="mb-12" data-testid="responsibility-note">
      <SectionTitle id="responsabilidade" className="text-xl sm:text-2xl">
        Responsabilidade
      </SectionTitle>
      <div className="mt-4 flex flex-col gap-4 leading-relaxed">
        <p>{RESPONSIBILITY_STATEMENT}</p>
        {profile?.responsibilityNote ? <p>{profile.responsibilityNote}</p> : null}
        {program?.url ? (
          <p>
            Informações oficiais sobre o programa estão disponíveis no site do{' '}
            <a
              href={safeHref(program.url) ?? undefined}
              rel="noopener noreferrer"
              className="text-link underline underline-offset-4 hover:no-underline"
            >
              {program.name}
              <span className="sr-only"> (site externo)</span>
            </a>
            .
          </p>
        ) : null}
      </div>
    </section>
  )

  return <LegalPage slug={SLUG} page={page} prepend={responsibility} />
}

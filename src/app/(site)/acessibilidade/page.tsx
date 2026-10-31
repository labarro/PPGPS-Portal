import type { Metadata } from 'next'

import { LegalPage } from '@/components/site/legal-page'
import { legalMetadata } from '@/lib/content/legal-metadata'
import { getPage } from '@/lib/content/queries'

const SLUG = 'acessibilidade'

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata(SLUG)
}

/** Declaração de acessibilidade (S06). */
export default async function AccessibilityPage() {
  return <LegalPage slug={SLUG} page={await getPage(SLUG)} />
}

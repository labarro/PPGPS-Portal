import type { Metadata } from 'next'

import { LegalPage } from '@/components/site/legal-page'
import { legalMetadata } from '@/lib/content/legal-metadata'
import { getPage } from '@/lib/content/queries'

const SLUG = 'privacidade'

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata(SLUG)
}

/** Política de privacidade (S06; controlador e canal do titular conforme a Q4). */
export default async function PrivacyPage() {
  return <LegalPage slug={SLUG} page={await getPage(SLUG)} />
}

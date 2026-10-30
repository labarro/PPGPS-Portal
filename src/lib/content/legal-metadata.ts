import type { Metadata } from 'next'

import { LEGAL_DEFAULTS } from './legal-defaults'
import { type LegalPageSlug, pagePath } from './paths'
import { getPage } from './queries'
import { metaDescription, pageMetadata } from './seo'

/** Metadados das páginas legais: página do CMS, se publicada; senão, o texto padrão. */
export async function legalMetadata(slug: LegalPageSlug): Promise<Metadata> {
  const page = await getPage(slug)
  const fallback = LEGAL_DEFAULTS[slug]
  return pageMetadata({
    title: page?.seo?.title || page?.title || fallback.title,
    path: pagePath(slug),
    description: metaDescription(page?.seo?.description || page?.summary || fallback.summary),
  })
}

import type { CollectionConfig } from 'payload'

import { publishedOnlyForPublic } from '../../hooks/published-only'
import { revalidateCollectionChange, revalidateCollectionDelete } from '../../hooks/revalidate'
import { rememberPublishedSlug, syncSlugRedirects } from '../../hooks/slug-redirects'

export const pagesHooks: CollectionConfig['hooks'] = {
  beforeOperation: [publishedOnlyForPublic],
  beforeChange: [rememberPublishedSlug('pages')],
  afterChange: [syncSlugRedirects('pages'), revalidateCollectionChange('pages')],
  afterDelete: [revalidateCollectionDelete('pages')],
}

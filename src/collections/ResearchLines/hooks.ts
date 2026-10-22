import type { CollectionConfig } from 'payload'

import { publishedOnlyForPublic } from '../../hooks/published-only'
import { revalidateCollectionChange, revalidateCollectionDelete } from '../../hooks/revalidate'
import { rememberPublishedSlug, syncSlugRedirects } from '../../hooks/slug-redirects'

export const researchLinesHooks: CollectionConfig['hooks'] = {
  beforeOperation: [publishedOnlyForPublic],
  beforeChange: [rememberPublishedSlug('research-lines')],
  afterChange: [syncSlugRedirects('research-lines'), revalidateCollectionChange('research-lines')],
  afterDelete: [revalidateCollectionDelete('research-lines')],
}

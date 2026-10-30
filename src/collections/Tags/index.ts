import type { CollectionConfig } from 'payload'

import { tagPath } from '../../lib/content/paths'
import { tagsAccess } from './access'
import { tagFields } from './fields'
import { tagsHooks } from './hooks'

/** Tags dos ensaios (planejamento 8.8), criadas pelos usuários administrativos. */
export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'Tag', plural: 'Tags' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    description: 'Palavras-chave dos ensaios (/blog/tag/...).',
    preview: (doc) => (typeof doc?.slug === 'string' ? tagPath(doc.slug) : null),
  },
  defaultSort: 'name',
  access: tagsAccess,
  hooks: tagsHooks,
  fields: tagFields,
}

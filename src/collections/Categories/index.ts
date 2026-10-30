import type { CollectionConfig } from 'payload'

import { categoryPath } from '../../lib/content/paths'
import { categoriesAccess } from './access'
import { categoryFields } from './fields'
import { categoriesHooks } from './hooks'

/**
 * Categorias do blog (planejamento 8.8): controladas pelo editor, com Bioética e Promoção da
 * Saúde como principais (Q7). Cada ensaio tem exatamente uma categoria.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Categoria', plural: 'Categorias' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'primary', 'order', 'updatedAt'],
    description: 'Categorias dos ensaios (/blog/categoria/...).',
    preview: (doc) => (typeof doc?.slug === 'string' ? categoryPath(doc.slug) : null),
  },
  defaultSort: 'order',
  access: categoriesAccess,
  hooks: categoriesHooks,
  fields: categoryFields,
}

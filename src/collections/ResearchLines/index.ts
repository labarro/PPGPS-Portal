import type { CollectionConfig } from 'payload'

import { researchLinePath } from '../../lib/content/paths'
import { previewUrl } from '../../lib/content/preview'
import { researchLinesAccess } from './access'
import { researchLineFields } from './fields'
import { researchLinesHooks } from './hooks'

/**
 * Linhas temáticas do portal (planejamento 13.3; Q7): Bioética e Promoção da Saúde.
 * Rótulo público "Linhas temáticas". As linhas registradas no DGP NÃO são cadastradas aqui:
 * ficam em `GroupProfile.dgpResearchLines` como referência histórica, sem páginas.
 */
export const ResearchLines: CollectionConfig = {
  slug: 'research-lines',
  labels: { singular: 'Linha temática', plural: 'Linhas temáticas' },
  admin: {
    group: 'Grupo',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order', 'active', '_status', 'updatedAt'],
    description: 'Eixos temáticos exibidos em /linhas. Use "Publicar" para atualizar o site.',
    preview: (doc) =>
      typeof doc?.slug === 'string' ? previewUrl(researchLinePath(doc.slug)) : null,
  },
  defaultSort: 'order',
  versions: { drafts: true, maxPerDoc: 30 },
  access: researchLinesAccess,
  hooks: researchLinesHooks,
  fields: researchLineFields,
}

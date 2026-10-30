import type { CollectionConfig } from 'payload'

import { essayPath } from '../../lib/content/paths'
import { previewUrl } from '../../lib/content/preview'
import { essaysAccess } from './access'
import { essayEndpoints } from './endpoints'
import { essayFields } from './fields'
import { essaysHooks } from './hooks'

/**
 * Ensaios do blog acadêmico (planejamento 8.8, 10.2, 13.3 e 15.2; ficha S05). Autores são
 * pessoas cadastradas ou convidados externos, sem conta (Q5, Q9); o coordenador (`editor`) e o
 * desenvolvedor (`admin`) cadastram, revisam, aprovam, agendam, publicam e arquivam.
 * Rascunhos/versões do Payload + `workflowStatus` controlado pela máquina de estados.
 */
export const Essays: CollectionConfig = {
  slug: 'essays',
  labels: { singular: 'Ensaio', plural: 'Ensaios' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'title',
    defaultColumns: ['title', 'workflowStatus', 'nature', 'category', 'publishedAt', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
    description:
      'Ensaios do blog. Salve como rascunho e use as "Ações editoriais" (barra lateral) para enviar à revisão, devolver, aprovar, agendar, publicar e arquivar.',
    preview: (doc) => (typeof doc?.slug === 'string' ? previewUrl(essayPath(doc.slug)) : null),
    components: {
      // A publicação só acontece pelas ações do fluxo editorial (sem botão "Publicar" genérico).
      edit: { PublishButton: '/components/admin/editorial-actions#PublishViaWorkflow' },
    },
  },
  defaultSort: '-updatedAt',
  versions: { drafts: true, maxPerDoc: 50 },
  access: essaysAccess,
  hooks: essaysHooks,
  endpoints: essayEndpoints,
  fields: essayFields,
}

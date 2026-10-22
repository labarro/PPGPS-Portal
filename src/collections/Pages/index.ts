import type { CollectionConfig } from 'payload'

import { pagePath } from '../../lib/content/paths'
import { previewUrl } from '../../lib/content/preview'
import { pagesAccess } from './access'
import { pageFields } from './fields'
import { pagesHooks } from './hooks'

/**
 * Páginas do grupo (planejamento 13.3): blocos, rascunhos/versões e pré-visualização.
 * Publicadas em /o-grupo/<slug>; páginas com slug de uma seção fixa (ex.: `historico`)
 * complementam a página correspondente. Sem página de laboratório (Q6).
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Página', plural: 'Páginas' },
  admin: {
    group: 'Conteúdo',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'Páginas livres e conteúdo complementar de "O grupo". Use "Publicar" para atualizar o site.',
    preview: (doc) => (typeof doc?.slug === 'string' ? previewUrl(pagePath(doc.slug)) : null),
  },
  versions: { drafts: true, maxPerDoc: 30 },
  access: pagesAccess,
  hooks: pagesHooks,
  fields: pageFields,
}

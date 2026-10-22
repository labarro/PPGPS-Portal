import type { Field } from 'payload'

import { PAGE_BLOCKS } from '../../blocks'
import { FIXED_GROUP_SLUGS } from '../../lib/content/paths'
import { slugField } from '../shared/slug-field'

export const pageFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    label: 'Título',
    required: true,
    localized: true,
    maxLength: 160,
  },
  slugField(
    'title',
    `Endereço em /o-grupo/<slug>. Os slugs ${FIXED_GROUP_SLUGS.join(', ')} complementam as páginas fixas de "O grupo". Alterar o slug de uma página publicada cria um redirecionamento 301.`,
  ),
  {
    name: 'summary',
    type: 'textarea',
    label: 'Resumo',
    localized: true,
    maxLength: 320,
    admin: {
      description: 'Usado abaixo do título, nas listagens e como descrição para buscadores.',
    },
  },
  {
    name: 'layout',
    type: 'blocks',
    label: 'Conteúdo',
    labels: { singular: 'Bloco', plural: 'Blocos' },
    blocks: PAGE_BLOCKS,
    maxRows: 40,
  },
  {
    name: 'seo',
    type: 'group',
    label: 'SEO',
    admin: { position: 'sidebar' },
    fields: [
      {
        name: 'title',
        type: 'text',
        label: 'Título para buscadores',
        localized: true,
        maxLength: 70,
      },
      {
        name: 'description',
        type: 'textarea',
        label: 'Descrição para buscadores',
        localized: true,
        maxLength: 160,
      },
    ],
  },
]

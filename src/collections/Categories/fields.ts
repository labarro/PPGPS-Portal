import type { Field } from 'payload'

import { taxonomyFields } from '../shared/taxonomy'

export const categoryFields: Field[] = [
  ...taxonomyFields('categories'),
  {
    name: 'primary',
    type: 'checkbox',
    label: 'Categoria principal (eixo temático)',
    defaultValue: false,
    index: true,
    admin: {
      position: 'sidebar',
      description:
        'Bioética e Promoção da Saúde são as principais (Q7). Aparecem primeiro no blog.',
    },
  },
  {
    name: 'order',
    type: 'number',
    label: 'Ordem de exibição',
    defaultValue: 10,
    min: 0,
    max: 999,
    admin: { position: 'sidebar' },
  },
]

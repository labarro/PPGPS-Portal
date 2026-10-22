import type { Field } from 'payload'

import { contentEditor } from '../shared/rich-text'
import { slugField } from '../shared/slug-field'

export const researchLineFields: Field[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Nome',
    required: true,
    localized: true,
    maxLength: 120,
  },
  slugField(
    'name',
    'Gerado a partir do nome. Alterar o endereço de uma linha publicada cria um redirecionamento 301 automático.',
  ),
  {
    name: 'summary',
    type: 'textarea',
    label: 'Descrição curta',
    required: true,
    localized: true,
    maxLength: 320,
    admin: {
      description:
        'Uma ou duas frases. Usada nos cartões da página inicial, em /linhas e na busca.',
    },
  },
  {
    name: 'description',
    type: 'richText',
    label: 'Descrição',
    localized: true,
    editor: contentEditor,
  },
  {
    name: 'relatedProgramLineText',
    type: 'text',
    label: 'Linha de programa relacionada (referência textual)',
    localized: true,
    maxLength: 300,
    admin: {
      description:
        'Opcional. Somente texto (ex.: nome de linha de um programa de pós-graduação), sem vínculo oficial.',
    },
  },
  {
    name: 'order',
    type: 'number',
    label: 'Ordem de exibição',
    required: true,
    defaultValue: 1,
    min: 0,
    max: 999,
    admin: { position: 'sidebar' },
  },
  {
    name: 'active',
    type: 'checkbox',
    label: 'Ativa',
    defaultValue: true,
    index: true,
    admin: { position: 'sidebar', description: 'Linhas inativas não aparecem no site.' },
  },
  {
    name: 'provisional',
    type: 'checkbox',
    label: 'Texto provisório',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description:
        'Marque enquanto a descrição aguardar o coordenador (Q7). O site exibe um aviso discreto.',
    },
  },
  {
    name: 'source',
    type: 'text',
    label: 'Fonte',
    maxLength: 300,
    admin: {
      position: 'sidebar',
      description: 'Ex.: Definição do coordenador do grupo (Q7), 22/10/2026.',
    },
  },
]

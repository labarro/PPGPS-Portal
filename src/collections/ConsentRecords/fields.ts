import type { Field } from 'payload'

import {
  CONSENT_METHOD_LABELS,
  CONSENT_METHODS,
  CONSENT_SCOPE_LABELS,
  CONSENT_SCOPES,
} from '../../lib/people/consent'

const dayOnly = { date: { pickerAppearance: 'dayOnly' as const, displayFormat: 'dd/MM/yyyy' } }

export const consentRecordFields: Field[] = [
  {
    name: 'displayTitle',
    type: 'text',
    label: 'Autorização',
    access: { create: () => false, update: () => false },
    admin: { readOnly: true, hidden: true },
  },
  {
    name: 'person',
    type: 'relationship',
    relationTo: 'people',
    label: 'Titular',
    required: true,
    index: true,
    admin: { description: 'Não pode ser alterado depois de salvo.' },
  },
  {
    name: 'scopes',
    type: 'select',
    hasMany: true,
    label: 'Escopos autorizados',
    required: true,
    options: CONSENT_SCOPES.map((value) => ({ value, label: CONSENT_SCOPE_LABELS[value] })),
    admin: {
      description:
        'Cada escopo é independente: foto e e-mail só são exibidos se houver também "Perfil público".',
    },
  },
  {
    type: 'row',
    fields: [
      {
        name: 'grantedAt',
        type: 'date',
        label: 'Data da autorização',
        required: true,
        admin: dayOnly,
      },
      {
        name: 'method',
        type: 'select',
        label: 'Meio',
        required: true,
        options: CONSENT_METHODS.map((value) => ({ value, label: CONSENT_METHOD_LABELS[value] })),
      },
    ],
  },
  {
    name: 'evidence',
    type: 'upload',
    relationTo: 'documents',
    label: 'Comprovante (documento privado)',
    filterOptions: { visibility: { not_equals: 'public' } },
    admin: {
      description:
        'Termo, formulário ou mensagem do titular. Envie em "Documentos" com visibilidade "Administrativa".',
    },
  },
  {
    name: 'collectedBy',
    type: 'text',
    label: 'Colhida por',
    required: true,
    maxLength: 200,
    admin: { description: 'Ex.: Coordenador do grupo.' },
  },
  {
    name: 'revokedAt',
    type: 'date',
    label: 'Revogada em',
    index: true,
    admin: {
      ...dayOnly,
      position: 'sidebar',
      description:
        'Ao registrar a revogação, o conteúdo deixa de ser exibido imediatamente. A revogação é definitiva: uma nova autorização exige novo registro.',
    },
  },
  {
    name: 'notes',
    type: 'textarea',
    label: 'Observações',
    maxLength: 1000,
  },
]

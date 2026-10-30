import type { Field } from 'payload'

import { fieldIsAdminOrEditor } from '../../access'
import { validateExternalUrl } from '../../lib/content/paths'
import {
  END_REASON_LABELS,
  END_REASONS,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_SOURCES,
  ROLE_LABELS,
  SOURCE_LABELS,
  TRAINING_LEVEL_LABELS,
  TRAINING_LEVELS,
} from '../../lib/people/memberships'

const dayOnly = { date: { pickerAppearance: 'dayOnly' as const, displayFormat: 'dd/MM/yyyy' } }
const adminOnlyRead = { read: fieldIsAdminOrEditor }

export const membershipFields: Field[] = [
  {
    name: 'displayTitle',
    type: 'text',
    label: 'Vínculo',
    access: { create: () => false, update: () => false },
    admin: { readOnly: true, hidden: true },
  },
  {
    name: 'person',
    type: 'relationship',
    relationTo: 'people',
    label: 'Pessoa',
    required: true,
    index: true,
  },
  {
    type: 'row',
    fields: [
      {
        name: 'role',
        type: 'select',
        label: 'Papel no grupo',
        required: true,
        index: true,
        options: MEMBERSHIP_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
        admin: {
          description: 'Papéis de vínculo do DGP (não são papéis de acesso ao sistema).',
        },
      },
      {
        name: 'trainingLevel',
        type: 'select',
        label: 'Nível de formação',
        options: TRAINING_LEVELS.map((value) => ({
          value,
          label: TRAINING_LEVEL_LABELS[value].replace(/^./, (c) => c.toUpperCase()),
        })),
        admin: {
          condition: (data) => data?.role === 'student',
          description: 'Obrigatório para estudantes.',
        },
      },
    ],
  },
  {
    name: 'lines',
    type: 'relationship',
    relationTo: 'research-lines',
    hasMany: true,
    label: 'Linhas temáticas',
    admin: { description: 'Bioética, Promoção da Saúde ou ambas.' },
  },
  {
    type: 'row',
    fields: [
      {
        name: 'startDate',
        type: 'date',
        label: 'Início',
        required: true,
        admin: dayOnly,
      },
      {
        name: 'endDate',
        type: 'date',
        label: 'Término',
        admin: {
          ...dayOnly,
          description: 'Deixe vazio enquanto o vínculo estiver ativo.',
        },
      },
    ],
  },
  {
    name: 'endReason',
    type: 'select',
    label: 'Motivo do encerramento',
    access: adminOnlyRead,
    options: END_REASONS.map((value) => ({ value, label: END_REASON_LABELS[value] })),
    admin: { condition: (data) => !!data?.endDate },
  },
  {
    name: 'status',
    type: 'select',
    label: 'Situação',
    defaultValue: 'active',
    index: true,
    access: { create: () => false, update: () => false },
    options: [
      { label: 'Ativo', value: 'active' },
      { label: 'Encerrado', value: 'ended' },
    ],
    admin: {
      readOnly: true,
      position: 'sidebar',
      description: 'Calculada: "Encerrado" quando há data de término.',
    },
  },
  {
    type: 'collapsible',
    label: 'Procedência',
    admin: { position: 'sidebar' },
    fields: [
      {
        name: 'source',
        type: 'select',
        label: 'Fonte',
        required: true,
        defaultValue: 'manual',
        access: adminOnlyRead,
        options: MEMBERSHIP_SOURCES.map((value) => ({ value, label: SOURCE_LABELS[value] })),
      },
      {
        name: 'sourceUrl',
        type: 'text',
        label: 'Endereço da fonte',
        maxLength: 500,
        access: adminOnlyRead,
        validate: (value: unknown) => validateExternalUrl(value),
      },
      {
        name: 'collectedAt',
        type: 'date',
        label: 'Data da coleta',
        access: adminOnlyRead,
        admin: dayOnly,
      },
    ],
  },
]

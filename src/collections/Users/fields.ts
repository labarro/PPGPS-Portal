import type { Field } from 'payload'

import { fieldIsAdmin } from '../../access'
import { ROLE_LABELS, ROLES } from '../../access/roles'

/** Usuário minimizado (planejamento 13.3 e 17.7): só o necessário para acesso e auditoria. */
export const userFields: Field[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Nome de exibição',
    maxLength: 120,
    admin: { description: 'Usado apenas na saudação dos e-mails do sistema.' },
  },
  {
    name: 'roles',
    type: 'select',
    label: 'Papéis',
    hasMany: true,
    required: true,
    defaultValue: ['editor'],
    saveToJWT: true,
    options: ROLES.map((role) => ({ label: ROLE_LABELS[role], value: role })),
    access: {
      create: fieldIsAdmin,
      update: fieldIsAdmin,
    },
    admin: {
      description:
        'Somente o administrador altera papéis. Toda mudança gera registro "role_change" na auditoria.',
    },
  },
  {
    name: 'active',
    type: 'checkbox',
    label: 'Conta ativa',
    defaultValue: true,
    saveToJWT: true,
    access: {
      create: fieldIsAdmin,
      update: fieldIsAdmin,
    },
    admin: { description: 'Contas desativadas não entram no painel nem têm permissões.' },
  },
  {
    name: 'person',
    type: 'relationship',
    relationTo: 'people',
    label: 'Pessoa acadêmica (opcional)',
    unique: true,
    access: {
      create: fieldIsAdmin,
      update: fieldIsAdmin,
    },
    admin: {
      position: 'sidebar',
      description:
        'Liga a conta (coordenador ou desenvolvedor) ao seu registro em "Pessoas". Não cria contas para integrantes (Q5) e não altera permissões.',
    },
  },
  {
    name: 'lastLoginAt',
    type: 'date',
    label: 'Último acesso',
    access: {
      create: () => false,
      update: () => false,
    },
    admin: {
      readOnly: true,
      position: 'sidebar',
      date: { pickerAppearance: 'dayAndTime' },
    },
  },
]

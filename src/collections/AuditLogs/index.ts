import type { CollectionConfig } from 'payload'

import { isAdminOrEditor, nobody } from '../../access'
import { AUDIT_ACTIONS, AUDIT_COLLECTION } from '../../hooks/audit'

const ACTION_LABELS: Record<(typeof AUDIT_ACTIONS)[number], string> = {
  create: 'Criação',
  update: 'Edição',
  delete: 'Exclusão',
  login: 'Login',
  role_change: 'Mudança de papel',
  publish: 'Publicação',
  unpublish: 'Despublicação',
  export: 'Exportação',
}

/**
 * Auditoria imutável (planejamento 13.3 e 17.4; matriz 14.3: admin L · editor L · visitante —).
 *
 * - Escrita somente pelos hooks do servidor (Local API com `overrideAccess`); a API não
 *   permite criar, editar nem excluir registros, nem mesmo ao `admin`.
 * - O banco reforça a imutabilidade: um gatilho bloqueia UPDATE e DELETE (a exclusão só é
 *   aceita para registros com mais de 2 anos — retenção do planejamento), ver migration da S02.
 * - Sem relacionamento com `users` (chave estrangeira alteraria o registro ao excluir a conta):
 *   guarda o id e o e-mail do autor como texto.
 */
export const AuditLogs: CollectionConfig = {
  slug: AUDIT_COLLECTION,
  labels: { singular: 'Registro de auditoria', plural: 'Auditoria' },
  admin: {
    group: 'Administração',
    useAsTitle: 'action',
    defaultColumns: ['at', 'action', 'targetCollection', 'documentId', 'userEmail'],
    description:
      'Registros somente leitura de criação, edição, exclusão, login e mudança de papel.',
    pagination: { defaultLimit: 50 },
  },
  access: {
    read: isAdminOrEditor,
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  lockDocuments: false,
  timestamps: true,
  defaultSort: '-at',
  fields: [
    {
      name: 'at',
      type: 'date',
      label: 'Data e hora (UTC)',
      required: true,
      index: true,
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'action',
      type: 'select',
      label: 'Ação',
      required: true,
      index: true,
      options: AUDIT_ACTIONS.map((value) => ({ label: ACTION_LABELS[value], value })),
      admin: { readOnly: true },
    },
    {
      name: 'targetCollection',
      type: 'text',
      label: 'Coleção',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'documentId',
      type: 'text',
      label: 'Documento',
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'userId',
      type: 'text',
      label: 'Id do usuário',
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'userEmail',
      type: 'text',
      label: 'Usuário',
      admin: { readOnly: true },
    },
    {
      name: 'diffSummary',
      type: 'textarea',
      label: 'Resumo (somente nomes de campos)',
      admin: { readOnly: true },
    },
    {
      name: 'ip',
      type: 'text',
      label: 'IP (truncado)',
      admin: { readOnly: true },
    },
  ],
}

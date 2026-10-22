import type { RedirectsPluginConfig } from '@payloadcms/plugin-redirects/types'
import type { CollectionBeforeValidateHook } from 'payload'

import { isAdminOrEditor } from '../../access'
import { auditAfterChange, auditAfterDelete } from '../../hooks/audit'
import {
  normalizePath,
  validateRedirectSource,
  validateRedirectTarget,
} from '../../lib/content/paths'

/** Origem normalizada (minúsculas, sem barra final) para a busca exata feita pelo proxy. */
const normalizeRedirect: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data
  if (typeof data.from === 'string' && data.from.trim()) data.from = normalizePath(data.from)
  const to = data.to as { url?: unknown } | undefined
  if (to && typeof to.url === 'string' && to.url.startsWith('/')) {
    to.url = normalizePath(to.url)
  }
  return data
}

/**
 * Redirecionamentos (`@payloadcms/plugin-redirects`; planejamento 9.3). Criados
 * automaticamente quando o slug de uma linha temática ou página publicada muda; também podem
 * ser cadastrados manualmente. O proxy (`src/proxy.ts`) responde 301/302 antes da página.
 * Somente admin/editor leem: os caminhos podem revelar conteúdo ainda não publicado.
 */
export const redirectsPluginConfig: RedirectsPluginConfig = {
  overrides: {
    labels: { singular: 'Redirecionamento', plural: 'Redirecionamentos' },
    admin: {
      group: 'Site',
      useAsTitle: 'from',
      defaultColumns: ['from', 'to.url', 'type', 'updatedAt'],
      description:
        'Endereços antigos que levam a novos endereços. Os de linhas e páginas são criados automaticamente ao alterar o slug.',
    },
    access: {
      read: isAdminOrEditor,
      create: isAdminOrEditor,
      update: isAdminOrEditor,
      delete: isAdminOrEditor,
    },
    hooks: {
      beforeValidate: [normalizeRedirect],
      // A coleção é criada pelo plugin (fora de `withAudit`): auditoria explícita.
      afterChange: [auditAfterChange],
      afterDelete: [auditAfterDelete],
    },
    fields: () => [
      {
        name: 'from',
        type: 'text',
        label: 'Endereço antigo (origem)',
        required: true,
        unique: true,
        index: true,
        maxLength: 300,
        validate: (value: unknown) => validateRedirectSource(value),
        admin: { description: 'Caminho interno, ex.: /linhas/nome-antigo.' },
      },
      {
        name: 'to',
        type: 'group',
        label: 'Destino',
        fields: [
          {
            name: 'url',
            type: 'text',
            label: 'Endereço de destino',
            required: true,
            maxLength: 500,
            validate: (value: unknown) => validateRedirectTarget(value),
            admin: { description: 'Caminho interno (/linhas/novo-nome) ou endereço https://.' },
          },
        ],
      },
      {
        name: 'type',
        type: 'select',
        label: 'Tipo',
        required: true,
        defaultValue: '301',
        options: [
          { label: 'Permanente (301)', value: '301' },
          { label: 'Temporário (302)', value: '302' },
        ],
      },
    ],
  },
}

import type { GlobalConfig } from 'payload'

import { anyone, fieldIsAdmin, isAdminOrEditor } from '../access'
import { revalidateSiteLayout } from '../hooks/revalidate'
import { SITE_FULL_NAME, SITE_SHORT_NAME } from '../lib/site/identity'

/**
 * Configurações do site. Matriz 14.3: SEO e textos (admin T · editor T); configurações
 * técnicas (admin T · editor L) — protegidas por acesso de campo.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Configurações do site',
  admin: { group: 'Site' },
  access: { read: anyone, update: isAdminOrEditor },
  hooks: { afterChange: [revalidateSiteLayout] },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      label: 'Nome do grupo (exibição)',
      required: true,
      defaultValue: SITE_FULL_NAME,
      localized: true,
      maxLength: 120,
      admin: { description: 'Nome definido pelo coordenador (Q2).' },
    },
    {
      name: 'shortName',
      type: 'text',
      label: 'Nome curto',
      required: true,
      defaultValue: SITE_SHORT_NAME,
      localized: true,
      maxLength: 60,
      admin: { description: 'Usado em títulos de página e no cabeçalho em telas pequenas.' },
    },
    {
      name: 'defaultDescription',
      type: 'textarea',
      label: 'Descrição padrão (SEO)',
      localized: true,
      maxLength: 300,
    },
    {
      name: 'technical',
      type: 'group',
      label: 'Configurações técnicas (somente administrador)',
      access: { update: fieldIsAdmin },
      fields: [
        {
          name: 'showIndicators',
          type: 'checkbox',
          label: 'Exibir indicadores públicos',
          defaultValue: false,
          admin: { description: 'Reservado para indicadores (M2/V3).' },
        },
      ],
    },
  ],
}
